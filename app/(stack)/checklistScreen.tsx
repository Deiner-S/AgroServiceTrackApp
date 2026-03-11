import ChecklistBox from '@/components/checklistComponents/checkListBox';
import HeaderOS from '@/components/checklistComponents/HeaderOS';
import Signature from '@/components/checklistComponents/signature';
import useCheckListHook from '@/hooks/checkListHook';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import React from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Routes } from '../routes';

export default function CheckList() {
  
  const checkList = useCheckListHook()
  const navigation = useNavigation<any>();
  const hasSignature = !!checkList.signature;

  async function handleSave() {
      try {
        const checklistPayload = checkList.buildChecklistPayload("1");
        await checkList.saveData(checklistPayload);
        navigation.navigate(Routes.HOME); 
      } catch (error) {
        console.error("Erro ao salvar formulário", error);
      }
    }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }} edges={['left', 'right', 'bottom']}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
        <HeaderOS
            client={checkList.workOrder.client}
            operation_code={checkList.workOrder.operation_code}
            symptoms={checkList.workOrder.symptoms}
            chassi={checkList.chassi}
            setChassi={checkList.setChassi}
            orimento={checkList.horimetro}
            setOrimento={(value) => checkList.setHorimetro(Number(value) || 0)}
            modelo={checkList.modelo}
            setModelo={checkList.setModelo}
            dateFilled={checkList.dateFilled}
            openCalendar={checkList.openCalendar}
            setOpen={checkList.setOpen}
            onChange={checkList.onChange}
          />

          <View style={styles.divider} />
          
          {checkList.checklistItems.map(item => (
            <ChecklistBox
              key={item.id}
              checkList={item.name}
              selected={checkList.checklistState.find(i => i.id === item.id)?.selected ?? null}
              setSelected={(value) => checkList.setItemSelected(item.id, value)}
              handleTakePhoto={() => checkList.takePhoto(item.id)}
              photoUri={checkList.checklistState.find(i => i.id === item.id)?.photoUri ?? null}
            />
          ))}
          <View style={styles.content}>
            <Pressable
              disabled={hasSignature}
              style={({ pressed }) => [
                styles.signatureButton,
                hasSignature && styles.signatureButtonDone,
                !hasSignature && pressed && styles.signatureButtonPressed,
              ]}
              onPress={() => {
                if (!hasSignature) checkList.setOpenSignature(true);
              }}
            >
              <View style={styles.signatureContent}>
                {hasSignature && (
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#14532d"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.buttonText}>
                  {hasSignature ? 'Assinado' : 'Assinar'}
                </Text>
              </View>
            </Pressable>
          </View>
          <Modal visible={checkList.openSignature} animationType="slide">
            <Signature
              setSignature={checkList.setSignature}
              onClose={() => checkList.setOpenSignature(false)}
            />
          </Modal>

          <View style={styles.divider} />

          <View style={styles.content}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.submitButtonPressed
                ]}
                onPress={handleSave}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </Pressable>
            </View>

      </ScrollView>
  </SafeAreaView>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
    paddingHorizontal: 24,
    paddingTop: 32,    
  },
  
  divider: {
    height: 2,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.2)", // levemente opaca
    borderRadius: 2,
    marginVertical: 12,
  },

  content: {
    padding: 16,
    alignItems: "center",
  },

  signatureButton: {
    width: "100%",
    maxWidth: 320,
    height: 52,

    backgroundColor: "#FDE68A", // amarelo pastel
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  signatureButtonDone: {
    backgroundColor: "#4ade80",
  },

  signatureButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  signatureContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  submitButton: {
    width: "100%",
    maxWidth: 320,
    height: 52,

    backgroundColor: "#2563EB", // azul elegante
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    elevation: 3, // Android shadow
    shadowColor: "#000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  submitButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
});

