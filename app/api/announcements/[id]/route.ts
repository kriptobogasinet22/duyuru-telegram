import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

// Belirli bir duyuruyu getir
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const { data, error } = await supabaseAdmin.from("announcements").select("*").eq("id", id).single()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      data,
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

// Duyuruyu güncelle
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from("announcements")
      .update({
        message: body.message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      data,
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

// Duyuruyu sil
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    const { data, error } = await supabaseAdmin.from("announcements").delete().eq("id", id)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Duyuru başarıyla silindi",
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
