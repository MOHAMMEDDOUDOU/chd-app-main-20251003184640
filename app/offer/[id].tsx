import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingCart } from 'lucide-react-native';
import { getOffer } from '../../lib/offers';
import { useUser } from '../../lib/userContext';

export default function OfferDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const screenWidth = Dimensions.get('window').width;
  const [activeIndex, setActiveIndex] = useState(0);
  const { user } = useUser();

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const res = await getOffer(String(id));
      if (res.success) {
        setOffer(res.offer);
        try {
          const item = res.offer as any;
          const imgs: any = item.images;
          const urls: string[] = [];
          if (Array.isArray(imgs)) {
            imgs.forEach((img) => {
              if (typeof img === 'string') urls.push(img);
              else if (img && typeof img === 'object') {
                const u = img.url || img.image_url || img.imageUrl;
                if (u) urls.push(u);
              }
            });
          }
          const primary = item.imageUrl || item.image_url;
          if (primary) urls.unshift(primary);
          const unique = Array.from(new Set(urls)).filter(Boolean);
          setImageUrls(unique.length > 0 ? unique : [primary].filter(Boolean));
        } catch {
          // ignore
        }
      }
      else setError(res.error || 'فشل تحميل العرض');
      setLoading(false);
    };
    load();
  }, [id]);

  const originalPrice = useMemo(() => {
    if (!offer) return 0;
    const p = parseFloat(String(offer.price || 0));
    return isNaN(p) ? 0 : p;
  }, [offer]);

  const discountPrice = useMemo(() => {
    if (!offer) return null as number | null;
    const d = offer.discountPrice ?? (offer as any).discount_price;
    const val = d != null ? parseFloat(String(d)) : null;
    return val != null && !isNaN(val) ? val : null;
  }, [offer]);

  const displayPrice = useMemo(() => {
    if (discountPrice && discountPrice < originalPrice) return discountPrice;
    return originalPrice;
  }, [discountPrice, originalPrice]);

  const handleOrderNow = () => {
    if (!offer) return;
    if (!user) {
      Alert.alert('تسجيل الدخول مطلوب', 'يرجى تسجيل الدخول لطلب هذا العرض');
      router.push('/login');
      return;
    }
    const orderData = {
      itemType: 'offer' as const,
      itemId: offer.id,
      itemName: offer.name,
      price: displayPrice,
      originalPrice: originalPrice,
      discountPrice: discountPrice || undefined,
      imageUrl: offer.imageUrl || (offer as any).image_url,
      sellerId: user.id,
      sellerName: user.fullName || user.username,
    };
    router.push({ pathname: '/create-order', params: { data: JSON.stringify(orderData) } });
  };

  const imagesToShow = useMemo(() => {
    const fallback = [offer?.imageUrl || (offer as any)?.image_url].filter(Boolean) as string[];
    return (imageUrls.length > 0 ? imageUrls : fallback);
  }, [imageUrls, offer]);

  if (loading) return <Text style={{ padding: 20 }}>جاري التحميل...</Text>;
  if (error) return <Text style={{ padding: 20 }}>{error}</Text>;
  if (!offer) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل العرض</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Images carousel */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={(e) => {
            const x = e.nativeEvent.contentOffset.x;
            const idx = Math.round(x / screenWidth);
            if (idx !== activeIndex) setActiveIndex(idx);
          }}
        >
          {imagesToShow.map((uri, idx) => (
            <Image key={idx} source={{ uri: String(uri) }} style={[styles.image, { width: screenWidth }]} resizeMode="contain" />
          ))}
        </ScrollView>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {imagesToShow.map((_, idx) => (
            <View key={idx} style={[styles.dot, idx === activeIndex && styles.dotActive]} />
          ))}
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{offer.name}</Text>
          <View style={styles.priceRow}>
            {discountPrice && discountPrice < originalPrice ? (
              <>
                <Text style={styles.newPrice}>{displayPrice.toLocaleString()} دج</Text>
                <Text style={styles.oldPrice}>{originalPrice.toLocaleString()} دج</Text>
              </>
            ) : (
              <Text style={styles.newPrice}>{originalPrice.toLocaleString()} دج</Text>
            )}
          </View>
          {offer.description ? <Text style={styles.description}>{offer.description}</Text> : null}

          <TouchableOpacity style={styles.orderButton} onPress={handleOrderNow}>
            <ShoppingCart size={18} color="#FFFFFF" />
            <Text style={styles.orderButtonText}>اطلب الآن</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },

  image: { height: 320 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#FF6B35' },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'right' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  newPrice: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4' },
  oldPrice: { fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' },
  description: { fontSize: 14, color: '#374151', lineHeight: 20, textAlign: 'right' },
  orderButton: { marginTop: 16, backgroundColor: '#FF6B35', paddingVertical: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  orderButtonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});


