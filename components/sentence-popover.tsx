import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useRef } from "react"

interface SentencePopoverProps {
  translation: string
  position: {
    x: number
    y: number
  }
  onClose: () => void
}

export function SentencePopover({ translation, position, onClose }: SentencePopoverProps) {
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

  // Add click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    // Add event listener
    document.addEventListener("mousedown", handleClickOutside);
    
    // Clean up event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y - 20}px`, // No additional offset
        transform: 'translate(-50%, 0)',
        maxWidth: '300px',
        width: 'calc(100% - 40px)'
      }}
    >
      <Card className="w-full shadow-lg">
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