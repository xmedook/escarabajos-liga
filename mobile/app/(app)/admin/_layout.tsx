import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Panel Admin', headerShown: false }} />
      <Stack.Screen name="usuarios" options={{ title: 'Gestionar Usuarios' }} />
    </Stack>
  );
}
