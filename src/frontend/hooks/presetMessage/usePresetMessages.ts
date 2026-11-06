import { useQueryClient } from '@tanstack/react-query';

import { useMutation, useQuery } from '@/frontend/data';
import {
  dataApiCollectionFilters,
  removeItemsFromCountedList,
  restoreQuerySnapshot,
  updateQueriesOptimistically,
} from '@/frontend/data/utils/optimisticQueryUpdate';
import type {
  CreatePresetMessageDto,
  UpdatePresetMessageDto,
} from '@/shared/data/api/schemas/presetMessages';
import type { PresetMessage } from '@/shared/data/types/presetMessage';

const EMPTY_PRESET_MESSAGES: readonly PresetMessage[] = Object.freeze([]);
type PresetMessageListData = { items: PresetMessage[]; total: number };

export function usePresetMessagesApi() {
  const query = useQuery('/preset-messages');

  return {
    error: query.error,
    isLoading: query.isLoading,
    presetMessages: query.data?.items ?? EMPTY_PRESET_MESSAGES,
    refetch: query.refetch,
    total: query.data?.total ?? 0,
  };
}

export function usePresetMessageApiById(id: string | undefined) {
  const query = useQuery('/preset-messages/:id', {
    enabled: Boolean(id),
    params: { id: id ?? '' },
  });

  return {
    error: query.error,
    isLoading: query.isLoading,
    presetMessage: query.data,
    refetch: query.refetch,
  };
}

export function usePresetMessageMutations() {
  const queryClient = useQueryClient();
  const createMutation = useMutation('POST', '/preset-messages', {
    refresh: ['/preset-messages'],
  });
  const updateMutation = useMutation('PATCH', '/preset-messages/:id', {
    refresh: ['/preset-messages'],
  });
  const deleteMutation = useMutation('DELETE', '/preset-messages/:id', {
    onMutate: async (variables) => {
      const messageId = variables?.params.id;
      const messageIds = new Set(messageId ? [messageId] : []);
      const list = await updateQueriesOptimistically<PresetMessageListData>(
        queryClient,
        dataApiCollectionFilters('/preset-messages'),
        (current) => removeItemsFromCountedList(current, messageIds),
      );

      return { list };
    },
    onError: (_error, _variables, context) => {
      restoreQuerySnapshot(queryClient, context?.list);
    },
  });

  return {
    createPresetMessage: (dto: CreatePresetMessageDto) => createMutation.trigger({ body: dto }),
    deletePresetMessage: async (id: string) => {
      await deleteMutation.trigger({ params: { id } });
    },
    isCreating: createMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    updatePresetMessage: (id: string, patch: UpdatePresetMessageDto) =>
      updateMutation.trigger({ body: patch, params: { id } }),
  };
}
