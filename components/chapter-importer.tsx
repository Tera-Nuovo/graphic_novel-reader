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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus(null);
    }
  };

  const validateImportData = (data: any): ImportedChapter | null => {
    // First check if it's a full story import with chapters
    if (data.chapters && Array.isArray(data.chapters) && data.chapters.length > 0) {
      // Take just the first chapter from a full story import
      return data.chapters[0];
    }
    
    // Check if it's a single chapter format (has panels directly)
    if (data.panels && Array.isArray(data.panels)) {
      return data as ImportedChapter;
    }
    
    // Check if it's a simple chapter object
    if (data.title && data.panels && Array.isArray(data.panels)) {
      return data as ImportedChapter;
    }
    
    throw new Error('Invalid format: Could not find a valid chapter structure in the import file');
  };

  const importChapter = async (chapterData: ImportedChapter) => {
    try {
      setImporting(true);
      let chapterId = '';
      let shouldUseServiceRole = false;
      
      // Get the maximum order of existing chapters to add this one at the end
      setImportProgress({ 
        current: 0, 
        total: 3, 
        stage: 'Getting chapter order' 
      });
      
      const { data: existingChapters, error: chaptersError } = await supabase
        .from('chapters')
        .select('order')
        .eq('story_id', storyId)
        .order('order', { ascending: false })
        .limit(1);
      
      const nextOrder = existingChapters && existingChapters.length > 0 
        ? existingChapters[0].order + 1 
        : 1;
      
      // Try normal client import first
      try {
        setImportProgress({ 
          current: 1, 
          total: 3, 
          stage: 'Creating chapter' 
        });
        
        // Create the chapter
        const { data: createdChapter, error: chapterError } = await supabase
          .from('chapters')
          .insert({
            story_id: storyId,
            title: chapterData.title,
            order: chapterData.order || nextOrder,
            status: chapterData.status || 'draft'
          })
          .select()
          .single();
        
        if (chapterError) {
          // Check if error is RLS related
          if (chapterError.message?.includes('row-level security') || 
              chapterError.message?.includes('policy')) {
            console.warn('RLS error detected, will try service role import');
            shouldUseServiceRole = true;
          } else {
            throw new Error(`Failed to create chapter: ${chapterError.message}`);
          }
        } else if (createdChapter) {
          chapterId = createdChapter.id;
          
          // Create panels
          setImportProgress({ 
            current: 2, 
            total: 3, 
            stage: 'Creating panels' 
          });
          
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
                const wordsToInsert = sentence.words.map(word => {
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
                      order: word.position || 0
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
                      order: word.order || 0
                    };
                  }
                });
                
                const { error: wordsError } = await supabase
                  .from('words')
                  .insert(wordsToInsert);
                
                if (wordsError) {
                  throw new Error(`Failed to create words: ${wordsError.message}`);
                }
              }
            }
          }
        }
      } catch (clientError) {
        if (!shouldUseServiceRole) {
          // If not already marked for service role, check the error
          if (clientError instanceof Error && 
              (clientError.message.includes('row-level security') || 
               clientError.message.includes('policy'))) {
            console.warn('RLS error detected during import, will try service role');
            shouldUseServiceRole = true;
          } else {
            throw clientError;
          }
        }
      }
      
      // If we need to use service role or client import failed
      if (shouldUseServiceRole) {
        setImportProgress({ 
          current: 1, 
          total: 2, 
          stage: 'Importing with admin privileges' 
        });
        
        // Update the chapter order in case it wasn't specified
        const chapterToImport = {
          ...chapterData,
          order: chapterData.order || nextOrder
        };
        
        chapterId = await importChapterWithServiceRole(storyId, chapterToImport);
        
        setImportProgress({ 
          current: 2, 
          total: 2, 
          stage: 'Import completed with admin privileges' 
        });
      }
      
      // Only proceed if we actually got a chapterId
      if (chapterId) {
        setImportStatus({
          success: true,
          message: `Successfully imported chapter: ${chapterData.title}`
        });
        
        // Call onComplete callback if provided
        if (onComplete) {
          onComplete();
        }
      } else {
        throw new Error('Failed to create chapter: No chapter ID returned');
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
      
      const chapterData = validateImportData(jsonData);
      if (chapterData) {
        await importChapter(chapterData);
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
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
            Upload a JSON file containing a chapter to add to this story.
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
              The JSON file can contain a single chapter or a full story (only the first chapter will be imported).
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