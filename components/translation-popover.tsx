"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TranslationPopoverProps {
  word: string
  position: { x: number; y: number }
  onClose: () => void
  pageText: any[]
}

export function TranslationPopover({ word, position, onClose, pageText }: TranslationPopoverProps) {
  // Find the translation for the clicked word
  const textItem = pageText.find((item) => item.text === word)

  if (!textItem) return null

  return (
    <div
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 30}px`,
      }}
    >
      <Card className="w-64">
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle className="text-sm">{textItem.text}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Reading</p>
              <p className="text-sm">{textItem.furigana.map((item: any) => item.reading).join(" ")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Translation</p>
              <p className="text-sm">{textItem.translation}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

