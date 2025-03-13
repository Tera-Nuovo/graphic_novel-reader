"use client";

import { useState } from "react";
import { FileImporter } from "@/components/file-importer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CopyIcon, CheckIcon, Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SampleGenerator } from "./sample-generator";
import Link from "next/link";

export default function ImportPage() {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [importedStoryId, setImportedStoryId] = useState<string | null>(null);

  const sampleJson = {
    title: "Sample Story Title",
    chapters: [
      {
        title: "Chapter 1: Introduction",
        panels: [
          {
            order: 0,
            sentences: [
              {
                text: "こんにちは、世界！",
                translation: "Hello, world!",
                words: [
                  {
                    text: "こんにちは",
                    translation: "hello",
                    position: 0
                  },
                  {
                    text: "世界",
                    translation: "world",
                    position: 1
                  }
                ]
              },
              {
                text: "これは例文です。",
                translation: "This is an example sentence.",
                words: [
                  {
                    text: "これ",
                    translation: "this",
                    position: 0
                  },
                  {
                    text: "は",
                    translation: "is",
                    position: 1
                  },
                  {
                    text: "例文",
                    translation: "example sentence",
                    position: 2
                  },
                  {
                    text: "です",
                    translation: "is",
                    position: 3
                  }
                ]
              }
            ]
          },
          {
            order: 1,
            sentences: [
              {
                text: "２番目のパネルです。",
                translation: "This is the second panel.",
                words: [
                  {
                    text: "２番目",
                    translation: "second",
                    position: 0
                  },
                  {
                    text: "の",
                    translation: "of",
                    position: 1
                  },
                  {
                    text: "パネル",
                    translation: "panel",
                    position: 2
                  },
                  {
                    text: "です",
                    translation: "is",
                    position: 3
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  };

  const jsonString = JSON.stringify(sampleJson, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportComplete = (storyId: string) => {
    setImportedStoryId(storyId);
  };

  const handleViewStory = () => {
    if (importedStoryId) {
      router.push(`/admin/stories/${importedStoryId}`);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Import Story Data</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="upload">Upload JSON File</TabsTrigger>
          <TabsTrigger value="generate">Generate Sample File</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Upload JSON File</h2>
                <FileImporter onImportComplete={handleImportComplete} />
                
                {importedStoryId && (
                  <div className="mt-6">
                    <Button onClick={handleViewStory}>
                      View Imported Story
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="md:col-span-1">
              <div className="bg-card p-6 rounded-lg shadow-sm">
                <h2 className="text-xl font-semibold mb-4">Instructions</h2>
                <div className="space-y-4">
                  <p>
                    Upload a JSON file containing your story data. The file should follow the structure shown in the example below.
                  </p>
                  <p>
                    Your JSON file should include:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>Story title</li>
                    <li>Chapters with titles</li>
                    <li>Panels with order numbers</li>
                    <li>Sentences with text and translations</li>
                    <li>Words with text, translations, and positions</li>
                  </ul>
                  <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      <strong>Note:</strong> If you encounter permission errors during import, the system will automatically attempt to use admin privileges to complete the import. This handles row-level security policies that might prevent regular imports.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-semibold mb-2">Download Test Files</h3>
                    <div className="flex gap-4">
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <Link href="/test-story-import.json" target="_blank" download>
                          <Download className="h-4 w-4" />
                          Comprehensive Test Story (3 chapters with furigana)
                        </Link>
                      </Button>
                      <Button variant="outline" className="flex items-center gap-2" asChild>
                        <Link href="/sample-chapter-import.json" target="_blank" download>
                          <Download className="h-4 w-4" />
                          Simple Sample Chapter
                        </Link>
                      </Button>
                    </div>
                    <div className="mt-2">
                      <Link href="/docs/json-format.md" target="_blank" className="text-sm text-primary hover:underline">
                        View JSON Format Documentation
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <Accordion type="single" collapsible className="bg-card rounded-lg shadow-sm">
              <AccordionItem value="sample">
                <AccordionTrigger className="px-6 py-4">
                  <div className="flex items-center">
                    <span>Sample JSON Structure</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopy();
                      }}
                    >
                      {copied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                      <span className="ml-1">{copied ? "Copied!" : "Copy"}</span>
                    </Button>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4">
                  <pre className="p-4 bg-muted rounded-md overflow-x-auto text-sm">
                    {jsonString}
                  </pre>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </TabsContent>
        
        <TabsContent value="generate">
          <SampleGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
} 