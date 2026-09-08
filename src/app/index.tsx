import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text accessibilityRole="header" style={styles.eyebrow}>
          SETLIST
        </Text>
        <Text style={styles.title}>Base multiplataforma pronta</Text>
        <Text style={styles.description}>
          O mesmo projeto está preparado para Android, iOS e navegador.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#ddd6fe',
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 560,
    padding: 32,
    width: '100%',
  },
  eyebrow: {
    color: '#6d28d9',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  title: {
    color: '#17111f',
    fontSize: 32,
    fontWeight: '700',
    marginTop: 12,
  },
  description: {
    color: '#5b5366',
    fontSize: 18,
    lineHeight: 27,
    marginTop: 12,
  },
});
