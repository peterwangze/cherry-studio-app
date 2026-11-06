import { useComposerActions as useUiComposerActions } from '@cherrystudio/ui/components';
import { useEffect } from 'react';

import { useComposerState } from '@/frontend/components/Composer';

export type ComposerDirectSendRequest = {
  /** Distinguishes two requests that would carry the same text. */
  id: number;
  /** The draft the request may send; anything else arrived first and retires it. */
  text: string;
};

/**
 * Sends through the composer's own protocol once the requested draft has landed.
 *
 * Rendered inside the composer tree, where the send action lives; the draft is
 * compared so a user typing in the same frame as the request can never send
 * text the request does not own.
 */
export function ComposerDirectSend({
  onConsumed,
  request,
}: {
  onConsumed(): void;
  request: ComposerDirectSendRequest | null;
}) {
  const { send } = useUiComposerActions('ComposerDirectSend');
  const { draft } = useComposerState();

  useEffect(() => {
    if (!request || draft !== request.text) return;
    onConsumed();
    send();
  }, [draft, onConsumed, request, send]);

  return null;
}
