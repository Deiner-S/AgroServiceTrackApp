import AppShell from '@/components/appShell/AppShell';
import { DetailRow, DetailSection } from '@/components/management/Cards';
import useManagementDetail from '@/hooks/useManagementDetail';
import { fetchChecklistItemDetail, toggleChecklistItemStatus } from '@/services/managementService';
import { formatDateLabel } from '@/utils/managementUi';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text } from 'react-native';

export default function ChecklistItemDetailScreen() {
  const params = useLocalSearchParams<{ itemId?: string }>();
  const { item, loading, error, reload } = useManagementDetail(params.itemId, fetchChecklistItemDetail);

  async function handleToggleStatus() {
    if (!params.itemId) {
      return;
    }

    try {
      await toggleChecklistItemStatus(params.itemId);
      await reload(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao atualizar o item.';
      Alert.alert('Checklist', message);
    }
  }

  return (
    <AppShell title={item?.name ?? 'Item de checklist'} subtitle="Detalhes do item">
      {loading ? <ActivityIndicator color="#38bdf8" style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {item ? (
        <>
          <Pressable style={styles.actionButton} onPress={handleToggleStatus}>
            <Text style={styles.actionButtonText}>{item.status === 1 ? 'Desativar item' : 'Reativar item'}</Text>
          </Pressable>

          <DetailSection title="Cadastro">
            <DetailRow label="Nome" value={item.name} />
            <DetailRow label="Status" value={item.statusLabel} />
            <DetailRow label="Uso em checklist" value={String(item.usageCount)} />
            <DetailRow label="Criado em" value={formatDateLabel(item.insertDate)} />
          </DetailSection>
        </>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginVertical: 24,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    marginBottom: 12,
  },
  actionButton: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#0f766e',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#f8fafc',
    fontWeight: '700',
  },
});
