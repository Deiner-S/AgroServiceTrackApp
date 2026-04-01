import { useAuth } from '@/contexts/authContext'
import { sanitizeOnlyLowercaseLetters, validateLoginPayload } from '@/utils/validation'
import { MaterialIcons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

export default function Login() {
  console.log('LOGIN RENDERIZOU')

  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { login } = useAuth()

  async function handleLogin() {
    try {
      const credentials = validateLoginPayload({ username: user, password })

      await login(credentials.username, credentials.password)
      router.replace('/(stack)/homeScreen')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Dados de login inválidos.'
      Alert.alert('Login', message)
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="User"
        placeholderTextColor="#d1d5db"
        value={user}
        onChangeText={(value) => setUser(sanitizeOnlyLowercaseLetters(value))}
        autoCapitalize="none"
      />

      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#d1d5db"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />

        <Pressable onPress={() => setShowPassword((p) => !p)}>
          <MaterialIcons
            name={showPassword ? 'visibility-off' : 'visibility'}
            size={22}
            color="#6b7280"
          />
        </Pressable>
      </View>

      <Pressable
        onPress={handleLogin}
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
      >
        <Text style={styles.text}>Entrar</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2e3238',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: 320,
    height: 52,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#fff',
    fontSize: 16,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    height: 52,
    marginBottom: 16,

    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',

    paddingHorizontal: 12,

    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  passwordInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
  },

  eye: {
    fontSize: 18,
    paddingHorizontal: 6,
  },

  button: {
    width: '100%',
    maxWidth: 320,
    height: 52,

    backgroundColor: '#2563EB',
    borderRadius: 12,

    alignItems: 'center',
    justifyContent: 'center',

    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  buttonPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },

  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
