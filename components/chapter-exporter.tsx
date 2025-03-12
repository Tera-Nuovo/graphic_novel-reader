import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getChapterById, getPanelsByChapterId, getSentencesByPanelId, getWordsBySentenceId } from "@/lib/db";
import { Chapter } from "@/lib/types";

interface ChapterExporterProps {
  storyId: string;
  chapterId: string;
  chapterData?: Chapter;
}

export function ChapterExporter({ storyId, chapterId, chapterData }: ChapterExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportStatus(null);
      
      // Get chapter data
      const chapter = chapterData || await getChapterById(chapterId);
      
      // Get panels for this chapter
      const panels = await getPanelsByChapterId(chapterId);
      
      // For each panel, get sentences and words
      const panelsWithSentences = await Promise.all(
        panels.map(async (panel) => {
          // Get sentences for this panel
          const sentences = await getSentencesByPanelId(panel.id);
          
          // For each sentence, get words
          const sentencesWithWords = await Promise.all(
            sentences.map(async (sentence) => {
              // Get words for this sentence
              const words = await getWordsBySentenceId(sentence.id);
              
              return {
                japanese: sentence.japanese,
                english: sentence.english,
                notes: sentence.notes,
                order: sentence.order,
                words: words.map(word => ({
                  japanese: word.japanese,
                  reading: word.reading,
                  english: word.english,
                  part_of_speech: word.part_of_speech,
                  grammar_notes: word.grammar_notes,
                  additional_notes: word.additional_notes,
                  order: word.order
                }))
              };
            })
          );
          
          return {
            order: panel.order,
            image: panel.image,
            sentences: sentencesWithWords
          };
        })
      );
      
      // Create the export data
      const exportData = {
        title: "Story Title", // This is just a placeholder for compatibility
        chapters: [
          {
            title: chapter.title,
            order: chapter.order,
            status: chapter.status,
            panels: panelsWithSentences
          }
        ]
      };
      
      // Create a blob with the data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      // Create a download link and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chapter-${chapter.title || chapterId}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus({
        success: true,
        message: 'Chapter data exported successfully!'
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export chapter data'
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleExport} 
        disabled={exporting}
        variant="outline"
        className="w-full"
      >
        {exporting ? "Exporting..." : "Export Chapter Data"}
        {!exporting && <Download className="ml-2 h-4 w-4" />}
      </Button>
      
      {exportStatus && (
        <div className={`text-sm ${exportStatus.success ? 'text-green-600' : 'text-red-600'}`}>
          {exportStatus.message}
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Export the complete chapter data including all panels, sentences, and words as a JSON file.
        This file can be imported back into the system.
      </p>
    </div>
  );
} 