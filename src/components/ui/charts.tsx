import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface BarDatum {
  label: string;
  value: number;
  active?: boolean;
}

interface MiniBarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  formatValue?: (value: number) => string;
}

export function MiniBarChart({ data, height = 120, color, formatValue }: MiniBarChartProps) {
  const theme = useTheme();
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <View style={styles.wrap}>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => {
          const ratio = d.value / max;
          const barHeight = Math.max(d.value > 0 ? 6 : 2, ratio * (height - 18));
          return (
            <View key={`${d.label}-${i}`} style={styles.column}>
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {d.value > 0 && formatValue ? formatValue(d.value) : ''}
              </ThemedText>
              <View
                style={[
                  styles.bar,
                  {
                    height: barHeight,
                    backgroundColor: d.active ? color ?? theme.primary : theme.muted,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <ThemedText
            key={`${d.label}-label-${i}`}
            type="caption"
            themeColor={d.active ? 'text' : 'textSecondary'}
            style={styles.label}
            numberOfLines={1}>
            {d.label}
          </ThemedText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.one },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  column: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.half,
  },
  bar: {
    width: '70%',
    borderRadius: Radius.sm,
  },
  labels: { flexDirection: 'row', gap: Spacing.two },
  label: { flex: 1, textAlign: 'center' },
});
