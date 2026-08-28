import { NextResponse } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';
import { getLeadtimeGap } from '@/lib/scm';

export async function GET() {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json({ configured: false, message: 'Supabase environment variables are missing.' }, { status: 503 });
  }

  const { rows, error } = await getLeadtimeGap();
  if (error) {
    return NextResponse.json({ configured: true, connected: false, message: error }, { status: 503 });
  }

  return NextResponse.json({ configured: true, connected: true, analyticsRows: rows.length });
}
