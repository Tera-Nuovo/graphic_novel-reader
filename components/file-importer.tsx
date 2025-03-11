import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, AlertTriangle, Upload } from "lucide-react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ImportedStory {
  title: string;
  chapters: {
    title: string;
    panels: {
      order: number;
      sentences: {
        text: string;
        translation: string;
        words: {
          text: string;
          translation: string;
          position: number;
        }[];
      }[];
    }[];
  }[];
}

interface FileImporterProps {
  onImportComplete: (storyId: string) => void;
}

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
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Invalid story format: Missing or invalid title');
    }
    
    if (!Array.isArray(data.chapters)) {
      throw new Error('Invalid story format: Chapters must be an array');
    }
    
    for (const chapter of data.chapters) {
      if (!chapter.title || typeof chapter.title !== 'string') {
        throw new Error('Invalid chapter format: Missing or invalid title');
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
          if (typeof sentence.text !== 'string') {
            throw new Error('Invalid sentence format: Missing or invalid text');
          }
          
          if (typeof sentence.translation !== 'string') {
            throw new Error('Invalid sentence format: Missing or invalid translation');
          }
          
          if (!Array.isArray(sentence.words)) {
            throw new Error('Invalid sentence format: Words must be an array');
          }
          
          for (const word of sentence.words) {
            if (typeof word.text !== 'string') {
              throw new Error('Invalid word format: Missing or invalid text');
            }
            
            if (typeof word.translation !== 'string') {
              throw new Error('Invalid word format: Missing or invalid translation');
            }
            
            if (typeof word.position !== 'number') {
              throw new Error('Invalid word format: Missing or invalid position');
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
      
      // 1. Create story
      const { data: createdStory, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: importData.title,
          status: 'draft'
        })
        .select()
        .single();
      
      if (storyError || !createdStory) {
        throw new Error(`Failed to create story: ${storyError?.message || 'Unknown error'}`);
      }
      
      const storyId = createdStory.id;
      
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
            order_index: i
          })
          .select()
          .single();
        
        if (chapterError || !chapterData) {
          throw new Error(`Failed to create chapter: ${chapterError?.message || 'Unknown error'}`);
        }
        
        const chapterId = chapterData.id;
        
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
              order_index: panel.order,
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
            
            const { data: sentenceData, error: sentenceError } = await supabase
              .from('sentences')
              .insert({
                panel_id: panelId,
                text: sentence.text,
                translation: sentence.translation,
                order_index: k
              })
              .select()
              .single();
            
            if (sentenceError || !sentenceData) {
              throw new Error(`Failed to create sentence: ${sentenceError?.message || 'Unknown error'}`);
            }
            
            const sentenceId = sentenceData.id;
            
            // 5. Create words for this sentence
            if (sentence.words.length > 0) {
              const wordsToInsert = sentence.words.map((word: { text: string; translation: string; position: number }) => ({
                sentence_id: sentenceId,
                text: word.text,
                translation: word.translation,
                position: word.position
              }));
              
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
      
      setImportStatus({
        success: true,
        message: `Successfully imported story: ${importData.title}`
      });
      
      onImportComplete(storyId);
      
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