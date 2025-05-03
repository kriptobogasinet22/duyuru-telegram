import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Telegram Hoş Geldin Botu</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Bot Durumu</CardTitle>
            <CardDescription>Botun mevcut durumu ve istatistikleri</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Bot aktif ve çalışıyor.</p>
            <Link href="/api/webhook" passHref>
              <Button>Bot Durumunu Kontrol Et</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kullanım Talimatları</CardTitle>
            <CardDescription>Botu nasıl kullanacağınıza dair bilgiler</CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold mb-2">Admin Komutları:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>/setmessage [mesaj]</code> - Duyuru mesajını ayarla
              </li>
              <li>
                <code>/showmessage</code> - Mevcut duyuru mesajını göster
              </li>
              <li>
                <code>/addadmin [user_id]</code> - Yeni admin ekle
              </li>
            </ul>

            <h3 className="font-semibold mt-4 mb-2">Mesaj Değişkenleri:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <code>{"{username}"}</code> - Kullanıcı adı (@username)
              </li>
              <li>
                <code>{"{first_name}"}</code> - Kullanıcının adı
              </li>
              <li>
                <code>{"{last_name}"}</code> - Kullanıcının soyadı
              </li>
              <li>
                <code>{"{chat_title}"}</code> - Grup/kanal adı
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
