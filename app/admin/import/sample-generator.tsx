"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Check, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Simple word segmentation for Japanese text
function segmentJapaneseText(text: string): string[] {
  // Replace full-width spaces with regular spaces
  const normalizedText = text.replace(/\u3000/g, " ");
  
  // If there are spaces, split by spaces
  if (normalizedText.includes(" ")) {
    return normalizedText.split(" ").filter(word => word.trim().length > 0);
  }
  
  // For non-spaced Japanese text, treat each character as a word
  // This is a simple approach - a proper tokenizer would be better
  return Array.from(text);
}

interface GeneratorFormState {
  storyTitle: string;
  chapterTitle: string;
  japaneseText: string;
  englishTranslation: string;
}

export function SampleGenerator() {
  const [formState, setFormState] = useState<GeneratorFormState>({
    storyTitle: "My Japanese Story",
    chapterTitle: "Chapter 1",
    japaneseText: "これは日本語のサンプルテキストです。漫画を読みましょう。",
    englishTranslation: "This is a sample Japanese text. Let's read manga."
  });
  
  const [generatedJson, setGeneratedJson] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleInputChange = (key: keyof GeneratorFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value
    }));
    setGeneratedJson(null);
    setError(null);
  };
  
  const generateSampleJson = () => {
    try {
      const { storyTitle, chapterTitle, japaneseText, englishTranslation } = formState;
      
      if (!storyTitle.trim() || !chapterTitle.trim() || !japaneseText.trim() || !englishTranslation.trim()) {
        setError("All fields are required");
        return;
      }
      
      // Split Japanese text into sentences (simple splitting by period, question mark, etc.)
      const japaneseSentences = japaneseText
        .split(/[。！？]/)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim());
      
      // Split English translation into sentences similarly
      const englishSentences = englishTranslation
        .split(/[.!?]/)
        .filter(s => s.trim().length > 0)
        .map(s => s.trim());
      
      // Make sure we have the same number of sentences
      if (japaneseSentences.length !== englishSentences.length) {
        setError("The number of sentences in Japanese and English don't match. Make sure you have the same number of sentence-ending punctuation marks (。, !, ?, ., etc.)");
        return;
      }
      
      // Create sentences with word segmentation
      const sentences = japaneseSentences.map((japanese, index) => {
        const words = segmentJapaneseText(japanese);
        
        return {
          text: japanese + (japanese.endsWith("。") ? "" : "。"),
          translation: englishSentences[index] + (englishSentences[index].endsWith(".") ? "" : "."),
          words: words.map((word, wordIndex) => ({
            text: word,
            translation: "[Translation needed]", // In a real app, you might use a dictionary API
            position: wordIndex
          }))
        };
      });
      
      // Build the sample json structure
      const jsonObject = {
        title: storyTitle,
        chapters: [
          {
            title: chapterTitle,
            panels: [
              {
                order: 0,
                sentences: sentences
              }
            ]
          }
        ]
      };
      
      // Format and set the JSON
      setGeneratedJson(JSON.stringify(jsonObject, null, 2));
      setError(null);
      
    } catch (error) {
      setError("Failed to generate JSON: " + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };
  
  const handleDownload = () => {
    if (!generatedJson) return;
    
    const blob = new Blob([generatedJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formState.storyTitle.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Sample Import File</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="storyTitle">Story Title</Label>
          <Input 
            id="storyTitle" 
            value={formState.storyTitle}
            onChange={(e) => handleInputChange("storyTitle", e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="chapterTitle">Chapter Title</Label>
          <Input 
            id="chapterTitle" 
            value={formState.chapterTitle}
            onChange={(e) => handleInputChange("chapterTitle", e.target.value)}
          />
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="japaneseText">Japanese Text</Label>
            <Textarea 
              id="japaneseText" 
              rows={4}
              value={formState.japaneseText}
              onChange={(e) => handleInputChange("japaneseText", e.target.value)}
              placeholder="Enter Japanese text here. Use 。 for sentence endings."
            />
            <p className="text-xs text-muted-foreground">
              Use 。 to separate sentences.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="englishTranslation">English Translation</Label>
            <Textarea 
              id="englishTranslation" 
              rows={4}
              value={formState.englishTranslation}
              onChange={(e) => handleInputChange("englishTranslation", e.target.value)}
              placeholder="Enter English translation here. Use . for sentence endings."
            />
            <p className="text-xs text-muted-foreground">
              Use . to separate sentences.
            </p>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex gap-2">
          <Button onClick={generateSampleJson}>
            Generate JSON
          </Button>
          
          {generatedJson && (
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download JSON
            </Button>
          )}
        </div>
        
        {generatedJson && (
          <div className="mt-4">
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>JSON generated successfully!</AlertDescription>
            </Alert>
            <div className="mt-4 p-4 bg-muted rounded-md overflow-x-auto">
              <pre className="text-sm whitespace-pre-wrap">{generatedJson}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 