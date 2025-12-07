import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';

interface FAQ {
  id?: number;
  question: string;
  answer: string;
  category?: string;
  order_index?: number;
  is_active?: boolean;
}

export default function FAQsManagement() {
  const { user } = useAuthStore();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FAQ>({
    question: '',
    answer: '',
    category: '',
    order_index: 0
  });

  useEffect(() => {
    loadFAQs();
  }, []);

  const loadFAQs = async () => {
    try {
      const response = await api.get('/faqs');
      setFaqs(response.data.faqs);
    } catch (error) {
      console.error('Failed to load FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/faqs/${editingId}`, formData);
      } else {
        await api.post('/faqs', { ...formData, hotelId: user?.hotelId });
      }
      await loadFAQs();
      resetForm();
    } catch (error) {
      console.error('Failed to save FAQ:', error);
      alert('Failed to save FAQ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      await api.delete(`/faqs/${id}`);
      await loadFAQs();
    } catch (error) {
      console.error('Failed to delete FAQ:', error);
      alert('Failed to delete FAQ');
    }
  };

  const handleEdit = (faq: FAQ) => {
    setFormData(faq);
    setEditingId(faq.id || null);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ question: '', answer: '', category: '', order_index: 0 });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">FAQs Management</h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add FAQ</span>
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question
              </label>
              <input
                type="text"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
                className="input"
                placeholder="What is the WiFi password?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Answer
              </label>
              <textarea
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
                className="input"
                rows={4}
                placeholder="The WiFi password is..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  placeholder="WiFi, Check-in, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order
                </label>
                <input
                  type="number"
                  value={formData.order_index || 0}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                  className="input"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn btn-primary flex items-center space-x-2">
                <Save size={18} />
                <span>{editingId ? 'Update' : 'Create'}</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-secondary flex items-center space-x-2"
              >
                <X size={18} />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {faqs.map((faq) => (
          <div key={faq.id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                <p className="text-gray-600 mt-2">{faq.answer}</p>
                {faq.category && (
                  <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                    {faq.category}
                  </span>
                )}
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(faq)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => faq.id && handleDelete(faq.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {faqs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No FAQs yet. Click "Add FAQ" to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

