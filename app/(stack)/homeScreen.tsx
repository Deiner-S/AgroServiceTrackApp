import AppShell from '@/components/appShell/AppShell';
import { EmptyState, MetricCard, ModuleCard } from '@/components/management/Cards';
import { useSync } from '@/contexts/syncContext';
import useDashboardHook from '@/hooks/useDashboardHook';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

const ICON_MAP: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  orders: 'assignment',
  clients: 'groups',
  employees: 'badge',
  checklist_items: 'fact-check',
};

export default function HomeScreen() {
  const { dashboard, loading, error } = useDashboardHook();
  const { runSync } = useSync();

  return (
    <AppShell
      title="Painel operacional"
      subtitle={dashboard ? `${dashboard.user.fullName} • ${dashboard.user.position}` : 'Visao geral do sistema'}
      rightAction={(
        <Pressable style={styles.syncButton} onPress={() => { void runSync(); }}>
          <MaterialIcons name="sync" size={20} color="#f8fafc" />
        </Pressable>
      )}
    >
      {loading && !dashboard ? <ActivityIndicator color="#38bdf8" style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {dashboard ? (
        <>
          <Text style={styles.sectionTitle}>Resumo rapido</Text>
          <View style={styles.grid}>
            <MetricCard label="Pendentes" value={dashboard.summary.pendingOrders} />
            <MetricCard label="Andamento" value={dashboard.summary.inProgressOrders} />
            <MetricCard label="Entrega" value={dashboard.summary.deliveryOrders} />
            <MetricCard label="Concluidas" value={dashboard.summary.completedOrders} />
          </View>

          <Text style={styles.sectionTitle}>Modulos principais</Text>
          <View style={styles.grid}>
            {dashboard.modules.map((module) => (
              <ModuleCard
                key={module.id}
                icon={<MaterialIcons name={ICON_MAP[module.id] ?? 'dashboard'} size={22} color="#38bdf8" />}
                title={module.title}
                description={module.description}
                count={module.count}
                disabled={!module.enabled}
                onPress={() => router.push(`/(stack)/${module.route}` as never)}
              />
            ))}
          </View>
        </>
      ) : null}

      {!loading && !dashboard && !error ? <EmptyState message="Nenhum dado de painel disponivel." /> : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: 32,
  },
  sectionTitle: {
    color: '#e2e8f0',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  syncButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.18)',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    marginBottom: 12,
  },
});
