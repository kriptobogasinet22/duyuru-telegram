"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw } from 'lucide-react'

export default function FullAdminPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [botChats, setBotChats] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("announcements")

  // Verileri yükle
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)

        // Admin kullanıcılarını yükle
        const adminResponse = await fetch("/api/admin-users")
        const adminResult = await adminResponse.json()

        if (!adminResult.success) {
          throw new Error(`Admin kullanıcıları yüklenirken hata: ${adminResult.error}`)
        }

        setAdminUsers(adminResult.data || [])

        // Duyuruları yükle
        const announcementsResponse = await fetch("/api/announcements")
        const announcementsResult = await announcementsResponse.json()

        if (!announcementsResult.success) {
          throw new Error(`Duyurular yüklenirken hata: ${announcementsResult.error}`)
        }

        setAnnouncements(announcementsResult.data || [])

        // Bot gruplarını yükle
        const botChatsResponse = await fetch("/api/bot-chats")
        const botChatsResult = await botChatsResponse.json()

        if (!botChatsResult.success) {
          throw new Error(`Bot grupları yüklenirken hata: ${botChatsResult.error}`)
        }

        setBotChats(botChatsResult.data || [])
      } catch (err) {
        console.error("Veri yükleme hatası:", err)
        setError(`Veri yükleme hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Paneli</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Hata!</p>
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements" onValueChange={setActiveTab}>
              Duyurular ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="bot-chats" onValueChange={setActiveTab}>
              Bot Grupları ({botChats.length})
            </TabsTrigger>
            <TabsTrigger value="admin-users" onValueChange={setActiveTab}>
              Admin Kullanıcıları ({adminUsers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="announcements">
            <Card>
              <CardHeader>
                <CardTitle>Duyurular</CardTitle>
                <CardDescription>
                  Gruplara ve kanallara katılan kullanıcılara gönderilen duyuru mesajları
                </CardDescription>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Henüz duyuru mesajı eklenmemiş.</p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div key={announcement.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold">
                              {announcement.chat_title || `Sohbet #${announcement.chat_id}`}
                            </h3>
                            <p className="text-sm text-gray-500">ID: {announcement.chat_id}</p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Sil
                          </Button>
                        </div>
                        <p className="whitespace-pre-wrap">{announcement.message}</p>
                        <p className="text-xs text-gray-500 mt-2">
                          Son güncelleme: {new Date(announcement.updated_at).toLocaleString("tr-TR")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bot-chats">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Bot'un Üye Olduğu Gruplar</CardTitle>
                    <CardDescription>
                      Bot'un eklendiği ve yönetici olduğu grupları görüntüleyin ve duyuru ayarlayın
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Grupları Yenile
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {botChats.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">
                    Bot henüz hiçbir gruba eklenmemiş veya gruplar henüz yüklenmedi.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {botChats.map((chat) => {
                      // Bu grup için duyuru var mı kontrol et
                      const hasAnnouncement = announcements.some((a) => a.chat_id === chat.chat_id)

                      return (
                        <div key={chat.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold">{chat.chat_title || `Sohbet #${chat.chat_id}`}</h3>
                              <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">ID: {chat.chat_id}</span>
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Tür: {chat.chat_type}</span>
                                <span
                                  className={`text-xs px-2 py-1 rounded ${
                                    chat.is_admin ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                  }`}
                                >
                                  {chat.is_admin ? "Admin" : "Üye"}
                                </span>
                                {chat.member_count && (
                                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{chat.member_count} üye</span>
                                )}
                                {hasAnnouncement && (
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    Duyuru Aktif
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button variant="outline" size="sm">
                              {hasAnnouncement ? "Duyuruyu Düzenle" : "Duyuru Ekle"}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin-users">
            <Card>
              <CardHeader>
                <CardTitle>Admin Kullanıcıları</CardTitle>
                <CardDescription>Bot komutlarını kullanabilen admin kullanıcıları</CardDescription>
              </CardHeader>
              <CardContent>
                {adminUsers.length === 0 ? (
                  <p className="text-center py-4 text-gray-500">Henüz admin kullanıcısı eklenmemiş.</p>
                ) : (
                  <div className="space-y-4">
                    {adminUsers.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{user.username || `Kullanıcı #${user.user_id}`}</h3>
                            <p className="text-sm text-gray-500">ID: {user.user_id}</p>
                          </div>
                          <Button variant="destructive" size="sm">
                            Sil
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <div className="mt-4">
        <Button variant="outline" onClick={() => (window.location.href = "/admin")}>
          Teşhis Sayfasına Dön
        </Button>
      </div>
    </div>
  )
}
