import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "✓ Mevcut" : "✗ Eksik",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Mevcut" : "✗ Eksik",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "✓ Mevcut" : "✗ Eksik",
    NODE_ENV: process.env.NODE_ENV || "Bilinmiyor",
  })
}
