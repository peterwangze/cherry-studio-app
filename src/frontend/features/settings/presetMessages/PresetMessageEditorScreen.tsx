import EllipsisIcon from '@cherrystudio/app-icons/icons/ellipsis';
import {
  Button,
  ContentState,
  Input,
  TextField,
  useAlert,
  useToast,
} from '@cherrystudio/ui/components';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useHeaderHeight } from 'expo-router/react-navigation';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RouteHeader, type HeaderToolbarAction } from '@/frontend/appShell/header';
import {
  usePresetMessageApiById,
  usePresetMessageMutations,
} from '@/frontend/hooks/presetMessage/usePresetMessages';
import { loggerService } from '@/shared/core/logger/LoggerService';
import { DataApiError, ErrorCode } from '@/shared/data/api/errors';
import type { PresetMessage } from '@/shared/data/types/presetMessage';

const logger = loggerService.withContext('PresetMessageEditorScreen');

const NEW_PRESET_MESSAGE_SENTINEL = 'new';

type PresetMessageFormState = {
  content: string;
  title: string;
};

/** Create or edit one preset message; `new` in the route starts an unsaved one. */
export function PresetMessageEditorScreen() {
  const { t } = useTranslation();
  const { messageId: rawMessageId } = useLocalSearchParams<{ messageId?: string }>();

  const isCreating = !rawMessageId || rawMessageId === NEW_PRESET_MESSAGE_SENTINEL;
  const messageId = isCreating ? undefined : rawMessageId;
  const { error, isLoading, presetMessage, refetch } = usePresetMessageApiById(messageId);

  if (!isCreating && isLoading) {
    return (
      <EditorFrame title={t('settings.presetMessages.edit')}>
        <ContentState.Loading title={t('settings.presetMessages.loading')} />
      </EditorFrame>
    );
  }

  if (!isCreating && error) {
    const isNotFound = error instanceof DataApiError && error.code === ErrorCode.NOT_FOUND;
    return (
      <EditorFrame title={t('settings.presetMessages.edit')}>
        {isNotFound ? (
          <ContentState.Empty title={t('settings.presetMessages.notFound')} />
        ) : (
          <ContentState.Error
            description={error.message}
            primaryAction={{
              children: t('common.retry'),
              onPress: () => void refetch(),
            }}
            title={t('settings.presetMessages.loadFailed')}
          />
        )}
      </EditorFrame>
    );
  }

  if (!isCreating && !presetMessage) {
    return (
      <EditorFrame title={t('settings.presetMessages.edit')}>
        <ContentState.Empty title={t('settings.presetMessages.notFound')} />
      </EditorFrame>
    );
  }

  return (
    <PresetMessageEditor
      key={messageId ?? NEW_PRESET_MESSAGE_SENTINEL}
      message={presetMessage}
      messageId={messageId}
    />
  );
}

