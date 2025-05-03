"use client"

import { useState, useEffect } from "react"

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchEnvVars() {
      try {
        const response = await fetch("/api/env-test")
        const data = await response.json()
        setEnvVars(data)
      } catch (error) {
        console.error("Hata:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEnvVars()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ortam Değişkenleri Testi</h1>

      {loading ? (
        <p>Yükleniyor...</p>
      ) : (
        <div className="bg-white shadow-md rounded p-4">
          <h2 className="text-xl font-semibold mb-4">Ortam Değişkenleri</h2>

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
        </div>
      )}
    </div>
  )
}
