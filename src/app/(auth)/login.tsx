import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors } from '@/theme/tokens';

/**
 * Login screen — scaffold M0.4-PIVOT.
 * Functional login lands in M1.3.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.brand}>101tags</Text>
        <Text style={styles.title}>Inicia sesión</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            placeholder="tu@correo.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            testID="login-email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            testID="login-password"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/(tabs)')}
          testID="login-submit"
        >
          <Text style={styles.buttonText}>Entrar</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(auth)/register')}
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brandColors.medium },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  brand: {
    fontSize: 32,
    fontWeight: '800',
    color: brandColors.primary,
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: brandColors.dark,
    marginBottom: 24,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 14, color: brandColors.dark, marginBottom: 6 },
  input: {
    backgroundColor: brandColors.white,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: brandColors.dark,
  },
  button: {
    backgroundColor: brandColors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonPressed: { opacity: 0.85 },
  buttonText: { color: brandColors.white, fontSize: 16, fontWeight: '700' },
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { color: brandColors.primary, fontSize: 14 },
});
