'use client';

import React, { useState } from 'react';
import { CommentItem } from '../lib/api';
import { MessageSquare, Send, UserCircle, CornerDownRight } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-stone-200">
        <MessageSquare className="w-4 h-4 text-amber-500" />
        <span>Reviewer & Creator Comments ({comments.length})</span>
      </div>

      {/* Existing Comments List */}
      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="p-4 rounded-xl bg-stone-900/40 border border-stone-800 text-center text-xs text-stone-500 italic">
            No comments yet. Start a discussion on this draft.
          </div>
        ) : (
          comments.map((c) => {
            const isReviewer = c.author_role === 'reviewer' || c.author_role === 'admin';
            return (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-stone-900/80 border border-stone-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-stone-400" />
                    <span className="text-xs font-bold text-stone-200">{c.author_name}</span>
                    <span
                      className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                        isReviewer
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {c.author_role}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-500">
                    {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-stone-300 leading-relaxed pl-6 whitespace-pre-wrap">
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
          placeholder="Leave editorial feedback or notes..."
          className="flex-1 px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-700 text-xs text-white placeholder-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold transition"
        >
          <Send className="w-3.5 h-3.5" />
          Comment
        </button>
      </form>
    </div>
  );
}
