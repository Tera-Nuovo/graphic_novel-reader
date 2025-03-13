import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('API: Processing chapter service role import request');

    // Create a Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          persistSession: false,
        }
      }
    );
    
    // Get the JSON data from the request
    const { storyId, chapters, chapter } = await request.json();
    
    // Basic validation
    if (!storyId) {
      return NextResponse.json(
        { success: false, error: 'Missing storyId' },
        { status: 400 }
      );
    }
    
    // Handle both single chapter and array of chapters
    const chaptersToImport = chapters || (chapter ? [chapter] : null);
    
    if (!chaptersToImport || !Array.isArray(chaptersToImport) || chaptersToImport.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing chapter data or invalid format' },
        { status: 400 }
      );
    }
    
    console.log(`API: Importing ${chaptersToImport.length} chapter(s) with service role`);
    
    // Track the created chapter IDs
    const chapterIds: string[] = [];
    
    // Process each chapter in sequence
    for (let i = 0; i < chaptersToImport.length; i++) {
      const chapterData = chaptersToImport[i];
      
      // 1. Create chapter
      const { data: createdChapter, error: chapterError } = await supabase
        .from('chapters')
        .insert({
          story_id: storyId,
          title: chapterData.title,
          order: chapterData.order || (i + 1), // Use provided order or sequential based on position
          status: chapterData.status || 'draft'
        })
        .select()
        .single();
      
      if (chapterError || !createdChapter) {
        console.error('API: Chapter creation failed:', chapterError);
        return NextResponse.json(
          { success: false, error: chapterError?.message || 'Failed to create chapter' },
          { status: 500 }
        );
      }
      
      const chapterId = createdChapter.id;
      chapterIds.push(chapterId);
      
      // 2. Create panels for this chapter
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
        
        if (panelError || !panelData) {
          console.error('API: Panel creation failed:', panelError);
          return NextResponse.json(
            { success: false, error: `Failed to create panel: ${panelError?.message}` },
            { status: 500 }
          );
        }
        
        const panelId = panelData.id;
        
        // 3. Create sentences for this panel
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
          
          if (sentenceError || !sentenceData) {
            console.error('API: Sentence creation failed:', sentenceError);
            return NextResponse.json(
              { success: false, error: `Failed to create sentence: ${sentenceError?.message}` },
              { status: 500 }
            );
          }
          
          const sentenceId = sentenceData.id;
          
          // 4. Create words for this sentence
          if (sentence.words && sentence.words.length > 0) {
            // Convert words to the expected format, handling both old and new formats
            const wordsToInsert = sentence.words.map((word: any) => {
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
              console.error('API: Words creation failed:', wordsError);
              return NextResponse.json(
                { success: false, error: `Failed to create words: ${wordsError.message}` },
                { status: 500 }
              );
            }
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      chapterIds,
      message: `${chapterIds.length} chapter(s) imported successfully using service role`
    });
    
  } catch (error: any) {
    console.error('API: Error in chapter-import-with-service-role endpoint:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during import'
      },
      { status: 500 }
    );
  }
} 