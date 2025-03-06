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
import { CreateBucketsButton } from '@/components/create-buckets-button'
import { useEnsureBuckets } from '@/lib/hooks/use-ensure-buckets'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

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

  const { ensureBuckets, bucketStatus, isEnsuring } = useEnsureBuckets()

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
                  let words: Word[];
                  
                  if (value.trim() === '') {
                    words = [];
                  } else {
                    // Smarter Japanese text parsing
                    words = parseJapaneseText(value, sentence.words);
                  }
                  
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

  // Improved Japanese text parsing function
  const parseJapaneseText = (text: string, existingWords: Word[]): Word[] => {
    // Helper function to check if a character is Japanese (kanji or kana)
    const isJapaneseChar = (char: string): boolean => {
      const code = char.charCodeAt(0);
      // Hiragana: U+3040-309F, Katakana: U+30A0-30FF, Kanji: U+4E00-9FFF
      return (
        (code >= 0x3040 && code <= 0x309F) || // Hiragana
        (code >= 0x30A0 && code <= 0x30FF) || // Katakana
        (code >= 0x4E00 && code <= 0x9FFF)    // Kanji
      );
    };

    // Helper function to check if a character is a symbol or punctuation
    const isSymbolOrPunctuation = (char: string): boolean => {
      const symbols = "、。！？…・「」『』（）｛｝［］【】〈〉〔〕—～：；＠＃＄％＾＆＊＋＝｜＜＞";
      return symbols.includes(char) || /[!-\/:-@\[-`{-~]/.test(char);
    };

    // First split by spaces (both western and Japanese)
    const spaceSplit = text.split(/[ \u3000]+/).filter(Boolean);
    let segments: string[] = [];
    
    // For each space-separated segment, further process
    spaceSplit.forEach(segment => {
      if (segment.length === 1) {
        // Keep single characters as is
        segments.push(segment);
        return;
      }
      
      let currentWord = '';
      let currentType: 'japanese' | 'other' | null = null;
      
      // Process character by character
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const isJapanese = isJapaneseChar(char);
        const isSymbol = isSymbolOrPunctuation(char);
        
        if (isSymbol) {
          // Save current word if any
          if (currentWord) {
            segments.push(currentWord);
            currentWord = '';
            currentType = null;
          }
          // Add symbol as separate word if needed
          segments.push(char);
        } else if (currentType === null) {
          // Start a new word
          currentWord = char;
          currentType = isJapanese ? 'japanese' : 'other';
        } else if ((isJapanese && currentType === 'japanese') || 
                  (!isJapanese && currentType === 'other')) {
          // Continue current word
          currentWord += char;
        } else {
          // Type changed, save current word and start a new one
          segments.push(currentWord);
          currentWord = char;
          currentType = isJapanese ? 'japanese' : 'other';
        }
      }
      
      // Don't forget to add the last word
      if (currentWord) {
        segments.push(currentWord);
      }
    });
    
    // Convert segments to Word objects
    return segments.map((segment, index) => {
      // Try to find matching existing word
      const existingWord = existingWords.find(w => w.japanese === segment);
      if (existingWord) {
        return existingWord;
      }
      
      // Create new word
      return {
        id: existingWords.length + index + 1,
        japanese: segment,
        reading: "",
        english: "",
        partOfSpeech: "",
        grammarNotes: "",
        additionalNotes: "",
      };
    });
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

  const updatePanelImage = (panelId: number, imageUrl: string) => {
    setPanels((prevPanels) => 
      prevPanels.map((panel) => {
        if (panel.id === panelId) {
          return {
            ...panel,
            image: imageUrl
          };
        }
        return panel;
      })
    );
  }

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Edit Panels</h1>
          <p className="text-muted-foreground">
            <span className="font-semibold">{chapter?.title}</span> - Chapter ID: {chapterId}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button onClick={addPanel}>Add Panel</Button>
        </div>
      </div>
      
      {bucketStatus.error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Storage Error</AlertTitle>
          <AlertDescription>
            There was a problem setting up storage for image uploads. 
            <Button 
              variant="link" 
              className="p-0 h-auto ml-1" 
              onClick={() => ensureBuckets()}
              disabled={isEnsuring}
            >
              {isEnsuring ? "Trying again..." : "Try again"}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col space-y-6">
        {/* Panels Editor */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Panels</h2>
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
                      onUpdatePanelImage={updatePanelImage}
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