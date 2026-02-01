import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // Get today's date range
    const today = new Date();
    const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    // Run all queries in parallel
    const [
      { count: totalMembers },
      { count: activeMembers },
      { data: paymentsData },
      { data: ordersData },
      { data: eventsData },
      { data: revenueData }
    ] = await Promise.all([
      // Total members
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member'),
      
      // Active members
      supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'member')
        .eq('status', 'active'),
      
      // Payments data
      supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Orders data
      supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      
      // Events data
      supabaseAdmin
        .from('events')
        .select('*')
        .order('event_date', { ascending: true }),
      
      // Today's revenue
      supabaseAdmin
        .from('payments')
        .select('amount')
        .eq('status', 'confirmed')
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
    ]);

    // Calculate stats
    const totalRevenue = paymentsData
      ?.filter(p => p.status === 'confirmed')
      .reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    const todayRevenue = revenueData
      ?.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0) || 0;

    const pendingPayments = paymentsData
      ?.filter(p => p.status === 'pending').length || 0;

    const pendingOrders = ordersData
      ?.filter(o => o.status === 'pending').length || 0;

    const upcomingEvents = eventsData
      ?.filter(e => e.status === 'upcoming' && e.is_active).length || 0;

    // Recent activity
    const recentPayments = paymentsData?.slice(0, 5) || [];
    const recentMembers = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role', 'member')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => data || []);

    return NextResponse.json({
      stats: {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        totalRevenue,
        todayRevenue,
        pendingPayments,
        pendingOrders,
        totalEvents: eventsData?.length || 0,
        upcomingEvents
      },
      recentPayments,
      recentMembers,
      payments: paymentsData || [],
      orders: ordersData || [],
      events: eventsData || []
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}