"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabaseClient, type Announcement } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [chatId, setChatId] = useState("")
  const [chatTitle, setChatTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Duyuruları yükle
  useEffect(() => {
    async function loadAnnouncements() {
      const { data, error } = await supabaseClient
        .from("announcements")
        .select("*")
        .order("updated_at", { ascending: false })

      if (error) {
        toast({
          title: "Hata",
          description: "Duyurular yüklenirken bir hata oluştu.",
          variant: "destructive",
        })
        return
      }

      setAnnouncements(data || [])
    }

    loadAnnouncements()
  }, [toast])

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

    setLoading(false)

    if (error) {
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
  }

  // Duyuru sil
  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm("Bu duyuruyu silmek istediğinizden emin misiniz?")) {
      return
    }

    const { error } = await supabaseClient.from("announcements").delete().eq("id", id)

    if (error) {
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
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Duyuru Yönetimi</h1>

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
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteAnnouncement(announcement.id)}>
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
    </div>
  )
}
