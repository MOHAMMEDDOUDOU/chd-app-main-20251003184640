import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, Modal } from 'react-native';
import { createSeller, listSellers, deleteSeller, updateSeller } from '../lib/sellers';

interface Props { onClose: () => void }

export default function SellersManagement(_: Props) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSeller, setEditingSeller] = useState<any | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listSellers();
      setRows(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('تنبيه', 'اسم البائع مطلوب');
      return;
    }
    setSaving(true);
    try {
      const res = await createSeller({ name: name.trim(), phoneNumber: phone.trim() || undefined, location: location.trim() || undefined });
      if (res.success) {
        setName('');
        setPhone('');
        setLocation('');
        setShowModal(false);
        await load();
      } else {
        Alert.alert('خطأ', res.error || 'فشل إضافة البائع');
      }
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (seller: any) => {
    setEditingSeller(seller);
    setName(seller.name || '');
    setPhone(seller.phoneNumber || '');
    setLocation(seller.location || '');
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingSeller) return;
    if (!name.trim()) {
      Alert.alert('تنبيه', 'اسم البائع مطلوب');
      return;
    }
    setSaving(true);
    try {
      const res = await updateSeller(editingSeller.id, {
        name: name.trim(),
        phoneNumber: phone.trim() || undefined,
        location: location.trim() || undefined,
      });
      if (res.success) {
        setShowEditModal(false);
        setEditingSeller(null);
        setName('');
        setPhone('');
        setLocation('');
        await load();
      } else {
        Alert.alert('خطأ', res.error || 'فشل تعديل البائع');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('🔘 تم الضغط على زر الحذف للبائع:', id);
    
    // حذف مباشر بدون تأكيد
    const deleteSellerDirectly = async () => {
      try {
        console.log('🗑️ بدء حذف البائع:', id);
        
        const result = await deleteSeller(id);
        console.log('📥 نتيجة الحذف:', JSON.stringify(result, null, 2));

        if (result && result.success) {
          console.log('✅ تم حذف البائع بنجاح');
          setRows(prev => {
            const newRows = prev.filter(s => s.id !== id);
            console.log('📊 عدد البائعين بعد الحذف:', newRows.length);
            return newRows;
          });
        } else {
          const errorMsg = result?.error || 'فشل في حذف البائع';
          console.error('❌ فشل في حذف البائع:', errorMsg);
          Alert.alert('خطأ', errorMsg);
        }
      } catch (error) {
        console.error('❌ خطأ في حذف البائع:', error);
        Alert.alert('خطأ', 'حدث خطأ في حذف البائع');
      }
    };

    // تشغيل الحذف مباشرة
    deleteSellerDirectly();
  };

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={styles.title}>إدارة البائعين</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowModal(true)}>
          <Text style={styles.addText}>+ إضافة بائع</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshing={loading}
        onRefresh={load}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            {item.phoneNumber ? <Text style={styles.phone}>+213 {item.phoneNumber}</Text> : null}
            {item.location ? <Text style={styles.location}>المكان: {item.location}</Text> : null}
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
                <Text style={styles.editText}>تعديل</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>حذف</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={!loading ? <Text style={styles.empty}>لا يوجد بائعون</Text> : null}
      />

      {/* Add Seller Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>إضافة بائع</Text>
            <TextInput style={styles.input} placeholder="اسم البائع (إجباري)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="رقم الهاتف (اختياري)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="المكان (اختياري)" value={location} onChangeText={setLocation} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowModal(false); }}>
                <Text style={styles.cancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, saving && styles.disabled]} onPress={handleAdd} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Seller Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>تعديل البائع</Text>
            <TextInput style={styles.input} placeholder="اسم البائع (إجباري)" value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="رقم الهاتف (اختياري)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
            <TextInput style={styles.input} placeholder="المكان (اختياري)" value={location} onChangeText={setLocation} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowEditModal(false); setEditingSeller(null); }}>
                <Text style={styles.cancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, saving && styles.disabled]} onPress={handleEditSave} disabled={saving}>
                <Text style={styles.modalSaveText}>{saving ? 'جاري الحفظ...' : 'حفظ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  row: { gap: 10, marginBottom: 12 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  addBtn: { backgroundColor: '#FF6B35', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 },
  addText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  disabled: { opacity: 0.6 },
  card: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, marginBottom: 10 },
  name: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  phone: { marginTop: 4, color: '#374151' },
  location: { marginTop: 2, color: '#6B7280' },
  editBtn: { backgroundColor: '#3B82F6', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  editText: { color: '#FFFFFF', fontWeight: '600' },
  deleteBtn: { marginTop: 8, alignSelf: 'flex-start', backgroundColor: '#EF4444', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6 },
  deleteText: { color: '#FFFFFF', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#6B7280', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  cancelBtn: { backgroundColor: '#F3F4F6', borderRadius: 8, paddingVertical: 12, alignItems: 'center', flex: 1 },
  cancelText: { color: '#111827', fontWeight: '600' },
  modalSaveBtn: { backgroundColor: '#FF6B35', borderRadius: 10, paddingVertical: 14, alignItems: 'center', flex: 1, shadowColor: '#FF6B35', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 6, elevation: 6 },
  modalSaveText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
});


