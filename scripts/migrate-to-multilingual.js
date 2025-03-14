#!/usr/bin/env node

/**
 * Migration script to convert a Japanese-English only database
 * to a multi-language structure.
 * 
 * This script:
 * 1. Identifies Japanese and English languages in the languages table
 * 2. Updates all existing stories to use the proper language references
 * 3. Renames japanese_title -> source_title, english_title -> target_title
 * 
 * Usage:
 * - Configure a .env.local file with Supabase credentials
 * - Run: node migrate-to-multilingual.js [--preview]
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Parse command line arguments
const args = process.argv.slice(2);
const previewMode = args.includes('--preview');

// Check if credentials are provided
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: Missing Supabase credentials. Please configure .env.local file.');
  console.error('Required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL: Supabase project URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY: Service role key with admin access');
  process.exit(1);
}

// Create a Supabase client with admin privileges
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Main migration function
 */
async function migrateToMultilingual() {
  try {
    console.log('Starting migration to multi-language structure...');
    
    if (previewMode) {
      console.log('PREVIEW MODE: No changes will be made to the database');
    }
    
    // Step 1: Check if the languages table exists
    const { data: languagesTable, error: schemaError } = await supabase
      .from('languages')
      .select('id')
      .limit(1);
    
    if (schemaError) {
      if (schemaError.code === '42P01') { // Table doesn't exist
        console.log('Languages table does not exist. Creating it...');
        if (!previewMode) {
          await createLanguagesTable();
        }
      } else {
        throw schemaError;
      }
    }
    
    // Step 2: Insert Japanese and English languages
    const languageIds = await ensureLanguages();
    
    // Step 3: Check if stories table has the new columns
    const { error: columnsError } = await supabase
      .from('stories')
      .select('source_language')
      .limit(1);
    
    if (columnsError && columnsError.code === '42703') { // Column doesn't exist
      console.log('Adding language columns to stories table...');
      if (!previewMode) {
        await addLanguageColumns();
      }
    }
    
    // Step 4: Migrate existing stories to use the language references
    console.log('Updating existing stories with language references...');
    if (!previewMode) {
      await updateStoriesWithLanguageReferences(languageIds);
    }
    
    console.log('Migration completed successfully!');
    
    if (previewMode) {
      console.log('\nPREVIEW MODE SUMMARY:');
      console.log('- Languages table would be created or verified');
      console.log('- Japanese and English languages would be added to languages table');
      console.log('- New language columns would be added to stories table');
      console.log('- Existing stories would be updated to use language references');
      console.log('\nRun without --preview to apply these changes');
    } else {
      console.log('\nNext Steps:');
      console.log('1. After verifying that the migration was successful, you can remove the old columns:');
      console.log('   ALTER TABLE stories DROP COLUMN japanese_title, DROP COLUMN english_title;');
      console.log('2. Update your application code to use the new columns');
      console.log('3. Test thoroughly with both existing and new content');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

/**
 * Create the languages table
 */
async function createLanguagesTable() {
  const { error } = await supabase.rpc('exec', { 
    query: `
      CREATE TABLE IF NOT EXISTS languages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        native_name TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  });
  
  if (error) throw error;
  console.log('Languages table created successfully');
}

/**
 * Ensure Japanese and English languages exist in the database
 */
async function ensureLanguages() {
  // Check if languages already exist
  const { data: existingLanguages, error } = await supabase
    .from('languages')
    .select('id, code')
    .in('code', ['ja', 'en']);
  
  if (error) throw error;
  
  const languageMap = {};
  existingLanguages?.forEach(lang => {
    languageMap[lang.code] = lang.id;
  });
  
  // Insert Japanese if not exists
  if (!languageMap['ja']) {
    console.log('Adding Japanese language to database...');
    if (!previewMode) {
      const { data, error } = await supabase
        .from('languages')
        .insert({
          code: 'ja',
          name: 'Japanese',
          native_name: '日本語'
        })
        .select();
      
      if (error) throw error;
      languageMap['ja'] = data[0].id;
    } else {
      languageMap['ja'] = 'preview-ja-id';
    }
  }
  
  // Insert English if not exists
  if (!languageMap['en']) {
    console.log('Adding English language to database...');
    if (!previewMode) {
      const { data, error } = await supabase
        .from('languages')
        .insert({
          code: 'en',
          name: 'English',
          native_name: 'English'
        })
        .select();
      
      if (error) throw error;
      languageMap['en'] = data[0].id;
    } else {
      languageMap['en'] = 'preview-en-id';
    }
  }
  
  // Add other common languages
  const otherLanguages = [
    { code: 'zh', name: 'Chinese', native_name: '中文' },
    { code: 'ko', name: 'Korean', native_name: '한국어' },
    { code: 'es', name: 'Spanish', native_name: 'Español' },
    { code: 'fr', name: 'French', native_name: 'Français' },
    { code: 'de', name: 'German', native_name: 'Deutsch' },
    { code: 'ru', name: 'Russian', native_name: 'Русский' }
  ];
  
  for (const lang of otherLanguages) {
    if (!languageMap[lang.code]) {
      console.log(`Adding ${lang.name} language to database...`);
      if (!previewMode) {
        const { data, error } = await supabase
          .from('languages')
          .insert(lang)
          .select();
        
        if (error) throw error;
        languageMap[lang.code] = data[0].id;
      } else {
        languageMap[lang.code] = `preview-${lang.code}-id`;
      }
    }
  }
  
  return languageMap;
}

/**
 * Add the new language columns to the stories table
 */
async function addLanguageColumns() {
  const { error } = await supabase.rpc('exec', { 
    query: `
      ALTER TABLE stories 
      ADD COLUMN IF NOT EXISTS source_language UUID REFERENCES languages(id),
      ADD COLUMN IF NOT EXISTS target_language UUID REFERENCES languages(id),
      ADD COLUMN IF NOT EXISTS source_title TEXT,
      ADD COLUMN IF NOT EXISTS target_title TEXT;
    `
  });
  
  if (error) throw error;
  console.log('Language columns added to stories table');
}

/**
 * Update existing stories to use language references
 */
async function updateStoriesWithLanguageReferences(languageIds) {
  // First, update source_title and target_title
  const { error: updateTitlesError } = await supabase.rpc('exec', { 
    query: `
      UPDATE stories
      SET 
        source_title = japanese_title,
        target_title = english_title
      WHERE 
        source_title IS NULL OR target_title IS NULL;
    `
  });
  
  if (updateTitlesError) throw updateTitlesError;
  
  // Then, set Japanese as source language and English as target language
  const { error: updateLanguagesError } = await supabase.rpc('exec', { 
    query: `
      UPDATE stories
      SET 
        source_language = '${languageIds['ja']}',
        target_language = '${languageIds['en']}'
      WHERE 
        source_language IS NULL OR target_language IS NULL;
    `
  });
  
  if (updateLanguagesError) throw updateLanguagesError;
  
  console.log('Existing stories updated with language references');
}

// Run the migration
migrateToMultilingual(); 