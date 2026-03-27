import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Modal, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../constants/colors';
import api from '../../../services/api';

interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: string;
  equipo_id: number | null;
  equipo_nombre: string | null;
}

interface Equipo {
  id: number;
  nombre: string;
}

const ROLES = ['admin', 'coach', 'capitan', 'jugador'] as const;

const ROL_COLORS: Record<string, string> = {
  admin: '#dc2626',
  coach: '#2563eb',
  capitan: '#d97706',
  jugador: '#16a34a',
};

export default function UsuariosScreen() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [modalRol, setModalRol] = useState<Usuario | null>(null);
  const [modalEquipo, setModalEquipo] = useState<Usuario | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [u, e] = await Promise.all([
        api.get('/admin/usuarios'),
        api.get('/equipos'),
      ]);
      setUsuarios(u.data);
      setEquipos(e.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, []);

  async function cambiarRol(userId: number, rol: string) {
    try {
      const { data } = await api.put(`/admin/usuarios/${userId}/rol`, { rol });
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, rol: data.rol } : u))
      );
      setModalRol(null);
    } catch {
      Alert.alert('Error', 'No se pudo cambiar el rol');
    }
  }

  async function asignarEquipo(userId: number, equipoId: number | null) {
    try {
      await api.put(`/admin/usuarios/${userId}/equipo`, { equipo_id: equipoId });
      const eq = equipos.find((e) => e.id === equipoId);
      setUsuarios((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, equipo_id: equipoId, equipo_nombre: eq?.nombre || null }
            : u
        )
      );
      setModalEquipo(null);
    } catch {
      Alert.alert('Error', 'No se pudo asignar el equipo');
    }
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={usuarios}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nombre[0]?.toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.nombre}>{item.nombre}</Text>
                <Text style={styles.email}>{item.email}</Text>
                {item.equipo_nombre && (
                  <Text style={styles.equipo}>
                    <Ionicons name="football" size={12} color={Colors.gray} /> {item.equipo_nombre}
                  </Text>
                )}
              </View>
              <View style={[styles.badge, { backgroundColor: ROL_COLORS[item.rol] || Colors.gray }]}>
                <Text style={styles.badgeText}>{item.rol.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setModalRol(item)}>
                <Ionicons name="key" size={16} color={Colors.primary} />
                <Text style={styles.actionText}>Cambiar rol</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setModalEquipo(item)}>
                <Ionicons name="people" size={16} color={Colors.primary} />
                <Text style={styles.actionText}>Asignar equipo</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No hay usuarios</Text>}
      />

      {/* Modal cambiar rol */}
      <Modal visible={!!modalRol} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalRol(null)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Cambiar rol de {modalRol?.nombre}
            </Text>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.modalOption,
                  modalRol?.rol === r && styles.modalOptionActive,
                ]}
                onPress={() => modalRol && cambiarRol(modalRol.id, r)}
              >
                <View style={[styles.rolDot, { backgroundColor: ROL_COLORS[r] }]} />
                <Text style={styles.modalOptionText}>{r.toUpperCase()}</Text>
                {modalRol?.rol === r && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Modal asignar equipo */}
      <Modal visible={!!modalEquipo} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalEquipo(null)}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Asignar equipo a {modalEquipo?.nombre}
            </Text>
            <TouchableOpacity
              style={[styles.modalOption, !modalEquipo?.equipo_id && styles.modalOptionActive]}
              onPress={() => modalEquipo && asignarEquipo(modalEquipo.id, null)}
            >
              <Text style={styles.modalOptionText}>Sin equipo</Text>
            </TouchableOpacity>
            {equipos.map((eq) => (
              <TouchableOpacity
                key={eq.id}
                style={[
                  styles.modalOption,
                  modalEquipo?.equipo_id === eq.id && styles.modalOptionActive,
                ]}
                onPress={() => modalEquipo && asignarEquipo(modalEquipo.id, eq.id)}
              >
                <Ionicons name="football" size={16} color={Colors.secondary} />
                <Text style={styles.modalOptionText}>{eq.nombre}</Text>
                {modalEquipo?.equipo_id === eq.id && (
                  <Ionicons name="checkmark" size={20} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  info: { flex: 1, marginLeft: 12 },
  nombre: { fontSize: 15, fontWeight: '600', color: Colors.text },
  email: { fontSize: 12, color: Colors.gray },
  equipo: { fontSize: 12, color: Colors.gray, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { color: Colors.white, fontSize: 11, fontWeight: 'bold' },
  actions: { flexDirection: 'row', marginTop: 12, gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
  },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  empty: { textAlign: 'center', marginTop: 40, color: Colors.gray, fontSize: 15 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '85%',
    maxWidth: 360,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold', color: Colors.text, marginBottom: 16 },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  modalOptionActive: { backgroundColor: Colors.lightGray },
  modalOptionText: { flex: 1, fontSize: 15, color: Colors.text },
  rolDot: { width: 12, height: 12, borderRadius: 6 },
});
