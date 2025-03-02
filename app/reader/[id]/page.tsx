"use client"

import type React from "react"

import { useState } from "react"
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
  } | null>(null)
  const [selectedSentence, setSelectedSentence] = useState<{
    translation: string
    position: { x: number; y: number }
  } | null>(null)

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
  ]

  const handleWordClick = (word: Word, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setSelectedWord({
      word,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    })
    setSelectedSentence(null)
  }

  const handleSentenceClick = (translation: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setSelectedSentence({
      translation,
      position: {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      },
    })
    setSelectedWord(null)
  }

  return (
    <div className="container py-6">
      <div className="max-w-4xl mx-auto space-y-8">
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
            <Card key={panel.id} className="p-6 space-y-8">
              {/* Text content */}
              <div className="space-y-6">
                {panel.sentences.map((sentence) => (
                  <div key={sentence.id} className="relative group">
                    <div className="flex flex-wrap gap-x-1 text-lg leading-loose">
                      {sentence.words.map((word, index) => (
                        <span
                          key={index}
                          className="relative cursor-pointer hover:bg-primary/10 rounded px-0.5"
                          onClick={(e) => handleWordClick(word, e)}
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
                        onClick={(e) => handleSentenceClick(sentence.translation, e)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel image */}
              <div className="relative aspect-video">
                <Image src={panel.image || "/placeholder.svg"} alt="Story panel" fill className="object-contain" />
              </div>
            </Card>
          ))}
        </div>

        {/* Popovers */}
        {selectedWord && (
          <WordPopover
            word={selectedWord.word}
            position={selectedWord.position}
            onClose={() => setSelectedWord(null)}
          />
        )}
        {selectedSentence && (
          <SentencePopover
            translation={selectedSentence.translation}
            position={selectedSentence.position}
            onClose={() => setSelectedSentence(null)}
          />
        )}
      </div>
    </div>
  )
}

