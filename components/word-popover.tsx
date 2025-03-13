import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { useEffect, useRef } from "react"

// Import the functions needed for SmartFurigana
// Function to check if a character is kanji
function isKanji(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x4e00 && code <= 0x9faf) || // Common and uncommon kanji
         (code >= 0x3400 && code <= 0x4dbf);   // Rare kanji
}

// Function to check if a character is kana (hiragana or katakana)
function isKana(char: string): boolean {
  const code = char.charCodeAt(0);
  return (code >= 0x3040 && code <= 0x309f) || // Hiragana
         (code >= 0x30a0 && code <= 0x30ff);   // Katakana
}

// Component to intelligently render a Japanese word with furigana only on kanji
function SmartFurigana({ 
  japanese, 
  furigana 
}: { 
  japanese: string; 
  furigana: string; 
}): JSX.Element {
  // If no Japanese text or no furigana, just return the Japanese text
  if (!japanese || !furigana) {
    return <span>{japanese}</span>;
  }
  
  // Check if the word is all kana (hiragana/katakana)
  if ([...japanese].every(char => !isKanji(char))) {
    return <span>{japanese}</span>;
  }
  
  // For words with kanji, we need a more sophisticated approach
  const japaneseChars = [...japanese];
  
  // Create mapped segments for rendering
  const segments: { text: string; isKanji: boolean; reading?: string }[] = [];
  let currentSegment: typeof segments[0] | null = null;
  
  // First, divide the text into segments of kanji and non-kanji
  for (let i = 0; i < japaneseChars.length; i++) {
    const char = japaneseChars[i];
    const charIsKanji = isKanji(char);
    
    if (!currentSegment || currentSegment.isKanji !== charIsKanji) {
      // Start a new segment
      currentSegment = {
        text: char,
        isKanji: charIsKanji
      };
      segments.push(currentSegment);
    } else {
      // Extend current segment
      currentSegment.text += char;
    }
  }
  
  // Simplify our approach for kanji reading assignment
  // Let's count kanji characters and map them directly
  const kanjiPositions: number[] = [];
  japaneseChars.forEach((char, index) => {
    if (isKanji(char)) {
      kanjiPositions.push(index);
    }
  });
  
  // Map furigana to each kanji character
  const furiganaMap: Map<number, string> = new Map();
  
  // Simple approach: split furigana by syllables
  const readingChars = [...furigana];
  let currentKanjiIndex = 0;
  
  // For each segment, assign readings only to kanji segments
  for (const segment of segments) {
    if (!segment.isKanji) continue;
    
    // Each kanji character in this segment needs a reading
    const segmentChars = [...segment.text];
    let segmentReading = '';
    
    // For each kanji in this segment, get a reading from the furigana
    for (let i = 0; i < segmentChars.length; i++) {
      // Make sure we don't run out of kanji indices
      if (currentKanjiIndex >= kanjiPositions.length) break;
      
      // Get position of this kanji in the original string
      const kanjiPos = kanjiPositions[currentKanjiIndex];
      
      // Basic heuristic: assign one character from furigana to each kanji
      // This is very simplified but works for many cases
      const readingChar = readingChars[kanjiPos < readingChars.length ? kanjiPos : 0] || '';
      
      // Add this reading to our segment reading
      segmentReading += readingChar;
      
      // Move to next kanji
      currentKanjiIndex++;
    }
    
    // Assign the combined reading to this segment
    segment.reading = segmentReading.length > 0 ? segmentReading : undefined;
  }
  
  // Now render the segments
  const elements: JSX.Element[] = segments.map((segment, index) => {
    if (!segment.isKanji || !segment.reading) {
      return <span key={`segment-${index}`}>{segment.text}</span>;
    }
    
    return (
      <ruby key={`segment-${index}`}>
        {segment.text}
        <rt className="text-xs text-muted-foreground">{segment.reading}</rt>
      </ruby>
    );
  });
  
  return <>{elements}</>;
}

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
        top: `${position.y - 30}px`, // No additional offset
        transform: 'translate(-50%, 0)',
        maxWidth: '300px',
        width: 'calc(100% - 40px)'
      }}
    >
      <Card className="w-full shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between py-2">
          <CardTitle className="text-base">
            <SmartFurigana japanese={word.japanese} furigana={word.furigana} />
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