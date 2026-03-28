import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2d6a4f' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Panel Admin', headerShown: false }} />
      <Stack.Screen name="usuarios" options={{ title: 'Gestionar Usuarios' }} />
      <Stack.Screen name="equipos" options={{ title: 'Equipos' }} />
      <Stack.Screen name="jugadores" options={{ title: 'Jugadores' }} />
      <Stack.Screen name="jornadas" options={{ title: 'Jornadas y Partidos' }} />
    </Stack>
  );
}
