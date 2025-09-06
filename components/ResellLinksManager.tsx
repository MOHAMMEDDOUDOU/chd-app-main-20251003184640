import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useUser } from '../lib/userContext';
import { createResellLink, listUserResellLinks, deactivateResellLink } from '../lib/resellLinks';

interface Props {
  productIdProvider?: () => Promise<string | null>;
}

export default function ResellLinksManager({ productIdProvider }: Props) {
  const { user } = useUser();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const rows = await listUserResellLinks(user.id);
      setItems(rows);
    } catch (error) {
      console.error('خطأ في تحميل الروابط:', error);
      Alert.alert('خطأ', 'فشل في تحميل الروابط');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user?.id]);

  const handleCreate = async () => {
    if (!user?.id) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول أولاً');
      return;
    }
    
    try {
      setCreating(true);
      
      let productId: string | null = null;
      if (productIdProvider) {
        productId = await productIdProvider();
      }
      
      if (!productId) {
        Alert.alert('تنبيه', 'لا توجد منتجات متاحة حالياً. يرجى إضافة منتجات أولاً.');
        return;
      }
      
      const row = await createResellLink(productId, user.id);
      
      await load();
              const url = `https://taziri.netlify.app/resell/${row.slug}`;
      await Clipboard.setStringAsync(url);
      Alert.alert('تم الإنشاء', `تم إنشاء الرابط ونسخه للحافظة:\n${url}`);
    } catch (error) {
      console.error('خطأ في إنشاء الرابط:', error);
      Alert.alert('خطأ', 'فشل في إنشاء الرابط. يرجى المحاولة مرة أخرى.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async (slug: string) => {
            const url = `https://taziri.netlify.app/resell/${slug}`;
    await Clipboard.setStringAsync(url);
    Alert.alert('نسخ', 'تم نسخ الرابط');
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateResellLink(id, user!.id);
      await load();
      Alert.alert('تم التعطيل', 'تم تعطيل الرابط بنجاح');
    } catch (error) {
      console.error('خطأ في تعطيل الرابط:', error);
      Alert.alert('خطأ', 'فشل في تعطيل الرابط');
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const name = item?.product?.name || item?.offer?.name || 'عنصر';
    const typeLabel = item?.itemType === 'offer' ? 'عرض' : 'منتج';
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.productName}>{name} • {typeLabel}</Text>
          <Text style={styles.slug}>/{item.slug}</Text>
          <Text style={styles.status}>{item.isActive ? 'فعّال' : 'معطّل'}</Text>
        </View>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => handleCopy(item.slug)}>
          <Text style={styles.secondaryText}>نسخ</Text>
        </TouchableOpacity>
        {item.isActive && (
          <TouchableOpacity style={styles.dangerBtn} onPress={() => handleDeactivate(item.id)}>
            <Text style={styles.dangerText}>تعطيل</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>روابط إعادة البيع</Text>
        <TouchableOpacity 
          style={[styles.primaryBtn, creating && styles.disabled]} 
          onPress={handleCreate} 
          disabled={creating}
        >
          {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>إنشاء رابط</Text>}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#FF6B35" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>لا توجد روابط بعد</Text>
              <Text style={styles.emptySubtext}>اضغط على "إنشاء رابط" لإنشاء أول رابط إعادة بيع</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingVertical: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  primaryBtn: { backgroundColor: '#FF6B35', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8 },
  disabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontWeight: '600' },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB', 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 12, 
    padding: 12, 
    marginBottom: 8 
  },
  productName: { fontWeight: '600', color: '#111827' },
  slug: { color: '#6B7280', marginTop: 2 },
  status: { fontSize: 12, color: '#059669', marginTop: 2 },
  secondaryBtn: { 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    paddingVertical: 8, 
    marginRight: 8 
  },
  secondaryText: { color: '#111827' },
  dangerBtn: { 
    borderWidth: 1, 
    borderColor: '#EF4444', 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    paddingVertical: 8 
  },
  dangerText: { color: '#EF4444' },
  emptyContainer: { alignItems: 'center', paddingVertical: 20 },
  empty: { textAlign: 'center', color: '#6B7280', fontSize: 16, marginBottom: 8 },
  emptySubtext: { textAlign: 'center', color: '#9CA3AF', fontSize: 14 },
});


