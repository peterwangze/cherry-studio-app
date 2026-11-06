import { randomUUID as mockRandomUUID } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { installTestHost, uninstallTestHost } from '@/backend/core/application/testHost';
import type { DbService } from '@/backend/data/db/DbService';

import { PresetMessageService } from '../PresetMessageService';
import { createTestDb } from './_testDb';

jest.mock('uuid', () => ({ v4: mockRandomUUID, v7: mockRandomUUID }));

describe('PresetMessageService', () => {
  let sqlite: DatabaseSync;
  let dbService: DbService;
  let service: PresetMessageService;

  beforeEach(async () => {
    sqlite = new DatabaseSync(':memory:');
    ({ dbService } = createTestDb(sqlite));
    // Data services resolve `DbService` from `application`, so the fake is
    // installed as a host override instead of being passed to constructors.
    await installTestHost({ DbService: dbService });
    service = new PresetMessageService();
  });

  afterEach(async () => {
    await uninstallTestHost();
    sqlite.close();
  });

  it('creates a preset message with trimmed fields', async () => {
    const message = await service.create({ content: ' Hello there! ', title: ' Greeting ' });

    expect(message).toMatchObject({ content: 'Hello there!', title: 'Greeting' });
    expect(message.createdAt).toEqual(expect.any(String));
    expect(message.updatedAt).toEqual(expect.any(String));
    await expect(service.getById(message.id)).resolves.toEqual(message);
  });

  it('rejects blank titles and content the contract does not own', async () => {
    await expect(service.create({ content: 'Hello', title: '   ' })).rejects.toBeDefined();
    await expect(service.create({ content: '  ', title: 'Greeting' })).rejects.toBeDefined();
    await expect(service.update('missing', { color: 'red' } as never)).rejects.toBeDefined();
  });

  it('lists in creation order', async () => {
    const first = await service.create({ content: 'first', title: 'First' });
    const second = await service.create({ content: 'second', title: 'Second' });

    const list = await service.list();
    expect(list.items.map((item) => item.id)).toEqual([first.id, second.id]);
    expect(list.total).toBe(2);
  });

  it('updates only the fields the patch carries', async () => {
    const message = await service.create({ content: 'Hello', title: 'Greeting' });

    const updated = await service.update(message.id, { title: 'Hi' });
    expect(updated).toMatchObject({ content: 'Hello', title: 'Hi' });

    const untouched = await service.update(message.id, {});
    expect(untouched).toEqual(updated);

    await expect(service.update(message.id, { title: '  ' })).rejects.toBeDefined();
  });

  it('deletes and reports missing rows', async () => {
    const message = await service.create({ content: 'Hello', title: 'Greeting' });
    await service.delete(message.id);
    await expect(service.getById(message.id)).rejects.toBeDefined();
    await expect(service.delete(message.id)).rejects.toBeDefined();
    await expect((await service.list()).total).toBe(0);
  });
});
