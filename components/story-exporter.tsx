import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getCompleteStoryData } from "@/lib/db";
import { Story } from "@/lib/types";

interface StoryExporterProps {
  storyId: string;
  storyData?: Story;
}

export function StoryExporter({ storyId, storyData }: StoryExporterProps) {
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleExport = async () => {
    try {
      setExporting(true);
      setExportStatus(null);
      
      // Get complete story data including all chapters, panels, sentences, and words
      const completeData = await getCompleteStoryData(storyId);
      
      // Transform the data to the expected export format
      const exportData = {
        title: completeData.japanese_title,
        english_title: completeData.english_title,
        description: completeData.description,
        difficulty_level: completeData.difficulty_level,
        tags: completeData.tags,
        cover_image: completeData.cover_image,
        status: completeData.status,
        chapters: completeData.chapters.map(chapter => ({
          title: chapter.title,
          order: chapter.order,
          status: chapter.status,
          panels: chapter.panels.map(panel => ({
            order: panel.order,
            image: panel.image,
            sentences: panel.sentences.map(sentence => ({
              japanese: sentence.japanese,
              english: sentence.english,
              notes: sentence.notes,
              order: sentence.order,
              words: sentence.words.map(word => ({
                japanese: word.japanese,
                reading: word.reading,
                english: word.english,
                part_of_speech: word.part_of_speech,
                grammar_notes: word.grammar_notes,
                additional_notes: word.additional_notes,
                order: word.order
              }))
            }))
          }))
        }))
      };
      
      // Create a blob with the data
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      // Create a download link and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${completeData.japanese_title || 'story'}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setExportStatus({
        success: true,
        message: 'Story data exported successfully!'
      });
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export story data'
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
        {exporting ? "Exporting..." : "Export Story Data"}
        {!exporting && <Download className="ml-2 h-4 w-4" />}
      </Button>
      
      {exportStatus && (
        <div className={`text-sm ${exportStatus.success ? 'text-green-600' : 'text-red-600'}`}>
          {exportStatus.message}
        </div>
      )}
      
      <p className="text-sm text-muted-foreground">
        Export the complete story data including all chapters, panels, sentences, and words as a JSON file.
        This file can be imported back into the system.
      </p>
    </div>
  );
} 