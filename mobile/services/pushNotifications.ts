import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permisos y registra el push token en el backend.
 * Llamar después del login exitoso.
 */
export async function registerPushToken(): Promise<void> {
  if (!Device.isDevice) return; // Simulador no soporta push

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[push] Permisos no concedidos');
    return;
  }

  // Android necesita canal de notificaciones
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Escarabajos Liga',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a472a',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('[push] No projectId — configura eas.projectId en app.json');
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const push_token = tokenData.data;

  try {
    await api.post('/auth/push-token', { push_token });
    console.log('[push] Token registrado:', push_token.slice(0, 30) + '...');
  } catch (err) {
    console.error('[push] Error guardando token:', err);
  }
}

/**
 * Elimina el push token al hacer logout.
 */
export async function unregisterPushToken(): Promise<void> {
  try {
    await api.delete('/auth/push-token');
  } catch {
    // silencioso en logout
  }
}
