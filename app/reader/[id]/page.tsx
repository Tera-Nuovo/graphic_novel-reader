"use client"

import type React from "react"

import { useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, MessageCircle } from "lucide-react"
import { WordPopover } from "@/components/word-popover"
import { SentencePopover } from "@/components/sentence-popover"

interface Word {
  japanese: string
  furigana: string
  english: string
  grammarNote: string
  additionalNote: string
}

interface Sentence {
  id: number
  words: Word[]
  translation: string
}

interface Panel {
  id: number
  sentences: Sentence[]
  image: string
}

export default function ReaderPage() {
  const [selectedWord, setSelectedWord] = useState<{
    word: Word
    position: { x: number; y: number }
    panelId: number
  } | null>(null)
  
  const [selectedSentence, setSelectedSentence] = useState<{
    translation: string
    position: { x: number; y: number }
    panelId: number
  } | null>(null)

  const handleWordClick = (word: Word, panelId: number, event: React.MouseEvent) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // Get the panel element
    const panel = target.closest('.panel-container') as HTMLElement;
    if (!panel) return;
    
    // Get panel's position
    const panelRect = panel.getBoundingClientRect();
    
    // Calculate position relative to the panel
    const relativeX = rect.left + rect.width/2 - panelRect.left;
    // Only add a small offset (5px) to position right below the text
    const relativeY = rect.bottom - panelRect.top + 5;
    
    setSelectedWord({
      word,
      position: {
        x: relativeX,
        y: relativeY
      },
      panelId
    });
    
    setSelectedSentence(null);
  }

  const handleSentenceClick = (translation: string, panelId: number, event: React.MouseEvent) => {
    const target = event.currentTarget;
    const rect = target.getBoundingClientRect();
    
    // Get the panel element
    const panel = target.closest('.panel-container') as HTMLElement;
    if (!panel) return;
    
    // Get panel's position
    const panelRect = panel.getBoundingClientRect();
    
    // Calculate position relative to the panel
    const relativeX = rect.left + rect.width/2 - panelRect.left;
    // Only add a small offset (5px) to position right below the text
    const relativeY = rect.bottom - panelRect.top + 5;
    
    setSelectedSentence({
      translation,
      position: {
        x: relativeX,
        y: relativeY
      },
      panelId
    });
    
    setSelectedWord(null);
  }

  // Sample data
  const panels: Panel[] = [
    {
      id: 1,
      sentences: [
        {
          id: 1,
          words: [
            {
              japanese: "春",
              furigana: "はる",
              english: "spring",
              grammarNote: "Noun (季節/season)",
              additionalNote: "One of the four seasons, known for cherry blossoms in Japan",
            },
            {
              japanese: "が",
              furigana: "が",
              english: "subject marker",
              grammarNote: "Particle marking the subject of the sentence",
              additionalNote: "Indicates that spring is the subject performing the action",
            },
            {
              japanese: "来",
              furigana: "く",
              english: "to come",
              grammarNote: "Verb (Group 1)",
              additionalNote: "Basic form of the verb 来る (くる)",
            },
          ],
          translation: "Spring has come",
        },
        {
          id: 2,
          words: [
            {
              japanese: "桜",
              furigana: "さくら",
              english: "cherry blossom",
              grammarNote: "Noun (植物/plant)",
              additionalNote: "Symbol of spring in Japan",
            },
            {
              japanese: "の",
              furigana: "の",
              english: "possessive particle",
              grammarNote: "Connecting particle",
              additionalNote: "Shows possession or relationship between words",
            },
            {
              japanese: "花びら",
              furigana: "はなびら",
              english: "flower petal",
              grammarNote: "Noun (植物の部分/plant part)",
              additionalNote: "Compound word: 花 (flower) + びら (petal)",
            },
            {
              japanese: "が",
              furigana: "が",
              english: "subject marker",
              grammarNote: "Particle",
              additionalNote: "Marks the subject of the sentence",
            },
            {
              japanese: "風",
              furigana: "かぜ",
              english: "wind",
              grammarNote: "Noun (気象/weather)",
              additionalNote: "Natural phenomenon",
            },
            {
              japanese: "に",
              furigana: "に",
              english: "in, at, to",
              grammarNote: "Particle indicating location or target",
              additionalNote: "Shows direction or target of action",
            },
            {
              japanese: "舞う",
              furigana: "まう",
              english: "to dance, flutter",
              grammarNote: "Verb (Group 1)",
              additionalNote: "Poetic expression often used for falling petals",
            },
          ],
          translation: "Cherry blossom petals dance in the wind",
        },
      ],
      image: "/placeholder.svg?height=400&width=600",
    },
    {
      id: 2,
      sentences: [
        {
          id: 3,
          words: [
            {
              japanese: "空",
              furigana: "そら",
              english: "sky",
              grammarNote: "Noun (自然/nature)",
              additionalNote: "Often used in poetry and literature",
            },
            {
              japanese: "は",
              furigana: "は",
              english: "topic marker",
              grammarNote: "Particle marking the topic",
              additionalNote: "Indicates what is being discussed",
            },
            {
              japanese: "青い",
              furigana: "あおい",
              english: "blue",
              grammarNote: "い-adjective (色/color)",
              additionalNote: "Basic color adjective",
            },
          ],
          translation: "The sky is blue",
        }
      ],
      image: "/placeholder.svg?height=400&width=600",
    }
  ]

  return (
    <div className="py-6">
      <div className="space-y-8">
        {/* Navigation */}
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/browse" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to stories
            </Link>
          </Button>
        </div>

        {/* Story content */}
        <div className="space-y-12">
          {panels.map((panel) => (
            <Card key={panel.id} className="p-6 space-y-8 w-full panel-container relative">
              {/* Text content */}
              <div className="space-y-6">
                {panel.sentences.map((sentence) => (
                  <div key={sentence.id} className="relative group">
                    <div className="flex flex-wrap gap-x-1 text-lg leading-loose">
                      {sentence.words.map((word, index) => (
                        <span
                          key={index}
                          className="relative cursor-pointer hover:bg-primary/10 rounded px-0.5"
                          onClick={(e) => handleWordClick(word, panel.id, e)}
                        >
                          <ruby className="group-hover:text-primary transition-colors">
                            {word.japanese}
                            <rt className="text-xs text-muted-foreground group-hover:text-primary/70">
                              {word.furigana}
                            </rt>
                          </ruby>
                        </span>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleSentenceClick(sentence.translation, panel.id, e)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel image */}
              <div className="relative w-full aspect-[4/3]">
                <Image 
                  src={panel.image || "/placeholder.svg"} 
                  alt="Story panel" 
                  fill 
                  className="object-cover w-full h-full"
                  sizes="(max-width: 1280px) 100vw, 1280px"
                  priority
                />
              </div>
              
              {/* Popovers - positioned INSIDE each panel */}
              {selectedWord && selectedWord.panelId === panel.id && (
                <WordPopover
                  word={selectedWord.word}
                  position={selectedWord.position}
                  onClose={() => setSelectedWord(null)}
                />
              )}
              {selectedSentence && selectedSentence.panelId === panel.id && (
                <SentencePopover
                  translation={selectedSentence.translation}
                  position={selectedSentence.position}
                  onClose={() => setSelectedSentence(null)}
                />
              )}
            </Card>
          ))}
        </div>

        {/* Chapter Navigation */}
        <div className="flex justify-between items-center pt-8">
          <Button variant="outline" size="lg" asChild>
            <Link href="/reader/0" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Previous Chapter
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/reader/2" className="flex items-center gap-2">
              Next Chapter
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}