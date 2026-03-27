import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';

const MENU_ITEMS = [
  { icon: 'people' as const, label: 'Gestionar Equipos', color: '#2563eb', route: null },
  { icon: 'football' as const, label: 'Gestionar Jugadores', color: '#16a34a', route: null },
  { icon: 'calendar' as const, label: 'Gestionar Jornadas y Partidos', color: '#d97706', route: null },
  { icon: 'key' as const, label: 'Gestionar Usuarios y Roles', color: '#dc2626', route: '/(app)/admin/usuarios' },
];

export default function AdminPanel() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={40} color={Colors.white} />
        <Text style={styles.title}>Panel Admin Liga</Text>
      </View>

      <View style={styles.menu}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.card}
            onPress={() => item.route && router.push(item.route as any)}
            disabled={!item.route}
          >
            <View style={[styles.iconBox, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon} size={28} color={Colors.white} />
            </View>
            <Text style={styles.cardLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={item.route ? Colors.gray : Colors.lightGray}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  title: { color: Colors.white, fontSize: 22, fontWeight: 'bold' },
  menu: { padding: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    flex: 1,
    marginLeft: 14,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
});
