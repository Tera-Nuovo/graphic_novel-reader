-- Seed data for the local Supabase instance

-- Insert sample stories
INSERT INTO stories (id, japanese_title, english_title, description, difficulty_level, tags, cover_image, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'こころ', 'The Heart', 'A classic Japanese novel exploring the complexities of human nature.', 'Intermediate', ARRAY['classic', 'literature'], 'https://placehold.co/600x400?text=Heart', 'published'),
  ('22222222-2222-2222-2222-222222222222', '雪国', 'Snow Country', 'A novel about a love affair between a Tokyo dilettante and a provincial geisha.', 'Advanced', ARRAY['classic', 'literature', 'romance'], 'https://placehold.co/600x400?text=Snow', 'published'),
  ('33333333-3333-3333-3333-333333333333', '君の名は', 'Your Name', 'A story about two strangers who mysteriously exchange bodies.', 'Beginner', ARRAY['modern', 'romance', 'fantasy'], 'https://placehold.co/600x400?text=YourName', 'published');

-- Insert sample chapters
INSERT INTO chapters (id, story_id, title, "order", status)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Chapter 1', 1, 'published'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Chapter 2', 2, 'published'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Chapter 1', 1, 'published'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '33333333-3333-3333-3333-333333333333', 'Chapter 1', 1, 'published');

-- Insert sample panels
INSERT INTO panels (id, chapter_id, image, "order")
VALUES 
  ('11aaaaaa-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://placehold.co/800x600?text=Panel1', 1),
  ('22aaaaaa-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'https://placehold.co/800x600?text=Panel2', 2),
  ('33aaaaaa-3333-3333-3333-333333333333', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'https://placehold.co/800x600?text=Panel3', 1),
  ('44aaaaaa-4444-4444-4444-444444444444', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'https://placehold.co/800x600?text=Panel4', 1),
  ('55aaaaaa-5555-5555-5555-555555555555', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'https://placehold.co/800x600?text=Panel5', 1);

-- Insert sample sentences
INSERT INTO sentences (id, panel_id, japanese, english, "order")
VALUES 
  ('a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '11aaaaaa-1111-1111-1111-111111111111', 'おはよう、元気？', 'Good morning, how are you?', 1),
  ('b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '11aaaaaa-1111-1111-1111-111111111111', '今日はいい天気ですね。', 'It''s nice weather today, isn''t it?', 2),
  ('c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '22aaaaaa-2222-2222-2222-222222222222', '彼は学校に行きました。', 'He went to school.', 1),
  ('d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4', '33aaaaaa-3333-3333-3333-333333333333', '私は本を読むのが好きです。', 'I like reading books.', 1),
  ('e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5', '44aaaaaa-4444-4444-4444-444444444444', '雪がたくさん降っています。', 'It''s snowing a lot.', 1),
  ('f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6', '55aaaaaa-5555-5555-5555-555555555555', '名前は何ですか？', 'What is your name?', 1);

-- Insert sample words
INSERT INTO words (id, sentence_id, japanese, reading, english, part_of_speech, "order")
VALUES 
  ('96e3d0e7-a9a7-4b31-9f78-4a3a5e33f4a1', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', 'おはよう', 'おはよう', 'good morning', 'greeting', 1),
  ('6d6e0fb2-81f5-4bb9-80b9-b8af0c8e1e2e', 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1', '元気', 'げんき', 'healthy/fine', 'adjective', 2),
  ('d47b0cf4-f6d9-4ba6-a7f4-d05a9734e1df', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '今日', 'きょう', 'today', 'noun', 1),
  ('4e5c4b7a-f7f3-4a4f-83d0-9c2b61e3eaa3', 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2', '天気', 'てんき', 'weather', 'noun', 2),
  ('8b6d7c2b-8b6a-4c3d-b5e5-7f2d4a9e1b3c', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '学校', 'がっこう', 'school', 'noun', 1),
  ('1c3e5b7a-9d2f-4e6b-8a0c-2d4f6e8a0c2e', 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3', '行きました', 'いきました', 'went', 'verb', 2);

-- Create a test user for local login
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    '9f2add35-9eef-42bd-b02c-6f29c4c8d505',
    'authenticated',
    'authenticated',
    'test@example.com',
    '$2a$10$Fs1C6EvtPkOlEg4cRcqGxOaA7BUVvxNVZmCmQfxOuXxcsPsN4nPUe',  -- Password is "password123"
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Test User", "role": "admin"}',
    NOW(),
    NOW(),
    '',
    ''
);

-- Insert user progress records
INSERT INTO user_progress (id, user_id, story_id, chapter_id, panel_id, last_accessed, completed)
VALUES 
  ('12345678-1234-1234-1234-123456789abc', '9f2add35-9eef-42bd-b02c-6f29c4c8d505', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11aaaaaa-1111-1111-1111-111111111111', NOW(), false); 