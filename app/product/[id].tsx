import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getProduct } from '../../lib/products';

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      const res = await getProduct(String(id));
      if (res.success) setProduct(res.product);
      else setError(res.error || 'فشل تحميل المنتج');
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <Text style={{ padding: 20 }}>جاري التحميل...</Text>;
  if (error) return <Text style={{ padding: 20 }}>{error}</Text>;
  if (!product) return null;

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="contain" />
      <View style={styles.content}>
        <Text style={styles.title}>{product.name}</Text>
        <Text style={styles.price}>${Number(product.price).toFixed(2)}</Text>
        {product.description ? <Text style={styles.description}>{product.description}</Text> : null}
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


