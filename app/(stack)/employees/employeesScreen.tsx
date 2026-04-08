import { Routes } from '@/app/routes';
import AppShell from '@/components/appShell/AppShell';
import { Badge, EmptyState, RecordCard } from '@/components/management/Cards';
import { useManagementAccess } from '@/contexts/managementAccessContext';
import { useEmployeeList } from '@/hooks/useEmployee';
import { formatDateLabel, getBooleanLabel } from '@/utils/managementUi';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function EmployeesScreen() {
  const { access } = useManagementAccess();
  const { items, searchQuery, setSearchQuery, loading, error } = useEmployeeList();

  return (
    <AppShell
      title="Funcionarios"
      subtitle="Equipe e acessos do sistema"
      rightAction={access?.can_create_employee ? (
        <Pressable style={styles.addButton} onPress={() => router.push(`/(stack)/${Routes.EMPLOYEE_CREATE}` as never)}>
          <MaterialIcons name="person-add-alt-1" size={20} color="#f8fafc" />
        </Pressable>
      ) : undefined}
    >
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 118, 110, 0.92)',
  },
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
