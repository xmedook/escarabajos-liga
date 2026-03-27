import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import api from '../../../services/api';

interface Jornada {
  id: number;
  numero: number;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Partido {
  id: number;
  equipo_local_nombre: string;
  equipo_visitante_nombre: string;
  goles_local: number;
  goles_visitante: number;
  fecha: string;
  hora: string;
  lugar: string;
  estado: string;
}

export default function FixturesScreen() {
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [selectedJornada, setSelectedJornada] = useState<number | null>(null);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJornadas = useCallback(async () => {
    try {
      const { data } = await api.get('/jornadas');
      setJornadas(data);
      if (data.length > 0 && !selectedJornada) {
        setSelectedJornada(data[0].id);
      }
    } catch {
      // ignore
    }
  }, [selectedJornada]);

  useEffect(() => { fetchJornadas(); }, [fetchJornadas]);

  useEffect(() => {
    if (selectedJornada) {
      api.get(`/jornadas/${selectedJornada}/partidos`).then(({ data }) => setPartidos(data)).catch(() => {});
    }
  }, [selectedJornada]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchJornadas();
    if (selectedJornada) {
      const { data } = await api.get(`/jornadas/${selectedJornada}/partidos`);
      setPartidos(data);
    }
    setRefreshing(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={styles.tab} onPress={() => router.push('/(app)/liga')}>
          <Text style={styles.tabText}>Tabla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Jornadas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={jornadas}
        keyExtractor={(j) => j.id.toString()}
        showsHorizontalScrollIndicator={false}
        style={styles.jornadaList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.jornadaChip, selectedJornada === item.id && styles.jornadaChipActive]}
            onPress={() => setSelectedJornada(item.id)}
          >
            <Text style={[styles.jornadaText, selectedJornada === item.id && styles.jornadaTextActive]}>
              J{item.numero}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={partidos}
        keyExtractor={(p) => p.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.matchCard}>
            <View style={styles.matchTeams}>
              <Text style={styles.teamName} numberOfLines={1}>{item.equipo_local_nombre}</Text>
              <View style={styles.scoreBox}>
                <Text style={styles.score}>
                  {item.estado === 'programado' ? 'vs' : `${item.goles_local} - ${item.goles_visitante}`}
                </Text>
              </View>
              <Text style={[styles.teamName, { textAlign: 'right' }]} numberOfLines={1}>{item.equipo_visitante_nombre}</Text>
            </View>
            <Text style={styles.matchInfo}>
              {item.fecha ? new Date(item.fecha).toLocaleDateString('es-ES') : ''} {item.hora ? `· ${item.hora.slice(0, 5)}` : ''} {item.lugar ? `· ${item.lugar}` : ''}
            </Text>
            <View style={[styles.statusBadge, item.estado === 'finalizado' && styles.statusFinalizado, item.estado === 'en_curso' && styles.statusEnCurso]}>
              <Text style={styles.statusText}>
                {item.estado === 'programado' ? 'Programado' : item.estado === 'en_curso' ? 'En curso' : 'Finalizado'}
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay partidos en esta jornada</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 3, borderBottomColor: Colors.primary },
  tabText: { fontSize: 15, color: Colors.gray, fontWeight: '600' },
  tabTextActive: { color: Colors.primary },
  jornadaList: { backgroundColor: Colors.white, paddingVertical: 8, maxHeight: 52 },
  jornadaChip: { paddingHorizontal: 16, paddingVertical: 8, marginHorizontal: 4, borderRadius: 20, backgroundColor: Colors.lightGray },
  jornadaChipActive: { backgroundColor: Colors.primary },
  jornadaText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  jornadaTextActive: { color: Colors.white },
  matchCard: { backgroundColor: Colors.white, borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  matchTeams: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  teamName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text },
  scoreBox: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: Colors.primary, borderRadius: 8, marginHorizontal: 8 },
  score: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  matchInfo: { fontSize: 12, color: Colors.gray, marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: Colors.lightGray },
  statusFinalizado: { backgroundColor: '#e8f5e9' },
  statusEnCurso: { backgroundColor: '#fff3e0' },
  statusText: { fontSize: 11, fontWeight: '600', color: Colors.text },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray, fontSize: 15 },
});
