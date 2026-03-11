import { Routes } from "@/app/routes";
import WorkOrder from "@/models/WorkOrder";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface OsCardProps {
  item: WorkOrder
}
const STATUS_LABEL: Record<string, string> = {
  "1": "Pendente",
  "2": "Em andamento",
  "3": "Entrega",
  "4": "Finalizada",
};



export default function OsCard({ item }: OsCardProps) {
  const navigation = useNavigation<any>();
  const targetRoute = item.status === "1"
    ? Routes.CHECKLIST
    : item.status === "2"
      ? Routes.MAINTENANCE
      : item.status === "3"
        ? Routes.DELIVERY_CHECKLIST
        : Routes.CHECKLIST;
  return (
      <Pressable
        onPress={() => navigation.navigate(targetRoute, { workOrder: item })}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressablePressed,
          pressed && { transform: [{ scale: 0.97 }] },
        ]}>
      
        <View style={styles.row}>         
          <Text style={[styles.text, styles.operationCode]}>OS - {item.operation_code}</Text>      
          <Text
            style={[
              styles.status,
              STATUS_STYLE[String(item.status)] ?? styles.statusFinalizada,
            ]}
          >
            {STATUS_LABEL[String(item.status)] ?? item.status}
          </Text>         
        </View>

      </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },

  pressablePressed: {
    opacity: 0.85,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  text: {
    color: '#1c1c1e',
  },

  operationCode: {
    fontSize: 16,
    fontWeight: '600',
  },

  status: {
    fontSize: 14,
    fontWeight: '500',
  },

  statusPendente: {
    color: "#e53935",
  },
  statusAndamento: {
    color: "#f9a825",
  },
  statusEntrega: {
    color: "#2196f3",
  },
  statusFinalizada: {
    color: "#9e9e9e",
  },
});

const STATUS_STYLE: Record<string, object> = {
  "1": styles.statusPendente,
  "2": styles.statusAndamento,
  "3": styles.statusEntrega,
  "4": styles.statusFinalizada,
};