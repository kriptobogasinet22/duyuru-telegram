import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get("userId")

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: "userId parametresi gerekli",
      },
      { status: 400 },
    )
  }

  try {
    // Admin kullanıcısını kontrol et
    const { data, error } = await supabaseAdmin.from("admin_users").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Admin kontrolü hatası:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      isAdmin: !!data,
      user: data,
    })
  } catch (error) {
    console.error("API hatası:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 },
    )
  }
}
