import fs from 'fs';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function processDocument(filePath: string, mimeType: string): Promise<{
  contentText: string;
  embeddingId: string | null;
}> {
  let contentText = '';

  try {
    // Extract text based on file type
    if (mimeType === 'application/pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      contentText = data.text;
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
               mimeType === 'application/msword') {
      const result = await mammoth.extractRawText({ path: filePath });
      contentText = result.value;
    } else if (mimeType === 'text/plain') {
      contentText = fs.readFileSync(filePath, 'utf-8');
    }

    // Clean and normalize text
    contentText = contentText.trim().replace(/\s+/g, ' ');

    if (!contentText) {
      throw new Error('No text content extracted from document');
    }

    // Create embeddings and store in vector DB
    let embeddingId: string | null = null;

    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        // Split content into chunks (max 8000 tokens per chunk)
        const chunks = splitIntoChunks(contentText, 8000);

        // Create embeddings for each chunk
        const embeddings = [];
        for (const chunk of chunks) {
          const embedding = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: chunk
          });

          embeddings.push({
            content: chunk,
            embedding: embedding.data[0].embedding
          });
        }

        // Store in Supabase vector store
        const { data, error } = await supabase
          .from('document_embeddings')
          .insert({
            content: contentText,
            chunks: embeddings.map(e => e.content),
            embeddings: embeddings.map(e => e.embedding),
            metadata: {
              file_path: filePath,
              mime_type: mimeType,
              chunk_count: chunks.length
            }
          })
          .select()
          .single();

        if (!error && data) {
          embeddingId = data.id.toString();
        }
      } catch (error) {
        console.error('Error creating embeddings:', error);
        // Continue without embedding if vector DB fails
      }
    }

    return { contentText, embeddingId };
  } catch (error) {
    console.error('Error processing document:', error);
    throw error;
  }
}

function splitIntoChunks(text: string, maxTokens: number): string[] {
  // Simple chunking by sentences (approximate token count)
  const sentences = text.split(/[.!?]+\s+/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    const estimatedTokens = (currentChunk + sentence).length / 4; // Rough estimate

    if (estimatedTokens > maxTokens && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter(chunk => chunk.length > 0);
}

