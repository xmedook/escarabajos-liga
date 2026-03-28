import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const equiposApi = {
  list: () => api.get('/equipos'),
  create: (data: { nombre: string; color_primario?: string; color_secundario?: string; escudo_url?: string }) =>
    api.post('/equipos', data),
  update: (id: number, data: Partial<{ nombre: string; color_primario: string; color_secundario: string; escudo_url: string }>) =>
    api.put(`/equipos/${id}`, data),
  delete: (id: number) => api.delete(`/equipos/${id}`),
};

export const jugadoresApi = {
  list: (equipo_id?: number) =>
    api.get('/jugadores', { params: equipo_id ? { equipo_id } : {} }),
  create: (data: { nombre: string; apellido: string; dorsal: number; posicion: string; equipo_id: number }) =>
    api.post('/jugadores', data),
  update: (id: number, data: Partial<{ nombre: string; apellido: string; dorsal: number; posicion: string; equipo_id: number }>) =>
    api.put(`/jugadores/${id}`, data),
  delete: (id: number) => api.delete(`/jugadores/${id}`),
};

export const jornadasApi = {
  list: () => api.get('/jornadas'),
  create: (data: { numero: number; fecha_inicio: string; fecha_fin: string; temporada?: string }) =>
    api.post('/jornadas', data),
  partidos: (id: number) => api.get(`/jornadas/${id}/partidos`),
  crearPartido: (jornadaId: number, data: { equipo_local_id: number; equipo_visitante_id: number; fecha: string; hora: string; lugar: string }) =>
    api.post(`/jornadas/${jornadaId}/partidos`, data),
  actualizarPartido: (partidoId: number, data: Partial<{ fecha: string; hora: string; lugar: string; goles_local: number; goles_visitante: number; estado: string }>) =>
    api.put(`/partidos/${partidoId}`, data),
};

export default api;
