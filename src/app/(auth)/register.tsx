import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors } from '@/theme/tokens';

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.title}>Crear cuenta</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor="#999"
            testID="register-name"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@correo.com"
            placeholderTextColor="#999"
            autoCapitalize="none"
            keyboardType="email-address"
            testID="register-email"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña (≥6 caracteres)</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#999"
            secureTextEntry
            testID="register-password"
          />
        </View>

        <Pressable
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
          onPress={() => router.replace('/(tabs)')}
          testID="register-submit"
        >
          <Text style={styles.buttonText}>Registrarme</Text>
        </Pressable>

        <Pressable onPress={() => router.back()} style={styles.linkButton}>
          <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: brandColors.medium },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
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
