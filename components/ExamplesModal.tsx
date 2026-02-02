'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, BookOpen, Loader2 } from 'lucide-react';

interface ExamplesModalProps {
  word: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExamplesModal({ word, isOpen, onClose }: ExamplesModalProps) {
  const [examples, setExamples] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && word) {
      fetchExamples();
    }
  }, [isOpen, word]);

  const fetchExamples = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/examples?word=${encodeURIComponent(word)}`);
      const data = await response.json();

      if (response.ok) {
        setExamples(data.examples);
        if (data.examples.length === 0) {
          setError('No examples found for this word');
        }
      } else {
        setError(data.error || 'Failed to load examples');
      }
    } catch (err) {
      setError('Failed to load examples');
      console.error('Error fetching examples:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl max-h-[80vh] rounded-2xl border-2 border-cyan-400/50 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(94, 179, 246, 0.15) 0%, rgba(139, 127, 246, 0.15) 100%)',
          backdropFilter: 'blur(20px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-cyan-400" />
              <h2 className="text-2xl font-bold text-white">
                Examples: <span className="text-cyan-400">{word}</span>
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(80vh-100px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-12">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {!loading && !error && examples.length > 0 && (
            <div className="space-y-4">
              {examples.map((example, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center text-cyan-400 font-bold">
                      {index + 1}
                    </div>
                    <p className="text-white text-lg leading-relaxed flex-1">
                      {example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
