import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui/ErrorState';
import { isOpenableUrl } from '@/core/models/content.model';
import { contentService } from '@/core/services/content-service';
import { brandColors } from '@/theme/tokens';

import type { FooterContent, FooterLink } from '@/core/models/content.model';

/**
 * The backend does not expose full Terms/Privacy text (business dependency).
 * This message is UI chrome, not legal copy — it never asserts any obligation.
 */
export const LEGAL_PENDING_NOTICE =
  'El texto completo de este documento aún no está disponible en la aplicación (contenido pendiente, dependencia de negocio).';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface LegalDocumentScreenProps {
  testID: string;
  title: string;
}

/**
 * Shared Terms/Privacy screen. Renders the real `footer.legal` links from the
 * backend and always flags the full document as pending. On `/footer` failure
 * it shows a clear error state — it never invents legal text.
 *
 * Only absolute `http(s)` URLs reach `Linking.openURL` (AGENTS §Seguridad).
 */
export function LegalDocumentScreen({ testID, title }: LegalDocumentScreenProps) {
  const [footer, setFooter] = useState<FooterContent | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const content = await contentService.getFooter();
      setFooter(content);
      setStatus('ready');
    } catch (err) {
      if (__DEV__) console.warn('[legal] no pudimos cargar /footer', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openLink = (link: FooterLink) => {
    if (!isOpenableUrl(link.url)) return;
    void Linking.openURL(link.url);
  };

  if (status === 'loading') {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-brand-medium"
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator testID={`${testID}-loading`} color={brandColors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID={`${testID}-error`}
          title="No pudimos cargar el contenido legal"
          subtitle="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => void load()}
        />
      </SafeAreaView>
    );
  }

  const legalLinks = footer?.legal ?? [];

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']} testID={testID}>
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="mb-brand-2 text-[22px] font-brand-bold text-brand-dark">{title}</Text>

        <View className="mb-brand-4 rounded-brand-lg border border-brand-primary/30 bg-brand-white p-brand-4">
          <Text testID={`${testID}-pending-notice`} className="font-brand text-sm text-brand-dark/80">
            {LEGAL_PENDING_NOTICE}
          </Text>
        </View>

        {legalLinks.length > 0 ? (
          <View className="rounded-brand-lg bg-brand-white p-brand-2">
            {legalLinks.map((link, index) => (
              <Pressable
                key={`${link.label}-${link.url}`}
                testID={`${testID}-legal-link-${index}`}
                accessibilityRole="link"
                accessibilityLabel={link.label}
                onPress={() => openLink(link)}
                className="flex-row items-center justify-between p-brand-3 active:opacity-80"
              >
                <Text className="font-brand text-base text-brand-primary">{link.label}</Text>
                <Ionicons name="open-outline" size={18} color={brandColors.primary} />
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
