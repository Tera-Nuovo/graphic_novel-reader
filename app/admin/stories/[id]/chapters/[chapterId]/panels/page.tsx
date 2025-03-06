"use client"

import { useState, useEffect } from "react"
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
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Accordion } from "@/components/ui/accordion"
import { ChevronLeft, Plus } from "lucide-react"
import { SortablePanel } from "@/components/sortable-panel"
import { toast } from "@/components/ui/use-toast"
import { savePanelsData, getChapterById, getPanelsByChapterId, getSentencesByPanelId, getWordsBySentenceId } from "@/lib/db"

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
  image?: string | null
  sentences: Sentence[]
}

export default function ChapterPanelsPage() {
  const router = useRouter()
  const params = useParams()
  const storyId = params.id
  const chapterId = params.chapterId
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [chapter, setChapter] = useState<any>({
    id: chapterId,
    title: "Loading...",
    order: 1,
  })

  const [panels, setPanels] = useState<Panel[]>([])
  const [selectedWord, setSelectedWord] = useState<{ panelId: number; sentenceId: number; word: Word } | null>(null)
  const [selectedSentence, setSelectedSentence] = useState<{ panelId: number; sentence: Sentence } | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Load the chapter and panels data
  useEffect(() => {
    async function loadData() {
      if (!chapterId) return;
      
      setIsLoading(true);
      try {
        // Load chapter data
        const chapterData = await getChapterById(chapterId as string);
        setChapter(chapterData);
        
        // Load panels data
        const panelsData = await getPanelsByChapterId(chapterId as string);
        
        // If we have panels, load sentences and words for each panel
        if (panelsData && panelsData.length > 0) {
          const panelsWithContent: Panel[] = [];
          
          for (const panel of panelsData) {
            // Convert DB panel to our local format
            const newPanel: Panel = {
              id: parseInt(panel.id.substring(0, 8), 16), // Generate a numeric ID from the UUID
              image: panel.image,
              sentences: [],
            };
            
            // Load sentences for this panel
            const sentencesData = await getSentencesByPanelId(panel.id);
            
            if (sentencesData && sentencesData.length > 0) {
              for (const sentence of sentencesData) {
                // Convert DB sentence to our local format
                const newSentence: Sentence = {
                  id: parseInt(sentence.id.substring(0, 8), 16), // Generate a numeric ID from the UUID
                  japanese: sentence.japanese,
                  english: sentence.english,
                  notes: sentence.notes || '',
                  words: [],
                };
                
                // Load words for this sentence
                const wordsData = await getWordsBySentenceId(sentence.id);
                
                if (wordsData && wordsData.length > 0) {
                  for (const word of wordsData) {
                    // Convert DB word to our local format
                    const newWord: Word = {
                      id: parseInt(word.id.substring(0, 8), 16), // Generate a numeric ID from the UUID
                      japanese: word.japanese,
                      reading: word.reading,
                      english: word.english,
                      partOfSpeech: word.part_of_speech || '',
                      grammarNotes: word.grammar_notes || '',
                      additionalNotes: word.additional_notes || '',
                    };
                    
                    newSentence.words.push(newWord);
                  }
                }
                
                newPanel.sentences.push(newSentence);
              }
            }
            
            panelsWithContent.push(newPanel);
          }
          
          setPanels(panelsWithContent);
        } else {
          // If no panels exist, create an empty one
          setPanels([{
            id: 1,
            image: null,
            sentences: [],
          }]);
        }
      } catch (error) {
        console.error("Error loading panels data:", error);
        toast({
          title: "Error",
          description: "Failed to load panels data",
          variant: "destructive",
        });
        
        // Set default empty panel
        setPanels([{
          id: 1,
          image: null,
          sentences: [],
        }]);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [chapterId]);

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
    setPanels((prevPanels) => 
      prevPanels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            sentences: panel.sentences.map((sentence) => {
              if (sentence.id === sentenceId) {
                // Only update the Japanese field and words if we're changing the Japanese text
                if (field === "japanese" && value !== sentence.japanese) {
                  // When Japanese text is updated, create word objects for each word
                  const words = value.split(" ").filter(Boolean).map((word, index) => {
                    // Try to keep existing words when possible
                    const existingWord = sentence.words.find(w => w.japanese === word);
                    if (existingWord) {
                      return existingWord;
                    }
                    return {
                      id: sentence.words.length + index + 1,
                      japanese: word,
                      reading: "",
                      english: "",
                      partOfSpeech: "",
                      grammarNotes: "",
                      additionalNotes: "",
                    };
                  });
                  return { ...sentence, [field]: value, words };
                }
                // For other fields, just update the field value
                return { ...sentence, [field]: value };
              }
              return sentence;
            }),
          };
        }
        return panel;
      })
    );
    
    // Also update the selected sentence if it's the one being edited
    if (selectedSentence && selectedSentence.panelId === panelId && 
        selectedSentence.sentence.id === sentenceId) {
      setSelectedSentence({
        ...selectedSentence,
        sentence: {
          ...selectedSentence.sentence,
          [field]: value,
        }
      });
    }
  };

  const updateWord = (panelId: number, sentenceId: number, wordId: number, field: keyof Word, value: string) => {
    setPanels((prevPanels) =>
      prevPanels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            sentences: panel.sentences.map((sentence) => {
              if (sentence.id === sentenceId) {
                return {
                  ...sentence,
                  words: sentence.words.map((word) => {
                    if (word.id === wordId) {
                      return { ...word, [field]: value };
                    }
                    return word;
                  }),
                };
              }
              return sentence;
            }),
          };
        }
        return panel;
      })
    );
    
    // Also update the selected word if it's the one being edited
    if (selectedWord && selectedWord.panelId === panelId && 
        selectedWord.sentenceId === sentenceId && 
        selectedWord.word.id === wordId) {
      setSelectedWord({
        ...selectedWord,
        word: {
          ...selectedWord.word,
          [field]: value,
        }
      });
    }
  };

  const handleWordClick = (panelId: number, sentenceId: number, word: Word) => {
    setSelectedWord({ panelId, sentenceId, word })
    setSelectedSentence(null)
  }

  const handleSentenceClick = (panelId: number, sentence: Sentence) => {
    setSelectedSentence({ panelId, sentence })
    setSelectedWord(null)
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Save the panels data to the database
      await savePanelsData(chapterId as string, panels);
      
      toast({
        title: "Success",
        description: "Panels saved successfully",
      });
      
      // Navigate back to the chapters page
      router.push(`/admin/stories/${storyId}/chapters`);
    } catch (error) {
      console.error("Error saving panels:", error);
      toast({
        title: "Error",
        description: "Failed to save panels. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

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

          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading panels data...</p>
            </div>
          ) : (
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
          )}
        </div>

        {/* Save Controls */}
        <div className="flex justify-end gap-4 pt-4">
          <Button variant="outline" asChild>
            <Link href={`/admin/stories/${storyId}/chapters`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  )
} 