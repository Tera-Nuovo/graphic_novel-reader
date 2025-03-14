# Graphic Novel Reader Development Scripts

This directory contains utility scripts for the Graphic Novel Reader application, focusing on database management, seeding, and migration.

## Local Database Setup

### Starting the Local PostgreSQL Database

To run a local PostgreSQL database for development:

```bash
cd local-db
./start.sh
```

This starts a PostgreSQL instance running at:
- **Host**: localhost
- **Port**: 5433
- **Username**: postgres
- **Password**: postgres
- **Database**: postgres

To stop the database:

```bash
cd local-db
./stop.sh
```

### Seeding the Database with Sample Data

To populate the local database with sample multi-language stories:

```bash
node seed-local-db.js
```

This script will:
1. Load language definitions (Japanese, English, Chinese, etc.)
2. Create sample stories in various language pairs
3. Add sample chapters, panels, sentences, and words

## Migration to Multi-Language Support

### Preparation

Before migrating a production database:

1. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. Compare the local schema with the remote database:
   ```bash
   node compare-schemas.js
   ```
   This will identify differences between your local database and the remote Supabase database.

### Migration Process

To migrate an existing Japanese-English specific database to the new multi-language format:

1. First run a preview to see what will be changed:
   ```bash
   node migrate-to-multilingual.js --preview
   ```

2. When ready, run the actual migration:
   ```bash
   node migrate-to-multilingual.js
   ```

The migration script will:
1. Create a `languages` table if it doesn't exist
2. Add Japanese, English, and other supported languages to this table
3. Add new columns to the `stories` table: `source_language`, `target_language`, `source_title`, `target_title`
4. Convert all existing Japanese-English stories to use the new structure

### Post-Migration

After verifying the migration was successful, you can remove the old columns:

```sql
ALTER TABLE stories DROP COLUMN japanese_title, DROP COLUMN english_title;
```

## Script Reference

| Script | Description |
|--------|-------------|
| `seed-local-db.js` | Seeds the local database with sample multi-language data |
| `migrate-to-multilingual.js` | Migrates an existing database to the multi-language structure |
| `compare-schemas.js` | Compares local and remote database schemas to help with migration planning |
| `local-db/start.sh` | Starts the local PostgreSQL database |
| `local-db/stop.sh` | Stops the local PostgreSQL database |

## Database Schema

The multi-language database uses the following tables:

- **languages**: Stores supported languages (Japanese, English, etc.)
- **stories**: Contains stories with source and target language references
- **chapters**: Story chapters
- **panels**: Visual panels within chapters
- **sentences**: Text sentences associated with panels
- **words**: Individual words for detailed language learning

See the SQL schema files in `local-db/init/` for the complete structure. 