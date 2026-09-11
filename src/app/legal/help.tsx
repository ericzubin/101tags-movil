import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '@/components/ui/ErrorState';
import { findWhatsAppLink, isOpenableUrl } from '@/core/models/content.model';
import { contentService } from '@/core/services/content-service';
import { brandColors } from '@/theme/tokens';

import type { FooterLink, PolicyContent } from '@/core/models/content.model';

type LoadStatus = 'loading' | 'ready' | 'error';

/**
 * Help screen (M6.3). Shows the backend-provided payment disclaimer and
 * mediation window from `/policies`, plus the WhatsApp contact row when
 * `whatsapp_enabled`. The WhatsApp number is never hardcoded: it is resolved
 * from the footer's `wa.me` link when present. `/policies` failure → clear
 * error state; `/footer` failure degrades to an informational WhatsApp row.
 *
 * @see .spec/2026-09-11-m6-3-legal-help.md AC1/AC5
 */
export default function HelpScreen() {
  const [policies, setPolicies] = useState<PolicyContent | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<FooterLink | null>(null);
  const [status, setStatus] = useState<LoadStatus>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const [policiesResult, footerResult] = await Promise.allSettled([
        contentService.getPolicies(),
        contentService.getFooter(),
      ]);

      if (policiesResult.status === 'rejected') throw policiesResult.reason;

      setPolicies(policiesResult.value);
      setWhatsappLink(
        footerResult.status === 'fulfilled' ? findWhatsAppLink(footerResult.value) : null,
      );
      setStatus('ready');
    } catch (err) {
      if (__DEV__) console.warn('[legal/help] no pudimos cargar /policies', err);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (status === 'loading') {
    return (
      <SafeAreaView
        className="flex-1 items-center justify-center bg-brand-medium"
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator testID="help-loading" color={brandColors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']}>
        <ErrorState
          testID="help-error"
          title="No pudimos cargar la ayuda"
          subtitle="Revisa tu conexión e inténtalo de nuevo."
          onRetry={() => void load()}
        />
      </SafeAreaView>
    );
  }

  const disclaimer = policies?.manualPaymentDisclaimer?.trim();
  const mediationHours = policies?.mediationWindowHours ?? 0;
  const whatsappEnabled = policies?.whatsappEnabled ?? false;
  const actionableLink =
    whatsappLink !== null && isOpenableUrl(whatsappLink.url) ? whatsappLink : null;

  return (
    <SafeAreaView className="flex-1 bg-brand-medium" edges={['top', 'left', 'right']} testID="legal-help">
      <ScrollView contentContainerClassName="p-brand-4">
        <Text className="mb-brand-4 text-[22px] font-brand-bold text-brand-dark">Ayuda</Text>

        {disclaimer ? (
          <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
            <Text className="mb-brand-2 font-brand-bold text-base text-brand-dark">Pagos</Text>
            <Text testID="help-disclaimer" className="font-brand text-sm text-brand-dark/80">
              {disclaimer}
            </Text>
          </View>
        ) : null}

        {mediationHours > 0 ? (
          <View className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4">
            <Text testID="help-mediation" className="font-brand text-sm text-brand-dark/80">
              {`Ventana de mediación: ${mediationHours} horas.`}
            </Text>
          </View>
        ) : null}

        {whatsappEnabled ? (
          <View
            testID="help-whatsapp"
            className="mb-brand-4 rounded-brand-lg bg-brand-white p-brand-4"
          >
            <Text className="mb-brand-2 font-brand-bold text-base text-brand-dark">WhatsApp</Text>
            <Text className="font-brand text-sm text-brand-dark/80">
              El canal de atención por WhatsApp está habilitado.
            </Text>
            {actionableLink ? (
              <Pressable
                testID="help-whatsapp-action"
                accessibilityRole="link"
                onPress={() => void Linking.openURL(actionableLink.url)}
                className="mt-brand-3 items-center rounded-brand-lg bg-brand-primary py-3 active:opacity-80"
              >
                <Text className="font-brand-bold text-sm text-white">Abrir WhatsApp</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
