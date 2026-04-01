import { Routes } from '@/app/routes';
import AppShell from '@/components/appShell/AppShell';
import { Badge, EmptyState, RecordCard } from '@/components/management/Cards';
import useManagementList from '@/hooks/useManagementList';
import { fetchEmployees } from '@/services/managementService';
import { formatDateLabel, getBooleanLabel } from '@/utils/managementUi';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EmployeesScreen() {
  const loadEmployees = useCallback((search: string) => fetchEmployees(search), []);
  const { items, searchQuery, setSearchQuery, loading, error } = useManagementList(loadEmployees);

  return (
    <AppShell title="Funcionarios" subtitle="Equipe e acessos do sistema">
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nome, email ou CPF"
        placeholderTextColor="#64748b"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {loading ? <ActivityIndicator color="#38bdf8" style={styles.loader} /> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View>
        {items.map((employee) => (
          <RecordCard
            key={employee.id}
            title={employee.fullName}
            subtitle={`${employee.positionLabel} • ${employee.email}`}
            meta={`${getBooleanLabel(employee.isActive, 'Ativo', 'Inativo')} • Cadastro: ${formatDateLabel(employee.insertDate)}`}
            badge={<Badge label={employee.isActive ? 'Ativo' : 'Inativo'} color={employee.isActive ? '#22c55e' : '#f97316'} />}
            onPress={() => router.push({ pathname: `/(stack)/${Routes.EMPLOYEE_DETAIL}` as never, params: { employeeId: employee.id } } as never)}
          />
        ))}

        {!loading && !items.length ? <EmptyState message="Nenhum funcionario encontrado." /> : null}
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
