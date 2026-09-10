import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useT } from '@/hooks/use-t';
import { useTheme } from '@/hooks/use-theme';
import { answer, suggestedQuestions, type AssistantContext } from '@/lib/assistant';
import type { LocalizedText } from '@/lib/types';
import { useAppStore } from '@/lib/store';

interface Message {
  id: number;
  role: 'user' | 'bot';
  text: LocalizedText;
}

export default function AssistantScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t, l } = useT();

  const user = useAppStore((s) => s.user);
  const transactions = useAppStore((s) => s.transactions);
  const budgets = useAppStore((s) => s.budgets);
  const bills = useAppStore((s) => s.bills);
  const debts = useAppStore((s) => s.debts);
  const goals = useAppStore((s) => s.goals);
  const habits = useAppStore((s) => s.habits);
  const habitLogs = useAppStore((s) => s.habitLogs);
  const buckets = useAppStore((s) => s.buckets);
  const investments = useAppStore((s) => s.investments);

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const counter = useRef(0);
  const scrollRef = useRef<ScrollView>(null);

  const ask = (text: string) => {
    const question = text.trim();
    if (!question) return;
    const ctx: AssistantContext = {
      user,
      transactions,
      budgets,
      bills,
      debts,
      goals,
      habits,
      habitLogs,
      buckets,
      investments,
    };
    const reply = answer(question, ctx);
    counter.current += 1;
    const userMsg: Message = { id: counter.current, role: 'user', text: { en: question, bn: question } };
    counter.current += 1;
    const botMsg: Message = { id: counter.current, role: 'bot', text: reply };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  const suggestions = suggestedQuestions();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="sparkles" size={20} color={theme.primary} />
            <ThemedText type="subtitle">{t('askAssistant')}</ThemedText>
          </View>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView ref={scrollRef} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            <View style={[styles.bubble, styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText type="small">{t('askIntro')}</ThemedText>
            </View>

            <View style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <Pressable
                  key={i}
                  onPress={() => ask(l(s))}
                  style={[styles.suggestion, { borderColor: theme.primary, backgroundColor: theme.primarySoft }]}>
                  <ThemedText type="small" style={{ color: theme.primary }}>
                    {l(s)}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.bubble,
                  message.role === 'user'
                    ? [styles.userBubble, { backgroundColor: theme.primary }]
                    : [styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border }],
                ]}>
                <ThemedText
                  type="small"
                  style={message.role === 'user' ? { color: theme.onPrimary } : undefined}>
                  {l(message.text)}
                </ThemedText>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.inputBar, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={t('askPlaceholder')}
              placeholderTextColor={theme.textSecondary}
              onSubmitEditing={() => ask(input)}
              returnKeyType="send"
              style={[styles.input, { backgroundColor: theme.card, borderColor: theme.border, color: theme.text }]}
            />
            <Pressable
              onPress={() => ask(input)}
              style={[styles.sendBtn, { backgroundColor: theme.primary }]}>
              <Ionicons name="arrow-up" size={20} color={theme.onPrimary} />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  messages: { padding: Spacing.four, gap: Spacing.three },
  bubble: { borderRadius: Radius.lg, padding: Spacing.three, maxWidth: '92%' },
  botBubble: { alignSelf: 'flex-start', borderWidth: StyleSheet.hairlineWidth },
  userBubble: { alignSelf: 'flex-end' },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  suggestion: {
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    fontSize: 15,
  },
  sendBtn: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
