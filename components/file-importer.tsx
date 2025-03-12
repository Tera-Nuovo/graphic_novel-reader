import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Upload } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

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
  // New format property
  image?: string | null;
  sentences: ImportedSentence[];
}

interface ImportedChapter {
  title: string;
  // New format properties
  order?: number;
  status?: 'draft' | 'published';
  panels: ImportedPanel[];
}

interface ImportedStory {
  title?: string;
  // New format properties
  japanese_title?: string;
  english_title?: string;
  description?: string | null;
  difficulty_level?: string;
  tags?: string[] | null;
  cover_image?: string | null;
  status?: 'draft' | 'published';
  chapters: ImportedChapter[];
}

interface FileImporterProps {
  onImportComplete: (storyId: string) => void;
}

// New helper function to import with service role
const importWithServiceRole = async (importData: ImportedStory): Promise<string> => {
  try {
    console.log('Attempting import with service role API...');
    
    const response = await fetch('/api/import/service-role', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(importData),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import with service role');
    }
    
    const data = await response.json();
    return data.storyId;
  } catch (error) {
    console.error('Error importing with service role:', error);
    throw error;
  }
};

export function FileImporter({ onImportComplete }: FileImporterProps) {
  const [file, setFile] = useState<File | null>(null);
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

  const validateImportData = (data: any): data is ImportedStory => {
    if (!data.title && !data.japanese_title) {
      throw new Error('Invalid story format: Missing title');
    }
    
    // Handle both the old and new format
    if (!Array.isArray(data.chapters)) {
      throw new Error('Invalid story format: Chapters must be an array');
    }
    
    for (const chapter of data.chapters) {
      if (!chapter.title) {
        throw new Error('Invalid chapter format: Missing title');
      }
      
      if (!Array.isArray(chapter.panels)) {
        throw new Error('Invalid chapter format: Panels must be an array');
      }
      
      for (const panel of chapter.panels) {
        if (typeof panel.order !== 'number') {
          throw new Error('Invalid panel format: Missing or invalid order');
        }
        
        if (!Array.isArray(panel.sentences)) {
          throw new Error('Invalid panel format: Sentences must be an array');
        }
        
        for (const sentence of panel.sentences) {
          // Check for both old format (text/translation) and new format (japanese/english)
          if (!sentence.text && !sentence.japanese) {
            throw new Error('Invalid sentence format: Missing text or japanese field');
          }
          
          if (!sentence.translation && !sentence.english) {
            throw new Error('Invalid sentence format: Missing translation or english field');
          }
          
          if (!Array.isArray(sentence.words)) {
            throw new Error('Invalid sentence format: Words must be an array');
          }
          
          for (const word of sentence.words) {
            // Check for both old format (text/translation) and new format (japanese/english)
            if (!word.text && !word.japanese) {
              throw new Error('Invalid word format: Missing text or japanese field');
            }
            
            if (!word.translation && !word.english) {
              throw new Error('Invalid word format: Missing translation or english field');
            }
          }
        }
      }
    }
    
    return true;
  };

  const importStory = async (importData: ImportedStory) => {
    try {
      setImporting(true);
      setImportProgress({ current: 0, total: 1, stage: 'Creating story' });
      
      let storyId = '';
      let shouldUseServiceRole = false;
      
      // Try normal client import first
      try {
        // 1. Create story
        const { data: createdStory, error: storyError } = await supabase
          .from('stories')
          .insert({
            japanese_title: importData.japanese_title || importData.title,
            english_title: importData.english_title || importData.title,
            description: importData.description || '',
            difficulty_level: importData.difficulty_level || 'intermediate',
            tags: importData.tags || [],
            cover_image: importData.cover_image || null,
            status: importData.status || 'draft'
          })
          .select()
          .single();
        
        if (storyError) {
          // Check if error is RLS related
          if (storyError.message?.includes('row-level security') || 
              storyError.message?.includes('policy')) {
            console.warn('RLS error detected, will try service role import');
            shouldUseServiceRole = true;
          } else {
            throw new Error(`Failed to create story: ${storyError.message}`);
          }
        } else if (createdStory) {
          storyId = createdStory.id;
          
          // Continue with normal import for chapters, panels, etc.
          // 2. Create chapters
          setImportProgress({ 
            current: 1, 
            total: importData.chapters.length + 1, 
            stage: 'Creating chapters' 
          });
          
          for (let i = 0; i < importData.chapters.length; i++) {
            const chapter = importData.chapters[i];
            
            setImportProgress({ 
              current: i + 1, 
              total: importData.chapters.length + 1, 
              stage: `Creating chapter ${i + 1}/${importData.chapters.length}` 
            });
            
            const { data: chapterData, error: chapterError } = await supabase
              .from('chapters')
              .insert({
                story_id: storyId,
                title: chapter.title,
                order: chapter.order || i + 1,
                status: chapter.status || 'draft'
              })
              .select()
              .single();
            
            if (chapterError) {
              throw new Error(`Failed to create chapter: ${chapterError.message}`);
            }
            
            const chapterId = chapterData.id;
            
            // Continue with panels, sentences, and words...
            // 3. Create panels for this chapter
            setImportProgress({ 
              current: 0, 
              total: chapter.panels.length, 
              stage: `Creating panels for chapter ${i + 1}` 
            });
            
            for (let j = 0; j < chapter.panels.length; j++) {
              const panel = chapter.panels[j];
              
              setImportProgress({ 
                current: j + 1, 
                total: chapter.panels.length, 
                stage: `Creating panel ${j + 1}/${chapter.panels.length} for chapter ${i + 1}` 
              });
              
              const { data: panelData, error: panelError } = await supabase
                .from('panels')
                .insert({
                  chapter_id: chapterId,
                  order: panel.order,
                  image: panel.image || null
                })
                .select()
                .single();
              
              if (panelError || !panelData) {
                throw new Error(`Failed to create panel: ${panelError?.message || 'Unknown error'}`);
              }
              
              const panelId = panelData.id;
              
              // 4. Create sentences for this panel
              setImportProgress({ 
                current: 0, 
                total: panel.sentences.length, 
                stage: `Creating sentences for panel ${j + 1}` 
              });
              
              for (let k = 0; k < panel.sentences.length; k++) {
                const sentence = panel.sentences[k];
                
                setImportProgress({ 
                  current: k + 1, 
                  total: panel.sentences.length, 
                  stage: `Creating sentence ${k + 1}/${panel.sentences.length} for panel ${j + 1}` 
                });
                
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
                
                if (sentenceError || !sentenceData) {
                  throw new Error(`Failed to create sentence: ${sentenceError?.message || 'Unknown error'}`);
                }
                
                const sentenceId = sentenceData.id;
                
                // 5. Create words for this sentence
                if (sentence.words.length > 0) {
                  // Convert words to the expected format, handling both old and new formats
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
          current: 0, 
          total: 1, 
          stage: 'Importing with admin privileges' 
        });
        
        storyId = await importWithServiceRole(importData);
        
        setImportProgress({ 
          current: 1, 
          total: 1, 
          stage: 'Import completed with admin privileges' 
        });
      }
      
      // Only proceed if we actually got a storyId
      if (storyId) {
        setImportStatus({
          success: true,
          message: `Successfully imported story: ${importData.japanese_title || importData.english_title || importData.title}`
        });
        
        onImportComplete(storyId);
      } else {
        throw new Error('Failed to create story: No story ID returned');
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
      
      if (validateImportData(jsonData)) {
        await importStory(jsonData);
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
    <div className="space-y-4 w-full">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="file-upload">Import Story Data</Label>
        <div className="flex gap-2">
          <Input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={importing}
          />
          <Button 
            onClick={handleImport} 
            disabled={!file || importing}
            className="whitespace-nowrap"
          >
            {importing ? "Importing..." : "Import File"}
            {!importing && <Upload className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Upload a JSON file with story data including chapters, panels, sentences, and words.
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
  );
} 