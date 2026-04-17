'use client';

import { useState, useEffect } from 'react';
import { FiThumbsUp, FiMessageSquare, FiSend, FiChevronDown, FiTrash2 } from 'react-icons/fi';
import { useAuthStore } from '@/store/auth.store';
import qaService from '@/services/qa.service';
import { ProductQuestion } from '@/types';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils';

interface ProductQAProps {
  productId: string;
}

export default function ProductQA({ productId }: ProductQAProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [answerText, setAnswerText] = useState<Record<string, string>>({});
  const [showAnswerForm, setShowAnswerForm] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [productId, page]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await qaService.getByProduct(productId, page);
      setQuestions(data.items || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      // Silent fail for Q&A
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to ask a question');
      return;
    }
    if (!newQuestion.trim()) return;

    try {
      setSubmitting(true);
      const qa = await qaService.askQuestion(productId, newQuestion.trim());
      setQuestions((prev) => [qa, ...prev]);
      setNewQuestion('');
      toast.success('Question posted');
    } catch {
      toast.error('Failed to post question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddAnswer = async (questionId: string) => {
    const text = answerText[questionId]?.trim();
    if (!text) return;

    try {
      await qaService.addAnswer(questionId, text);
      setAnswerText((prev) => ({ ...prev, [questionId]: '' }));
      setShowAnswerForm(null);
      loadQuestions();
      toast.success('Answer posted');
    } catch {
      toast.error('Failed to post answer');
    }
  };

  const handleUpvoteQuestion = async (questionId: string) => {
    if (!isAuthenticated) {
      toast.error('Please login to vote');
      return;
    }
    try {
      await qaService.upvoteQuestion(questionId);
      loadQuestions();
    } catch {
      toast.error('Failed to vote');
    }
  };

  if (loading && questions.length === 0) {
    return (
      <div className="py-8">
        <h3 className="text-lg font-semibold mb-4">Questions & Answers</h3>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <h3 className="text-lg font-semibold mb-4">Questions & Answers ({questions.length})</h3>

      {/* Ask Question Form */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Have a question? Ask the community..."
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          maxLength={1000}
          onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
        />
        <button
          onClick={handleAskQuestion}
          disabled={submitting || !newQuestion.trim()}
          className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1.5"
        >
          <FiSend className="w-4 h-4" />
          Ask
        </button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No questions yet. Be the first to ask!</p>
        ) : (
          questions.map((q) => (
            <div key={q._id} className="border border-gray-100 rounded-lg p-4">
              {/* Question */}
              <div className="flex items-start gap-3">
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded mt-0.5">Q</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{q.question}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>{q.user.name}</span>
                    <span>{formatDate(q.createdAt)}</span>
                    <button
                      onClick={() => handleUpvoteQuestion(q._id)}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <FiThumbsUp className="w-3.5 h-3.5" />
                      {q.upvotes}
                    </button>
                    <button
                      onClick={() => setShowAnswerForm(showAnswerForm === q._id ? null : q._id)}
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      <FiMessageSquare className="w-3.5 h-3.5" />
                      Answer
                    </button>
                  </div>
                </div>
              </div>

              {/* Answers */}
              {q.answers.length > 0 && (
                <div className="mt-3 ml-8 space-y-2.5">
                  {q.answers.map((a) => (
                    <div key={a._id} className="flex items-start gap-2.5 bg-gray-50 rounded-lg p-3">
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                        {a.isSellerAnswer ? 'S' : 'A'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{a.answer}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>
                            {a.user.name}
                            {a.isSellerAnswer && (
                              <span className="ml-1 text-green-600 font-medium">Seller</span>
                            )}
                          </span>
                          <span>{formatDate(a.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Form */}
              {showAnswerForm === q._id && isAuthenticated && (
                <div className="mt-3 ml-8 flex gap-2">
                  <input
                    type="text"
                    value={answerText[q._id] || ''}
                    onChange={(e) => setAnswerText((prev) => ({ ...prev, [q._id]: e.target.value }))}
                    placeholder="Write your answer..."
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    maxLength={2000}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAnswer(q._id)}
                  />
                  <button
                    onClick={() => handleAddAnswer(q._id)}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                  >
                    Submit
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
