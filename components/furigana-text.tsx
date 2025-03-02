"use client"

import { cn } from "@/lib/utils"

interface FuriganaItem {
  text: string
  reading: string
}

interface FuriganaTextProps {
  text: string
  furigana: FuriganaItem[]
  className?: string
}

export function FuriganaText({ text, furigana, className }: FuriganaTextProps) {
  return (
    <ruby className={cn("text-lg leading-loose", className)}>
      {text}
      <rt className="text-xs text-muted-foreground">{furigana.map((item) => item.reading).join(" ")}</rt>
    </ruby>
  )
}

