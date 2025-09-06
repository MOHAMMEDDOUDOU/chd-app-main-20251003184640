import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Heart, Star, ShoppingCart, Trash2 } from 'lucide-react-native';

const favoriteProducts = [
  {
    id: '1',
    name: 'آيفون 15 برو ماكس',
    image: 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg',
    price: 1299,
    originalPrice: 1499,
    rating: 4.8,
    reviews: 2847,
    discount: 13,
    inStock: true,
  },
  {
    id: '2',
    name: 'سماعات AirPods Pro',
    image: 'https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg',
    price: 249,
    originalPrice: 299,
    rating: 4.7,
    reviews: 1523,
    discount: 17,
    inStock: true,
  },
  {
    id: '3',
    name: 'حقيبة لويس فيتون',
    image: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg',
    price: 1899,
    originalPrice: 2199,
    rating: 4.6,
    reviews: 892,
    discount: 14,
    inStock: false,
  },
];

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState(favoriteProducts);

  const removeFromFavorites = (productId: string) => {
    setFavorites(favorites.filter(item => item.id !== productId));
  };

  const FavoriteItem = ({ item }: { item: typeof favoriteProducts[0] }) => (
    <View style={styles.favoriteItem}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        
        <View style={styles.ratingContainer}>
          <Star size={14} color="#FFD700" fill="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
          <Text style={styles.reviews}>({item.reviews})</Text>
        </View>
        
        <View style={styles.priceContainer}>
          <Text style={styles.price}>${item.price}</Text>
          {item.originalPrice > item.price && (
            <Text style={styles.originalPrice}>${item.originalPrice}</Text>
          )}
          {item.discount > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{item.discount}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.stockStatus}>
          <View style={[styles.stockIndicator, { backgroundColor: item.inStock ? '#10B981' : '#EF4444' }]} />
          <Text style={[styles.stockText, { color: item.inStock ? '#10B981' : '#EF4444' }]}>
            {item.inStock ? 'متوفر' : 'غير متوفر'}
          </Text>
        </View>
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => removeFromFavorites(item.id)}
        >
          <Trash2 size={18} color="#EF4444" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.addToCartButton, !item.inStock && styles.disabledButton]}
          disabled={!item.inStock}
        >
          <ShoppingCart size={16} color="#FFFFFF" />
          <Text style={styles.addToCartText}>
            {item.inStock ? 'أضف للسلة' : 'غير متوفر'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EmptyFavorites = () => (
    <View style={styles.emptyContainer}>
      <Heart size={80} color="#E5E7EB" />
      <Text style={styles.emptyTitle}>لا توجد منتجات مفضلة</Text>
      <Text style={styles.emptySubtitle}>
        ابدأ بإضافة المنتجات التي تعجبك إلى قائمة المفضلة
      </Text>
      <TouchableOpacity style={styles.shopButton}>
        <Text style={styles.shopButtonText}>تسوق الآن</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المفضلة</Text>
        {favorites.length > 0 && (
          <Text style={styles.itemCount}>{favorites.length} منتج</Text>
        )}
      </View>

      {favorites.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <FlatList
          data={favorites}
          renderItem={({ item }) => <FavoriteItem item={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.favoritesList}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  itemCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  favoritesList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  favoriteItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 15,
  },
  productInfo: {
    marginBottom: 15,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 14,
    color: '#1F2937',
    marginLeft: 4,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  originalPrice: {
    fontSize: 16,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  removeButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: '#667eea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});