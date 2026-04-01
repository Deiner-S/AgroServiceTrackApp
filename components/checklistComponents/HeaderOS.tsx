import DateTimePicker from "@react-native-community/datetimepicker";
import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  sanitizeOnlyLettersAndNumbers,
  sanitizeOnlyNumbers,
} from "@/utils/validation";

interface CabecalhoOSProps {
  client: string;
  operation_code: string;
  symptoms: string;
  chassi: string;
  setChassi: (value: string) => void;
  orimento: number;
  setOrimento: (value: string) => void;
  modelo: string;
  setModelo: (value: string) => void;
  dateFilled: Date;
  openCalendar: boolean;
  setOpen: (value: boolean) => void;
  onChange: (_event: any, selectedDate?: Date) => void;
}

export default function HeaderOS({
  client,  operation_code,  symptoms,  chassi,
  setChassi,  orimento,  setOrimento,  modelo,  setModelo,
  dateFilled, openCalendar,  setOpen,  onChange,
}: CabecalhoOSProps) {
  return (
    <View style={{ flex: 1 }}>
      <View style={styles.content}>
        <Text style={styles.label}>Cliente:</Text>
        <Text style={styles.text}>{client}</Text>

        <Text style={styles.label}>Ordem de Serviço:</Text>
        <Text style={styles.text}>{operation_code}</Text>

        <Text style={styles.label}>Problema relatado:</Text>
        <Text style={styles.text}>{symptoms}</Text>

        <TextInput
          style={styles.input}
          placeholder="Chassi"
          placeholderTextColor="#8e8e93"
          value={chassi}
          onChangeText={(value) => setChassi(sanitizeOnlyLettersAndNumbers(value).toUpperCase())}
          autoCapitalize="characters"
          maxLength={17}
        />

        <TextInput
          style={styles.input}
          placeholder="Horimetro"
          placeholderTextColor="#8e8e93"
          value={orimento}
          onChangeText={(value) => setOrimento(sanitizeOnlyNumbers(value))}
          keyboardType="numeric"
        />

        <TextInput
          style={styles.input}
          placeholder="Modelo"
          placeholderTextColor="#8e8e93"
          value={modelo}
          onChangeText={(value) => setModelo(sanitizeOnlyLettersAndNumbers(value))}
        />

        <Pressable
          onPress={() => setOpen(true)}
          style={styles.dateButton}
        >
          <Text style={{ color: "#fff" }}>
            {dateFilled.toLocaleDateString("pt-BR")}
          </Text>
        </Pressable>

        {openCalendar && (
          <DateTimePicker
            value={dateFilled}
            mode="date"
            display="default"
            onChange={onChange}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 6,
  },
  label: {
    color: "#fff",
    marginBottom: 6,
    fontSize: 14,
  },
  text: {
    color: "#ccc",
    backgroundColor: "#333",
    padding: 10,
    borderRadius: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#3a3f45",
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#2e3238",
    color: "#fff",
    fontSize: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  dateButton: {
    backgroundColor: "#2e3238",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#3a3f45",
  },
});
