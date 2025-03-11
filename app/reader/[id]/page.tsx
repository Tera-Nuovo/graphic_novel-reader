"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, MessageCircle, Loader2 } from "lucide-react"
import { WordPopover } from "@/components/word-popover"
import { SentencePopover } from "@/components/sentence-popover"
import { getStoryById, getChaptersByStoryId, getPanelsByChapterId, getSentencesByPanelId, getWordsBySentenceId } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"
import { useParams, useRouter } from "next/navigation"

interface ReaderWord {
  japanese: string
  furigana: string
  english: string
  grammarNote: string
  additionalNote: string
}

interface ReaderSentence {
  id: number
  words: ReaderWord[]
  translation: string
}

interface ReaderPanel {
  id: number
  sentences: ReaderSentence[]
  image: string
}

interface Chapter {
  id: string
  title: string
  order: number
}

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [storyTitle, setStoryTitle] = useState("");
  const [englishTitle, setEnglishTitle] = useState("");
  const [panels, setPanels] = useState<ReaderPanel[]>([]);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  
  const [selectedWord, setSelectedWord] = useState<{
    word: ReaderWord
    position: { x: number; y: number }
    panelId: number
  } | null>(null);
  
  const [selectedSentence, setSelectedSentence] = useState<{
    translation: string
    position: { x: number; y: number }
    panelId: number
  } | null>(null);

  // Load all chapters for the story
  useEffect(() => {
    async function loadChapters() {
      try {
        // Get the story details
        const story = await getStoryById(storyId);
        setStoryTitle(story.japanese_title);
        setEnglishTitle(story.english_title);
        
        // Get chapters for this story
        const chaptersList = await getChaptersByStoryId(storyId);
        
        if (chaptersList.length === 0) {
          setError("No chapters found for this story");
          return;
        }
        
        // Sort chapters by order
        const sortedChapters = chaptersList.sort((a, b) => a.order - b.order);
        setChapters(sortedChapters);
        
        // Set the first chapter as current
        setCurrentChapter(sortedChapters[0]);
        setCurrentChapterIndex(0);
      } catch (err) {
        console.error("Error loading chapters:", err);
        setError("Failed to load chapters. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load chapters",
          variant: "destructive",
        });
      }
    }
    
    loadChapters();
  }, [storyId]);

  // Load panels for the current chapter
  useEffect(() => {
    async function loadChapterContent() {
      if (!currentChapter) return;
      
      try {
        setLoading(true);
        
        // Get panels for this chapter
        const panelsData = await getPanelsByChapterId(currentChapter.id);
        
        if (panelsData.length === 0) {
          setError(`No panels found for chapter "${currentChapter.title}"`);
          return;
        }
        
        // For each panel, get sentences and words
        const readerPanels: ReaderPanel[] = [];
        
        for (const panel of panelsData) {
          // Get sentences for this panel
          const sentencesData = await getSentencesByPanelId(panel.id);
          const readerSentences: ReaderSentence[] = [];
          
          for (const sentence of sentencesData) {
            // Get words for this sentence
            const wordsData = await getWordsBySentenceId(sentence.id);
            
            // Convert DB words to Reader words
            const readerWords: ReaderWord[] = wordsData.map(word => ({
              japanese: word.japanese,
              furigana: word.reading,
              english: word.english,
              grammarNote: word.part_of_speech || '',
              additionalNote: word.grammar_notes || '',
            }));
            
            readerSentences.push({
              id: parseInt(sentence.id.substring(0, 8), 16), // Generate numeric ID from UUID
              words: readerWords,
              translation: sentence.english,
            });
          }
          
          readerPanels.push({
            id: parseInt(panel.id.substring(0, 8), 16), // Generate numeric ID from UUID
            sentences: readerSentences,
            image: panel.image || "/placeholder.svg?height=400&width=600",
          });
        }
        
        setPanels(readerPanels);
      } catch (err) {
        console.error("Error loading chapter content:", err);
        setError("Failed to load chapter content. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load chapter content",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
    
    loadChapterContent();
  }, [currentChapter]);

  const navigateToPreviousChapter = () => {
    if (currentChapterIndex > 0) {
      setCurrentChapter(chapters[currentChapterIndex - 1]);
      setCurrentChapterIndex(currentChapterIndex - 1);
      window.scrollTo(0, 0);
    }
  };

  const navigateToNextChapter = () => {
    if (currentChapterIndex < chapters.length - 1) {
      setCurrentChapter(chapters[currentChapterIndex + 1]);
      setCurrentChapterIndex(currentChapterIndex + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleWordClick = (word: ReaderWord, panelId: number, event: React.MouseEvent) => {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading story content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link href="/browse">Back to Browse</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/browse" className="flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to stories
            </Link>
          </Button>
          <div className="text-center">
            <h1 className="text-xl font-bold">{storyTitle}</h1>
            <p className="text-sm text-muted-foreground">{englishTitle}</p>
            {currentChapter && (
              <p className="text-sm mt-1">{currentChapter.title}</p>
            )}
          </div>
          <div className="w-[100px]"></div> {/* Spacer to keep title centered */}
        </div>

        {/* Chapter Navigation */}
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToPreviousChapter}
            disabled={currentChapterIndex === 0}
            className={currentChapterIndex === 0 ? "invisible" : ""}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Chapter
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={navigateToNextChapter}
            disabled={currentChapterIndex === chapters.length - 1}
            className={currentChapterIndex === chapters.length - 1 ? "invisible" : ""}
          >
            Next Chapter
            <ChevronRight className="h-4 w-4 ml-2" />
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
                        <div
                          key={index}
                          className="cursor-pointer relative inline-flex items-center"
                          onClick={(e) => handleWordClick(word, panel.id, e)}
                        >
                          <div className="text-lg hover:text-primary">
                            <ruby>
                              {word.japanese}
                              <rt className="text-xs text-muted-foreground">{word.furigana}</rt>
                            </ruby>
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleSentenceClick(sentence.translation, panel.id, e)}
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">Show translation</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Panel image */}
              <div className="relative w-full rounded-md overflow-hidden">
                <Image
                  src={panel.image}
                  alt={`Panel ${panel.id}`}
                  width={600}
                  height={400}
                  className="w-full"
                />
              </div>

              {/* Word popup */}
              {selectedWord && selectedWord.panelId === panel.id && (
                <WordPopover
                  word={selectedWord.word}
                  position={selectedWord.position}
                  onClose={() => setSelectedWord(null)}
                />
              )}

              {/* Sentence popup */}
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
        
        {/* Bottom Chapter Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button 
            variant="outline" 
            onClick={navigateToPreviousChapter}
            disabled={currentChapterIndex === 0}
            className={currentChapterIndex === 0 ? "invisible" : ""}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Chapter
          </Button>
          
          <Button 
            variant="outline"
            onClick={navigateToNextChapter}
            disabled={currentChapterIndex === chapters.length - 1}
            className={currentChapterIndex === chapters.length - 1 ? "invisible" : ""}
          >
            Next Chapter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}