import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Plus, Search, Edit, Trash2 } from 'lucide-react-native';
import { getProducts, deleteProduct, Product } from '../lib/products';
import ProductForm from './ProductForm';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  stock_quantity: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // تحميل المنتجات
  const loadProducts = async () => {
    console.log('🔄 loadProducts تم استدعاؤها');
    try {
      setLoading(true);
      const result = await getProducts();
      console.log('📥 نتيجة getProducts:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ تم تحميل المنتجات بنجاح، عدد المنتجات:', result.products?.length || 0);
        setProducts(result.products || []);
      } else {
        console.log('❌ فشل في تحميل المنتجات:', result.error);
        Alert.alert('خطأ', 'فشل في تحميل المنتجات');
      }
    } catch (error) {
      console.error('❌ خطأ في loadProducts:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل المنتجات');
    } finally {
      setLoading(false);
      console.log('🔄 تم إعادة تعيين حالة التحميل');
    }
  };

  // البحث في المنتجات
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  // تحميل المنتجات عند فتح الصفحة
  useEffect(() => {
    loadProducts();
  }, []);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = (product: Product) => {
    console.log('🔘 تم الضغط على زر الحذف للمنتج:', product.name);
    
    // حذف مباشر بدون تأكيد
    const deleteProductDirectly = async () => {
      try {
        setDeletingProductId(product.id);
        console.log('🗑️ بدء حذف المنتج:', product.id, product.name);
        
        const result = await deleteProduct(product.id);
        console.log('📥 نتيجة الحذف:', JSON.stringify(result, null, 2));

        if (result && result.success) {
          console.log('✅ تم حذف المنتج بنجاح');
          setProducts(prev => {
            const newProducts = prev.filter(p => p.id !== product.id);
            console.log('📊 عدد المنتجات بعد الحذف:', newProducts.length);
            return newProducts;
          });
          setFilteredProducts(prev => {
            const newFiltered = prev.filter(p => p.id !== product.id);
            console.log('📊 عدد المنتجات المفلترة بعد الحذف:', newFiltered.length);
            return newFiltered;
          });
        } else {
          const errorMsg = result?.error || 'فشل في حذف المنتج';
          console.error('❌ فشل في حذف المنتج:', errorMsg);
        }
      } catch (error) {
        console.error('❌ خطأ في حذف المنتج:', error);
      } finally {
        setDeletingProductId(null);
        console.log('🔄 تم إعادة تعيين حالة الحذف');
      }
    };

    // تشغيل الحذف مباشرة
    deleteProductDirectly();
  };

  const handleProductFormSuccess = () => {
    console.log('🔄 handleProductFormSuccess تم استدعاؤها');
    loadProducts(); // إعادة تحميل المنتجات بعد الإضافة/التعديل
  };

  const handleCloseProductForm = () => {
    setShowProductForm(false);
    setEditingProduct(null);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} دج`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const ProductAdminCard = ({ product }: { product: Product }) => {
    const [aspectRatio, setAspectRatio] = useState(1);

    useEffect(() => {
      const uri = (product.image_url as string) || (product as any).imageUrl;
      if (uri) {
        Image.getSize(
          uri,
          (w, h) => {
            if (w && h) setAspectRatio(w / h);
          },
          () => setAspectRatio(1)
        );
      } else {
        setAspectRatio(1);
      }
    }, [product.image_url, (product as any).imageUrl]);

    return (
      <View style={styles.productCard}>
        {/* Product Image */}
        <View style={styles.productImageContainer}>
          {product.image_url || (product as any).imageUrl ? (
            <Image 
              source={{ uri: (product.image_url as string) || (product as any).imageUrl }} 
              style={[styles.productImage, { height: undefined, aspectRatio }]}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>صورة المنتج</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {product.name}
          </Text>
          <Text style={styles.productCategory}>
            {product.category}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.productPrice}>
              {formatPrice(product.price)}
            </Text>
            {product.discount_price && (
              <Text style={styles.discountPrice}>
                {formatPrice(product.discount_price)}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditProduct(product)}
            disabled={deletingProductId === product.id}
            activeOpacity={0.8}
          >
            <Edit size={16} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { marginLeft: 8 }]}
            onPress={() => {
              console.log('🔘 تم الضغط على زر الحذف للمنتج:', product.name);
              handleDeleteProduct(product);
            }}
            disabled={deletingProductId === product.id}
            activeOpacity={0.8}
          >
            {deletingProductId === product.id ? (
              <Text style={styles.deletingText}>...</Text>
            ) : (
              <Trash2 size={16} color="#EF4444" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.sectionTitle}>إدارة المنتجات</Text>
          <Text style={styles.productCount}>
            {filteredProducts.length} منتج
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddProduct}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة منتج</Text>
        </TouchableOpacity>
        

      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث في المنتجات..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Products Grid */}
      <ScrollView style={styles.productsList}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد منتجات'}
            </Text>
          </View>
        ) : (
          <View style={styles.productsGrid}>
            {filteredProducts.map((product) => (
              <ProductAdminCard key={product.id} product={product} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Product Form Modal */}
      <ProductForm
        visible={showProductForm}
        onClose={handleCloseProductForm}
        onSuccess={handleProductFormSuccess}
        product={editingProduct}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  productCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  productsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  productImageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
  },
  noImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 18,
  },
  productCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  discountPrice: {
    fontSize: 12,
    color: '#EF4444',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FFF7ED',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
  deletingButton: {
    backgroundColor: '#9CA3AF',
  },
  deletingText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
