import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { listUsers } from '../lib/users';
import { getOrdersByResellerUser } from '../lib/orders';

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

  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  const openUserOrders = async (user: any) => {
    try {
      setSelectedUser(user);
      const res = await getOrdersByResellerUser(user.id);
      if (res.success) setUserOrders(res.orders || []);
      else setUserOrders([]);
      setShowOrdersModal(true);
    } catch (e) {
      setUserOrders([]);
      setShowOrdersModal(true);
    }
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
                <TouchableOpacity style={styles.details} onPress={() => openUserOrders(u)}>
                  <Text style={styles.detailsText}>عرض التفاصيل</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* User Orders Modal */}
      {showOrdersModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>طلبيات {selectedUser?.fullName || selectedUser?.username}</Text>
              <TouchableOpacity onPress={() => setShowOrdersModal(false)}><Text style={{ color: '#EF4444', fontWeight: '700' }}>إغلاق</Text></TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              {userOrders.length === 0 ? (
                <View style={styles.center}><Text style={styles.muted}>لا توجد طلبيات</Text></View>
              ) : (
                userOrders.map((o) => {
                  const original = Number(o.unitPrice);
                  const resell = Number(o.resellerPrice || o.unitPrice);
                  const qty = Number(o.quantity || 1);
                  const profitPerUnit = Math.max(0, resell - original);
                  const totalProfit = profitPerUnit * qty;
                  return (
                    <View key={o.id} style={styles.orderCard}>
                      <View style={styles.orderRow}><Text style={styles.orderLabel}>المنتج/العرض:</Text><Text style={styles.orderValue}>{o.itemName}</Text></View>
                      <View style={styles.orderRow}><Text style={styles.orderLabel}>الكمية:</Text><Text style={styles.orderValue}>{qty}</Text></View>
                      <View style={styles.orderRow}><Text style={styles.orderLabel}>السعر الأصلي:</Text><Text style={styles.orderValue}>{original.toLocaleString()} دج</Text></View>
                      <View style={styles.orderRow}><Text style={styles.orderLabel}>سعر إعادة البيع:</Text><Text style={styles.orderValue}>{resell.toLocaleString()} دج</Text></View>
                      <View style={styles.orderRow}><Text style={styles.orderLabel}>الحالة:</Text><Text style={styles.orderValue}>{o.status}</Text></View>
                      <View style={[styles.orderRow, { borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 8 }]}>
                        <Text style={[styles.orderLabel, { fontWeight: '700' }]}>فائدة هذه الطلبية:</Text>
                        <Text style={[styles.orderValue, { color: '#10B981', fontWeight: '700' }]}>{totalProfit.toLocaleString()} دج</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      )}
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
  details: { backgroundColor: '#FF6B35', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  detailsText: { color: '#FFFFFF', fontWeight: '700' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: '92%', height: '80%', backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  orderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  orderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderLabel: { fontSize: 12, color: '#6B7280' },
  orderValue: { fontSize: 14, color: '#1F2937', fontWeight: '600' },
});