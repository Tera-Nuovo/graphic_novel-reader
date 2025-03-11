# Chapter Import Format

This document explains how to use the chapter importer feature and the expected JSON format for importing chapter data.

## Overview

The chapter importer allows you to bulk import panels, sentences, and words data into a chapter. This is useful for:

- Migrating content from other systems
- Preparing content offline and importing it later
- Quickly adding multiple panels with pre-translated content

## How to Use

1. Navigate to the panels page for a chapter
2. Click the "Import from File" button
3. Select a JSON file that follows the format described below
4. Click "Import File"

The importer will validate your file, convert the data to the format expected by the editor, and replace any existing panels with the imported data.

## JSON Format

The JSON file should follow this structure:

```json
{
  "title": "Story Title",
  "chapters": [
    {
      "title": "Chapter Title",
      "panels": [
        {
          "order": 1,
          "sentences": [
            {
              "text": "Japanese text",
              "translation": "English translation",
              "words": [
                {
                  "text": "Japanese word",
                  "translation": "English translation",
                  "position": 0
                },
                // More words...
              ]
            },
            // More sentences...
          ]
        },
        // More panels...
      ]
    }
  ]
}
```

### Required Fields

- **title**: The story title (for reference only, not imported)
- **chapters**: Array of chapter objects (only the first chapter is used)
  - **title**: The chapter title (for reference only, not imported)
  - **panels**: Array of panel objects
    - **order**: Numeric order of the panel
    - **sentences**: Array of sentence objects
      - **text**: Japanese text of the sentence
      - **translation**: English translation of the sentence
      - **words**: Array of word objects
        - **text**: Japanese text of the word
        - **translation**: English translation of the word
        - **position**: Numeric position of the word in the sentence (0-based)

## Sample File

A sample file is available at `/sample-chapter-import.json` that demonstrates the expected format. You can download this file, modify it with your own content, and then import it.

## Notes

- The importer only uses the first chapter in the file, even if multiple chapters are included
- Panel images are not included in the import format and must be added separately
- The importer will replace all existing panels in the chapter with the imported data
- Word positions should be 0-based (the first word is at position 0)
- All fields shown in the format are required 