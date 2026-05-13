import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { registerPushToken, unregisterPushToken } from '../services/pushNotifications';

interface User {
  id: number;
  email: string;
  nombre: string;
  rol: 'admin' | 'coach' | 'capitan' | 'jugador';
  equipo_id: number | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
}

const PERMISSIONS: Record<string, string[]> = {
  admin: ["*"],
  coach: [
    "ver:tabla", "ver:fixtures", "ver:alineacion", "ver:asistencia_equipo",
    "editar:alineacion", "confirmar:asistencia_propia", "confirmar:asistencia_equipo",
    "registrar:resultado", "registrar:goles", "registrar:tarjetas"
  ],
  capitan: [
    "ver:tabla", "ver:fixtures", "ver:alineacion",
    "confirmar:asistencia_propia", "confirmar:asistencia_equipo"
  ],
  jugador: [
    "ver:tabla", "ver:fixtures", "ver:alineacion",
    "confirmar:asistencia_propia"
  ],
};

function checkPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const perms = PERMISSIONS[user.rol] || [];
  return perms.includes("*") || perms.includes(permission);
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem('token'),
        AsyncStorage.getItem('user'),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    await AsyncStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    // Registrar push token en segundo plano (no bloquea el login)
    registerPushToken().catch(() => {});
  }

  async function logout() {
    await unregisterPushToken();
    await AsyncStorage.multiRemove(['token', 'user']);
    setToken(null);
    setUser(null);
  }

  const can = useCallback((permission: string) => checkPermission(user, permission), [user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
