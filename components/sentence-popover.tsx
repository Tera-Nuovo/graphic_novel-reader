import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface SentencePopoverProps {
  translation: string
  position: {
    x: number
    y: number
  }
  onClose: () => void
}

export function SentencePopover({ translation, position, onClose }: SentencePopoverProps) {
  return (
    <div
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y + 20}px`,
      }}
    >
      <Card className="w-80">
        <CardContent className="pt-4 pb-3">
          <div className="flex justify-between items-start gap-4">
            <p className="text-sm flex-1">{translation}</p>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 -mt-1 -mr-1">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

