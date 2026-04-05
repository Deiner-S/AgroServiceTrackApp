import AppShell from "@/components/appShell/AppShell";
import HeaderOSReadOnly from "@/components/checklistComponents/HeaderOSReadOnly";
import { useSync } from "@/contexts/syncContext";
import { useChecklistMaintenance } from "@/hooks/useChecklistFlow";
import { useNavigation } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Routes } from "../../routes";

export default function ChecklistMaintenanceScreen() {
  const navigation = useNavigation<any>();
  const { runSync } = useSync();
  const {
    workOrderParam,
    displayOrder,
    service,
    saving,
    serviceError,
    serviceEditorOpen,
    serviceDraft,
    saveService,
    openServiceEditor,
    closeServiceEditor,
    updateServiceDraft,
    applyServiceEditor,
  } = useChecklistMaintenance();

  async function handleSave() {
    const saved = await saveService();

    if (!saved) {
      return;
    }

    await runSync();
    navigation.navigate(Routes.HOME);
  }

  if (!workOrderParam) {
    return (
      <AppShell title="Manutencao" subtitle="Dados da ordem nao informados">
        <View style={styles.content}>
          <Text style={styles.errorText}>Ordem de servico nao informada.</Text>
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Manutencao"
      subtitle={`OS ${displayOrder?.operation_code ?? ""} - ${displayOrder?.client ?? ""}`}
    >
      <View style={styles.content}>
        {displayOrder ? <HeaderOSReadOnly workOrder={displayOrder} /> : null}

        <View style={styles.editorCard}>
          <Text style={styles.cardTitle}>Servico realizado</Text>
          <Text style={styles.cardSubtitle}>
            Registre de forma objetiva o que foi executado na manutencao.
          </Text>

          <Pressable
            onPress={openServiceEditor}
            style={({ pressed }) => [styles.inputPreview, serviceError && styles.inputPreviewError, pressed && styles.inputPreviewPressed]}
          >
            <Text style={service ? styles.inputPreviewText : styles.inputPreviewPlaceholder}>
              {service || "Toque para descrever o servico realizado..."}
            </Text>
            <Text style={styles.editHint}>Toque para editar</Text>
          </Pressable>
          {serviceError ? <Text style={styles.errorText}>{serviceError}</Text> : null}
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.submitButtonPressed,
              saving && styles.submitButtonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {saving ? "Salvando..." : "Salvar"}
            </Text>
          </Pressable>
        </View>
      </View>

      <Modal
        visible={serviceEditorOpen}
        transparent
        animationType="fade"
        onRequestClose={applyServiceEditor}
      >
        <KeyboardAvoidingView
          style={styles.modalKeyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable style={styles.modalBackdrop} onPress={applyServiceEditor}>
            <Pressable style={styles.modalCard} onPress={() => undefined}>
              <Text style={styles.modalTitle}>Editar servico realizado</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Descreva o servico realizado..."
                placeholderTextColor="#64748b"
                value={serviceDraft}
                onChangeText={updateServiceDraft}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                autoFocus
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={closeServiceEditor}
                  style={({ pressed }) => [
                    styles.modalActionButton,
                    styles.modalCancelButton,
                    pressed && styles.modalActionPressed,
                  ]}
                >
                  <Text style={styles.modalActionText}>Cancelar</Text>
                </Pressable>

                <Pressable
                  onPress={applyServiceEditor}
                  style={({ pressed }) => [
                    styles.modalActionButton,
                    styles.modalApplyButton,
                    pressed && styles.modalActionPressed,
                  ]}
                >
                  <Text style={styles.modalActionText}>Aplicar</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
  },
  editorCard: {
    borderRadius: 22,
    padding: 18,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    marginTop: 14,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 17,
    fontWeight: "700",
  },
  cardSubtitle: {
    color: "#94a3b8",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 14,
  },
  inputPreview: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    minHeight: 148,
    justifyContent: "space-between",
  },
  inputPreviewPressed: {
    opacity: 0.88,
  },
  inputPreviewError: {
    borderColor: "rgba(248, 113, 113, 0.75)",
  },
  inputPreviewText: {
    color: "#f8fafc",
    fontSize: 16,
    lineHeight: 24,
  },
  inputPreviewPlaceholder: {
    color: "#64748b",
    fontSize: 16,
  },
  editHint: {
    color: "#38bdf8",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "700",
  },
  footer: {
    marginBottom: 8,
  },
  submitButton: {
    width: "100%",
    minHeight: 54,
    backgroundColor: "#2563EB",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  errorText: {
    color: "#fca5a5",
    fontSize: 12,
    marginTop: 8,
  },
  modalKeyboardContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#0f172a",
    borderColor: "rgba(148, 163, 184, 0.18)",
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
  },
  modalTitle: {
    color: "#f8fafc",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.12)",
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    color: "#f8fafc",
    fontSize: 16,
    minHeight: 180,
  },
  modalActions: {
    marginTop: 14,
    flexDirection: "row",
    gap: 12,
  },
  modalActionButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "rgba(30, 41, 59, 0.86)",
  },
  modalApplyButton: {
    backgroundColor: "#2563EB",
  },
  modalActionPressed: {
    opacity: 0.85,
  },
  modalActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
