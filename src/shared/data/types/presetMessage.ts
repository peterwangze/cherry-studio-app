import * as z from 'zod';

/** A reusable chat message the user keeps at hand for quick insertion or sending. */
export const PresetMessageSchema = z.strictObject({
  content: z.string().min(1),
  createdAt: z.iso.datetime(),
  id: z.string(),
  title: z.string().min(1),
  updatedAt: z.iso.datetime(),
});

export type PresetMessage = z.infer<typeof PresetMessageSchema>;
