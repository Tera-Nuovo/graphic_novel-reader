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
  sentences: ImportedSentence[];
  image?: string;
}

interface ImportedChapter {
  title: string;
  panels: ImportedPanel[];
}

interface ImportedStory {
  title: string;
  chapters: ImportedChapter[];
}

interface ChapterImporterProps {
  storyId: string;
  chapterId: string;
  onImportComplete: (panels: any[]) => void;
}

export function ChapterImporter({ storyId, chapterId, onImportComplete }: ChapterImporterProps) {
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
    // For chapter import, we only need to validate the structure of panels, sentences, and words
    if (!data.chapters || !Array.isArray(data.chapters) || data.chapters.length === 0) {
      throw new Error('Invalid format: No chapters found');
    }
    
    // We'll only use the first chapter from the file
    const chapter = data.chapters[0];
    
    if (!chapter.panels || !Array.isArray(chapter.panels)) {
      throw new Error('Invalid format: No panels found in chapter');
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
    
    return true;
  };

  // Convert imported data to the format expected by the panels editor
  const convertToEditorFormat = (importedChapter: ImportedChapter) => {
    return importedChapter.panels.map((panel, index) => {
      return {
        id: index + 1, // Generate sequential IDs
        image: panel.image || null, // Use image if available
        sentences: panel.sentences.map((sentence, sentenceIndex) => {
          // Check format: old format has 'text' and 'translation', new format has 'japanese' and 'english'
          const japanese = 'japanese' in sentence ? sentence.japanese : sentence.text;
          const english = 'english' in sentence ? sentence.english : sentence.translation;
          const notes = 'notes' in sentence ? sentence.notes : "";
          
          return {
            id: sentenceIndex + 1,
            japanese,
            english,
            notes,
            words: sentence.words.map((word, wordIndex) => {
              // Check if word is in old format (text, translation, position) or new format
              if ('text' in word && 'translation' in word) {
                return {
                  id: wordIndex + 1,
                  japanese: word.text,
                  reading: "", // No reading in old format
                  english: word.translation,
                  partOfSpeech: "",
                  grammarNotes: "",
                  additionalNotes: "",
                };
              } else {
                // New format with more details
                return {
                  id: wordIndex + 1,
                  japanese: word.japanese,
                  reading: word.reading || "",
                  english: word.english,
                  partOfSpeech: word.part_of_speech || "",
                  grammarNotes: word.grammar_notes || "",
                  additionalNotes: word.additional_notes || "",
                };
              }
            }),
          };
        }),
      };
    });
  };

  const handleImport = async () => {
    if (!file) return;
    
    try {
      setImporting(true);
      setImportProgress({ current: 0, total: 1, stage: 'Parsing file' });
      
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);
      
      if (validateImportData(jsonData)) {
        setImportProgress({ current: 1, total: 2, stage: 'Converting data format' });
        
        // We'll only use the first chapter from the file
        const importedChapter = jsonData.chapters[0];
        
        // Convert to the format expected by the panels editor
        const panelsData = convertToEditorFormat(importedChapter);
        
        setImportProgress({ current: 2, total: 2, stage: 'Completing import' });
        
        // Call the onImportComplete callback with the converted data
        onImportComplete(panelsData);
        
        setImportStatus({
          success: true,
          message: `Successfully imported ${panelsData.length} panels with content`
        });
      }
    } catch (error) {
      console.error("File parsing error:", error);
      setImportStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to parse file'
      });
    } finally {
      setImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col space-y-2">
        <Label htmlFor="chapter-file-upload">Import Chapter Data</Label>
        <div className="flex gap-2">
          <Input
            id="chapter-file-upload"
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
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground mt-1">
            Upload a JSON file with panels, sentences, and words data.
          </p>
          <div className="flex gap-2">
            <a 
              href="/docs/chapter-import-format" 
              target="_blank" 
              className="text-sm text-primary hover:underline"
            >
              View Format Documentation
            </a>
            <a 
              href="/sample-chapter-import.json" 
              target="_blank" 
              className="text-sm text-primary hover:underline"
              download
            >
              Download Sample File
            </a>
          </div>
        </div>
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