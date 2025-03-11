import { supabase } from './supabase';
import { Story, Chapter, Panel, Sentence, Word, UserProgress } from './types';

// Stories
export async function getPublishedStories() {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data as Story[];
}

export async function getStoryById(id: string) {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Story;
}

export async function createStory(story: Omit<Story, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('stories')
    .insert(story)
    .select()
    .single();
  
  if (error) throw error;
  return data as Story;
}

export async function updateStory(id: string, updates: Partial<Omit<Story, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('stories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Story;
}

export async function deleteStory(id: string) {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Chapters
export async function getChaptersByStoryId(storyId: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('story_id', storyId)
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data as Chapter[];
}

export async function getPublishedChaptersByStoryId(storyId: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('story_id', storyId)
    .eq('status', 'published')
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data as Chapter[];
}

export async function getChapterById(id: string) {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Chapter;
}

export async function createChapter(chapter: Omit<Chapter, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('chapters')
    .insert(chapter)
    .select()
    .single();
  
  if (error) throw error;
  return data as Chapter;
}

export async function updateChapter(id: string, updates: Partial<Omit<Chapter, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('chapters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Chapter;
}

export async function deleteChapter(id: string) {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Panels
export async function getPanelsByChapterId(chapterId: string) {
  const { data, error } = await supabase
    .from('panels')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data as Panel[];
}

export async function getPanelById(id: string) {
  const { data, error } = await supabase
    .from('panels')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Panel;
}

export async function createPanel(panel: Omit<Panel, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('panels')
    .insert(panel)
    .select()
    .single();
  
  if (error) throw error;
  return data as Panel;
}

export async function updatePanel(id: string, updates: Partial<Omit<Panel, 'id' | 'created_at' | 'updated_at'>>) {
  const { data, error } = await supabase
    .from('panels')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Panel;
}

export async function deletePanel(id: string) {
  const { error } = await supabase
    .from('panels')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  return true;
}

// Sentences
export async function getSentencesByPanelId(panelId: string) {
  const { data, error } = await supabase
    .from('sentences')
    .select('*')
    .eq('panel_id', panelId)
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data as Sentence[];
}

// Words
export async function getWordsBySentenceId(sentenceId: string) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('sentence_id', sentenceId)
    .order('order', { ascending: true });
  
  if (error) throw error;
  return data as Word[];
}

// User Progress
export async function getUserProgress(userId: string, storyId: string) {
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows returned"
  return data as UserProgress | null;
}

export async function updateUserProgress(progress: Omit<UserProgress, 'id' | 'last_accessed'>) {
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      { 
        ...progress, 
        last_accessed: new Date().toISOString() 
      },
      { 
        onConflict: 'user_id,story_id',
        ignoreDuplicates: false
      }
    )
    .select()
    .single();
  
  if (error) throw error;
  return data as UserProgress;
}

// Save all panels, sentences, and words for a chapter
export async function savePanelsData(chapterId: string, panels: any[]) {
  try {
    // Convert panels data to a format suitable for PostgreSQL
    const panelsData = panels.map((panel, i) => ({
      chapter_id: chapterId,
      image: panel.image,
      order: i + 1,
      sentences: panel.sentences.map((sentence: any, j: number) => ({
        japanese: sentence.japanese,
        english: sentence.english || '',
        notes: sentence.notes || '',
        order: j + 1,
        words: sentence.words.map((word: any, k: number) => ({
          japanese: word.japanese,
          reading: word.reading || '',
          english: word.english || '',
          part_of_speech: word.partOfSpeech || null,
          grammar_notes: word.grammarNotes || null,
          additional_notes: word.additionalNotes || null,
          order: k + 1,
        }))
      }))
    }));

    // Call a custom PostgreSQL function to handle the transaction
    // First, we need to create the function if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION save_panels_data(
        p_chapter_id TEXT,
        p_panels_data JSONB
      ) RETURNS BOOLEAN AS $$
      DECLARE
        panel_record RECORD;
        sentence_record RECORD;
        word_record RECORD;
        new_panel_id UUID;
        new_sentence_id UUID;
      BEGIN
        -- Delete existing panels (will cascade to sentences and words)
        DELETE FROM panels WHERE chapter_id = p_chapter_id::UUID;
        
        -- Insert new panels and related data
        FOR panel_record IN SELECT * FROM jsonb_array_elements(p_panels_data) WITH ORDINALITY AS panels(data, idx)
        LOOP
          -- Insert panel
          INSERT INTO panels (
            chapter_id, 
            image, 
            "order"
          ) VALUES (
            p_chapter_id::UUID,
            (panel_record.data->>'image')::TEXT,
            (panel_record.data->>'order')::INTEGER
          ) RETURNING id INTO new_panel_id;
          
          -- Insert sentences for this panel
          FOR sentence_record IN SELECT * FROM jsonb_array_elements(panel_record.data->'sentences') WITH ORDINALITY AS sentences(data, idx)
          LOOP
            -- Insert sentence
            INSERT INTO sentences (
              panel_id,
              japanese,
              english,
              notes,
              "order"
            ) VALUES (
              new_panel_id,
              (sentence_record.data->>'japanese')::TEXT,
              (sentence_record.data->>'english')::TEXT,
              (sentence_record.data->>'notes')::TEXT,
              (sentence_record.data->>'order')::INTEGER
            ) RETURNING id INTO new_sentence_id;
            
            -- Insert words for this sentence
            FOR word_record IN SELECT * FROM jsonb_array_elements(sentence_record.data->'words') WITH ORDINALITY AS words(data, idx)
            LOOP
              -- Insert word
              INSERT INTO words (
                sentence_id,
                japanese,
                reading,
                english,
                part_of_speech,
                grammar_notes,
                additional_notes,
                "order"
              ) VALUES (
                new_sentence_id,
                (word_record.data->>'japanese')::TEXT,
                (word_record.data->>'reading')::TEXT,
                (word_record.data->>'english')::TEXT,
                (word_record.data->>'part_of_speech')::TEXT,
                (word_record.data->>'grammar_notes')::TEXT,
                (word_record.data->>'additional_notes')::TEXT,
                (word_record.data->>'order')::INTEGER
              );
            END LOOP;
          END LOOP;
        END LOOP;
        
        RETURN TRUE;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Create the function
    const { error: createFunctionError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSql 
    });

    // If the exec_sql function doesn't exist, we'll need an alternative approach
    if (createFunctionError) {
      console.log('Error creating function, falling back to direct inserts:', createFunctionError);
      
      // Delete existing panels (will cascade to sentences and words)
      const { error: deleteError } = await supabase
        .from('panels')
        .delete()
        .eq('chapter_id', chapterId);
      
      if (deleteError) throw deleteError;
      
      // Insert panels one by one
      for (const panelData of panelsData) {
        // Insert panel
        const { data: panel, error: panelError } = await supabase
          .from('panels')
          .insert({
            chapter_id: chapterId,
            image: panelData.image,
            order: panelData.order
          })
          .select()
          .single();
        
        if (panelError) throw panelError;
        
        // Insert sentences for this panel
        for (const sentenceData of panelData.sentences) {
          const { data: sentence, error: sentenceError } = await supabase
            .from('sentences')
            .insert({
              panel_id: panel.id,
              japanese: sentenceData.japanese,
              english: sentenceData.english,
              notes: sentenceData.notes,
              order: sentenceData.order
            })
            .select()
            .single();
          
          if (sentenceError) throw sentenceError;
          
          // Insert words for this sentence
          for (const wordData of sentenceData.words) {
            const { error: wordError } = await supabase
              .from('words')
              .insert({
                sentence_id: sentence.id,
                japanese: wordData.japanese,
                reading: wordData.reading,
                english: wordData.english,
                part_of_speech: wordData.part_of_speech,
                grammar_notes: wordData.grammar_notes,
                additional_notes: wordData.additional_notes,
                order: wordData.order
              });
            
            if (wordError) throw wordError;
          }
        }
      }
      
      return true;
    }
    
    // Call the function with our data
    const { data, error } = await supabase.rpc('save_panels_data', {
      p_chapter_id: chapterId,
      p_panels_data: JSON.stringify(panelsData)
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving panels data:', error);
    throw error;
  }
}

// Get complete story data including chapters, panels, sentences, and words
export async function getCompleteStoryData(storyId: string) {
  try {
    // Get story data
    const story = await getStoryById(storyId);
    
    // Get chapters for this story
    const chapters = await getChaptersByStoryId(storyId);
    
    // For each chapter, get panels, sentences, and words
    const chaptersWithPanels = await Promise.all(
      chapters.map(async (chapter) => {
        // Get panels for this chapter
        const panels = await getPanelsByChapterId(chapter.id);
        
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
                  ...sentence,
                  words
                };
              })
            );
            
            return {
              ...panel,
              sentences: sentencesWithWords
            };
          })
        );
        
        return {
          ...chapter,
          panels: panelsWithSentences
        };
      })
    );
    
    return {
      ...story,
      chapters: chaptersWithPanels
    };
  } catch (error) {
    console.error("Error getting complete story data:", error);
    throw error;
  }
} 