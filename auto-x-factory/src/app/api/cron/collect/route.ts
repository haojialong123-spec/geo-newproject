import { NextResponse } from 'next/server';

export async function GET() {
  // Logic to trigger Search tools and store in Supabase Inbox
  return NextResponse.json({ success: true, message: "Daily collection triggered" });
}
