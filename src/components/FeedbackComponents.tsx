"use client";

import { useState, useEffect } from "react";

interface MessageFeedbackProps {
  messageId: number;
  sessionId: string;
  userQuestion: string;
  aiResponse: string;
  industry: string;
}

export function MessageFeedbackButtons({
  messageId,
  sessionId,
  userQuestion,
  aiResponse,
  industry,
}: MessageFeedbackProps) {
  const storageKey = `feedback_${sessionId}_${messageId}`;
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved feedback state on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(storageKey);
    if (saved === 'up' || saved === 'down') {
      setFeedback(saved);
    }
  }, [storageKey]);

  const handleFeedback = async (type: 'up' | 'down') => {
    if (isSubmitting || feedback === type) return;
    
    // Optimistic update - show immediately
    const previousFeedback = feedback;
    setFeedback(type);
    sessionStorage.setItem(storageKey, type);
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'message',
          sessionId,
          messageId,
          userQuestion,
          aiResponse,
          feedback: type,
          industry,
        }),
      });

      if (!response.ok) {
        // Revert on error
        console.error('Failed to save feedback, status:', response.status);
        setFeedback(previousFeedback);
        if (previousFeedback) {
          sessionStorage.setItem(storageKey, previousFeedback);
        } else {
          sessionStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Revert on error
      setFeedback(previousFeedback);
      if (previousFeedback) {
        sessionStorage.setItem(storageKey, previousFeedback);
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-2">
      <button
        onClick={() => handleFeedback('up')}
        disabled={isSubmitting}
        className={`p-1.5 rounded-lg transition-all duration-200 ${
          feedback === 'up'
            ? 'bg-green-500/20 text-green-400'
            : 'text-gray-500 hover:text-green-400 hover:bg-green-500/10'
        }`}
        title="Helpful"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => handleFeedback('down')}
        disabled={isSubmitting}
        className={`p-1.5 rounded-lg transition-all duration-200 ${
          feedback === 'down'
            ? 'bg-red-500/20 text-red-400'
            : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
        }`}
        title="Not helpful"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  );
}

interface SessionRatingProps {
  sessionId: string;
  industry: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function SessionRatingModal({ sessionId, industry, onComplete, onSkip }: SessionRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [textFeedback, setTextFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'session',
          sessionId,
          rating,
          textFeedback,
          industry,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        console.error('Failed to save session rating:', data.error);
        // Still show success to user but log the error
        setSubmitted(true);
        setTimeout(() => {
          onComplete();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      // Still proceed even on error
      setSubmitted(true);
      setTimeout(() => {
        onComplete();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="glass-card p-8 max-w-md mx-4 text-center">
          <div className="text-green-400 text-5xl mb-4">✓</div>
          <h3 className="text-xl font-semibold text-white mb-2">Thank you!</h3>
          <p className="text-gray-400">Your feedback has been submitted.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card p-6 max-w-md mx-4 w-full">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-semibold text-white">Rate this session</h3>
        </div>
        <p className="text-gray-400 text-sm mb-6">How was your experience?</p>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="p-1 transition-transform hover:scale-110"
            >
              <svg
                className={`w-10 h-10 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-600'
                }`}
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </button>
          ))}
        </div>

        <textarea
          value={textFeedback}
          onChange={(e) => setTextFeedback(e.target.value)}
          placeholder="Share your thoughts about this session (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 resize-none"
          rows={4}
        />

        <div className="flex gap-3 mt-4">
          <button
            onClick={onSkip}
            className="flex-1 py-3 rounded-xl font-medium transition-all bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10"
          >
            Skip
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isSubmitting}
            className={`flex-1 py-3 rounded-xl font-medium transition-all ${
              rating === 0
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'btn-primary'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
