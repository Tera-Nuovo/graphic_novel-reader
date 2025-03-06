"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Upload, Plus } from "lucide-react"
import Image from "next/image"

interface Panel {
  id: number
  image?: string | null
  sentences: Sentence[]
}

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

interface SortablePanelProps {
  panel: Panel
  selectedWord: { panelId: number; sentenceId: number; word: Word } | null
  selectedSentence: { panelId: number; sentence: Sentence } | null
  onWordClick: (panelId: number, sentenceId: number, word: Word) => void
  onSentenceClick: (panelId: number, sentence: Sentence) => void
  onUpdateWord: (panelId: number, sentenceId: number, wordId: number, field: keyof Word, value: string) => void
  onUpdateSentence: (panelId: number, sentenceId: number, field: keyof Sentence, value: string) => void
  onAddSentence: (panelId: number) => void
  onRemovePanel: (id: number) => void
}

export function SortablePanel({
  panel,
  selectedWord,
  selectedSentence,
  onWordClick,
  onSentenceClick,
  onUpdateWord,
  onUpdateSentence,
  onAddSentence,
  onRemovePanel,
}: SortablePanelProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: panel.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 2 : 1,
  }

  return (
    <AccordionItem
      ref={setNodeRef}
      style={style}
      value={panel.id.toString()}
      className={`${isDragging ? "opacity-50" : ""}`}
    >
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-2 w-full">
          <div {...attributes} {...listeners}>
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
          </div>
          <span>Panel {panel.id}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Panel Image */}
            <div className="space-y-4">
              <div className="border-2 border-dashed rounded-md aspect-[16/9] flex flex-col items-center justify-center">
                {panel.image ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={panel.image || "/placeholder.svg"}
                      alt={`Panel ${panel.id}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
                  </>
                )}
              </div>
            </div>

            {/* Content Editor */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Side - Sentences List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Sentences</h3>
                  <Button size="sm" onClick={() => onAddSentence(panel.id)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Sentence
                  </Button>
                </div>
                <div className="space-y-2">
                  {panel.sentences.map((sentence) => (
                    <div key={sentence.id} className="space-y-2">
                      <div
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedSentence?.sentence.id === sentence.id ? "bg-muted" : "hover:bg-muted/50"
                        }`}
                        onClick={() => onSentenceClick(panel.id, sentence)}
                      >
                        <div className="space-y-2">
                          <Input
                            value={sentence.japanese}
                            onChange={(e) => onUpdateSentence(panel.id, sentence.id, "japanese", e.target.value)}
                            placeholder="Enter Japanese sentence..."
                            className="font-bold"
                          />
                          {sentence.words.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {sentence.words.map((word) => (
                                <Button
                                  key={word.id}
                                  variant="outline"
                                  size="sm"
                                  className={`${
                                    selectedWord?.word.id === word.id ? "bg-primary text-primary-foreground" : ""
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onWordClick(panel.id, sentence.id, word)
                                  }}
                                >
                                  {word.japanese}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Word/Sentence Details */}
              <div className="space-y-4">
                {selectedWord && selectedWord.panelId === panel.id && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Word Details</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Japanese</Label>
                          <Input
                            value={selectedWord.word.japanese}
                            onChange={(e) => {
                              e.stopPropagation();
                              onUpdateWord(
                                selectedWord.panelId,
                                selectedWord.sentenceId,
                                selectedWord.word.id,
                                "japanese",
                                e.target.value,
                              );
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Reading (Furigana)</Label>
                          <Input
                            value={selectedWord.word.reading}
                            onChange={(e) => {
                              e.stopPropagation();
                              onUpdateWord(
                                selectedWord.panelId,
                                selectedWord.sentenceId,
                                selectedWord.word.id,
                                "reading",
                                e.target.value,
                              );
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>English Translation</Label>
                        <Input
                          value={selectedWord.word.english}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateWord(
                              selectedWord.panelId,
                              selectedWord.sentenceId,
                              selectedWord.word.id,
                              "english",
                              e.target.value,
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Part of Speech</Label>
                        <Select
                          value={selectedWord.word.partOfSpeech}
                          onValueChange={(value) => {
                            onUpdateWord(
                              selectedWord.panelId,
                              selectedWord.sentenceId,
                              selectedWord.word.id,
                              "partOfSpeech",
                              value,
                            );
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select part of speech" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="noun">Noun</SelectItem>
                            <SelectItem value="verb">Verb</SelectItem>
                            <SelectItem value="adjective">Adjective</SelectItem>
                            <SelectItem value="adverb">Adverb</SelectItem>
                            <SelectItem value="particle">Particle</SelectItem>
                            <SelectItem value="expression">Expression</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Grammar Notes</Label>
                        <Textarea
                          value={selectedWord.word.grammarNotes}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateWord(
                              selectedWord.panelId,
                              selectedWord.sentenceId,
                              selectedWord.word.id,
                              "grammarNotes",
                              e.target.value,
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Additional Notes</Label>
                        <Textarea
                          value={selectedWord.word.additionalNotes}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateWord(
                              selectedWord.panelId,
                              selectedWord.sentenceId,
                              selectedWord.word.id,
                              "additionalNotes",
                              e.target.value,
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedSentence && selectedSentence.panelId === panel.id && !selectedWord && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Sentence Details</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Japanese</Label>
                        <Input
                          value={selectedSentence.sentence.japanese}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateSentence(
                              selectedSentence.panelId,
                              selectedSentence.sentence.id,
                              "japanese",
                              e.target.value,
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>English Translation</Label>
                        <Input
                          value={selectedSentence.sentence.english}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateSentence(
                              selectedSentence.panelId,
                              selectedSentence.sentence.id,
                              "english",
                              e.target.value,
                            );
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={selectedSentence.sentence.notes}
                          onChange={(e) => {
                            e.stopPropagation();
                            onUpdateSentence(
                              selectedSentence.panelId,
                              selectedSentence.sentence.id,
                              "notes",
                              e.target.value,
                            );
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {(!selectedWord || selectedWord.panelId !== panel.id) &&
                  (!selectedSentence || selectedSentence.panelId !== panel.id) && (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>Select a sentence or word to edit its details</p>
                    </div>
                  )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button variant="destructive" size="sm" onClick={() => onRemovePanel(panel.id)}>
                <Trash2 className="h-4 w-4 mr-1" />
                Remove Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      </AccordionContent>
    </AccordionItem>
  )
}

