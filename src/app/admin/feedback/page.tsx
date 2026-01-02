"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MessageFeedbackEntry {
  messageId: number;
  userQuestion: string;
  aiResponse: string;
  feedback: 'up' | 'down';
  timestamp: string;
}

interface SessionFeedbackRecord {
  id: string;
  session_id: string;
  industry: string;
  message_feedbacks: MessageFeedbackEntry[];
  star_rating: number | null;
  text_feedback: string | null;
  created_at: string;
  updated_at: string;
}

interface FeedbackData {
  sessions: SessionFeedbackRecord[];
  stats: {
    totalSessions: number;
    totalMessageFeedbacks: number;
    thumbsUp: number;
    thumbsDown: number;
    totalSessionRatings: number;
    averageRating: string;
  };
}

export default function AdminFeedbackPage() {
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'sessions'>('messages');
  const [filterIndustry, setFilterIndustry] = useState<string>('all');
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Check if already authenticated on mount
  useEffect(() => {
    const authToken = sessionStorage.getItem('admin_auth');
    if (authToken === 'authenticated') {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const response = await fetch('/api/feedback', {
        headers: {
          'x-admin-password': password,
        },
      });
      
      if (response.ok) {
        sessionStorage.setItem('admin_auth', 'authenticated');
        sessionStorage.setItem('admin_password', password);
        setIsAuthenticated(true);
      } else {
        setAuthError('Invalid password');
      }
    } catch {
      setAuthError('Authentication failed');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    sessionStorage.removeItem('admin_password');
    setIsAuthenticated(false);
    setPassword('');
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchFeedback();
    }
  }, [isAuthenticated]);

  const fetchFeedback = async () => {
    try {
      const savedPassword = sessionStorage.getItem('admin_password');
      const response = await fetch('/api/feedback', {
        headers: {
          'x-admin-password': savedPassword || '',
        },
      });
      
      if (!response.ok) {
        handleLogout();
        return;
      }
      
      const data = await response.json();
      setFeedbackData(data);
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter sessions by industry (with null safety)
  const sessions = feedbackData?.sessions || [];
  const filteredSessions = sessions.filter(
    s => filterIndustry === 'all' || s.industry === filterIndustry
  );

  // Flatten all message feedbacks from filtered sessions
  const allMessageFeedbacks: Array<MessageFeedbackEntry & { sessionId: string; industry: string }> = [];
  filteredSessions.forEach(session => {
    (session.message_feedbacks || []).forEach(mf => {
      allMessageFeedbacks.push({
        ...mf,
        sessionId: session.session_id,
        industry: session.industry,
      });
    });
  });

  // Sessions with ratings
  const sessionsWithRatings = filteredSessions.filter(s => s.star_rating !== null);

  const industries = ['all', 'Healthcare', 'Finance', 'Education'];

  // Show loading while checking auth
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="bg-white/5 border border-white/10 rounded-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            {authError && (
              <p className="text-red-400 text-sm">{authError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Login
            </button>
          </form>
          <Link href="/" className="block text-center text-gray-500 hover:text-gray-400 mt-4 text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-white text-xl">Loading feedback data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0f172a]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/"
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Feedback Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchFeedback}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-colors text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Total Message Feedback</div>
            <div className="text-3xl font-bold">{feedbackData?.stats?.totalMessageFeedbacks || 0}</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-5">
            <div className="text-green-400 text-sm mb-1">Thumbs Up</div>
            <div className="text-3xl font-bold text-green-400">{feedbackData?.stats?.thumbsUp || 0}</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5">
            <div className="text-red-400 text-sm mb-1">Thumbs Down</div>
            <div className="text-3xl font-bold text-red-400">{feedbackData?.stats?.thumbsDown || 0}</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="text-gray-400 text-sm mb-1">Session Ratings</div>
            <div className="text-3xl font-bold">{feedbackData?.stats?.totalSessionRatings || 0}</div>
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5">
            <div className="text-yellow-400 text-sm mb-1">Average Rating</div>
            <div className="text-3xl font-bold text-yellow-400 flex items-center gap-2">
              {feedbackData?.stats?.averageRating || '0.0'}
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Filter by Industry:</span>
            <select
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
            >
              {industries.map(industry => (
                <option key={industry} value={industry} className="bg-[#0f172a]">
                  {industry === 'all' ? 'All Industries' : industry}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white/5 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'messages'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Message Feedback ({allMessageFeedbacks.length})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'sessions'
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Session Ratings ({sessionsWithRatings.length})
          </button>
        </div>

        {/* Content */}
        {activeTab === 'messages' ? (
          <div className="space-y-4">
            {allMessageFeedbacks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No message feedback yet
              </div>
            ) : (
              allMessageFeedbacks.map((feedback, index) => (
                <div
                  key={`${feedback.sessionId}-${feedback.messageId}-${index}`}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm ${
                        feedback.feedback === 'up'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {feedback.feedback === 'up' ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                          </svg>
                        )}
                        {feedback.feedback === 'up' ? 'Helpful' : 'Not Helpful'}
                      </span>
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                        {feedback.industry}
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {formatDate(feedback.timestamp)}
                    </span>
                  </div>
                  
                  {/* User Question */}
                  <div className="mb-3 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                    <div className="text-cyan-400 text-xs font-medium mb-1">User Question:</div>
                    <p className="text-gray-300 text-sm">{feedback.userQuestion}</p>
                  </div>
                  
                  {/* AI Response */}
                  <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
                    <div className="text-gray-400 text-xs font-medium mb-1">AI Response:</div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {feedback.aiResponse.length > 400
                        ? `${feedback.aiResponse.substring(0, 400)}...`
                        : feedback.aiResponse}
                    </p>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    Session: {feedback.sessionId}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sessionsWithRatings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No session ratings yet
              </div>
            ) : (
              sessionsWithRatings.map((session) => (
                <div
                  key={session.id}
                  className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/[0.07] transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-5 h-5 ${
                              star <= (session.star_rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                            }`}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                        ))}
                      </div>
                      <span className="px-2 py-1 bg-white/10 rounded text-xs text-gray-300">
                        {session.industry}
                      </span>
                      <span className="px-2 py-1 bg-purple-500/20 rounded text-xs text-purple-300">
                        {session.message_feedbacks?.length || 0} message feedbacks
                      </span>
                    </div>
                    <span className="text-gray-500 text-sm">
                      {formatDate(session.created_at)}
                    </span>
                  </div>
                  {session.text_feedback && (
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                      &ldquo;{session.text_feedback}&rdquo;
                    </p>
                  )}
                  <div className="text-xs text-gray-500">
                    Session: {session.session_id}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
