import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import AdminCard from '../../../components/AdminCard';
import { equiposApi, jugadoresApi, jornadasApi } from '../../../services/api';

export default function AdminPanel() {
  const [stats, setStats] = useState({ equipos: 0, jugadores: 0, jornadas: 0 });

  useEffect(() => {
    Promise.all([
      equiposApi.list().then(r => r.data.length).catch(() => 0),
      jugadoresApi.list().then(r => r.data.length).catch(() => 0),
      jornadasApi.list().then(r => r.data.length).catch(() => 0),
    ]).then(([equipos, jugadores, jornadas]) => setStats({ equipos, jugadores, jornadas }));
  }, []);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🛡️</Text>
        <Text style={styles.title}>Panel Admin Liga</Text>
        <Text style={styles.subtitle}>Gestiona equipos, jugadores y jornadas</Text>
      </View>

      <View style={styles.grid}>
        <AdminCard
          emoji="🏆"
          title="Equipos"
          count={stats.equipos}
          onPress={() => router.push('/(app)/admin/equipos')}
        />
        <AdminCard
          emoji="⚽"
          title="Jugadores"
          count={stats.jugadores}
          onPress={() => router.push('/(app)/admin/jugadores')}
        />
        <AdminCard
          emoji="📅"
          title="Jornadas"
          count={stats.jornadas}
          onPress={() => router.push('/(app)/admin/jornadas')}
        />
        <AdminCard
          emoji="👥"
          title="Usuarios"
          onPress={() => router.push('/(app)/admin/usuarios')}
        />
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.statsTitle}>Resumen rápido</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.equipos}</Text>
            <Text style={styles.statLabel}>Equipos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.jugadores}</Text>
            <Text style={styles.statLabel}>Jugadores</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.jornadas}</Text>
            <Text style={styles.statLabel}>Jornadas</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1a13' },
  header: {
    backgroundColor: '#2d6a4f',
    padding: 28,
    alignItems: 'center',
    gap: 4,
  },
  headerEmoji: { fontSize: 44 },
  title: { color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
  subtitle: { color: '#a7c4a7', fontSize: 14, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    justifyContent: 'center',
  },
  statsSection: {
    backgroundColor: '#1a2e1f',
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
  },
  statsTitle: { color: '#52b788', fontSize: 16, fontWeight: '700', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { color: '#ffffff', fontSize: 28, fontWeight: 'bold' },
  statLabel: { color: '#a7c4a7', fontSize: 12, marginTop: 4 },
});
