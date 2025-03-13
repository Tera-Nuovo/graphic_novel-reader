# JSON Format Documentation for Graphic Novel Reader

This document provides a comprehensive guide to the JSON format used for importing stories and chapters into the Graphic Novel Reader application.

## Table of Contents

1. [Introduction](#introduction)
2. [Story Import Format](#story-import-format)
3. [Chapter Import Format](#chapter-import-format)
4. [Common Elements](#common-elements)
   - [Panel Format](#panel-format)
   - [Sentence Format](#sentence-format)
   - [Word Format](#word-format)
5. [Examples](#examples)
6. [Best Practices](#best-practices)

## Introduction

The Graphic Novel Reader application supports importing content in a structured JSON format. You can import:

- Complete stories with multiple chapters (using the Story Import Format)
- Individual chapters to add to existing stories (using the Chapter Import Format)

All imports provide support for Japanese text with furigana, translations, and detailed word-level annotations.

## Story Import Format

When you want to import a complete story with one or more chapters, use the Story Import Format.

### Structure

```json
{
  "title": "Story Title",
  "chapters": [
    {
      "title": "Chapter Title",
      "order": 1,
      "status": "published",
      "panels": [
        // Panel objects (see Panel Format)
      ]
    },
    // More chapters...
  ]
}
```

### Story Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `title` | String | The title of the story | Yes |
| `chapters` | Array | Array of chapter objects | Yes |

### Story Import Notes

- When importing a complete story, all chapters in the `chapters` array will be created
- Chapter orders will be preserved as specified in the file
- The story title will be used for both Japanese and English titles 
- If you're importing into an existing story, consider using the Chapter Import Format instead

## Chapter Import Format

When you want to add a single chapter or multiple chapters to an existing story, use the Chapter Import Format.

### Structure for Single Chapter Import

```json
{
  "title": "Chapter Title",
  "status": "draft",
  "panels": [
    {
      "order": 1,
      "image": "https://example.com/image.jpg",
      "sentences": [
        // Sentence objects
      ]
    },
    // More panels...
  ]
}
```

### Structure for Multiple Chapters Import

```json
{
  "chapters": [
    {
      "title": "Chapter 1 Title",
      "status": "draft",
      "panels": [
        // Panel objects
      ]
    },
    {
      "title": "Chapter 2 Title",
      "status": "draft",
      "panels": [
        // Panel objects
      ]
    }
  ]
}
```

### Chapter Properties

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `title` | String | The title of the chapter | Yes |
| `order` | Number | The numerical order of this chapter (when importing multiple chapters, this can be omitted) | No |
| `status` | String | Either "draft" or "published" | No (defaults to "draft") |
| `panels` | Array | Array of panel objects | Yes |

### Chapter Import Notes

- When using chapter import, the chapters will be added to an existing story
- All imported chapters will be added to the end of the story, after any existing chapters
- You can either import a single chapter (using the single chapter format) or multiple chapters (using the multiple chapters format or a full story import file)
- If `order` is specified, it will be adjusted to follow existing chapters
- The system will automatically assign an appropriate order value to avoid conflicts with existing chapters

## Common Elements

The following formats are used in both story and chapter imports.

### Panel Format

Panels are used to organize content within chapters:

```json
{
  "order": 1,
  "image": "https://example.com/image.jpg",
  "sentences": [
    // Sentence objects
  ]
}
```

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `order` | Number | The numerical order of this panel within the chapter | Yes |
| `image` | String | URL or data URI of the panel image | No |
| `sentences` | Array | Array of sentence objects | Yes |

### Sentence Format

Sentences can use either the modern format or legacy format:

#### Modern Format (Preferred)

```json
{
  "japanese": "日本語の文章です。",
  "english": "This is a Japanese sentence.",
  "notes": "This is an example sentence.",
  "order": 1,
  "words": [
    // Word objects
  ]
}
```

#### Legacy Format (Supported but not recommended)

```json
{
  "text": "日本語の文章です。",
  "translation": "This is a Japanese sentence.",
  "order": 1,
  "words": [
    // Word objects
  ]
}
```

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `japanese` or `text` | String | The Japanese text of the sentence | Yes |
| `english` or `translation` | String | The English translation of the sentence | Yes |
| `notes` | String | Optional grammatical or contextual notes | No |
| `order` | Number | The numerical order of this sentence within the panel | No (defaults to array position + 1) |
| `words` | Array | Array of word objects | Yes |

### Word Format

Words can use either the modern format or legacy format:

#### Modern Format (Preferred)

```json
{
  "japanese": "日本語",
  "reading": "にほんご",
  "english": "Japanese language",
  "part_of_speech": "noun",
  "grammar_notes": "Common noun referring to the Japanese language",
  "additional_notes": "Used widely in linguistic contexts",
  "order": 1
}
```

#### Legacy Format (Supported but not recommended)

```json
{
  "text": "日本語",
  "translation": "Japanese language",
  "position": 1
}
```

| Property | Type | Description | Required |
|----------|------|-------------|----------|
| `japanese` or `text` | String | The Japanese word or phrase | Yes |
| `reading` | String | The furigana/reading for the word | No |
| `english` or `translation` | String | The English translation of the word | Yes |
| `part_of_speech` | String | The grammatical part of speech | No |
| `grammar_notes` | String | Grammatical notes for the word | No |
| `additional_notes` | String | Any additional usage notes | No |
| `order` or `position` | Number | The order of this word in the sentence | No (defaults to array position + 1) |

## Examples

### Complete Story Import Example

```json
{
  "title": "Japanese Stories for Beginners",
  "chapters": [
    {
      "title": "森の出会い - Meeting in the Forest",
      "order": 1,
      "status": "published",
      "panels": [
        {
          "order": 1,
          "image": "https://example.com/forest-panel1.jpg",
          "sentences": [
            {
              "japanese": "昨日、新しい本を買いました。",
              "english": "Yesterday, I bought a new book.",
              "notes": "Past tense sentence using ました form",
              "order": 1,
              "words": [
                {
                  "japanese": "昨日",
                  "reading": "きのう",
                  "english": "yesterday",
                  "part_of_speech": "noun",
                  "order": 1
                },
                {
                  "japanese": "新しい",
                  "reading": "あたらしい",
                  "english": "new",
                  "part_of_speech": "い-adjective",
                  "order": 2
                },
                {
                  "japanese": "本",
                  "reading": "ほん",
                  "english": "book",
                  "part_of_speech": "noun",
                  "order": 3
                },
                {
                  "japanese": "買いました",
                  "reading": "かいました",
                  "english": "bought",
                  "part_of_speech": "verb",
                  "grammar_notes": "Past tense of 買う (to buy)",
                  "order": 4
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Single Chapter Import Example

```json
{
  "title": "My First Chapter",
  "panels": [
    {
      "order": 1,
      "sentences": [
        {
          "japanese": "こんにちは、元気ですか？",
          "english": "Hello, how are you?",
          "words": [
            {
              "japanese": "こんにちは",
              "reading": "こんにちは",
              "english": "hello",
              "part_of_speech": "greeting"
            },
            {
              "japanese": "元気",
              "reading": "げんき",
              "english": "well/healthy",
              "part_of_speech": "na-adjective"
            },
            {
              "japanese": "ですか",
              "reading": "ですか",
              "english": "are?",
              "part_of_speech": "question marker",
              "grammar_notes": "Polite copula です + question particle か"
            }
          ]
        }
      ]
    }
  ]
}
```

### Multiple Chapters Import Example

```json
{
  "chapters": [
    {
      "title": "Chapter One",
      "panels": [
        {
          "order": 1,
          "sentences": [
            {
              "japanese": "これは最初の章です。",
              "english": "This is the first chapter.",
              "words": [
                {
                  "japanese": "これ",
                  "reading": "これ",
                  "english": "this",
                  "part_of_speech": "pronoun"
                },
                {
                  "japanese": "は",
                  "reading": "は",
                  "english": "(topic marker)",
                  "part_of_speech": "particle"
                },
                {
                  "japanese": "最初",
                  "reading": "さいしょ",
                  "english": "first",
                  "part_of_speech": "noun"
                },
                {
                  "japanese": "の",
                  "reading": "の",
                  "english": "(possessive)",
                  "part_of_speech": "particle"
                },
                {
                  "japanese": "章",
                  "reading": "しょう",
                  "english": "chapter",
                  "part_of_speech": "noun"
                },
                {
                  "japanese": "です",
                  "reading": "です",
                  "english": "is",
                  "part_of_speech": "copula"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "title": "Chapter Two",
      "panels": [
        {
          "order": 1,
          "sentences": [
            {
              "japanese": "これは二番目の章です。",
              "english": "This is the second chapter.",
              "words": [
                {
                  "japanese": "これ",
                  "reading": "これ",
                  "english": "this",
                  "part_of_speech": "pronoun"
                },
                {
                  "japanese": "は",
                  "reading": "は",
                  "english": "(topic marker)",
                  "part_of_speech": "particle"
                },
                {
                  "japanese": "二番目",
                  "reading": "にばんめ",
                  "english": "second",
                  "part_of_speech": "noun"
                },
                {
                  "japanese": "の",
                  "reading": "の",
                  "english": "(possessive)",
                  "part_of_speech": "particle"
                },
                {
                  "japanese": "章",
                  "reading": "しょう",
                  "english": "chapter",
                  "part_of_speech": "noun"
                },
                {
                  "japanese": "です",
                  "reading": "です",
                  "english": "is",
                  "part_of_speech": "copula"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

## Best Practices

1. **Always use the modern format** over the legacy format when creating new imports
2. **Provide furigana/readings** for all Japanese words to improve accessibility
3. **Include grammar notes** for complex structures to aid learning
4. **Maintain consistent order values** for chapters, panels, sentences, and words
5. **Validate your JSON** before importing to ensure no parsing errors
6. **Use proper UTF-8 encoding** to ensure Japanese characters are displayed correctly
7. **Keep file sizes reasonable** by optimizing image URLs or using external image hosting 