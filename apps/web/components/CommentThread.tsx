'use client';

import React, { useState } from 'react';
import { CommentItem } from '../lib/api';
import { MessageSquare, Send, UserCircle } from 'lucide-react';

interface CommentThreadProps {
  comments: CommentItem[];
  currentVersionId: string;
  onAddComment: (body: string, start_idx?: number, end_idx?: number) => Promise<void>;
}

export function CommentThread({
  comments,
  currentVersionId,
  onAddComment
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const roleLabels: Record<string, string> = {
    creator: 'Writer',
    reviewer: 'Reviewer',
    admin: 'Brand Lead',
    solo: 'Solo Creator'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-xs font-bold text-gray-700">
        <MessageSquare className="w-4 h-4 text-violet-600" />
        <span>Team Notes & Feedback ({comments.length})</span>
      </div>

      {/* Existing Comments List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center text-xs text-gray-500 italic">
            No notes yet. Add thoughts or feedback for this draft below.
          </div>
        ) : (
          comments.map((c) => {
            const isReviewer = c.author_role === 'reviewer' || c.author_role === 'admin';
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-900">{c.author_name}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isReviewer
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-violet-50 text-violet-700 border border-violet-200'
                      }`}
                    >
                      {roleLabels[c.author_role] || c.author_role}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed pl-6 whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Comment Box */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write feedback or notes for the team..."
          className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-gray-300 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-violet-500 shadow-sm"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white text-xs font-semibold transition shadow-sm"
        >
          <Send className="w-3.5 h-3.5" />
          Post Note
        </button>
      </form>
    </div>
  );
}
