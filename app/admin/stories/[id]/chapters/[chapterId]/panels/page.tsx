"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Accordion } from "@/components/ui/accordion"
import { ChevronLeft, Plus } from "lucide-react"
import { SortablePanel } from "@/components/sortable-panel"

interface Word {
  id: number
  japanese: string
  reading: string
  english: string
  partOfSpeech: string
  grammarNotes: string
  additionalNotes: string
}

interface Sentence {
  id: number
  japanese: string
  english: string
  notes: string
  words: Word[]
}

interface Panel {
  id: number
  image: string | null
  sentences: Sentence[]
}

export default function ChapterPanelsPage() {
  const params = useParams()
  const storyId = params.id
  const chapterId = params.chapterId

  // Sample chapter data
  const chapter = {
    id: chapterId,
    title: "Chapter 1: The Beginning",
    order: 1,
  }

  const [panels, setPanels] = useState<Panel[]>([
    {
      id: 1,
      image: null,
      sentences: [],
    },
  ])
  const [selectedWord, setSelectedWord] = useState<{ panelId: number; sentenceId: number; word: Word } | null>(null)
  const [selectedSentence, setSelectedSentence] = useState<{ panelId: number; sentence: Sentence } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setPanels((panels) => {
        const oldIndex = panels.findIndex((panel) => panel.id === active.id)
        const newIndex = panels.findIndex((panel) => panel.id === over.id)
        return arrayMove(panels, oldIndex, newIndex)
      })
    }
  }

  const addPanel = () => {
    const newId = panels.length > 0 ? Math.max(...panels.map((p) => p.id)) + 1 : 1
    setPanels([...panels, { id: newId, image: null, sentences: [] }])
  }

  const addSentence = (panelId: number) => {
    setPanels(
      panels.map((panel) => {
        if (panel.id === panelId) {
          const newSentence: Sentence = {
            id: panel.sentences.length + 1,
            japanese: "",
            english: "",
            notes: "",
            words: [],
          }
          return {
            ...panel,
            sentences: [...panel.sentences, newSentence],
          }
        }
        return panel
      }),
    )
  }

  const updateSentence = (panelId: number, sentenceId: number, field: keyof Sentence, value: string) => {
    setPanels(
      panels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            sentences: panel.sentences.map((sentence) => {
              if (sentence.id === sentenceId) {
                if (field === "japanese") {
                  // When Japanese text is updated, create word objects for each word
                  const words = value.split(" ").map((word, index) => ({
                    id: index + 1,
                    japanese: word,
                    reading: "",
                    english: "",
                    partOfSpeech: "",
                    grammarNotes: "",
                    additionalNotes: "",
                  }))
                  return { ...sentence, [field]: value, words }
                }
                return { ...sentence, [field]: value }
              }
              return sentence
            }),
          }
        }
        return panel
      }),
    )
  }

  const updateWord = (panelId: number, sentenceId: number, wordId: number, field: keyof Word, value: string) => {
    setPanels(
      panels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            sentences: panel.sentences.map((sentence) => {
              if (sentence.id === sentenceId) {
                return {
                  ...sentence,
                  words: sentence.words.map((word) => {
                    if (word.id === wordId) {
                      return { ...word, [field]: value }
                    }
                    return word
                  }),
                }
              }
              return sentence
            }),
          }
        }
        return panel
      }),
    )
  }

  const handleWordClick = (panelId: number, sentenceId: number, word: Word) => {
    setSelectedWord({ panelId, sentenceId, word })
    setSelectedSentence(null)
  }

  const handleSentenceClick = (panelId: number, sentence: Sentence) => {
    setSelectedSentence({ panelId, sentence })
    setSelectedWord(null)
  }

  return (
    <div className="container py-10">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center mb-4">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link href={`/admin/stories/${storyId}/chapters`} className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Chapters
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{chapter.title}</h1>
            <p className="text-muted-foreground">Manage panels for this chapter</p>
          </div>
        </div>

        {/* Panels Editor */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Panels</h2>
            <Button onClick={addPanel}>
              <Plus className="mr-2 h-4 w-4" />
              Add Panel
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <Accordion type="multiple" className="w-full">
              <SortableContext items={panels.map((panel) => panel.id)} strategy={verticalListSortingStrategy}>
                {panels.map((panel) => (
                  <SortablePanel
                    key={panel.id}
                    panel={panel}
                    selectedWord={selectedWord}
                    selectedSentence={selectedSentence}
                    onWordClick={handleWordClick}
                    onSentenceClick={handleSentenceClick}
                    onUpdateWord={updateWord}
                    onUpdateSentence={updateSentence}
                    onAddSentence={addSentence}
                    onRemovePanel={(id) => {
                      setPanels(panels.filter((p) => p.id !== id))
                      setSelectedWord(null)
                      setSelectedSentence(null)
                    }}
                  />
                ))}
              </SortableContext>
            </Accordion>
          </DndContext>
        </div>

        {/* Save Controls */}
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/stories/${storyId}/chapters`}>Cancel</Link>
          </Button>
          <Button>Save Changes</Button>
        </div>
      </div>
    </div>
  )
} 