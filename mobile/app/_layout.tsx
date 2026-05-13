import { Slot, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

function NotificationHandler() {
  const router = useRouter();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Cuando el usuario toca una notificación
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data as Record<string, string>;
      if (data?.screen === 'partido') router.push('/(app)/partido');
      else if (data?.screen === 'liga')  router.push('/(app)/liga');
      else if (data?.screen === 'equipo') router.push('/(app)/equipo');
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <NotificationHandler />
      <Slot />
    </AuthProvider>
  );
}
