import { pool } from '../db/connection.js';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

interface AIResponse {
  answer: string;
  confidence: number;
  wasAIResponse: boolean;
  escalated: boolean;
}

export async function getAIResponse(
  hotelId: number,
  question: string,
  language: string = 'en'
): Promise<AIResponse> {
  try {
    // Get hotel context
    const hotelResult = await pool.query(
      'SELECT name, description, address, phone, email, wifi_ssid, check_in_time, check_out_time, breakfast_time_start, breakfast_time_end, emergency_contact FROM hotels WHERE id = $1',
      [hotelId]
    );

    if (hotelResult.rows.length === 0) {
      throw new Error('Hotel not found');
    }

    const hotel = hotelResult.rows[0];

    // Get relevant FAQs
    const faqsResult = await pool.query(
      'SELECT question, answer FROM faqs WHERE hotel_id = $1 AND is_active = true LIMIT 20',
      [hotelId]
    );

    // Get relevant document chunks from vector DB
    let relevantContext = '';
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
      try {
        // Create embedding for the question
        const questionEmbedding = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: question
        });

        // Search for similar content in vector DB
        const { data: embeddings } = await supabase
          .from('document_embeddings')
          .select('content, chunks, embeddings, metadata')
          .limit(10);

        if (embeddings && embeddings.length > 0) {
          // Find most relevant chunks (simple cosine similarity)
          const questionVec = questionEmbedding.data[0].embedding;
          const similarities: Array<{ content: string; score: number }> = [];

          for (const doc of embeddings) {
            if (doc.embeddings && Array.isArray(doc.embeddings[0])) {
              for (let i = 0; i < doc.chunks.length && i < doc.embeddings.length; i++) {
                const chunkVec = doc.embeddings[i];
                const similarity = cosineSimilarity(questionVec, chunkVec);
                if (similarity > 0.7) { // Threshold
                  similarities.push({ content: doc.chunks[i], score: similarity });
                }
              }
            }
          }

          // Sort by similarity and take top 3
          similarities.sort((a, b) => b.score - a.score);
          relevantContext = similarities.slice(0, 3).map(s => s.content).join('\n\n');
        }
      } catch (error) {
        console.error('Error searching vector DB:', error);
      }
    }

    // Build context for AI
    const context = `
Hotel Information:
- Name: ${hotel.name}
- Description: ${hotel.description || 'N/A'}
- Address: ${hotel.address || 'N/A'}
- Phone: ${hotel.phone || 'N/A'}
- Email: ${hotel.email || 'N/A'}
- WiFi: ${hotel.wifi_ssid || 'N/A'}
- Check-in: ${hotel.check_in_time}
- Check-out: ${hotel.check_out_time}
- Breakfast: ${hotel.breakfast_time_start} - ${hotel.breakfast_time_end}
- Emergency: ${hotel.emergency_contact || 'N/A'}

Frequently Asked Questions:
${faqsResult.rows.map(faq => `Q: ${faq.question}\nA: ${faq.answer}`).join('\n\n')}

${relevantContext ? `Additional Context from Documents:\n${relevantContext}` : ''}
`;

    // Get AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are a helpful, professional hotel concierge assistant. Answer guest questions based on the hotel information provided. Be polite, concise, and accurate. If you're not confident about an answer, suggest contacting hotel staff. Respond in ${language === 'en' ? 'English' : language}.`
        },
        {
          role: 'user',
          content: `Context:\n${context}\n\nGuest Question: ${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const aiAnswer = completion.choices[0].message.content || 'I apologize, but I cannot provide an answer at this time. Please contact the hotel staff for assistance.';
    
    // Calculate confidence (simple heuristic based on token probability)
    const confidence = Math.min(0.95, Math.max(0.5, completion.choices[0].finish_reason === 'stop' ? 0.9 : 0.7));

    // Determine if we should escalate
    const shouldEscalate = confidence < 0.7 || 
                           question.toLowerCase().includes('complaint') ||
                           question.toLowerCase().includes('problem') ||
                           question.toLowerCase().includes('issue');

    if (shouldEscalate) {
      return {
        answer: `${aiAnswer}\n\nIf you need further assistance, please contact our front desk at ${hotel.phone || 'the reception'}.`,
        confidence,
        wasAIResponse: true,
        escalated: true
      };
    }

    return {
      answer: aiAnswer,
      confidence,
      wasAIResponse: true,
      escalated: false
    };

  } catch (error) {
    console.error('AI Service Error:', error);
    
    // Fallback to FAQ matching
    return await getFallbackResponse(hotelId, question);
  }
}

async function getFallbackResponse(hotelId: number, question: string): Promise<AIResponse> {
  // Simple keyword matching fallback
  const faqsResult = await pool.query(
    'SELECT question, answer FROM faqs WHERE hotel_id = $1 AND is_active = true',
    [hotelId]
  );

  const questionLower = question.toLowerCase();
  
  for (const faq of faqsResult.rows) {
    const faqQuestionLower = faq.question.toLowerCase();
    // Simple keyword matching
    const keywords = questionLower.split(' ');
    const matchingKeywords = keywords.filter(k => faqQuestionLower.includes(k));
    
    if (matchingKeywords.length >= 2) {
      return {
        answer: faq.answer,
        confidence: 0.6,
        wasAIResponse: false,
        escalated: false
      };
    }
  }

  // Default fallback
  const hotelResult = await pool.query(
    'SELECT phone FROM hotels WHERE id = $1',
    [hotelId]
  );

  const phone = hotelResult.rows[0]?.phone || 'the front desk';

  return {
    answer: `I apologize, but I couldn't find a specific answer to your question. Please contact ${phone} for assistance.`,
    confidence: 0.3,
    wasAIResponse: false,
    escalated: true
  };
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

