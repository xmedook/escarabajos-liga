import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';

interface EquipoRow {
  id: number;
  nombre: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  dif: number;
  pts: number;
}

export default function TablaPosiciones() {
  const { user } = useAuth();
  const [tabla, setTabla] = useState<EquipoRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTabla = useCallback(async () => {
    try {
      const { data } = await api.get('/tabla-posiciones');
      setTabla(data);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => { fetchTabla(); }, [fetchTabla]);

  async function onRefresh() {
    setRefreshing(true);
    await fetchTabla();
    setRefreshing(false);
  }

  const Header = () => (
    <View style={styles.headerRow}>
      <Text style={[styles.cell, styles.posCell, styles.headerText]}>#</Text>
      <Text style={[styles.cell, styles.nameCell, styles.headerText]}>Equipo</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>PJ</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>PG</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>PE</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>PP</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>GF</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>GC</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>DIF</Text>
      <Text style={[styles.cell, styles.numCell, styles.headerText]}>PTS</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Tabla</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tab} onPress={() => router.push('/(app)/liga/fixtures')}>
          <Text style={styles.tabText}>Jornadas</Text>
        </TouchableOpacity>
      </View>

      <Header />
      <FlatList
        data={tabla}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        renderItem={({ item, index }) => {
          const isMyTeam = item.id === user?.equipo_id;
          return (
            <View style={[styles.row, isMyTeam && styles.myTeamRow]}>
              <Text style={[styles.cell, styles.posCell]}>{index + 1}</Text>
              <Text style={[styles.cell, styles.nameCell, isMyTeam && styles.myTeamText]} numberOfLines={1}>{item.nombre}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.pj}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.pg}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.pe}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.pp}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.gf}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.gc}</Text>
              <Text style={[styles.cell, styles.numCell]}>{item.dif}</Text>
              <Text style={[styles.cell, styles.numCell, styles.ptsCell]}>{item.pts}</Text>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No hay datos de la liga aún</Text>}
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
  headerRow: { flexDirection: 'row', backgroundColor: Colors.primary, paddingVertical: 10, paddingHorizontal: 8 },
  headerText: { color: Colors.white, fontWeight: 'bold', fontSize: 11 },
  row: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  myTeamRow: { backgroundColor: '#e8f5e9' },
  myTeamText: { fontWeight: 'bold', color: Colors.primary },
  cell: { fontSize: 13, color: Colors.text },
  posCell: { width: 24, textAlign: 'center' },
  nameCell: { flex: 1, paddingHorizontal: 4 },
  numCell: { width: 28, textAlign: 'center' },
  ptsCell: { fontWeight: 'bold', color: Colors.primary },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray, fontSize: 15 },
});
