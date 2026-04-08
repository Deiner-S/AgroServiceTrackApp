import { Routes } from '@/app/routes';
import AppShell from '@/components/appShell/AppShell';
import { DetailSection } from '@/components/management/Cards';
import { FormActions, FormField, FormSelect } from '@/components/management/FormControls';
import { useEmployeeForm } from '@/hooks/useEmployee';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';

export default function EmployeeCreateScreen() {
  const { values, errors, loading, submitting, formError, positionOptions, setFieldValue, submit } = useEmployeeForm('create');

  async function handleSubmit() {
    const detail = await submit();

    if (!detail) {
      return;
    }

    router.replace({
      pathname: `/(stack)/${Routes.EMPLOYEE_DETAIL}` as never,
      params: { employeeId: detail.id },
    } as never);
  }

  return (
    <AppShell title="Novo funcionario" subtitle="Cadastro com regras de acesso do painel">
      {loading ? <ActivityIndicator color="#38bdf8" style={styles.loader} /> : null}

      <DetailSection title="Dados do funcionario">
        {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

        <FormField
          label="Primeiro nome"
          value={values.first_name}
          onChangeText={(value) => setFieldValue('first_name', value)}
          error={errors.first_name}
          placeholder="Primeiro nome"
        />
        <FormField
          label="Sobrenome"
          value={values.last_name}
          onChangeText={(value) => setFieldValue('last_name', value)}
          error={errors.last_name}
          placeholder="Sobrenome"
        />
        <FormField
          label="CPF"
          value={values.cpf}
          onChangeText={(value) => setFieldValue('cpf', value)}
          keyboardType="number-pad"
          error={errors.cpf}
          placeholder="123.456.789-00"
        />
        <FormField
          label="Telefone"
          value={values.phone}
          onChangeText={(value) => setFieldValue('phone', value)}
          keyboardType="phone-pad"
          error={errors.phone}
          placeholder="(11) 98765-4321"
        />
        <FormField
          label="Email"
          value={values.email}
          onChangeText={(value) => setFieldValue('email', value)}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
          placeholder="funcionario@empresa.com"
        />
        <FormSelect
          label="Cargo"
          value={values.position}
          onValueChange={(value) => setFieldValue('position', value)}
          options={[
            { label: 'Selecione um cargo', value: '' },
            ...positionOptions,
          ]}
          error={errors.position}
          emptyOptionLabel="Selecione um cargo"
        />
        <FormField
          label="Usuario"
          value={values.username}
          onChangeText={(value) => setFieldValue('username', value)}
          autoCapitalize="none"
          error={errors.username}
          placeholder="usuario"
        />
        <FormField
          label="Senha"
          value={values.password ?? ''}
          onChangeText={(value) => setFieldValue('password', value)}
          error={errors.password}
          placeholder="Defina uma senha de acesso"
          secureTextEntry
        />

        <FormActions submitLabel="Cadastrar funcionario" onSubmit={() => { void handleSubmit(); }} submitting={submitting || loading} />
      </DetailSection>
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
