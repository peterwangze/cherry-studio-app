import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createUpdateTimestamps, uuidPrimaryKey } from './_columnHelpers';

/** User-authored messages kept for quick insertion into the chat composer. */
export const presetMessageTable = sqliteTable('preset_message', {
  id: uuidPrimaryKey(),
  title: text().notNull(),
  content: text().notNull(),
  ...createUpdateTimestamps,
});

export type InsertPresetMessageRow = typeof presetMessageTable.$inferInsert;
export type PresetMessageRow = typeof presetMessageTable.$inferSelect;
