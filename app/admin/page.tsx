"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabaseClient, type Announcement, type BotChat } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { RefreshCw } from "lucide-react"

export default function AdminPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseStatus, setSupabaseStatus] = useState("Kontrol ediliyor...")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [botChats, setBotChats] = useState<BotChat[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatId, setChatId] = useState("")
  const [chatTitle, setChatTitle] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("add-announcement")
  const { toast } = useToast()

  // Sayfa yüklendiğinde çalışacak
  useEffect(() => {
    const checkSupabase = async () => {
      try {
        setLoading(true)

        // Supabase bağlantısını kontrol et
        const response = await fetch("/api/check-supabase")
        const data = await response.json()

        if (data.success) {
          setSupabaseStatus("Bağlantı başarılı ✅")
        } else {
          setSupabaseStatus(`Bağlantı hatası: ${data.error || "Bilinmeyen hata"}`)
          setError("Supabase bağlantısı kurulamadı. Lütfen ortam değişkenlerini kontrol edin.")
        }
      } catch (err) {
        console.error("Supabase kontrol hatası:", err)
        setSupabaseStatus(`Kontrol hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
        setError("Bir hata oluştu. Lütfen konsolu kontrol edin.")
      } finally {
        setLoading(false)
      }
    }

    async function loadData() {
      try {
        // Duyuruları yükle
        const { data: announcementsData, error: announcementsError } = await supabaseClient
          .from("announcements")
          .select("*")
          .order("updated_at", { ascending: false })

        if (announcementsError) {
          console.error("Duyuru yükleme hatası:", announcementsError)
          toast({
            title: "Hata",
            description: "Duyurular yüklenirken bir hata oluştu.",
            variant: "destructive",
          })
        } else {
          setAnnouncements(announcementsData || [])
        }

        // Botun üye olduğu grupları yükle
        const { data: chatsData, error: chatsError } = await supabaseClient
          .from("bot_chats")
          .select("*")
          .order("chat_title", { ascending: true })

        if (chatsError) {
          console.error("Grup yükleme hatası:", chatsError)
          toast({
            title: "Hata",
            description: "Gruplar yüklenirken bir hata oluştu.",
            variant: "destructive",
          })
        } else {
          setBotChats(chatsData || [])
        }
      } catch (error) {
        console.error("Veri yükleme hatası:", error)
      }
    }

    checkSupabase()
    loadData()
  }, [toast])

  // Grupları yenile
  const refreshChats = async () => {
    setRefreshing(true)

    try {
      // API endpoint'i çağır
      const response = await fetch("/api/refresh-chats")

      if (!response.ok) {
        throw new Error("Grupları yenileme işlemi başarısız oldu.")
      }

      // Başarılı mesajı göster
      toast({
        title: "Başarılı",
        description: "Gruplar yenileniyor. Bu işlem biraz zaman alabilir.",
      })

      // 3 saniye bekle ve grupları yeniden yükle
      setTimeout(async () => {
        const { data: chatsData } = await supabaseClient
          .from("bot_chats")
          .select("*")
          .order("chat_title", { ascending: true })

        setBotChats(chatsData || [])
        setRefreshing(false)
      }, 3000)
    } catch (error) {
      console.error("Grup yenileme hatası:", error)
      toast({
        title: "Hata",
        description: "Grupları yenilerken bir hata oluştu.",
        variant: "destructive",
      })
      setRefreshing(false)
    }
  }

  // Yeni duyuru ekle
  const handleAddAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!chatId || !newMessage) {
      toast({
        title: "Eksik Bilgi",
        description: "Lütfen sohbet ID ve mesaj alanlarını doldurun.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabaseClient.from("announcements").upsert(
        {
          chat_id: Number.parseInt(chatId),
          chat_type: "group", // Varsayılan olarak grup
          chat_title: chatTitle || null,
          message: newMessage,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "chat_id",
        },
      )

      if (error) {
        console.error("Duyuru ekleme hatası:", error)
        toast({
          title: "Hata",
          description: `Duyuru eklenirken bir hata oluştu: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Başarılı",
        description: "Duyuru mesajı başarıyla eklendi/güncellendi.",
      })

      // Formu temizle
      setChatId("")
      setChatTitle("")
      setNewMessage("")

      // Listeyi yenile
      const { data: updatedData } = await supabaseClient
        .from("announcements")
        .select("*")
        .order("updated_at", { ascending: false })

      setAnnouncements(updatedData || [])
    } catch (error) {
      console.error("Duyuru ekleme hatası:", error)
      toast({
        title: "Hata",
        description: "Duyuru eklenirken bir hata oluştu.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Duyuru sil
  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) {
      return
    }

    try {
      const { error } = await supabaseClient.from("announcements").delete().eq("id", id)

      if (error) {
        console.error("Duyuru silme hatası:", error)
        toast({
          title: "Hata",
          description: `Duyuru silinirken bir hata oluştu: ${error.message}`,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Başarılı",
        description: "Duyuru başarıyla silindi.",
      })

      // Listeyi güncelle
      setAnnouncements(announcements.filter((a) => a.id !== id))
    } catch (error) {
      console.error("Duyuru silme hatası:", error)
    }
  }

  // Grup seç
  const selectChat = (chat: BotChat) => {
    setChatId(chat.chat_id.toString())
    setChatTitle(chat.chat_title || "")
    setActiveTab("add-announcement")

    // Bu grup için mevcut duyuru var mı kontrol et
    const existingAnnouncement = announcements.find((a) => a.chat_id === chat.chat_id)
    if (existingAnnouncement) {
      setNewMessage(existingAnnouncement.message)
    } else {
      // Varsayılan mesaj şablonu
      setNewMessage(`Merhaba {first_name}! 👋\n\n{chat_title} grubuna hoş geldiniz!`)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Admin Paneli - Durum Kontrolü</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Sistem Durumu</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="font-medium">Sayfa Durumu: Yüklendi ✅</p>
            </div>

            <div>
              <p className="font-medium">Supabase Durumu: {supabaseStatus}</p>
            </div>

            <div className="pt-4">
              <Button onClick={() => window.location.reload()} disabled={loading}>
                Sayfayı Yenile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <h1 className="text-3xl font-bold mb-6">Duyuru Yönetimi</h1>

      <div className="mb-6">
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "add-announcement"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("add-announcement")}
          >
            Duyuru Ekle
          </button>
          <button
            className={`py-2 px-4 font-medium ${
              activeTab === "bot-chats"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("bot-chats")}
          >
            Bot Grupları
          </button>
        </div>
      </div>

      {activeTab === "add-announcement" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Yeni Duyuru Ekle</CardTitle>
              <CardDescription>
                Gruplara ve kanallara katılan kullanıcılara gönderilecek duyuru mesajını ayarlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAnnouncement} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="chatId">Sohbet ID</Label>
                  <Input
                    id="chatId"
                    type="text"
                    placeholder="-1001234567890"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    required
                  />
                  <p className="text-sm text-gray-500">Grup veya kanal ID'si. Negatif bir sayı olmalıdır.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="chatTitle">Sohbet Başlığı (İsteğe Bağlı)</Label>
                  <Input
                    id="chatTitle"
                    type="text"
                    placeholder="Grubumun Adı"
                    value={chatTitle}
                    onChange={(e) => setChatTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Duyuru Mesajı</Label>
                  <Textarea
                    id="message"
                    placeholder="Hoş geldin {username}! {chat_title} grubuna katıldığın için teşekkürler."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={5}
                    required
                  />
                  <p className="text-sm text-gray-500">
                    Kullanılabilir değişkenler: {"{username}"}, {"{first_name}"}, {"{last_name}"}, {"{chat_title}"}
                  </p>
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? "Ekleniyor..." : "Duyuru Ekle"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mevcut Duyurular</CardTitle>
              <CardDescription>Ayarlanmış duyuru mesajlarını görüntüleyin ve yönetin</CardDescription>
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
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteAnnouncement(announcement.id)}
                        >
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
        </div>
      )}

      {activeTab === "bot-chats" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Bot'un Üye Olduğu Gruplar</CardTitle>
                <CardDescription>
                  Bot'un eklendiği ve yönetici olduğu grupları görüntüleyin ve duyuru ayarlayın
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshChats}
                disabled={refreshing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Yenileniyor..." : "Grupları Yenile"}
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
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Duyuru Aktif</span>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => selectChat(chat)}>
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
      )}
    </div>
  )
}
