import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

interface MessageFeedbackEntry {
  messageId: number;
  userQuestion: string;
  aiResponse: string;
  feedback: 'up' | 'down';
  timestamp: string;
}

// GET - Retrieve all feedback from Supabase
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    
    const { data: sessions, error } = await supabase
      .from('session_feedback')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    // Calculate stats
    let totalThumbsUp = 0;
    let totalThumbsDown = 0;
    let totalMessageFeedbacks = 0;
    let totalRatings = 0;
    let sumRatings = 0;

    sessions?.forEach(session => {
      const feedbacks = session.message_feedbacks as MessageFeedbackEntry[] || [];
      feedbacks.forEach(f => {
        totalMessageFeedbacks++;
        if (f.feedback === 'up') totalThumbsUp++;
        if (f.feedback === 'down') totalThumbsDown++;
      });
      if (session.star_rating) {
        totalRatings++;
        sumRatings += session.star_rating;
      }
    });

    const avgRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    return NextResponse.json({
      sessions: sessions || [],
      stats: {
        totalSessions: sessions?.length || 0,
        totalMessageFeedbacks,
        thumbsUp: totalThumbsUp,
        thumbsDown: totalThumbsDown,
        totalSessionRatings: totalRatings,
        averageRating: avgRating.toFixed(1),
      }
    });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add or update feedback in Supabase
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const { type } = body;

    if (type === 'message') {
      const { sessionId, messageId, userQuestion, aiResponse, feedback, industry } = body;
      
      if (!sessionId || messageId === undefined || !feedback || !industry) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const newFeedbackEntry: MessageFeedbackEntry = {
        messageId,
        userQuestion: userQuestion || '',
        aiResponse: aiResponse || '',
        feedback,
        timestamp: new Date().toISOString(),
      };

      // Check if session exists
      const { data: existing } = await supabase
        .from('session_feedback')
        .select('id, message_feedbacks')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        // Update existing session - append or update message feedback
        const currentFeedbacks = (existing.message_feedbacks as MessageFeedbackEntry[]) || [];
        const existingIndex = currentFeedbacks.findIndex(f => f.messageId === messageId);
        
        if (existingIndex >= 0) {
          currentFeedbacks[existingIndex] = newFeedbackEntry;
        } else {
          currentFeedbacks.push(newFeedbackEntry);
        }

        const { error: updateError } = await supabase
          .from('session_feedback')
          .update({ message_feedbacks: currentFeedbacks })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
        }
      } else {
        // Create new session record
        const { error: insertError } = await supabase
          .from('session_feedback')
          .insert({
            session_id: sessionId,
            industry,
            message_feedbacks: [newFeedbackEntry],
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'session') {
      const { sessionId, rating, textFeedback, industry } = body;
      
      if (!sessionId || rating === undefined || !industry) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      // Check if session exists
      const { data: existing } = await supabase
        .from('session_feedback')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        // Update existing session with rating
        const { error: updateError } = await supabase
          .from('session_feedback')
          .update({ 
            star_rating: rating,
            text_feedback: textFeedback || '',
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Update error:', updateError);
          return NextResponse.json({ error: 'Failed to update rating' }, { status: 500 });
        }
      } else {
        // Create new session with rating (no message feedbacks yet)
        const { error: insertError } = await supabase
          .from('session_feedback')
          .insert({
            session_id: sessionId,
            industry,
            star_rating: rating,
            text_feedback: textFeedback || '',
            message_feedbacks: [],
          });

        if (insertError) {
          console.error('Insert error:', insertError);
          return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 });
        }
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
  } catch (error) {
    console.error('Feedback API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
