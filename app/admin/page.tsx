"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any>(null)

  // Adım 1: Sayfa yüklendi
  // Adım 2: Supabase bağlantısını test et
  // Adım 3: Admin kullanıcılarını yükle
  // Adım 4: Duyuruları yükle
  // Adım 5: Bot gruplarını yükle

  // Supabase bağlantısını test et
  const testSupabase = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/test-supabase")
      const result = await response.json()

      setData(result)

      if (result.success) {
        setStep(2) // Başarılı, bir sonraki adıma geç
      } else {
        setError(`Supabase bağlantı hatası: ${result.error || "Bilinmeyen hata"}`)
      }
    } catch (err) {
      setError(`Supabase testi başarısız: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  // Admin kullanıcılarını yükle
  const loadAdminUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/admin-users")
      const result = await response.json()

      setData(result)

      if (result.success) {
        setStep(3) // Başarılı, bir sonraki adıma geç
      } else {
        setError(`Admin kullanıcıları yüklenirken hata: ${result.error || "Bilinmeyen hata"}`)
      }
    } catch (err) {
      setError(`Admin kullanıcıları yüklenirken hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  // Duyuruları yükle
  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/announcements")
      const result = await response.json()

      setData(result)

      if (result.success) {
        setStep(4) // Başarılı, bir sonraki adıma geç
      } else {
        setError(`Duyurular yüklenirken hata: ${result.error || "Bilinmeyen hata"}`)
      }
    } catch (err) {
      setError(`Duyurular yüklenirken hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  // Bot gruplarını yükle
  const loadBotChats = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/bot-chats")
      const result = await response.json()

      setData(result)

      if (result.success) {
        setStep(5) // Başarılı, son adım
      } else {
        setError(`Bot grupları yüklenirken hata: ${result.error || "Bilinmeyen hata"}`)
      }
    } catch (err) {
      setError(`Bot grupları yüklenirken hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  // Tam admin paneline git
  const goToFullAdmin = () => {
    window.location.href = "/admin/full"
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Paneli - Adım {step}/5</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Hata!</p>
          <p>{error}</p>
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{getStepTitle(step)}</CardTitle>
        </CardHeader>
        <CardContent>
          {step === 1 && (
            <div>
              <p className="mb-4">Supabase bağlantısını test etmek için aşağıdaki butona tıklayın.</p>
              <Button onClick={testSupabase} disabled={loading}>
                {loading ? "Test Ediliyor..." : "Supabase Bağlantısını Test Et"}
              </Button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="mb-4">Supabase bağlantısı başarılı! Şimdi admin kullanıcılarını yükleyelim.</p>
              <Button onClick={loadAdminUsers} disabled={loading}>
                {loading ? "Yükleniyor..." : "Admin Kullanıcılarını Yükle"}
              </Button>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="mb-4">Admin kullanıcıları başarıyla yüklendi! Şimdi duyuruları yükleyelim.</p>
              <Button onClick={loadAnnouncements} disabled={loading}>
                {loading ? "Yükleniyor..." : "Duyuruları Yükle"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div>
              <p className="mb-4">Duyurular başarıyla yüklendi! Şimdi bot gruplarını yükleyelim.</p>
              <Button onClick={loadBotChats} disabled={loading}>
                {loading ? "Yükleniyor..." : "Bot Gruplarını Yükle"}
              </Button>
            </div>
          )}

          {step === 5 && (
            <div>
              <p className="mb-4">Tüm veriler başarıyla yüklendi! Artık tam admin paneline gidebilirsiniz.</p>
              <Button onClick={goToFullAdmin}>Tam Admin Paneline Git</Button>
            </div>
          )}

          {data && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Sonuç:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-60">{JSON.stringify(data, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getStepTitle(step: number): string {
  switch (step) {
    case 1:
      return "Supabase Bağlantı Testi"
    case 2:
      return "Admin Kullanıcıları Yükleme"
    case 3:
      return "Duyurular Yükleme"
    case 4:
      return "Bot Grupları Yükleme"
    case 5:
      return "Tamamlandı"
    default:
      return "Bilinmeyen Adım"
  }
}
