export type Story = {
  id: string;
  japanese_title: string;
  english_title: string;
  description: string | null;
  difficulty_level: string;
  tags: string[] | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published';
};

export type Chapter = {
  id: string;
  story_id: string;
  title: string;
  order: number;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published';
};

export type Panel = {
  id: string;
  chapter_id: string;
  image: string | null;
  order: number;
  created_at: string;
  updated_at: string;
};

export type Sentence = {
  id: string;
  panel_id: string;
  japanese: string;
  english: string;
  notes: string | null;
  order: number;
  created_at: string;
  updated_at: string;
};

export type Word = {
  id: string;
  sentence_id: string;
  japanese: string;
  reading: string;
  english: string;
  part_of_speech: string | null;
  grammar_notes: string | null;
  additional_notes: string | null;
  order: number;
  created_at: string;
  updated_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  story_id: string;
  chapter_id: string | null;
  panel_id: string | null;
  last_accessed: string;
  completed: boolean;
}; 