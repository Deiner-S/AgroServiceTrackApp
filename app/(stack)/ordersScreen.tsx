import AppShell from '@/components/appShell/AppShell';
import { Badge, EmptyState, RecordCard } from '@/components/management/Cards';
import { useSync } from '@/contexts/syncContext';
import useHomeHook, { WORK_ORDER_STATUS_OPTIONS } from '@/hooks/homeHook';
import { getStatusColor } from '@/utils/managementUi';
import { getOperationalRoute } from '@/utils/orderNavigation';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function OrdersScreen() {
  const navigation = useNavigation<any>();
  const { workOrders, selectedStatus, setSelectedStatus, reload } = useHomeHook();
  const { lastSyncAt } = useSync();

  useEffect(() => {
    if (lastSyncAt) {
      reload();
    }
  }, [lastSyncAt, reload]);

  const filteredOrders = useMemo(() => {
    if (selectedStatus === 'all') {
      return workOrders;
    }

    return workOrders.filter((item) => item.status === selectedStatus);
  }, [selectedStatus, workOrders]);

  return (
    <AppShell title="Ordens de servico" subtitle="Fluxo operacional atual do app">
      <ScrollView
        horizontal
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
        showsHorizontalScrollIndicator={false}
      >
        {WORK_ORDER_STATUS_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setSelectedStatus(opt.value)}
            style={[styles.filterChip, selectedStatus === opt.value && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, selectedStatus === opt.value && styles.filterChipTextActive]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View>
        {filteredOrders.map((item) => (
          <RecordCard
            key={item.operation_code}
            title={`OS ${item.operation_code}`}
            subtitle={item.client}
            meta={item.symptoms}
            badge={<Badge label={`Status ${item.status}`} color={getStatusColor(item.status)} />}
            onPress={() => navigation.navigate(getOperationalRoute(item.status), { workOrder: item })}
          />
        ))}

        {!filteredOrders.length ? <EmptyState message="Nenhuma ordem disponivel para o filtro selecionado." /> : null}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    maxHeight: 52,
    marginBottom: 8,
  },
  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(30, 41, 59, 0.86)',
  },
  filterChipActive: {
    backgroundColor: '#0f766e',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#f8fafc',
  },
});
