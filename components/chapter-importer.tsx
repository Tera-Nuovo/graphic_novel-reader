import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Upload } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface ImportedWord {
  text?: string;
  translation?: string;
  position?: number;
  // New format properties
  japanese?: string;
  reading?: string;
  english?: string;
  part_of_speech?: string | null;
  grammar_notes?: string | null;
  additional_notes?: string | null;
  order?: number;
}

interface ImportedSentence {
  text?: string;
  translation?: string;
  // New format properties
  japanese?: string;
  english?: string;
  notes?: string | null;
  order?: number;
  words: ImportedWord[];
}

interface ImportedPanel {
  order: number;
  sentences: ImportedSentence[];
  image?: string;
}

interface ImportedChapter {
  title: string;
  order?: number;
  status?: 'draft' | 'published';
  panels: ImportedPanel[];
}

interface ImportedStory {
  title: string;
  chapters: ImportedChapter[];
}

interface ChapterImporterProps {
  storyId: string;
  onComplete?: () => void;
}

// Helper function to import with service role if needed
const importChapterWithServiceRole = async (storyId: string, chapterData: ImportedChapter): Promise<string> => {
  try {
    console.log('Attempting chapter import with service role API...');
    
    const response = await fetch('/api/import/chapter-service-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storyId,
        chapter: chapterData
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import chapter with service role');
    }
    
    const data = await response.json();
    return data.chapterId;
  } catch (error) {
    console.error('Error importing chapter with service role:', error);
    throw error;
  }
};

