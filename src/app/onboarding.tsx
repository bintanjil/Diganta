import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { PAYMENT_METHODS } from '@/lib/catalog';
import { formatMoney, toBanglaDigits } from '@/lib/format';
import { translate, type TranslationKey } from '@/lib/i18n';
import { useAppStore } from '@/lib/store';
import type { Language, PaymentType } from '@/lib/types';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OnboardingScreen() {
  const theme = useTheme();
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<Language>('en');
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [methods, setMethods] = useState<PaymentType[]>(['cash', 'bkash']);

  const t = useMemo(() => (key: TranslationKey) => translate(language, key), [language]);
  const money = (value: number) => formatMoney(value, language);

  const totalSteps = 4;
  const canNext = step !== 1 || name.trim().length > 0;

  const next = () => {
    if (step < totalSteps - 1) {
      setStep((s) => s + 1);
      return;
    }
    completeOnboarding({
      name: name.trim() || (language === 'bn' ? 'বন্ধু' : 'Friend'),
      language,
      currency: 'BDT',
      monthlyIncome: Number(income) || 0,
      methods: methods.length > 0 ? methods : ['cash'],
      notificationsEnabled: false,
    });
    router.replace('/(tabs)');
  };

  const toggleMethod = (id: PaymentType) =>
    setMethods((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.topBar}>
            {step > 0 ? (
              <Pressable onPress={() => setStep((s) => Math.max(0, s - 1))} hitSlop={10}>
                <ThemedText type="small" weight="semibold" style={{ color: theme.primary }}>
                  ‹ {t('back')}
                </ThemedText>
              </Pressable>
            ) : (
              <View />
            )}
            <ThemedText type="caption" themeColor="textSecondary">
              {t('step')} {language === 'bn' ? toBanglaDigits(String(step + 1)) : step + 1}/
              {language === 'bn' ? toBanglaDigits(String(totalSteps)) : totalSteps}
            </ThemedText>
          </View>

          <View style={styles.dots}>
            {Array.from({ length: totalSteps }).map((_, i) => (
              <View key={i} style={[styles.dot, { backgroundColor: i <= step ? theme.primary : theme.muted, width: i === step ? 22 : 8 }]} />
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {step === 0 && (
              <View style={styles.block}>
                <ThemedText type="title">{t('chooseLanguage')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('chooseLanguageSub')}
                </ThemedText>
                <View style={styles.langRow}>
                  <LanguageCard active={language === 'bn'} label="বাংলা" sub="Bangla" onPress={() => setLanguage('bn')} />
                  <LanguageCard active={language === 'en'} label="English" sub="ইংরেজি" onPress={() => setLanguage('en')} />
                </View>
              </View>
            )}

            {step === 1 && (
              <View style={styles.block}>
                <ThemedText type="title">{t('yourName')}</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder={t('yourNamePlaceholder')}
                  placeholderTextColor={theme.textSecondary}
                  style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
                />
                <ThemedText type="small" themeColor="textSecondary">
                  {t('monthlyIncome')}
                </ThemedText>
                <View style={[styles.amountInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.symbol, { color: theme.textSecondary }]}>৳</Text>
                  <TextInput
                    value={income}
                    onChangeText={(v) => setIncome(v.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={theme.textSecondary}
                    style={[styles.amountField, { color: theme.text }]}
                  />
                </View>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('monthlyIncomeSub')}
                </ThemedText>
                {income ? (
                  <ThemedText type="subtitle" style={{ color: theme.primary }}>
                    {money(Number(income))}
                  </ThemedText>
                ) : null}
              </View>
            )}

            {step === 2 && (
              <View style={styles.block}>
                <ThemedText type="title">{t('paymentMethods')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('paymentMethodsSub')}
                </ThemedText>
                <View style={styles.chips}>
                  {PAYMENT_METHODS.map((method) => {
                    const active = methods.includes(method.id);
                    return (
                      <Pressable
                        key={method.id}
                        onPress={() => toggleMethod(method.id)}
                        style={[styles.methodCard, { backgroundColor: active ? method.color : theme.card, borderColor: active ? method.color : theme.border }]}>
                        <Text style={[styles.methodText, { color: active ? '#FFFFFF' : theme.text }]}>{method.short}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.block}>
                <Ionicons name="checkmark-circle" size={52} color={theme.primary} />
                <ThemedText type="title">{t('readyTitle')}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('readySub')}
                </ThemedText>
                <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <SummaryRow label={t('name')} value={name.trim() || '—'} />
                  <SummaryRow label={t('monthlyIncome')} value={income ? money(Number(income)) : '—'} />
                  <SummaryRow
                    label={t('paymentMethods')}
                    value={methods.map((m) => PAYMENT_METHODS.find((p) => p.id === m)?.short).filter(Boolean).join(', ')}
                  />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button title={step === totalSteps - 1 ? t('getStarted') : t('continue')} onPress={next} disabled={!canNext} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function LanguageCard({ active, label, sub, onPress }: { active: boolean; label: string; sub: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.langCard, { backgroundColor: active ? theme.primarySoft : theme.card, borderColor: active ? theme.primary : theme.border }]}>
      <ThemedText type="subtitle">{label}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {sub}
      </ThemedText>
      {active ? (
        <ThemedText type="default" weight="bold" style={[styles.check, { color: theme.primary }]}>
          ✓
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.flex}>
        {label}
      </ThemedText>
      <ThemedText type="small" weight="semibold" style={styles.flexRight} numberOfLines={1}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  flexRight: { flex: 1.4, textAlign: 'right' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.four, paddingTop: Spacing.two },
  dots: { flexDirection: 'row', gap: Spacing.one, paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  dot: { height: 8, borderRadius: 4 },
  content: { paddingHorizontal: Spacing.four, paddingTop: Spacing.five, paddingBottom: Spacing.four, flexGrow: 1 },
  block: { gap: Spacing.three },
  emoji: { fontSize: 44 },
  langRow: { flexDirection: 'row', gap: Spacing.three, marginTop: Spacing.two },
  langCard: { flex: 1, borderRadius: Radius.lg, borderWidth: 1.5, padding: Spacing.four, gap: Spacing.one },
  check: { position: 'absolute', top: Spacing.three, right: Spacing.three },
  input: { borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  amountInput: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.md, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three },
  symbol: { fontSize: 18, fontWeight: '700', marginRight: Spacing.two },
  amountField: { flex: 1, paddingVertical: Spacing.three, fontSize: 20, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  methodCard: { borderRadius: Radius.md, borderWidth: 1.5, paddingVertical: Spacing.three, paddingHorizontal: Spacing.four },
  methodText: { fontSize: 15, fontWeight: '700' },
  summary: { borderRadius: Radius.lg, borderWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two, marginTop: Spacing.two },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.three },
  footer: { paddingHorizontal: Spacing.four, paddingBottom: Spacing.three, paddingTop: Spacing.two },
});
