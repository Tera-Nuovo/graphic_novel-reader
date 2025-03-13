"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, MessageCircle, Loader2, BookmarkIcon } from "lucide-react"
import { WordPopover } from "@/components/word-popover"
import { SentencePopover } from "@/components/sentence-popover"
import { getStoryById, getPublishedChaptersByStoryId, getPanelsByChapterId, getSentencesByPanelId, getWordsBySentenceId, getUserProgress, updateUserProgress } from "@/lib/db"
import { toast } from "@/components/ui/use-toast"
import { useParams, useRouter } from "next/navigation"
import React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/lib/auth"

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
  originalId: string
  sentences: ReaderSentence[]
  image: string
}

interface Chapter {
  id: string
  title: string
  order: number
  status: 'draft' | 'published'
}

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

// Replace the current SmartFurigana component with this improved version
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

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id as string;
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [storyTitle, setStoryTitle] = useState("");
  const [englishTitle, setEnglishTitle] = useState("");
  const [panels, setPanels] = useState<ReaderPanel[]>([]);
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [currentPanelId, setCurrentPanelId] = useState<number | null>(null);
  
  const [restoringProgress, setRestoringProgress] = useState(false);
  
  const panelRefs = useRef<{[key: number]: HTMLDivElement | null}>({});
  
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
        
        // Get published chapters for this story
        const chaptersList = await getPublishedChaptersByStoryId(storyId);
        
        if (chaptersList.length === 0) {
          setError("No published chapters found for this story");
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
        
        // Verify the chapter is published
        if (currentChapter.status !== 'published') {
          setError(`Chapter "${currentChapter.title}" is not published yet`);
          return;
        }
        
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
            originalId: panel.id, // Store the original UUID
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

  // Get user progress when story loads
  useEffect(() => {
    async function loadUserProgress() {
      if (!user || !storyId || !chapters.length) return;
      
      try {
        console.log("Loading user progress for:", user.id, storyId);
        const progress = await getUserProgress(user.id, storyId);
        
        if (progress) {
          console.log('Found user progress:', progress);
          
          // Find chapter index
          const chapterIndex = chapters.findIndex(ch => ch.id === progress.chapter_id);
          console.log('Chapter index:', chapterIndex, 'Current index:', currentChapterIndex);
          
          if (chapterIndex !== -1 && chapterIndex !== currentChapterIndex) {
            // If found chapter is different than current, load it
            console.log('Switching to saved chapter:', chapters[chapterIndex].title);
            setRestoringProgress(true);
            setCurrentChapter(chapters[chapterIndex]);
            setCurrentChapterIndex(chapterIndex);
          } else if (progress.panel_id && panels.length > 0) {
            // Try to find the panel in current panels by UUID first
            let foundPanel = panels.find(p => p.originalId === progress.panel_id);
            
            if (foundPanel) {
              console.log('Found panel by original ID:', foundPanel.id);
              setCurrentPanelId(foundPanel.id);
              
              // Small delay to ensure DOM is ready
              setTimeout(() => {
                if (panelRefs.current[foundPanel!.id]) {
                  panelRefs.current[foundPanel!.id]?.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start' 
                  });
                  
                  toast({
                    title: "Reading Progress Restored",
                    description: "Continuing from where you left off",
                  });
                }
                setRestoringProgress(false);
              }, 500);
            } else {
              console.log('Panel not found by UUID, trying numeric ID');
              // Fallback: Convert UUID to numeric ID (for backward compatibility)
              const panelIdString = progress.panel_id.substring(0, 8);
              const numericPanelId = parseInt(panelIdString, 16);
              
              // Find panel in current chapter
              const panelIndex = panels.findIndex(p => p.id === numericPanelId);
              
              if (panelIndex !== -1) {
                console.log('Found panel by numeric ID:', numericPanelId);
                setCurrentPanelId(numericPanelId);
                
                // Small delay to ensure DOM is ready
                setTimeout(() => {
                  if (panelRefs.current[numericPanelId]) {
                    panelRefs.current[numericPanelId]?.scrollIntoView({ 
                      behavior: 'smooth', 
                      block: 'start' 
                    });
                    
                    toast({
                      title: "Reading Progress Restored",
                      description: "Continuing from where you left off",
                    });
                  }
                  setRestoringProgress(false);
                }, 500);
              } else {
                console.log('Panel not found, starting at beginning');
                setCurrentPanelId(panels[0]?.id || null);
                setRestoringProgress(false);
              }
            }
          } else {
            console.log('No panel_id in progress or no panels loaded, starting at beginning');
            if (panels.length > 0) {
              setCurrentPanelId(panels[0]?.id || null);
            }
            setRestoringProgress(false);
          }
        } else {
          console.log('No progress found, starting at beginning');
          if (panels.length > 0) {
            setCurrentPanelId(panels[0]?.id || null);
          }
          setRestoringProgress(false);
        }
      } catch (err) {
        console.error("Error loading user progress:", err);
        setRestoringProgress(false);
      }
    }
    
    loadUserProgress();
  }, [user, storyId, chapters, panels, currentChapterIndex]);
  
  // Save user progress when panel changes
  useEffect(() => {
    async function saveUserProgress() {
      if (!user || !storyId || !currentChapter || !currentPanelId || restoringProgress) return;
      
      try {
        // Find the panel with its original UUID
        const panel = panels.find(p => p.id === currentPanelId);
        if (!panel) return;
        
        console.log('Saving progress for panel:', panel.id, 'UUID:', panel.originalId);
        
        await updateUserProgress({
          user_id: user.id,
          story_id: storyId,
          chapter_id: currentChapter.id,
          panel_id: panel.originalId, // Use the original UUID
          completed: false
        });
        
        console.log('Progress saved:', {
          chapter: currentChapter.title,
          panel: currentPanelId,
          panelUUID: panel.originalId
        });
      } catch (err) {
        console.error("Error saving user progress:", err);
      }
    }
    
    saveUserProgress();
  }, [user, storyId, currentChapter, currentPanelId, panels, restoringProgress]);
  
  // Track current panel based on scroll position
  useEffect(() => {
    if (restoringProgress || panels.length === 0) return;
    
    const handleScroll = () => {
      // Find the panel that is most visible in the viewport
      let highestVisibleRatio = 0;
      let mostVisiblePanelId = null;
      
      Object.entries(panelRefs.current).forEach(([panelId, element]) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const windowHeight = window.innerHeight;
          
          // Calculate how much of the panel is in the viewport
          const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
          const ratio = visibleHeight > 0 ? visibleHeight / rect.height : 0;
          
          if (ratio > highestVisibleRatio) {
            highestVisibleRatio = ratio;
            mostVisiblePanelId = parseInt(panelId);
          }
        }
      });
      
      if (mostVisiblePanelId !== null && mostVisiblePanelId !== currentPanelId) {
        setCurrentPanelId(mostVisiblePanelId);
      }
    };
    
    // Set initial panel
    if (!currentPanelId && panels.length > 0) {
      setCurrentPanelId(panels[0].id);
    }
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [panels, currentPanelId, restoringProgress]);

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
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToPreviousChapter}
            disabled={currentChapterIndex === 0}
            className={currentChapterIndex === 0 ? "invisible md:visible md:opacity-50" : ""}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Chapter
          </Button>
          
          {/* Chapter Dropdown */}
          <div className="w-full md:w-64">
            <Select
              value={currentChapter?.id}
              onValueChange={(value) => {
                const index = chapters.findIndex(chapter => chapter.id === value);
                if (index !== -1) {
                  setCurrentChapter(chapters[index]);
                  setCurrentChapterIndex(index);
                  window.scrollTo(0, 0);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((chapter) => (
                  <SelectItem key={chapter.id} value={chapter.id}>
                    {chapter.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={navigateToNextChapter}
            disabled={currentChapterIndex === chapters.length - 1}
            className={currentChapterIndex === chapters.length - 1 ? "invisible md:visible md:opacity-50" : ""}
          >
            Next Chapter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Story content */}
        <div className="space-y-12">
          {panels.map((panel) => (
            <Card 
              key={panel.id} 
              className="p-6 space-y-8 w-full panel-container relative"
              ref={(el) => { panelRefs.current[panel.id] = el; }}
            >
              {/* Text content */}
              <div className="space-y-6">
                <div className="relative group">
                    <div className="flex flex-wrap gap-x-1 text-lg leading-loose">
                    {panel.sentences.map((sentence, sentenceIndex) => (
                      <React.Fragment key={sentence.id}>
                        {sentence.words.map((word, wordIndex) => (
                          <div
                            key={`${sentence.id}-${wordIndex}`}
                            className="cursor-pointer relative inline-flex items-center"
                            onClick={(e) => handleWordClick(word, panel.id, e)}
                          >
                            <div className="text-lg hover:text-primary">
                              <SmartFurigana 
                                japanese={word.japanese} 
                                furigana={word.furigana} 
                              />
                            </div>
                          </div>
                      ))}
                      <Button
                        variant="ghost"
                        size="icon"
                          className="h-6 w-6 ml-1 opacity-0 group-hover:opacity-100 transition-opacity self-end mb-1 -ml-1"
                          onClick={(e) => handleSentenceClick(sentence.translation, panel.id, e)}
                      >
                        <MessageCircle className="h-4 w-4" />
                          <span className="sr-only">Show translation</span>
                      </Button>
                        {/* Add a small space after each sentence except the last one */}
                        {sentenceIndex < panel.sentences.length - 1 && (
                          <span className="mx-1"></span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
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
      </div>
    </div>
  );
}