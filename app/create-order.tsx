import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { ArrowLeft, ShoppingCart } from 'lucide-react-native';
import { useUser } from '../lib/userContext';
import { createResellLinkForItem } from '../lib/resellLinks';

interface OrderData {
  itemType: 'product' | 'offer';
  itemId: string;
  itemName: string;
  price: number;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
}

export default function CreateOrderScreen() {
  const { user } = useUser();
  const params = useLocalSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [resellerPrice, setResellerPrice] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);
  // تم إلغاء إنشاء روابط الويب للطلبات
  const initializedRef = useRef(false);

  useEffect(() => {
    console.log('🔄 createdUrl تغيّر إلى:', createdUrl);
  }, [createdUrl]);

  useEffect(() => {
    if (initializedRef.current) return;
    const raw = params?.data as string | undefined;
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      setOrderData(parsed);
      initializedRef.current = true;
    } catch (error) {
      console.error('Error parsing order data:', error);
      Alert.alert('خطأ', 'فشل في تحميل بيانات الطلب');
      router.back();
    }
  }, [params?.data]);

  useEffect(() => {
    if (!user) {
      Alert.alert('خطأ', 'يجب تسجيل الدخول لإنشاء طلبية');
      router.push('/login');
    }
  }, [user]);

  const handleCreateOrder = async () => {
    if (!orderData || !user) return;

    console.log('🧾 بدء إنشاء الطلبية...', { orderData, resellerPrice });

    if (!resellerPrice.trim()) {
      setFormError('يرجى إدخال سعر البيع');
      return;
    }

    const price = parseFloat(resellerPrice);
    if (isNaN(price) || price <= 0) {
      setFormError('يرجى إدخال سعر صحيح');
      return;
    }
    setFormError(null);

    setIsCreating(true);

    try {
      console.log('🔗 إنشاء رابط إعادة بيع في قاعدة البيانات...');
      const row = await createResellLinkForItem(orderData.itemType, orderData.itemId, user.id, parseFloat(resellerPrice));
      console.log('✅ تم إنشاء رابط إعادة البيع:', row);
              const url = `https://taziri.netlify.app/resell/${row.slug}`;
      console.log('🔗 الرابط المُنشأ:', url);
      setCreatedUrl(url);
      console.log('📱 تم تحديث حالة createdUrl:', url);
      try { await Clipboard.setStringAsync(url); } catch {}
      Alert.alert('تم الإنشاء', `تم إنشاء رابط إعادة البيع:\n${url}`, [
        { text: 'تم', onPress: () => {} }
      ]);
    } catch (error) {
      console.error('Error creating resell link:', error);
      const message = (error as any)?.message || 'حدث خطأ أثناء إنشاء رابط إعادة البيع';
      Alert.alert('خطأ', message);
    } finally {
      setIsCreating(false);
    }
  };

  if (!orderData || !user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#666" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إنشاء طلبية</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Product Info */}
        <View style={styles.productSection}>
          <Image
            source={{ uri: orderData.imageUrl || 'https://via.placeholder.com/150' }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{orderData.itemName}</Text>
            <Text style={styles.productType}>
              {orderData.itemType === 'product' ? 'منتج' : 'عرض'}
            </Text>
            <Text style={styles.originalPrice}>السعر الأصلي: {orderData.price} دج</Text>
          </View>
        </View>

        {/* Seller Info */}
        <View style={styles.sellerSection}>
          <Text style={styles.sectionTitle}>معلومات البائع</Text>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>البائع: {user.fullName || user.username}</Text>
            <Text style={styles.sellerPhone}>الهاتف: {user.phoneNumber}</Text>
          </View>
        </View>

        {/* Reseller Price */}
        <View style={styles.priceSection}>
          <Text style={styles.sectionTitle}>سعر البيع</Text>
          <Text style={styles.priceDescription}>
            أدخل السعر الذي تريد بيعه به
          </Text>
          <TextInput
            style={styles.priceInput}
            value={resellerPrice}
            onChangeText={setResellerPrice}
            placeholder="أدخل سعر البيع"
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
          />
          {formError ? (
            <Text style={styles.errorText}>{formError}</Text>
          ) : null}
        </View>

        {/* Show created resell link if exists */}
        {createdUrl ? (
          <View style={styles.linkSection}>
            <Text style={styles.sectionTitle}>رابط إعادة البيع</Text>
            <Text style={{color: 'red', fontSize: 12}}>DEBUG: الرابط موجود في الحالة</Text>
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>{createdUrl}</Text>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={async () => { try { await Clipboard.setStringAsync(createdUrl); Alert.alert('نسخ', 'تم نسخ الرابط'); } catch {} }}
              >
                <Text>نسخ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={{color: 'blue', fontSize: 12, textAlign: 'center', marginTop: 20}}>DEBUG: createdUrl = {createdUrl}</Text>
        )}

        {/* Create Order Button */}
        <TouchableOpacity
          style={[styles.createButton, (isCreating || !resellerPrice.trim()) && styles.createButtonDisabled]}
          onPress={handleCreateOrder}
          disabled={isCreating || !resellerPrice.trim()}
        >
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.createButtonText}>
            {isCreating ? 'جاري الإنشاء...' : 'إنشاء الطلبية'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  productSection: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  productType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
  sellerSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sellerInfo: {
    gap: 8,
  },
  sellerName: {
    fontSize: 14,
    color: '#374151',
  },
  sellerPhone: {
    fontSize: 14,
    color: '#374151',
  },
  priceSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  linkSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  linkDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
  },
  copyButton: {
    padding: 8,
  },
  linkPlaceholder: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  linkPlaceholderText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  errorText: {
    marginTop: 8,
    color: '#EF4444',
    fontSize: 13,
  },
  createButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
