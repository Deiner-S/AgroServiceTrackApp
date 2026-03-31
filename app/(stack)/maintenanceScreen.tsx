import HeaderOSReadOnly from "@/components/checklistComponents/HeaderOSReadOnly";
import { useSync } from "@/contexts/syncContext";
import useMaintenanceHook from "@/hooks/maintenanceHook";
import WorkOrder from "@/models/WorkOrder";
import WorkOrderRepository from "@/repository/WorkOrderRepository";
import { executeControllerTask } from "@/services/controllerErrorService";
import { useRoute } from "@react-navigation/native";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Routes } from "../routes";

export default function MaintenanceScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const { runSync } = useSync();
  const { workOrder: workOrderParam } = (route.params ?? {}) as { workOrder: WorkOrder };
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(workOrderParam ?? null);
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [serviceDraft, setServiceDraft] = useState("");

  useEffect(() => {
    if (!workOrderParam?.operation_code) return;
    let cancelled = false;
    (async () => {
      try {
        const repo = await WorkOrderRepository.build();
        const loaded = await repo.getById(workOrderParam.operation_code);
        if (!cancelled && loaded) setWorkOrder(loaded);
      } catch (_) {
        if (!cancelled && workOrderParam) setWorkOrder(workOrderParam);
      }
    })();
    return () => { cancelled = true; };
  }, [workOrderParam?.operation_code]);

  const displayOrder = workOrder ?? workOrderParam ?? ({} as WorkOrder);
  const { service, setService, saveService, saving } = useMaintenanceHook(displayOrder);

  useEffect(() => {
    if (!serviceEditorOpen) {
      setServiceDraft(service);
    }
  }, [service, serviceEditorOpen]);

  function openServiceEditor() {
    setServiceDraft(service);
    setServiceEditorOpen(true);
  }

  function applyServiceEditor() {
    setService(serviceDraft);
    setServiceEditorOpen(false);
  }

  async function handleSave() {
    await executeControllerTask(async () => {
      await saveService();
      await runSync();
      navigation.navigate(Routes.HOME);
    }, {
      operation: 'salvar serviço',
    });
  }

  if (!workOrderParam) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Ordem de serviÃ§o nÃ£o informada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["left", "right", "bottom"]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <HeaderOSReadOnly workOrder={displayOrder} />

        <View style={styles.divider} />

        <Text style={styles.label}>ServiÃ§o realizado:</Text>
        <Pressable
          onPress={openServiceEditor}
          style={({ pressed }) => [styles.inputPreview, pressed && styles.inputPreviewPressed]}
        >
          <Text style={service ? styles.inputPreviewText : styles.inputPreviewPlaceholder}>
            {service || "Toque para descrever o serviÃ§o realizado..."}
          </Text>
          <Text style={styles.editHint}>Toque para editar</Text>
        </Pressable>

        <View style={styles.divider} />

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
      </ScrollView>

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
          <Pressable
            style={styles.modalBackdrop}
            onPress={applyServiceEditor}
          >
            <Pressable style={styles.modalCard} onPress={() => undefined}>
              <Text style={styles.modalTitle}>Editar serviÃ§o realizado</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Descreva o serviÃ§o realizado..."
                placeholderTextColor="#8e8e93"
                value={serviceDraft}
                onChangeText={setServiceDraft}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
                autoFocus
              />

              <View style={styles.modalActions}>
                <Pressable
                  onPress={() => setServiceEditorOpen(false)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  errorText: {
    color: "#ccc",
    padding: 24,
  },
  label: {
    color: "#fff",
    marginBottom: 8,
    fontSize: 14,
  },
  inputPreview: {
    borderWidth: 1,
    borderColor: "#3a3f45",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#2e3238",
    minHeight: 120,
    justifyContent: "space-between",
  },
  inputPreviewPressed: {
    opacity: 0.9,
  },
  inputPreviewText: {
    color: "#fff",
    fontSize: 16,
  },
  inputPreviewPlaceholder: {
    color: "#8e8e93",
    fontSize: 16,
  },
  editHint: {
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 8,
  },
  divider: {
    height: 2,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginVertical: 12,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  submitButton: {
    width: "100%",
    maxWidth: 320,
    height: 52,
    backgroundColor: "#2563EB",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
  modalKeyboardContainer: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#25292e",
    borderColor: "#3a3f45",
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#3a3f45",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#2e3238",
    color: "#fff",
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
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#3a3f45",
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
