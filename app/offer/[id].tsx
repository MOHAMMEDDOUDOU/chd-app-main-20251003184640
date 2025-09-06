import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getOffer } from '../../lib/products';

export default function OfferDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [offer, setOffer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const res = await getOffer(String(id));
      if (res.success) setOffer(res.offer);
      else setError(res.error || 'فشل تحميل العرض');
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>جاري التحميل...</Text>;
  if (error) return <Text style={{ padding: 20 }}>{error}</Text>;
  if (!offer) return null;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: offer.imageUrl }} style={styles.image} resizeMode="contain" />
      <View style={styles.content}>
        <Text style={styles.title}>{offer.name}</Text>
        <Text style={styles.price}>${Number(offer.price).toFixed(2)}</Text>
        {offer.description ? <Text style={styles.description}>{offer.description}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  image: { width: '100%', height: 300 },
  content: { padding: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  price: { fontSize: 16, fontWeight: 'bold', color: '#10B981', marginBottom: 12 },
  description: { fontSize: 14, color: '#374151', lineHeight: 20 },
  button: { marginTop: 20, backgroundColor: '#FF6B35', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});