export function ChapterImporter({ storyId, onComplete }: ChapterImporterProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    stage: string;
  } | null>(null);

  const supabase = createClientComponentClient();

  // Reset state when dialog opens/closes
  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      // Reset state when dialog is closed
      setFile(null);
      setImportStatus(null);
      setImportProgress(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus(null);
    }
  };

  const validateImportData = (data: any): ImportedChapter[] => {
    // Check if it's a full story import with chapters
    if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
      // Return all chapters from the story
      return data.chapters;
    }
    
    // Check if it's a single chapter format (has panels directly)
    if (data.panels && Array.isArray(data.panels)) {
      // Single chapter, wrap in array
      return [data as ImportedChapter];
    }
    
    // Check if it's a simple chapter object
    if (data.title && data.panels && Array.isArray(data.panels)) {
      // Single chapter, wrap in array
      return [data as ImportedChapter];
    }
    
    throw new Error('Invalid format: Could not find a valid chapter structure in the import file');
  };

  const importChapters = async (chaptersData: ImportedChapter[]) => {
    try {
      setImporting(true);
      let importedChapterIds: string[] = [];
      let shouldUseServiceRole = false;
      let importError = null;
      
      // Get ALL existing chapters to ensure we have the correct next order
      setImportProgress({ 
        current: 0, 
        total: chaptersData.length + 1, 
        stage: 'Getting chapter order' 
      });
      
      const { data: existingChapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('order')
        .eq('story_id', storyId)
        .order('order', { ascending: false });
      
      // Find the highest order value
      let nextOrder = 1;
      if (existingChapters && existingChapters.length > 0) {
        const maxOrder = Math.max(...existingChapters.map(ch => ch.order || 0));
        nextOrder = maxOrder + 1;
      }
      
      console.log(`Starting import with nextOrder: ${nextOrder}`);
      
      // Try normal client import first
      try {
        // Loop through all chapters to import
        for (let chapterIndex = 0; chapterIndex < chaptersData.length; chapterIndex++) {
          const chapterData = chaptersData[chapterIndex];
          const chapterOrder = nextOrder + chapterIndex;
          
          setImportProgress({ 
            current: chapterIndex + 1, 
            total: chaptersData.length + 1, 
            stage: `Creating chapter ${chapterIndex + 1}/${chaptersData.length} (order: ${chapterOrder})` 
          });
          
          console.log(`Creating chapter with order: ${chapterOrder}`);
          
          // Create the chapter with incrementing order
          const { data: createdChapter, error: chapterError } = await supabase
            .from('chapters')
            .insert({
              story_id: storyId,
              title: chapterData.title,
              order: chapterOrder, // Use pre-calculated order
              status: chapterData.status || 'draft'
            })
            .select()
            .single();
          
          if (chapterError) {
            console.error("Chapter creation error:", chapterError);
            // Check if error is RLS related
            if (chapterError.message?.includes('row-level security') || 
                chapterError.message?.includes('policy')) {
              console.warn('RLS error detected, will try service role import');
              shouldUseServiceRole = true;
              break; // Exit the loop and try service role import
            } else if (chapterError.message?.includes('duplicate key') || 
                     chapterError.message?.includes('unique constraint')) {
              // If we hit a duplicate key constraint, try with a much higher order
              console.warn(`Duplicate key error for order ${chapterOrder}, retrying with higher order`);
              nextOrder = nextOrder + chaptersData.length + 10; // Add extra buffer
              chapterIndex = -1; // Restart the loop (will be incremented to 0)
              importedChapterIds = []; // Reset imported IDs
              continue;
            } else {
              throw new Error(`Failed to create chapter: ${chapterError.message}`);
            }
          } 
          
          if (createdChapter) {
            const chapterId = createdChapter.id;
            importedChapterIds.push(chapterId);
            
            // Create panels
            for (let j = 0; j < chapterData.panels.length; j++) {
              const panel = chapterData.panels[j];
              
              const { data: panelData, error: panelError } = await supabase
                .from('panels')
                .insert({
                  chapter_id: chapterId,
                  order: panel.order,
                  image: panel.image || null
                })
                .select()
                .single();
              
              if (panelError) {
                throw new Error(`Failed to create panel: ${panelError.message}`);
              }
              
              const panelId = panelData.id;
              
              // Create sentences
              for (let k = 0; k < panel.sentences.length; k++) {
                const sentence = panel.sentences[k];
                
                // Handle both old and new format
                const japanese = sentence.japanese || sentence.text;
                const english = sentence.english || sentence.translation;
                const notes = sentence.notes || '';
                const order = sentence.order || k + 1;
                
                const { data: sentenceData, error: sentenceError } = await supabase
                  .from('sentences')
                  .insert({
                    panel_id: panelId,
                    japanese,
                    english,
                    notes,
                    order
                  })
                  .select()
                  .single();
                
                if (sentenceError) {
                  throw new Error(`Failed to create sentence: ${sentenceError.message}`);
                }
                
                const sentenceId = sentenceData.id;
                
                // Create words
                if (sentence.words && sentence.words.length > 0) {
                  const wordsToInsert = sentence.words.map((word, wordIndex) => {
                    // Calculate a safe order value - if word order/position is present, use it, otherwise use index + 1
                    const orderValue = (word.order || word.position || (wordIndex + 1));
                    
                    if ('text' in word && 'translation' in word) {
                      // Old format
                      return {
                        sentence_id: sentenceId,
                        japanese: word.text,
                        reading: '',
                        english: word.translation,
                        part_of_speech: null,
                        grammar_notes: null,
                        additional_notes: null,
                        order: orderValue
                      };
                    } else {
                      // New format
                      return {
                        sentence_id: sentenceId,
                        japanese: word.japanese,
                        reading: word.reading || '',
                        english: word.english,
                        part_of_speech: word.part_of_speech || null,
                        grammar_notes: word.grammar_notes || null,
                        additional_notes: word.additional_notes || null,
                        order: orderValue
                      };
                    }
                  });
                  
                  // Try to insert words with retry logic for duplicate keys
                  let wordInsertSuccess = false;
                  let wordInsertAttempt = 0;
                  const maxWordInsertAttempts = 3;
                  
                  while (!wordInsertSuccess && wordInsertAttempt < maxWordInsertAttempts) {
                    try {
                      // If this is a retry, adjust all order values
                      if (wordInsertAttempt > 0) {
                        console.log(`Retrying word insert with offset ${wordInsertAttempt * 100}`);
                        wordsToInsert.forEach(word => {
                          word.order += (wordInsertAttempt * 100); // Add a large offset on each retry
                        });
                      }
                      
                      const { error: wordsError } = await supabase
                        .from('words')
                        .insert(wordsToInsert);
                      
                      if (wordsError) {
                        if (wordsError.message?.includes('duplicate key') || 
                           wordsError.message?.includes('unique constraint')) {
                          // If it's a duplicate key error, try again
                          wordInsertAttempt++;
                        } else {
                          throw wordsError;
                        }
                      } else {
                        wordInsertSuccess = true;
                      }
                    } catch (error) {
                      console.error("Error inserting words:", error);
                      throw error;
                    }
                  }
                  
                  if (!wordInsertSuccess) {
                    throw new Error(`Failed to create words after ${maxWordInsertAttempts} attempts`);
                  }
                }
              }
            }
          }
        }
      } catch (clientError) {
        console.error("Client import error:", clientError);
        if (!shouldUseServiceRole) {
          // If not already marked for service role, check the error
          if (clientError instanceof Error && 
              (clientError.message.includes('row-level security') || 
               clientError.message.includes('policy'))) {
            console.warn('RLS error detected during import, will try service role');
            shouldUseServiceRole = true;
          } else {
            importError = clientError;
          }
        }
      }
      
      // If we need to use service role or client import failed
      if (shouldUseServiceRole) {
        setImportProgress({ 
          current: 0, 
          total: 1, 
          stage: 'Importing with admin privileges' 
        });
        
        // Reset for service role import
        importedChapterIds = [];
        // Recalculate nextOrder to be safe
        if (existingChapters && existingChapters.length > 0) {
          const maxOrder = Math.max(...existingChapters.map(ch => ch.order || 0));
          nextOrder = maxOrder + 1;
        } else {
          nextOrder = 1;
        }
        
        // Add extra buffer to avoid conflicts  
        nextOrder += 10;
        
        console.log(`Using service role to import chapters starting at order: ${nextOrder}`);
          
        // Use service role to import all chapters
        const chaptersToImport = chaptersData.map((chapter, index) => {
          return {
            ...chapter,
            order: nextOrder + index // Assign sequential order numbers with buffer
          };
        });
        
        try {
          const result = await fetch('/api/import/chapter-service-role', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              storyId,
              chapters: chaptersToImport
            }),
          });
          
          if (!result.ok) {
            const errorData = await result.json();
            throw new Error(errorData.error || 'Failed to import chapter with service role');
          }
          
          const data = await result.json();
          importedChapterIds = data.chapterIds || [];
          
          setImportProgress({ 
            current: 1, 
            total: 1, 
            stage: 'Import completed with admin privileges' 
          });
        } catch (serviceRoleError) {
          console.error("Service role import error:", serviceRoleError);
          importError = serviceRoleError;
        }
      }
      
      // Re-throw any error we encountered
      if (importError) {
        throw importError;
      }
      
      // Only proceed if we actually got chapter IDs
      if (importedChapterIds.length > 0) {
        setImportStatus({
          success: true,
          message: `Successfully imported ${importedChapterIds.length} chapter${importedChapterIds.length !== 1 ? 's' : ''}`
        });
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
        
        // Close the dialog after a short delay to show success message
        setTimeout(() => {
          setDialogOpen(false);
        }, 1500);
      } else {
        throw new Error('Failed to create any chapters');
      }
      
    } catch (error) {
      console.error("Import error:", error);
      setImportStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred during import'
      });
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    try {
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);
      
      const chaptersData = validateImportData(jsonData);
      if (chaptersData && chaptersData.length > 0) {
        await importChapters(chaptersData);
      }
    } catch (error) {
      console.error("File parsing error:", error);
      setImportStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to parse file'
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Chapter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Chapter</DialogTitle>
          <DialogDescription>
            Upload a JSON file containing one or more chapters to add to this story.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 w-full py-4">
          <div className="flex flex-col space-y-2">
            <Label htmlFor="file-upload">Select Chapter File</Label>
            <div className="flex gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={importing}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              The JSON file can contain multiple chapters. All chapters will be added to the end of the story in the order they appear in the file.
            </p>
          </div>

          {importProgress && (
            <div className="mt-4">
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-300 ease-in-out"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {importProgress.stage}: {importProgress.current}/{importProgress.total}
              </p>
            </div>
          )}

          {importStatus && (
            <Alert variant={importStatus.success ? "default" : "destructive"}>
              {importStatus.success ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {importStatus.success ? "Import Successful" : "Import Failed"}
              </AlertTitle>
              <AlertDescription>{importStatus.message}</AlertDescription>
            </Alert>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="w-full"
          >
            {importing ? "Importing..." : "Import Chapter"}
            {!importing && <Upload className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 