function PresetMessageEditor({
  message,
  messageId,
}: {
  message?: PresetMessage;
  messageId?: string;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const { alert } = useAlert();
  const {
    createPresetMessage,
    deletePresetMessage,
    isCreating,
    isDeleting,
    isUpdating,
    updatePresetMessage,
  } = usePresetMessageMutations();

  const [form, setForm] = useState<PresetMessageFormState>(() => ({
    content: message?.content ?? '',
    title: message?.title ?? '',
  }));
  const isDirty =
    form.title !== (message?.title ?? '') || form.content !== (message?.content ?? '');
  const isBusy = isCreating || isUpdating;

  const updateField = useCallback(
    <TKey extends keyof PresetMessageFormState>(key: TKey, value: PresetMessageFormState[TKey]) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const handleSave = useCallback(async () => {
    const title = form.title.trim();
    const content = form.content.trim();
    if (!title) {
      alert.show({ title: t('settings.presetMessages.validation.titleRequired') });
      return;
    }
    if (!content) {
      alert.show({ title: t('settings.presetMessages.validation.contentRequired') });
      return;
    }

    try {
      if (messageId) {
        await updatePresetMessage(messageId, { content, title });
      } else {
        await createPresetMessage({ content, title });
      }
      router.back();
    } catch (error) {
      logger.error('Failed to save preset message', error as Error);
      toast.show({ label: t('settings.presetMessages.toast.saveFailed'), variant: 'danger' });
    }
  }, [
    alert,
    createPresetMessage,
    form.content,
    form.title,
    messageId,
    router,
    t,
    toast,
    updatePresetMessage,
  ]);

  const handleDelete = useCallback(() => {
    if (!messageId) return;
    const deletion = deletePresetMessage(messageId);
    router.back();
    void deletion
      .then(() => {
        toast.show({ label: t('settings.presetMessages.toast.deleted'), variant: 'success' });
      })
      .catch((error: unknown) => {
        logger.error('Failed to delete preset message', error as Error);
        toast.show({ label: t('settings.presetMessages.toast.deleteFailed'), variant: 'danger' });
      });
  }, [deletePresetMessage, messageId, router, t, toast]);

  const rightActions = useMemo<HeaderToolbarAction[] | undefined>(
    () =>
      messageId
        ? [
            {
              accessibilityLabel: t('common.more'),
              disabled: isBusy || isDeleting,
              icon: EllipsisIcon,
              items: [
                {
                  destructive: true,
                  id: 'preset-message-delete',
                  label: t('common.delete'),
                  onPress: () =>
                    alert.confirm({
                      confirmLabel: t('common.delete'),
                      description: t('settings.presetMessages.delete.message', {
                        name: message?.title ?? '',
                      }),
                      onConfirm: handleDelete,
                      role: 'destructive',
                      title: t('settings.presetMessages.delete.title'),
                    }),
                },
              ],
              key: 'preset-message-actions',
              nativeIcon: require('@/assets/header-toolbar/ellipsis.png'),
              testID: 'preset-message-actions',
              type: 'menu',
            },
          ]
        : undefined,
    [alert, handleDelete, isBusy, isDeleting, message?.title, messageId, t],
  );

  return (
    <EditorFrame
      footer={
        <Button
          disabled={!isDirty || isBusy || isDeleting}
          loading={isBusy}
          onPress={() => void handleSave()}
          size="lg"
          testID="preset-message-save"
        >
          {messageId ? t('common.save') : t('settings.presetMessages.add')}
        </Button>
      }
      rightActions={rightActions}
      title={messageId ? t('settings.presetMessages.edit') : t('settings.presetMessages.add')}
    >
      <View className="gap-6">
        <FormField label={t('settings.presetMessages.fields.title')}>
          <Input
            accessibilityLabel={t('settings.presetMessages.fields.title')}
            onChangeText={(value) => updateField('title', value)}
            placeholder={t('settings.presetMessages.fields.titlePlaceholder')}
            value={form.title}
          />
        </FormField>
        <FormField label={t('settings.presetMessages.fields.content')}>
          <Input
            accessibilityLabel={t('settings.presetMessages.fields.content')}
            multiline
            onChangeText={(value) => updateField('content', value)}
            placeholder={t('settings.presetMessages.fields.contentPlaceholder')}
            textAlignVertical="top"
            value={form.content}
          />
        </FormField>
      </View>
    </EditorFrame>
  );
}

/** Editor pages keep the save action below the scrolling content and above the keyboard. */
function EditorFrame({
  children,
  footer,
  rightActions,
  title,
}: {
  children: ReactNode;
  footer?: ReactNode;
  rightActions?: readonly HeaderToolbarAction[];
  title?: string;
}) {
  const headerHeight = useHeaderHeight();
  const { bottom } = useSafeAreaInsets();

  return (
    <>
      <RouteHeader rightActions={rightActions} title={title} />
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-background">
          <View
            className="flex-1 justify-center px-6"
            style={footer ? undefined : { paddingBottom: bottom + 24 }}
          >
            {children}
          </View>
          {footer ? (
            <View
              className="gap-3 border-t border-border-subtle bg-background px-6 pt-4"
              style={{ paddingBottom: Math.max(bottom, 16) }}
            >
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

function FormField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <TextField>
      <TextField.Label>{label}</TextField.Label>
      {children}
    </TextField>
  );
}
