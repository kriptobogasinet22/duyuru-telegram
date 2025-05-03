"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [supabaseTest, setSupabaseTest] = useState<any>(null)

  // Ortam değişkenlerini kontrol et
  useEffect(() => {
    async function checkEnv() {
      try {
        const response = await fetch("/api/env-test")
        const data = await response.json()
        setEnvVars(data)
      } catch (err) {
        setError(`API çağrısı başarısız: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
      } finally {
        setLoading(false)
      }
    }

    checkEnv()
  }, [])

  // Supabase bağlantısını test et
  const testSupabase = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/test-supabase")
      const data = await response.json()
      setSupabaseTest(data)
    } catch (err) {
      setError(`Supabase testi başarısız: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Paneli</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Hata!</p>
          <p>{error}</p>
        </div>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Ortam Değişkenleri</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Yükleniyor...</p>
          ) : (
            <ul className="space-y-2">
              {Object.entries(envVars).map(([key, value]) => (
                <li key={key} className="flex items-center">
                  <span className="font-medium mr-2">{key}:</span>
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      value.includes("✓") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {value}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Supabase Bağlantı Testi</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testSupabase} disabled={loading}>
            {loading ? "Test Ediliyor..." : "Supabase Bağlantısını Test Et"}
          </Button>

          {supabaseTest && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Sonucu:</h3>
              <div
                className={`p-4 rounded ${
                  supabaseTest.success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                <p className="font-bold">{supabaseTest.success ? "Başarılı!" : "Hata!"}</p>
                <pre className="mt-2 overflow-auto">{JSON.stringify(supabaseTest, null, 2)}</pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Yardım</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Eğer Supabase bağlantı testi başarısız olursa, şu adımları izleyin:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Vercel'de ortam değişkenlerinin doğru formatta olduğundan emin olun</li>
            <li>Supabase projenizin aktif olduğundan emin olun</li>
            <li>Supabase URL'sinin başında "https://" olduğundan emin olun</li>
            <li>Anahtarların tam olarak Supabase'den kopyalandığından emin olun</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
