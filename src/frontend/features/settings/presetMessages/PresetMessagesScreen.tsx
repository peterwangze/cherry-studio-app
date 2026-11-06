import PlusIcon from '@cherrystudio/app-icons/icons/plus';
import { ContentState, Section } from '@cherrystudio/ui/components';
import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import type { HeaderToolbarAction } from '@/frontend/appShell/header';
import { usePresetMessagesApi } from '@/frontend/hooks/presetMessage/usePresetMessages';

import { SettingsScrollPage } from '../components/SettingsScrollPage';

/** Preset messages the chat composer offers for quick insertion and sending. */
export function PresetMessagesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { error, isLoading, presetMessages, refetch } = usePresetMessagesApi();

  const openEditor = useCallback(
    (messageId: string) => {
      void router.push(`/settings/preset-messages/${messageId}`);
    },
    [router],
  );
  const rightActions = useMemo<HeaderToolbarAction[]>(
    () => [
      {
        accessibilityLabel: t('settings.presetMessages.add'),
        icon: PlusIcon,
        key: 'create-preset-message',
        nativeIcon: require('@/assets/header-toolbar/plus.png'),
        onPress: () => openEditor('new'),
        type: 'icon',
      },
    ],
    [openEditor, t],
  );

  return (
    <SettingsScrollPage headerProps={{ rightActions, title: t('settings.presetMessages.title') }}>
      <Section footer={t('settings.presetMessages.summary')}>
        {presetMessages.map((message) => (
          <Section.Item
            description={
              <Text className="text-muted-foreground" numberOfLines={1}>
                {message.content}
              </Text>
            }
            key={message.id}
            label={message.title}
            onPress={() => openEditor(message.id)}
            showChevron
            testID={`preset-message-${message.id}`}
          />
        ))}
        {isLoading ? <Section.Item label={t('settings.presetMessages.loading')} /> : null}
      </Section>
      {!isLoading && error ? (
        <ContentState.Error
          description={error.message}
          primaryAction={{
            children: t('common.retry'),
            onPress: () => void refetch(),
          }}
          title={t('settings.presetMessages.loadFailed')}
        />
      ) : null}
      {!isLoading && !error && presetMessages.length === 0 ? (
        <ContentState.Empty
          title={t('settings.presetMessages.empty.title')}
          description={t('settings.presetMessages.empty.description')}
          primaryAction={{
            children: t('settings.presetMessages.empty.action'),
            onPress: () => openEditor('new'),
          }}
        />
      ) : null}
    </SettingsScrollPage>
  );
}
