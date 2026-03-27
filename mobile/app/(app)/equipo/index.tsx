import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface Jugador {
  id: number;
  nombre: string;
  apellido: string;
  dorsal: number;
  posicion: string;
}

export default function EquipoScreen() {
  const { user } = useAuth();
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJugadores = useCallback(async () => {
    if (!user?.equipo_id) return;
    try {
      const { data } = await api.get(`/equipos/${user.equipo_id}/jugadores`);
      setJugadores(data);
    } catch {
      // ignore
    }
  }, [user?.equipo_id]);

  useEffect(() => { fetchJugadores(); }, [fetchJugadores]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchJugadores();
    setRefreshing(false);
  }

  const posicionIcon = (pos: string) => {
    switch (pos?.toLowerCase()) {
      case 'portero': return 'hand-left';
      case 'defensa': return 'shield';
      case 'mediocampista': return 'swap-horizontal';
      case 'delantero': return 'arrow-up';
      default: return 'football';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={jugadores}
        keyExtractor={(j) => j.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.dorsalBox}>
              <Text style={styles.dorsal}>{item.dorsal ?? '-'}</Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.nombre} {item.apellido}</Text>
              <View style={styles.posRow}>
                <Ionicons name={posicionIcon(item.posicion) as any} size={14} color={Colors.gray} />
                <Text style={styles.posicion}> {item.posicion || 'Sin posición'}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color={Colors.gray} />
            <Text style={styles.empty}>No hay jugadores en tu equipo</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  dorsalBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  dorsal: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: Colors.text },
  posRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  posicion: { fontSize: 13, color: Colors.gray },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  empty: { textAlign: 'center', marginTop: 12, color: Colors.gray, fontSize: 15 },
});
