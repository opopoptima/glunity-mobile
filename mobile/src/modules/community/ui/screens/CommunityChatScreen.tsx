import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppScaffold } from '@/shared/components/AppScaffold';
import { useTheme } from '@/shared/context/theme.context';

export default function CommunityChatScreen({ navigation }: any) {
  const [joined, setJoined] = useState(true);
  const { theme: T } = useTheme();

  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('@joined_community');
        setJoined(v === 'true');
      } catch (e) {
        setJoined(true);
      }
    })();
  }, []);

  const handleLeave = async () => {
    await AsyncStorage.removeItem('@joined_community');
    navigation.replace('Home');
  };

  return (
    <AppScaffold title="Community" activeTab="events" contentStyle={{ backgroundColor: T.bg }}>
      <View style={[styles.container, { backgroundColor: 'transparent' }]}> 
        <Text style={styles.title}>Community Chat</Text>
        <Text style={styles.subtitle}>Welcome to the community chat. Treat this as the group space for tips, questions and discovery.</Text>

        <TouchableOpacity style={styles.leave} onPress={handleLeave}>
          <Text style={styles.leaveText}>Leave community (dev)</Text>
        </TouchableOpacity>
      </View>
    </AppScaffold>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#666', textAlign: 'center' },
  leave: { marginTop: 20, padding: 12, backgroundColor: '#eee', borderRadius: 8 },
  leaveText: { color: '#c33' },
});
