import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface WordPopoverProps {
  word: {
    japanese: string
    furigana: string
    english: string
    grammarNote: string
    additionalNote: string
  }
  position: {
    x: number
    y: number
  }
  onClose: () => void
}

export function WordPopover({ word, position, onClose }: WordPopoverProps) {
  return (
    <div
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`,
      }}
    >
      <Card className="w-80">
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle className="text-base">
            <ruby>
              {word.japanese}
              <rt className="text-xs text-muted-foreground">{word.furigana}</rt>
            </ruby>
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Translation</p>
            <p className="text-sm">{word.english}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Grammar Note</p>
            <p className="text-sm">{word.grammarNote}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Additional Note</p>
            <p className="text-sm">{word.additionalNote}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

