import { useState, useEffect, useRef } from 'react';
import { Upload, Trash2, FileText, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

interface Document {
  id: number;
  name: string;
  file_type: string;
  file_size: number;
  created_at: string;
  is_active: boolean;
}

export default function DocumentsManagement() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data.documents);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    // Don't send hotelId - backend will use the authenticated user's hotelId

    try {
      await api.post('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      await loadDocuments();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Failed to upload document:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await api.delete(`/documents/${id}`);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents Management</h1>
          <p className="text-gray-600 mt-1">
            Upload PDFs, DOCX, or TXT files to train the AI chatbot
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="btn btn-primary flex items-center space-x-2 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Upload Document</span>
              </>
            )}
          </label>
        </div>
      </div>

      <div className="space-y-4">
        {documents.map((doc) => (
          <div key={doc.id} className="card flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-primary-50 rounded-lg">
                <FileText className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{doc.name}</h3>
                <p className="text-sm text-gray-600">
                  {doc.file_type} • {formatFileSize(doc.file_size)} •{' '}
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {documents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No documents uploaded yet.</p>
            <p className="text-sm mt-2">Upload documents to help train the AI chatbot.</p>
          </div>
        )}
      </div>
    </div>
  );
}

