import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

const ROL_COLORS: Record<string, string> = {
  admin: '#dc2626',
  coach: '#2563eb',
  capitan: '#d97706',
  jugador: '#16a34a',
};

interface Stats {
  goles: number;
  amarillas: number;
  rojas: number;
  partidos: number;
}

export default function PerfilScreen() {
  const { user, logout } = useAuth();
  const [jugador, setJugador] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ goles: 0, amarillas: 0, rojas: 0, partidos: 0 });

  useEffect(() => {
    fetchPerfil();
  }, []);

  async function fetchPerfil() {
    try {
      if (!user?.equipo_id) return;
      const { data: jugadores } = await api.get(`/equipos/${user.equipo_id}/jugadores`);
      const miJugador = jugadores.find((j: any) => j.usuario_id === user.id);
      if (miJugador) {
        setJugador(miJugador);
        // Calcular stats desde los partidos
        const { data: jornadas } = await api.get('/jornadas');
        let goles = 0, amarillas = 0, rojas = 0, partidos = 0;
        for (const j of jornadas) {
          const { data: pts } = await api.get(`/jornadas/${j.id}/partidos`);
          for (const p of pts) {
            if (p.estado === 'finalizado') {
              const { data: st } = await api.get(`/partidos/${p.id}/stats`);
              const misGoles = st.goles.filter((g: any) => g.jugador_id === miJugador.id);
              const misTarjetas = st.tarjetas.filter((t: any) => t.jugador_id === miJugador.id);
              goles += misGoles.length;
              amarillas += misTarjetas.filter((t: any) => t.tipo === 'amarilla').length;
              rojas += misTarjetas.filter((t: any) => t.tipo === 'roja').length;
              partidos++;
            }
          }
        }
        setStats({ goles, amarillas, rojas, partidos });
      }
    } catch {
      // ignore
    }
  }

  async function handleLogout() {
    await logout();
    router.replace('/(auth)/login');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.nombre}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={[styles.rolBadge, { backgroundColor: ROL_COLORS[user?.rol || ''] || Colors.primary }]}>
          <Text style={styles.rolText}>{user?.rol?.toUpperCase()}</Text>
        </View>
      </View>

      {jugador && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos de Jugador</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Dorsal</Text>
            <Text style={styles.value}>#{jugador.dorsal ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Posición</Text>
            <Text style={styles.value}>{jugador.posicion || 'Sin asignar'}</Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Estadísticas</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="football" size={24} color={Colors.primary} />
            <Text style={styles.statNum}>{stats.goles}</Text>
            <Text style={styles.statLabel}>Goles</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.tarjeta, { backgroundColor: Colors.yellow }]} />
            <Text style={styles.statNum}>{stats.amarillas}</Text>
            <Text style={styles.statLabel}>Amarillas</Text>
          </View>
          <View style={styles.statBox}>
            <View style={[styles.tarjeta, { backgroundColor: Colors.red }]} />
            <Text style={styles.statNum}>{stats.rojas}</Text>
            <Text style={styles.statLabel}>Rojas</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="calendar" size={24} color={Colors.primary} />
            <Text style={styles.statNum}>{stats.partidos}</Text>
            <Text style={styles.statLabel}>Partidos</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={Colors.danger} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16 },
  header: { alignItems: 'center', paddingVertical: 24, backgroundColor: Colors.white, borderRadius: 16, marginBottom: 16, elevation: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: Colors.text },
  email: { fontSize: 14, color: Colors.gray, marginTop: 4 },
  rolBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 },
  rolText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  label: { fontSize: 14, color: Colors.gray },
  value: { fontSize: 14, fontWeight: '600', color: Colors.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statBox: { width: '46%' as any, alignItems: 'center', padding: 16, backgroundColor: Colors.background, borderRadius: 12 },
  statNum: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 6 },
  statLabel: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  tarjeta: { width: 18, height: 24, borderRadius: 3 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, marginTop: 8 },
  logoutText: { fontSize: 16, color: Colors.danger, fontWeight: '600' },
});
