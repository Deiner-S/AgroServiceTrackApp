import { Routes } from '@/app/routes';
import AppShell from '@/components/appShell/AppShell';
import { Badge, EmptyState, RecordCard } from '@/components/management/Cards';
import useManagementList from '@/hooks/useManagementList';
import { fetchClients } from '@/services/managementService';
import { formatDateLabel } from '@/utils/managementUi';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ClientsScreen() {
  const loadClients = useCallback((search: string) => fetchClients(search), []);
  const { items, searchQuery, setSearchQuery, loading, error } = useManagementList(loadClients);

  return (
    <AppShell title="Clientes" subtitle="Gestao e consulta de clientes">
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nome, email, CPF ou CNPJ"
        placeholderTextColor="#64748b"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? <ActivityIndicator color="#38bdf8" style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View>
        {items.map((client) => (
          <RecordCard
            key={client.id}
            title={client.name}
            subtitle={`${client.email} • ${client.phone}`}
            meta={`Enderecos: ${client.addressCount} • Cadastro: ${formatDateLabel(client.insertDate)}`}
            badge={<Badge label={client.cnpj ? 'CNPJ' : 'CPF'} color="#38bdf8" />}
            onPress={() => router.push({ pathname: `/(stack)/${Routes.CLIENT_DETAIL}` as never, params: { clientId: client.id } } as never)}
          />
        ))}

        {!loading && !items.length ? <EmptyState message="Nenhum cliente encontrado." /> : null}
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.82)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
    color: '#f8fafc',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 16,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    marginBottom: 12,
  },
});
