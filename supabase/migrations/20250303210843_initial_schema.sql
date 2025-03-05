-- Create tables for the graphic novel reader

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stories table
CREATE TABLE IF NOT EXISTS stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  japanese_title TEXT NOT NULL,
  english_title TEXT NOT NULL,
  description TEXT,
  difficulty_level TEXT NOT NULL,
  tags TEXT[],
  cover_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft'
);

-- Create chapters table
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'draft',
  UNIQUE(story_id, "order")
);

-- Create panels table
CREATE TABLE IF NOT EXISTS panels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  image TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(chapter_id, "order")
);

-- Create sentences table
CREATE TABLE IF NOT EXISTS sentences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  panel_id UUID NOT NULL REFERENCES panels(id) ON DELETE CASCADE,
  japanese TEXT NOT NULL,
  english TEXT NOT NULL,
  notes TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(panel_id, "order")
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sentence_id UUID NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
  japanese TEXT NOT NULL,
  reading TEXT NOT NULL,
  english TEXT NOT NULL,
  part_of_speech TEXT,
  grammar_notes TEXT,
  additional_notes TEXT,
  "order" INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sentence_id, "order")
);

-- Create users progress table
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  panel_id UUID REFERENCES panels(id) ON DELETE CASCADE,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, story_id)
);

-- Create RLS policies
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentences ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to stories and chapters
CREATE POLICY "Public stories are viewable by everyone" 
ON stories FOR SELECT 
USING (status = 'published');

CREATE POLICY "Public chapters are viewable by everyone" 
ON chapters FOR SELECT 
USING (status = 'published');

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view all panels" 
ON panels FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all sentences" 
ON sentences FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view all words" 
ON words FOR SELECT 
TO authenticated
USING (true);

-- Create policies for user progress
CREATE POLICY "Users can manage their own progress" 
ON user_progress FOR ALL 
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create policies for admin users (assuming a role-based system)
CREATE POLICY "Admins can manage all stories" 
ON stories FOR ALL 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.users.id = auth.uid() AND auth.users.role = 'admin'
));

-- Add similar admin policies for other tables 