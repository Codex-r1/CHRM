// app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', admin: null };
    }

    const token = authHeader.replace('Bearer ', '');
    const adminClient = supabaseAdmin();

    const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !user) {
      return { error: 'Invalid or expired token', admin: null };
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return { error: 'Unauthorized: Admin access required', admin: null };
    }

    return { error: null, admin: user };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { error: 'Authentication failed', admin: null };
  }
}

export async function GET(request: NextRequest) {
  try {
    const { error: authError, admin } = await verifyAdmin(request);
    if (authError || !admin) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    // FIX: Don't mutate the same Date object
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

    const adminClient = supabaseAdmin();

    const [
      { count: totalMembers },
      { count: activeMembers },
      { data: paymentsData },
      { data: ordersData },
      { data: eventsData },
      { data: revenueData },
      { data: usersData },
    ] = await Promise.all([
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member'),
      adminClient.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'member').eq('status', 'active'),
      adminClient.from('payments').select('*, profiles:user_id (full_name, email, membership_number)').order('created_at', { ascending: false }).limit(100),
      adminClient.from('orders').select('*, profiles:user_id (full_name, email)').order('created_at', { ascending: false }).limit(100),
      adminClient.from('events').select('*').order('event_date', { ascending: true }),
      adminClient.from('payments').select('amount').eq('status', 'confirmed').gte('created_at', todayStart).lte('created_at', todayEnd),
      adminClient.from('profiles').select('*').eq('role', 'member').order('created_at', { ascending: false }).limit(5),
    ]);

    // FIX: Safe amount parsing (handle nulls)
    const parseAmount = (v: any) => {
      const n = parseFloat(String(v ?? 0));
      return isNaN(n) ? 0 : n;
    };

    const totalRevenue = (paymentsData || [])
      .filter((p) => p.status === 'confirmed')
      .reduce((sum, p) => sum + parseAmount(p.amount), 0);

    const todayRevenue = (revenueData || []).reduce((sum, p) => sum + parseAmount(p.amount), 0);

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyRevenue = (paymentsData || [])
      .filter((p) => {
        if (p.status !== 'confirmed') return false;
        const d = new Date(p.created_at);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, p) => sum + parseAmount(p.amount), 0);

    const pendingPayments = (paymentsData || []).filter((p) => p.status === 'pending').length;
    const pendingOrders = (ordersData || []).filter((o) => o.status === 'pending').length;
    const upcomingEvents = (eventsData || []).filter((e) => e.status === 'upcoming' && e.is_active).length;

    return NextResponse.json({
      stats: {
        totalMembers: totalMembers || 0,
        activeMembers: activeMembers || 0,
        totalRevenue,
        todayRevenue,
        monthlyRevenue,
        pendingPayments,
        pendingOrders,
        totalEvents: eventsData?.length || 0,
        upcomingEvents,
      },
      recentPayments: (paymentsData || []).slice(0, 5),
      recentMembers: usersData || [],
      payments: paymentsData || [],
      orders: ordersData || [],
      events: eventsData || [],
    });
  } catch (error: any) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data', details: error.message }, { status: 500 });
  }
}