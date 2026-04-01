import AppShell from '@/components/appShell/AppShell';
import { DetailRow, DetailSection, EmptyState, RecordCard } from '@/components/management/Cards';
import useManagementDetail from '@/hooks/useManagementDetail';
import { fetchClientDetail } from '@/services/managementService';
import { formatDateLabel } from '@/utils/managementUi';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function ClientDetailScreen() {
  const params = useLocalSearchParams<{ clientId?: string }>();
  const { item, loading, error } = useManagementDetail(params.clientId, fetchClientDetail);

  return (
    <AppShell title={item?.name ?? 'Cliente'} subtitle="Detalhes do cadastro">
      {loading ? <ActivityIndicator color="#38bdf8" style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {item ? (
        <>
          <DetailSection title="Cadastro">
            <DetailRow label="Nome" value={item.name} />
            <DetailRow label="Email" value={item.email} />
            <DetailRow label="Telefone" value={item.phone} />
            <DetailRow label="CPF" value={item.cpf || '-'} />
            <DetailRow label="CNPJ" value={item.cnpj || '-'} />
            <DetailRow label="Criado em" value={formatDateLabel(item.insertDate)} />
          </DetailSection>

          <DetailSection title="Enderecos">
            {item.addresses.length ? item.addresses.map((address) => (
              <RecordCard key={address.id} title={address.label} />
            )) : <EmptyState message="Cliente sem enderecos cadastrados." />}
          </DetailSection>

          <DetailSection title="Ordens vinculadas">
            {item.recentOrders.length ? item.recentOrders.map((order) => (
              <RecordCard
                key={order.id}
                title={`OS ${order.operationCode}`}
                subtitle={order.statusLabel}
                meta={formatDateLabel(order.insertDate)}
              />
            )) : <EmptyState message="Nenhuma ordem vinculada a este cliente." />}
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
});
