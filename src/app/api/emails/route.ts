import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase';
import { EmailCategory, EmailPriority } from '@/types/email';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as EmailCategory | null;
        const priorityParam = searchParams.get('priority');

    const isEmailPriority = (value: string): value is EmailPriority => {
      return ["High", "Medium", "Low"].includes(value as EmailPriority);
    };
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10'); // Show 10 emails per page
    const offset = (page - 1) * limit;

    const supabase = createServerSupabaseClient();
    
    let query = supabase
      .from('emails')
      .select('*')
      .eq('user_id', session.user.id)
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (category) {
      query = query.eq('category', category);
    }
    
    if (priorityParam && isEmailPriority(priorityParam)) {
      query = query.eq('priority', priorityParam);
    }

    const { data: emails, error } = await query;

    if (error) {
      console.error('Error fetching emails:', error);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('emails')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);

    if (category) {
      countQuery = countQuery.eq('category', category);
    }
    
    if (priorityParam && isEmailPriority(priorityParam)) {
      countQuery = countQuery.eq('priority', priorityParam);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting emails:', countError);
    }

    return NextResponse.json({
      emails: emails || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });

  } catch (error) {
    console.error('Error in emails API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();
    
    const { error } = await supabase
      .from('emails')
      .delete()
      .eq('id', emailId)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Error deleting email:', error);
      return NextResponse.json({ error: 'Failed to delete email' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in delete email API:', error);
    return NextResponse.json(
      { error: 'Failed to delete email' },
      { status: 500 }
    );
  }
}
