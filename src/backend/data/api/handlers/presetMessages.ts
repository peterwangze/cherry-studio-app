import type { PresetMessageService } from '@/backend/data/services/PresetMessageService';
import type { PresetMessageSchemas } from '@/shared/data/api/schemas/presetMessages';
import type { HandlersFor } from '@/shared/data/api/types';

export function createPresetMessageHandlers(
  service: PresetMessageService,
): HandlersFor<PresetMessageSchemas> {
  return {
    '/preset-messages': {
      GET: () => service.list(),
      POST: ({ body }) => service.create(body),
    },
    '/preset-messages/:id': {
      DELETE: ({ params }) => service.delete(params.id),
      GET: ({ params }) => service.getById(params.id),
      PATCH: ({ body, params }) => service.update(params.id, body),
    },
  };
}
