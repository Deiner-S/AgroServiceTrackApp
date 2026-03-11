import { useAuth } from '@/contexts/authContext'
import { useSync } from '@/contexts/syncContext'
import { MaterialIcons } from '@expo/vector-icons'
import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, TouchableOpacity, View } from 'react-native'
import { Routes } from '../routes'



export default function StackLayout() {
  console.log('StackLayout Renderizou')

  const { loged, loading } = useAuth()
  const { runSync } = useSync()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  if (!loged) {
    return <Redirect href={Routes.LOGIN} />
  }

  return (
    <Stack>
      <Stack.Screen
        name={Routes.HOME}
        options={{
          title:"Home",
          headerRight: () => (            
            <TouchableOpacity onPress={runSync}>
              <MaterialIcons name="sync" size={24} color="#000" />
            </TouchableOpacity>            
          ),
        }}
      />
      <Stack.Screen name={Routes.CHECKLIST} options={{title:"Check list"}}/>
      <Stack.Screen name={Routes.DELIVERY_CHECKLIST} options={{ title: "Checklist de entrega" }} />
      <Stack.Screen name={Routes.MAINTENANCE} options={{ title: "Manutenção" }} />
    </Stack>
  )
}
