import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useRef } from "react"

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
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure popover stays within panel boundaries
    if (popoverRef.current) {
      const popoverRect = popoverRef.current.getBoundingClientRect();
      const parentPanel = popoverRef.current.closest('.panel-container');
      
      if (parentPanel) {
        const panelRect = parentPanel.getBoundingClientRect();
        
        // Check if popover exceeds right boundary
        if (position.x + popoverRect.width/2 > panelRect.width) {
          popoverRef.current.style.left = `${panelRect.width - popoverRect.width/2}px`;
        }
        
        // Check if popover exceeds left boundary
        if (position.x - popoverRect.width/2 < 0) {
          popoverRef.current.style.left = `${popoverRect.width/2}px`;
        }
      }
    }
  }, [position]);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 30}px`, // No additional offset
        transform: 'translate(-50%, 0)',
        maxWidth: '300px',
        width: 'calc(100% - 40px)'
      }}
    >
      <Card className="w-full shadow-lg">
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