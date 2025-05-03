"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Plus, Edit, Trash } from "lucide-react"
import { AnnouncementForm } from "@/components/announcement-form"
import { DeleteConfirmation } from "@/components/delete-confirmation"
// Mevcut importlara ekle
import { Input } from "@/components/ui/input"

export default function FullAdminPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adminUsers, setAdminUsers] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [botChats, setBotChats] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("bot-chats") // Varsayılan olarak bot-chats sekmesini göster

  // Duyuru formu state'leri
  const [isAnnouncementFormOpen, setIsAnnouncementFormOpen] = useState(false)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<any>(null)
  const [currentChat, setCurrentChat] = useState<any>(null)

  // Silme onayı state'leri
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [announcementToDelete, setAnnouncementToDelete] = useState<any>(null)

  // State'lere ekle
  const [manualChatId, setManualChatId] = useState("")
  const [addingChat, setAddingChat] = useState(false)

  // Verileri yükle
  useEffect(() => {
    loadAllData()
  }, [])

  // Tüm verileri yükle
  async function loadAllData() {
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
      await loadAnnouncements()

      // Bot gruplarını yükle
      await loadBotChats()
    } catch (err) {
      console.error("Veri yükleme hatası:", err)
      setError(`Veri yükleme hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setLoading(false)
    }
  }

  // Duyuruları yükle
  async function loadAnnouncements() {
    try {
      const announcementsResponse = await fetch("/api/announcements")
      const announcementsResult = await announcementsResponse.json()

      if (!announcementsResult.success) {
        throw new Error(`Duyurular yüklenirken hata: ${announcementsResult.error}`)
      }

      setAnnouncements(announcementsResult.data || [])
      return announcementsResult.data || []
    } catch (err) {
      console.error("Duyurular yükleme hatası:", err)
      throw err
    }
  }

  // Bot gruplarını yükle
  async function loadBotChats() {
    try {
      setError(null) // Önceki hataları temizle

      const botChatsResponse = await fetch("/api/bot-chats")
      const botChatsResult = await botChatsResponse.json()

      console.log("Bot grupları yüklendi:", botChatsResult)

      if (!botChatsResult.success) {
        throw new Error(`Bot grupları yüklenirken hata: ${botChatsResult.error}`)
      }

      // Veri yoksa veya boşsa
      if (!botChatsResult.data || botChatsResult.data.length === 0) {
        console.log("Hiç bot grubu bulunamadı, grupları yenilemeyi deneyin")
        setBotChats([])
        return []
      }

      // Verileri set et
      setBotChats(botChatsResult.data)

      // Detaylı log
      console.log(
        `${botChatsResult.data.length} adet bot grubu yüklendi:`,
        botChatsResult.data.map((c) => `${c.chat_title || c.chat_id} (${c.chat_type})`),
      )

      return botChatsResult.data
    } catch (err) {
      console.error("Bot grupları yükleme hatası:", err)
      setError(`Bot grupları yüklenirken hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
      throw err
    }
  }

  // Grupları yenile
  async function refreshBotChats() {
    try {
      setRefreshing(true)
      setError(null)

      // Önce grupları yenile API'sini çağır
      const refreshResponse = await fetch("/api/refresh-chats")
      const refreshResult = await refreshResponse.json()

      if (!refreshResult.success) {
        throw new Error(`Grupları yenileme hatası: ${refreshResult.error}`)
      }

      // Sonra güncel grupları yükle
      await loadBotChats()
      // Duyuruları da yenile
      await loadAnnouncements()

      // Başarı mesajı
      alert("Gruplar başarıyla yenilendi!")
    } catch (err) {
      console.error("Grupları yenileme hatası:", err)
      setError(`Grupları yenileme hatası: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
      alert(`Hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setRefreshing(false)
    }
  }

  // Duyuru ekle veya düzenle
  async function handleAnnouncementSubmit(message: string) {
    try {
      if (currentAnnouncement) {
        // Duyuru düzenleme
        const response = await fetch(`/api/announcements/${currentAnnouncement.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(`Duyuru güncellenirken hata: ${result.error}`)
        }

        // Duyuruları yenile
        await loadAnnouncements()
        alert("Duyuru başarıyla güncellendi!")
      } else if (currentChat) {
        // Yeni duyuru ekleme
        const response = await fetch("/api/announcements", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chat_id: currentChat.chat_id,
            message,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          throw new Error(`Duyuru eklenirken hata: ${result.error}`)
        }

        // Duyuruları yenile
        await loadAnnouncements()
        alert("Duyuru başarıyla eklendi!")
      }
    } catch (err) {
      console.error("Duyuru işlemi hatası:", err)
      throw err
    }
  }

  // Duyuru silme
  async function handleAnnouncementDelete() {
    try {
      if (!announcementToDelete) return

      const response = await fetch(`/api/announcements/${announcementToDelete.id}`, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(`Duyuru silinirken hata: ${result.error}`)
      }

      // Duyuruları yenile
      await loadAnnouncements()
      alert("Duyuru başarıyla silindi!")
    } catch (err) {
      console.error("Duyuru silme hatası:", err)
      throw err
    }
  }

  // Duyuru düzenleme modalını aç
  function openEditAnnouncementModal(announcement: any) {
    setCurrentAnnouncement(announcement)
    setCurrentChat(null)
    setIsAnnouncementFormOpen(true)
  }

  // Duyuru ekleme modalını aç
  function openAddAnnouncementModal(chat: any) {
    setCurrentAnnouncement(null)
    setCurrentChat(chat)
    setIsAnnouncementFormOpen(true)
  }

  // Duyuru silme onayı modalını aç
  function openDeleteConfirmationModal(announcement: any) {
    setAnnouncementToDelete(announcement)
    setIsDeleteConfirmationOpen(true)
  }

  // Yeni fonksiyon ekle
  async function handleAddChatManually() {
    if (!manualChatId || isNaN(Number(manualChatId))) {
      alert("Lütfen geçerli bir chat ID girin")
      return
    }

    try {
      setAddingChat(true)
      setError(null)

      const response = await fetch("/api/add-chat-manually", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chat_id: manualChatId }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(`Grup eklenirken hata: ${result.error}`)
      }

      // Grupları yenile
      await loadBotChats()
      setManualChatId("")
      alert(`Grup başarıyla eklendi: ${result.chat.chat_title || result.chat.chat_id}`)
    } catch (err) {
      console.error("Grup ekleme hatası:", err)
      setError(`Grup eklenirken hata oluştu: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
      alert(`Hata: ${err instanceof Error ? err.message : "Bilinmeyen hata"}`)
    } finally {
      setAddingChat(false)
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

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="announcements">Duyurular ({announcements.length})</TabsTrigger>
            <TabsTrigger value="bot-chats">Bot Grupları ({botChats.length})</TabsTrigger>
            <TabsTrigger value="admin-users">Admin Kullanıcıları ({adminUsers.length})</TabsTrigger>
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
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditAnnouncementModal(announcement)}>
                              <Edit className="h-4 w-4 mr-1" />
                              Düzenle
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteConfirmationModal(announcement)}
                            >
                              <Trash className="h-4 w-4 mr-1" />
                              Sil
                            </Button>
                          </div>
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={refreshBotChats}
                    disabled={refreshing}
                  >
                    <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    {refreshing ? "Yenileniyor..." : "Grupları Yenile"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {botChats.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-4">
                      Bot henüz hiçbir gruba eklenmemiş veya gruplar henüz yüklenmedi.
                    </p>
                    <Button variant="outline" onClick={loadBotChats} disabled={refreshing}>
                      Grupları Tekrar Yükle
                    </Button>
                  </div>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                hasAnnouncement
                                  ? openEditAnnouncementModal(announcements.find((a) => a.chat_id === chat.chat_id))
                                  : openAddAnnouncementModal(chat)
                              }
                            >
                              {hasAnnouncement ? (
                                <>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Duyuruyu Düzenle
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Duyuru Ekle
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                {/* Aşağıdaki kodu TabsContent value="bot-chats" içindeki CardContent'in sonuna ekle */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-medium mb-2">Manuel Grup Ekleme</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Eğer bir grup listede görünmüyorsa, grup ID'sini girerek manuel olarak ekleyebilirsiniz.
                  </p>

                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={manualChatId}
                      onChange={(e) => setManualChatId(e.target.value)}
                      placeholder="Grup/Kanal ID (örn: -1001234567890)"
                      className="max-w-xs"
                    />
                    <Button onClick={handleAddChatManually} disabled={addingChat || !manualChatId} variant="outline">
                      {addingChat ? "Ekleniyor..." : "Grup Ekle"}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Not: Grup ID'sini öğrenmek için grupta /chatinfo komutunu kullanabilirsiniz.
                  </p>
                </div>
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
                            <Trash className="h-4 w-4 mr-1" />
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

      {/* Duyuru Formu Modal */}
      <AnnouncementForm
        isOpen={isAnnouncementFormOpen}
        onClose={() => setIsAnnouncementFormOpen(false)}
        onSubmit={handleAnnouncementSubmit}
        initialMessage={currentAnnouncement?.message || ""}
        title={currentAnnouncement ? "Duyuru Düzenle" : "Duyuru Ekle"}
        description={
          currentAnnouncement
            ? "Bu duyuru mesajını düzenleyin. Bu mesaj, gruba/kanala katılan yeni üyelere gönderilecektir."
            : "Yeni bir duyuru mesajı ekleyin. Bu mesaj, gruba/kanala katılan yeni üyelere gönderilecektir."
        }
        chatTitle={
          currentAnnouncement
            ? currentAnnouncement.chat_title || `Sohbet #${currentAnnouncement.chat_id}`
            : currentChat?.chat_title || `Sohbet #${currentChat?.chat_id}`
        }
      />

      {/* Duyuru Silme Onayı Modal */}
      <DeleteConfirmation
        isOpen={isDeleteConfirmationOpen}
        onClose={() => setIsDeleteConfirmationOpen(false)}
        onConfirm={handleAnnouncementDelete}
        title="Duyuruyu Sil"
        description="Bu duyuruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz."
        itemName={announcementToDelete?.chat_title || `Sohbet #${announcementToDelete?.chat_id}`}
      />
    </div>
  )
}
