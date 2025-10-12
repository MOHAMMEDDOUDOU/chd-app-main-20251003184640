import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { listUsers, deleteUserAccount } from '../lib/users';

interface Props { onClose: () => void }

export default function UsersManagement(_: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const res = await listUsers();
      if (res.success) setUsers(res.users || []);
      else Alert.alert('خطأ', res.error || 'فشل في جلب المستخدمين');
    } catch (e) {
      Alert.alert('خطأ', 'تعذر تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = (userId: string) => {
    Alert.alert('تأكيد', 'هل تريد حذف هذا المستخدم؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          const res = await deleteUserAccount(userId);
          if (res.success) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            Alert.alert('تم', 'تم حذف المستخدم');
          } else {
            Alert.alert('خطأ', res.error || 'فشل حذف المستخدم');
          }
        } catch (e) {
          Alert.alert('خطأ', 'حدث خطأ أثناء الحذف');
        }
      }}
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}> 
        <Text style={styles.muted}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>إدارة المستخدمين</Text>
        <TouchableOpacity style={styles.reload} onPress={load}>
          <Text style={styles.reloadText}>تحديث</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {users.length === 0 ? (
          <View style={styles.center}> 
            <Text style={styles.muted}>لا يوجد مستخدمون</Text>
          </View>
        ) : (
          users.map((u) => (
            <View key={u.id} style={styles.card}>
              <View style={styles.row}>
                <Image source={{ uri: u.profileImageUrl || 'https://i.pravatar.cc/100' }} style={styles.avatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u.fullName || u.username}</Text>
                  <Text style={styles.sub}>هاتف: {u.phoneNumber || 'غير متوفر'}</Text>
                  <Text style={styles.sub}>الدور: {u.role}</Text>
                  <Text style={styles.sub}>الحالة: {u.isActive ? 'نشط' : 'غير نشط'}</Text>
                </View>
                <TouchableOpacity style={styles.delete} onPress={() => handleDelete(u.id)}>
                  <Text style={styles.deleteText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  muted: { color: '#6B7280' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  reload: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  reloadText: { color: '#111827', fontWeight: '600' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E5E7EB' },
  name: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  sub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  delete: { backgroundColor: '#EF4444', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  deleteText: { color: '#FFFFFF', fontWeight: '700' },
});