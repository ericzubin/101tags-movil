import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { brandColors } from '@/theme/tokens';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <Text style={styles.brand}>101tags</Text>
        <Text style={styles.tagline}>Compra local, compra fácil</Text>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Bienvenido</Text>
          <Text style={styles.cardBody}>
            Esta es la pantalla de inicio del cliente móvil 101tags. Aquí se mostrarán
            categorías, productos destacados y banners cuando se implemente F2.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: brandColors.medium,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    fontSize: 48,
    fontWeight: '800',
    color: brandColors.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: brandColors.dark,
    marginBottom: 32,
  },
  card: {
    backgroundColor: brandColors.white,
    padding: 24,
    borderRadius: 12,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: brandColors.dark,
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: brandColors.dark,
    lineHeight: 20,
  },
});
