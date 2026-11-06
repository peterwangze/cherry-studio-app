/** CRUD for user-authored preset messages reused in the chat composer. */

import { asc, eq } from 'drizzle-orm';

import { application } from '@/backend/core/application/Application';
import type { Database } from '@/backend/data/db/DbService';
import { presetMessageTable, type PresetMessageRow } from '@/backend/data/db/schemas';
import { DataApiErrorFactory } from '@/shared/data/api/errors';
import {
  CreatePresetMessageSchema,
  type CreatePresetMessageDto,
  UpdatePresetMessageSchema,
  type UpdatePresetMessageDto,
} from '@/shared/data/api/schemas/presetMessages';
import type { OffsetPaginationResponse } from '@/shared/data/api/types';
import { PresetMessageSchema, type PresetMessage } from '@/shared/data/types/presetMessage';

import { timestampToISO } from './utils/rowMappers';

function rowToPresetMessage(row: PresetMessageRow): PresetMessage {
  return PresetMessageSchema.parse({
    content: row.content,
    createdAt: timestampToISO(row.createdAt),
    id: row.id,
    title: row.title,
    updatedAt: timestampToISO(row.updatedAt),
  });
}

export class PresetMessageService {
  /**
   * Resolved per call rather than injected once, so the instance holds no
   * reference to a particular host generation and a replaced host cannot leave
   * this singleton writing to a closed connection.
   */
  private get dbService() {
    return application.get('DbService');
  }

  private get db(): Database {
    return this.dbService.getDb();
  }

  async getById(id: string): Promise<PresetMessage> {
    const [row] = await this.db
      .select()
      .from(presetMessageTable)
      .where(eq(presetMessageTable.id, id))
      .limit(1);

    if (!row) {
      throw DataApiErrorFactory.notFound('PresetMessage', id);
    }

    return rowToPresetMessage(row);
  }

  /** Creation order is the list order; reordering is a later feature's to add. */
  async list(): Promise<OffsetPaginationResponse<PresetMessage>> {
    const rows = await this.db
      .select()
      .from(presetMessageTable)
      .orderBy(asc(presetMessageTable.createdAt), asc(presetMessageTable.id));

    return {
      items: rows.map(rowToPresetMessage),
      page: 1,
      total: rows.length,
    };
  }

  async create(dto: CreatePresetMessageDto): Promise<PresetMessage> {
    const parsed = CreatePresetMessageSchema.parse(dto);
    const title = parsed.title.trim();
    const content = parsed.content.trim();
    if (!title || !content) {
      throw DataApiErrorFactory.validation({
        title: title ? [] : ['A preset message needs a title'],
        content: content ? [] : ['A preset message needs content'],
      });
    }

    const [row] = await this.dbService.withWriteTx((tx) =>
      tx.insert(presetMessageTable).values({ content, title }).returning(),
    );

    return rowToPresetMessage(row);
  }

  async update(id: string, dto: UpdatePresetMessageDto): Promise<PresetMessage> {
    const parsed = UpdatePresetMessageSchema.parse(dto);
    const title = parsed.title?.trim();
    const content = parsed.content?.trim();
    if (title !== undefined && !title) {
      throw DataApiErrorFactory.validation({ title: ['A preset message needs a title'] });
    }
    if (content !== undefined && !content) {
      throw DataApiErrorFactory.validation({ content: ['A preset message needs content'] });
    }

    const updates = {
      ...(title !== undefined && { title }),
      ...(content !== undefined && { content }),
    };
    if (Object.keys(updates).length === 0) {
      return this.getById(id);
    }

    const [row] = await this.dbService.withWriteTx((tx) =>
      tx.update(presetMessageTable).set(updates).where(eq(presetMessageTable.id, id)).returning(),
    );

    if (!row) {
      throw DataApiErrorFactory.notFound('PresetMessage', id);
    }

    return rowToPresetMessage(row);
  }

  async delete(id: string): Promise<void> {
    const rows = await this.dbService.withWriteTx((tx) =>
      tx
        .delete(presetMessageTable)
        .where(eq(presetMessageTable.id, id))
        .returning({ id: presetMessageTable.id }),
    );

    if (rows.length === 0) {
      throw DataApiErrorFactory.notFound('PresetMessage', id);
    }
  }
}

export const presetMessageService = new PresetMessageService();
