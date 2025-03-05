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