import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AdminCardProps {
  emoji: string;
  title: string;
  subtitle?: string;
  count?: number;
  onPress: () => void;
}

export default function AdminCard({ emoji, title, subtitle, count, onPress }: AdminCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {count !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a2e1f',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
    aspectRatio: 1,
    position: 'relative',
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: '#a7c4a7',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#52b788',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
