import { pgTable, text, uuid, boolean, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull(),
  isPro: boolean('is_pro').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});


export const collections = pgTable('collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isShared: boolean('is_shared').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

export const knowledgeItems = pgTable('knowledge_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  collectionId: uuid('collection_id').notNull(),
  type: text('type').notNull(), // 'text' | 'pdf' | 'link'
  title: text('title').notNull(),
  url: text('url'), // for links
  createdAt: timestamp('created_at').defaultNow()
});


// Useful raw SQL trigger to auto-update updatedAt (optional for POC)
// export const touchUpdatedAt = sql`
// DO $$
// BEGIN
//   IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'collections_touch_updated_at') THEN
//     CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
//     BEGIN
//       NEW.updated_at = NOW();
//       RETURN NEW;
//     END;
//     $$ LANGUAGE plpgsql;

//     CREATE TRIGGER collections_touch_updated_at
//       BEFORE UPDATE ON collections
//       FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
//   END IF;
// END $$;
// `;