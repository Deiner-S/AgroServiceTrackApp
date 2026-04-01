import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function ModuleCard({
  title,
  description,
  count,
  onPress,
  disabled = false,
  icon,
}: {
  title: string;
  description: string;
  count: number;
  onPress: () => void;
  disabled?: boolean;
  icon: ReactNode;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.moduleCard,
        disabled && styles.disabledCard,
        pressed && !disabled && styles.moduleCardPressed,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.moduleTopRow}>
        <View style={styles.moduleIconWrap}>{icon}</View>
        <Text style={styles.moduleCount}>{count}</Text>
      </View>

      <Text style={styles.moduleTitle}>{title}</Text>
      <Text style={styles.moduleDescription}>{description}</Text>
    </Pressable>
  );
}

export function RecordCard({
  title,
  subtitle,
  badge,
  meta,
  onPress,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  meta?: string;
  onPress?: () => void;
}) {
  const content = (
    <View style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <Text style={styles.recordTitle}>{title}</Text>
        {badge}
      </View>

      {subtitle ? <Text style={styles.recordSubtitle}>{subtitle}</Text> : null}
      {meta ? <Text style={styles.recordMeta}>{meta}</Text> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable style={({ pressed }) => [pressed && styles.moduleCardPressed]} onPress={onPress}>
      {content}
    </Pressable>
  );
}

export function DetailSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

export function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}22` }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  metricCard: {
    width: '48%',
    minHeight: 108,
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginBottom: 12,
  },
  metricValue: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 8,
  },
  moduleCard: {
    width: '48%',
    minHeight: 180,
    borderRadius: 24,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.18)',
    marginBottom: 12,
  },
  disabledCard: {
    opacity: 0.45,
  },
  moduleCardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },
  moduleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleCount: {
    color: '#e2e8f0',
    fontSize: 24,
    fontWeight: '700',
  },
  moduleTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 22,
  },
  moduleDescription: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
  },
  recordCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginBottom: 12,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  recordTitle: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  recordSubtitle: {
    color: '#cbd5e1',
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  recordMeta: {
    color: '#64748b',
    marginTop: 10,
    fontSize: 12,
  },
  section: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.84)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginBottom: 14,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.18)',
  },
  detailLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  detailValue: {
    color: '#e2e8f0',
    fontSize: 15,
    marginTop: 6,
    lineHeight: 21,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
});
