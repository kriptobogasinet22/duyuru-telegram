"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AnnouncementFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (message: string) => Promise<void>
  initialMessage?: string
  title: string
  description: string
  chatTitle?: string
}

export function AnnouncementForm({
  isOpen,
  onClose,
  onSubmit,
  initialMessage = "",
  title,
  description,
  chatTitle,
}: AnnouncementFormProps) {
  const [message, setMessage] = useState(initialMessage)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!message.trim()) {
      setError("Lütfen bir duyuru mesajı girin")
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await onSubmit(message)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
            {chatTitle && <span className="font-medium block mt-1">{chatTitle}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Duyuru Mesajı</h4>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hoş geldiniz! Grubumuzun kurallarını okumayı unutmayın."
              className="min-h-[150px]"
            />
            <p className="text-xs text-gray-500">
              Kullanabileceğiniz değişkenler: {"{username}"}, {"{first_name}"}, {"{last_name}"}, {"{chat_title}"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            İptal
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
