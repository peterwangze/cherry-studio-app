import * as z from 'zod';

import type { PresetMessage } from '@/shared/data/types/presetMessage';

export const CreatePresetMessageSchema = z.strictObject({
  content: z.string().min(1),
  title: z.string().min(1),
});
export type CreatePresetMessageDto = z.infer<typeof CreatePresetMessageSchema>;

export const UpdatePresetMessageSchema = z.strictObject({
  content: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
});
export type UpdatePresetMessageDto = z.infer<typeof UpdatePresetMessageSchema>;

export type PresetMessageSchemas = {
  '/preset-messages': {
    GET: {
      response: { items: PresetMessage[]; total: number };
    };
    POST: {
      body: CreatePresetMessageDto;
      response: PresetMessage;
    };
  };
  '/preset-messages/:id': {
    DELETE: {
      params: { id: string };
      response: undefined;
    };
    GET: {
      params: { id: string };
      response: PresetMessage;
    };
    PATCH: {
      body: UpdatePresetMessageDto;
      params: { id: string };
      response: PresetMessage;
    };
  };
};
