import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function AppLayout() {
  const { user } = useAuth();
  const isAdmin = user?.rol === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: { backgroundColor: Colors.white, borderTopColor: Colors.border },
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.white,
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tabs.Screen
        name="liga"
        options={{
          title: 'Liga',
          headerTitle: 'Escarabajos Liga',
          tabBarIcon: ({ color, size }) => <Ionicons name="trophy" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="equipo"
        options={{
          title: 'Mi Equipo',
          tabBarIcon: ({ color, size }) => <Ionicons name="football" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="partido"
        options={{
          title: 'Partido',
          tabBarIcon: ({ color, size }) => <Ionicons name="clipboard" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark" size={size} color={color} />,
          href: isAdmin ? undefined : null,
        }}
      />
    </Tabs>
  );
}
