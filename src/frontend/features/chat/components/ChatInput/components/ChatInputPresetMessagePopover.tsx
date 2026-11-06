import MessageSquareTextIcon from '@cherrystudio/app-icons/icons/message-square-text';
import SendIcon from '@cherrystudio/app-icons/icons/send';
import { Button, Composer } from '@cherrystudio/ui/components';
import { useFocusEffect, useRouter } from 'expo-router';
import { type ReactNode, type RefObject, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View, type ViewInstance } from 'react-native';

import { useComposerActions, useComposerMeta } from '@/frontend/components/Composer';
import type { PresetMessage } from '@/shared/data/types/presetMessage';

/**
 * The same compact picker as Plugins and MCP prompts. A row tap inserts the
 * preset at the caret for editing; its send control hands the preset to the
 * caller's direct-send path instead.
 */
export function ChatInputPresetMessagePopover({
  children,
  onClose,
  onSendNow,
  open,
  presetMessages,
  returnFocusRef,
}: {
  children: ReactNode;
  onClose(): void;
  /** Appends the preset to the draft and sends it through the composer's own send protocol. */
  onSendNow(content: string): void;
  open: boolean;
  presetMessages: readonly PresetMessage[];
  returnFocusRef?: RefObject<ViewInstance | null>;
}) {
  const { t } = useTranslation();
  const router = useRouter();
  const { inputRef } = useComposerMeta();
  const { setDraft } = useComposerActions();
  const initialFocusRef = useRef<ViewInstance>(null);

  useFocusEffect(
    useCallback(
      () => () => {
        onClose();
      },
      [onClose],
    ),
  );

  const insert = useCallback(
    (message: PresetMessage) => {
      if (!open) return;
      const input = inputRef.current;
      if (input) {
        // The field owns the buffer and caret, so insertion lands where the user is looking.
        input.insertText(message.content);
      } else {
        // A field that never mounted has no caret to place; append instead.
        setDraft((draft) => (draft ? `${draft}\n${message.content}` : message.content));
      }
      onClose();
    },
    [inputRef, onClose, open, setDraft],
  );

  const sendNow = useCallback(
    (message: PresetMessage) => {
      if (!open) return;
      onSendNow(message.content);
      onClose();
    },
    [onClose, onSendNow, open],
  );

  const content =
    presetMessages.length > 0 ? (
      <ScrollView
        className="grow-0 shrink"
        contentContainerClassName="gap-0.5 p-2"
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
      >
        {presetMessages.map((message, index) => (
          <Pressable
            accessibilityHint={t('chat.presetMessages.insertHint')}
            accessibilityLabel={message.title}
            accessibilityRole="button"
            className="min-h-12 flex-row items-center gap-3 rounded-xl px-3 py-2 active:bg-secondary-active"
            key={message.id}
            onPress={() => insert(message)}
            ref={index === 0 ? initialFocusRef : undefined}
            testID={`chat-preset-message-${message.id}`}
          >
            <MessageSquareTextIcon className="size-5 text-foreground" />
            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="text-base text-foreground" numberOfLines={1}>
                {message.title}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {message.content}
              </Text>
            </View>
            <Button
              accessibilityLabel={t('chat.presetMessages.send', { title: message.title })}
              icon={<SendIcon className="size-4 text-foreground" />}
              onPress={() => sendNow(message)}
              shape="pill"
              size="xs"
              variant="ghost"
              testID={`chat-preset-message-send-${message.id}`}
            />
          </Pressable>
        ))}
      </ScrollView>
    ) : (
      <View className="gap-3 p-4">
        <Text className="text-sm text-muted-foreground">
          {t('chat.presetMessages.empty.description')}
        </Text>
        <Button
          onPress={() => router.push('/settings/preset-messages')}
          size="sm"
          testID="chat-preset-message-open-settings"
          variant="secondary"
        >
          {t('chat.presetMessages.empty.action')}
        </Button>
      </View>
    );

  return (
    <Composer.Popover
      accessibilityLabel={t('chat.presetMessages.title')}
      content={content}
      initialFocusRef={initialFocusRef}
      maxHeight={320}
      maxWidth={280}
      onClose={onClose}
      open={open}
      returnFocusRef={returnFocusRef}
      testID="chat-preset-message-popover"
    >
      {children}
    </Composer.Popover>
  );
}
