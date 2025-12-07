import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, Bot, User } from 'lucide-react';
import api from '../../api/client';

interface Message {
  id: string;
  question: string;
  answer: string;
  timestamp: Date;
  confidence?: number;
  escalated?: boolean;
}

interface ChatInterfaceProps {
  hotelId: number;
}

export default function ChatInterface({ hotelId }: ChatInterfaceProps) {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Generate session ID
    const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    loadChatHistory(newSessionId);
  }, [hotelId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async (sid: string) => {
    try {
      const response = await api.get(`/chat/history/${sid}`, {
        params: { hotelId }
      });
      if (response.data.history && response.data.history.length > 0) {
        const historyMessages: Message[] = response.data.history.map((msg: any) => ({
          id: msg.id.toString(),
          question: msg.question,
          answer: msg.answer,
          timestamp: new Date(msg.created_at),
          confidence: msg.ai_confidence,
          escalated: msg.escalated_to_staff
        }));
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !sessionId) return;

    const question = input.trim();
    setInput('');
    setLoading(true);

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      question,
      answer: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await api.post('/chat/message', {
        hotelId,
        question,
        language: i18n.language,
        sessionId
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        question,
        answer: response.data.answer,
        timestamp: new Date(),
        confidence: response.data.confidence,
        escalated: response.data.escalated
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        question,
        answer: error.response?.data?.error || 'Failed to get response. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center mt-12 fade-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 mb-4">
              <Bot size={40} className="text-primary-600" />
            </div>
            <p className="text-xl font-bold text-gray-800 mb-2">👋 {t('welcome')}</p>
            <p className="text-gray-600 mb-1">I'm your digital concierge</p>
            <p className="text-sm text-gray-500">Ask me anything about the hotel!</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="space-y-3 fade-in">
            {/* User Question */}
            <div className="flex justify-end items-end space-x-2">
              <div 
                className="message-bubble bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md"
                style={{ maxWidth: '85%' }}
              >
                <p className="text-sm leading-relaxed">{message.question}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-primary-600" />
              </div>
            </div>

            {/* AI Answer */}
            {message.answer && (
              <div className="flex justify-start items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-primary-600" />
                </div>
                <div 
                  className="message-bubble bg-white rounded-2xl rounded-tl-sm shadow-md border border-gray-100"
                  style={{ maxWidth: '85%' }}
                >
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{message.answer}</p>
                  {message.confidence !== undefined && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                            style={{ width: `${message.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          {Math.round(message.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start items-start space-x-2 fade-in">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <Bot size={16} className="text-primary-600" />
            </div>
            <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-md border border-gray-100">
              <div className="flex items-center space-x-2">
                <Loader2 className="animate-spin h-4 w-4 text-primary-600" />
                <span className="text-xs text-gray-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200/50 bg-white/95 backdrop-blur-md p-4 shadow-lg">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t('askQuestion')}
              className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-2xl 
                         focus:outline-none focus:ring-2 focus:ring-primary-500/50 
                         focus:border-primary-500 bg-gray-50
                         transition-all duration-200 placeholder:text-gray-400
                         disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="p-3 rounded-2xl shadow-lg transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                     hover:scale-105 active:scale-95"
            style={{ 
              background: input.trim() && !loading 
                ? 'linear-gradient(135deg, var(--primary-color, #3B82F6) 0%, var(--secondary-color, #1E40AF) 100%)'
                : '#9CA3AF'
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin h-5 w-5 text-white" />
            ) : (
              <Send size={20} className="text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

