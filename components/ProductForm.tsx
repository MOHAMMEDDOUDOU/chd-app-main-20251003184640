import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Switch,
  Image,
} from 'react-native';
import { X, Save, Image as ImageIcon, Plus, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createProduct, updateProduct, Product } from '../lib/products';
import { CloudinaryService } from '../lib/cloudinary';
import { CategoryService, Category } from '../lib/categories';
import { listSellers } from '../lib/sellers';

interface ProductFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: Product | null;
}

export default function ProductForm({ visible, onClose, onSuccess, product }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [showDiscountPrice, setShowDiscountPrice] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [sellers, setSellers] = useState<Array<{ id: string; name: string }>>([]);
  const [showSellerPicker, setShowSellerPicker] = useState(false);

  // تحميل الفئات
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await CategoryService.getAllActiveCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    };
    const loadSellers = async () => {
      try {
        const data = await listSellers();
        setSellers(data);
      } catch (error) {
        console.error('Error loading sellers:', error);
      }
    };
    loadCategories();
    loadSellers();
  }, []);

  // تحميل بيانات المنتج للتعديل (يدعم snake_case و camelCase)
  useEffect(() => {
    if (product) {
      const p: any = product as any;
      const imageUrl = p.image_url ?? p.imageUrl ?? '';
      const stockQty = p.stock_quantity ?? p.stockQuantity;
      const discountPrice = p.discount_price ?? p.discountPrice;

      // تهيئة النموذج
      setFormData(prev => ({
        ...prev,
        name: p.name || '',
        description: p.description || '',
        price: (p.price !== undefined && p.price !== null) ? String(p.price) : '',
        discount_price: (discountPrice !== undefined && discountPrice !== null) ? String(discountPrice) : '',
        stock_quantity: (stockQty !== undefined && stockQty !== null) ? String(stockQty) : '',
        category: p.category || '',
        image_url: imageUrl,
        ...(p.seller_id || p.sellerId ? { seller_id: p.seller_id ?? p.sellerId } : {}),
      } as any));

      // الصور المتعددة
      const imagesFromDb: string[] | undefined = Array.isArray(p.images) ? p.images : undefined;
      if (imagesFromDb && imagesFromDb.length > 0) {
        setImages(imagesFromDb);
        // إذا لم تكن هناك صورة رئيسية، اجعل الأولى رئيسية
        if (!imageUrl) {
          setFormData(prev => ({ ...(prev as any), image_url: imagesFromDb[0] } as any));
        }
      } else if (imageUrl) {
        setImages([imageUrl]);
      } else {
        setImages([]);
      }

      // إظهار حقل التخفيض إذا كان موجوداً
      setShowDiscountPrice(!!discountPrice);
    } else {
      // إعادة تعيين النموذج للمنتج الجديد
      setFormData({
        name: '',
        description: '',
        price: '',
        discount_price: '',
        stock_quantity: '',
        category: '',
        image_url: '',
      });
      setImages([]);
      setShowDiscountPrice(false);
    }
  }, [product, visible]);

  // عند تحميل قائمة البائعين، عرّف اسم البائع إن كان seller_id موجوداً
  useEffect(() => {
    const currentSellerId = (formData as any).seller_id;
    const currentSellerName = (formData as any).seller_name;
    if (currentSellerId && !currentSellerName && sellers.length > 0) {
      const found = sellers.find(s => s.id === currentSellerId);
      if (found) {
        setFormData(prev => ({ ...(prev as any), seller_name: found.name } as any));
      }
    }
  }, [sellers, formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };








  // اختيار ملف من الجهاز ثم رفعه إلى Cloudinary
  const pickAndUploadImage = async () => {
    try {
      setUploadingImage(true);
      // اختيار ملف صورة
      const result = await DocumentPicker.getDocumentAsync({ type: 'image/*', multiple: false });
      if (result.canceled) {
        return;
      }
      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('خطأ', 'تعذر الحصول على ملف الصورة');
        return;
      }
      console.log('🚀 بدء رفع الصورة...');
      const imageUrl = await CloudinaryService.uploadImage(asset.uri, 'products');
      
      // إضافة الصورة إلى قائمة الصور
      setImages(prev => [...prev, imageUrl]);
      
      // تحديث الصورة الرئيسية إذا كانت الأولى
      if (images.length === 0) {
        setFormData(prev => ({
          ...prev,
          image_url: imageUrl
        }));
      }
      
      Alert.alert('✅ نجح', 'تم رفع الصورة بنجاح');
    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
      Alert.alert('❌ خطأ', `فشل في رفع الصورة: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };

  // حذف صورة من القائمة
  const removeImage = (imageUrl: string) => {
    setImages(prev => prev.filter(img => img !== imageUrl));
    
    // إذا كانت الصورة المحذوفة هي الصورة الرئيسية، اجعل الأولى الجديدة هي الرئيسية
    if (formData.image_url === imageUrl) {
      const remainingImages = images.filter(img => img !== imageUrl);
      setFormData(prev => ({
        ...prev,
        image_url: remainingImages[0] || ''
      }));
    }
  };

  const validateForm = () => {
    console.log('🔍 بدء التحقق من البيانات...');
    
    if (!formData.name.trim()) {
      console.log('❌ اسم المنتج فارغ');
      Alert.alert('خطأ', 'اسم المنتج مطلوب');
      return false;
    }
    if (!formData.price.trim()) {
      console.log('❌ سعر المنتج فارغ');
      Alert.alert('خطأ', 'سعر المنتج مطلوب');
      return false;
    }
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      console.log('❌ سعر المنتج غير صحيح:', formData.price);
      Alert.alert('خطأ', 'سعر المنتج يجب أن يكون رقم موجب');
      return false;
    }
    if (!formData.stock_quantity.trim()) {
      console.log('❌ كمية المخزون فارغة');
      Alert.alert('خطأ', 'كمية المخزون مطلوبة');
      return false;
    }
    if (isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
      console.log('❌ كمية المخزون غير صحيحة:', formData.stock_quantity);
      Alert.alert('خطأ', 'كمية المخزون يجب أن تكون رقم موجب');
      return false;
    }
    if (!formData.category.trim()) {
      console.log('❌ فئة المنتج فارغة');
      Alert.alert('خطأ', 'فئة المنتج مطلوبة');
      return false;
    }
    
    // التحقق من سعر التخفيض إذا تم إدخاله
    if (formData.discount_price && (isNaN(Number(formData.discount_price)) || Number(formData.discount_price) <= 0)) {
      console.log('❌ سعر التخفيض غير صحيح:', formData.discount_price);
      Alert.alert('خطأ', 'سعر التخفيض يجب أن يكون رقم موجب');
      return false;
    }
    
    console.log('✅ جميع البيانات صحيحة');
    return true;
  };

  const handleSubmit = async () => {
    console.log('🔘 تم الضغط على زر الحفظ');
    console.log('📊 البيانات الحالية:', formData);
    
    if (!validateForm()) {
      console.log('❌ فشل في التحقق من البيانات');
      return;
    }

    console.log('✅ تم التحقق من البيانات بنجاح');
    setLoading(true);
    try {
      // حساب نسبة التخفيض تلقائياً
      let discount_percentage = undefined;
      if (formData.discount_price && Number(formData.discount_price) > 0) {
        const originalPrice = Number(formData.price);
        const discountPrice = Number(formData.discount_price);
        discount_percentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
      }

      const productData: any = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        discount_percentage: discount_percentage,
        stock_quantity: Number(formData.stock_quantity),
        category: formData.category.trim(),
        image_url: formData.image_url.trim() || undefined,
        images: images && images.length > 0 ? images : undefined,
        seller_id: (formData as any).seller_id || undefined,
      };

      console.log('📤 إرسال البيانات:', JSON.stringify(productData, null, 2));

      let result;
      if (product) {
        // تحديث منتج موجود
        console.log('🔄 تحديث منتج موجود:', product.id);
        result = await updateProduct(product.id, productData);
      } else {
        // إضافة منتج جديد
        console.log('➕ إضافة منتج جديد');
        result = await createProduct(productData);
      }

      console.log('📥 نتيجة الحفظ:', JSON.stringify(result, null, 2));

      if (result.success) {
        console.log('✅ تم الحفظ بنجاح');
        console.log('🔄 إغلاق النموذج وإعادة تحميل البيانات');
        onSuccess();
        onClose();
      } else {
        console.log('❌ فشل في الحفظ:', result.error);
        Alert.alert('خطأ', result.error || 'حدث خطأ غير متوقع');
      }
    } catch (error) {
      console.error('❌ خطأ في حفظ المنتج:', error);
      Alert.alert('خطأ', 'حدث خطأ في حفظ المنتج');
    } finally {
      setLoading(false);
      console.log('🔄 تم إعادة تعيين حالة التحميل');
    }
  };



  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Save size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* جميع الحقول معاً */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>معلومات المنتج</Text>
            
            {/* اسم المنتج */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم المنتج *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="أدخل اسم المنتج"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* فئة المنتج */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>فئة المنتج *</Text>
              <TouchableOpacity
                style={styles.categoryPickerButton}
                onPress={() => setShowCategoryPicker(true)}
              >
                <Text style={styles.categoryPickerText}>
                  {formData.category || 'اختر فئة المنتج'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* البائع */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>البائع</Text>
              <TouchableOpacity
                style={styles.categoryPickerButton}
                onPress={() => setShowSellerPicker(true)}
              >
                <Text style={styles.categoryPickerText}>
                  {(formData as any).seller_name || 'اختر البائع'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* السعر الأساسي */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>السعر الأساسي (دج) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price}
                onChangeText={(value) => handleInputChange('price', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* كمية المخزون */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>كمية المخزون *</Text>
              <TextInput
                style={styles.input}
                value={formData.stock_quantity}
                onChangeText={(value) => handleInputChange('stock_quantity', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </View>

            {/* زر إضافة سعر التخفيض */}
            {!showDiscountPrice && (
              <TouchableOpacity 
                style={styles.addFieldButton}
                onPress={() => setShowDiscountPrice(true)}
              >
                <Plus size={20} color="#FF6B35" />
                <Text style={styles.addFieldButtonText}>إضافة سعر التخفيض</Text>
              </TouchableOpacity>
            )}

            {/* حقل سعر التخفيض */}
            {showDiscountPrice && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>سعر التخفيض (دج)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount_price}
                  onChangeText={(value) => handleInputChange('discount_price', value)}
                  placeholder="أدخل سعر التخفيض"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* حقل الوصف */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>وصف المنتج</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="أدخل وصف المنتج"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
              />
            </View>

            {/* قسم الصور */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>صور المنتج</Text>
              
              {/* عرض الصور المرفوعة */}
              {images.length > 0 && (
                <View style={styles.imagesGrid}>
                  {images.map((imageUrl, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                      <Image 
                        source={{ uri: imageUrl }} 
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(imageUrl)}
                      >
                        <Trash2 size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                      {formData.image_url === imageUrl && (
                        <View style={styles.mainImageBadge}>
                          <Text style={styles.mainImageText}>رئيسية</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
              
              {/* زر إضافة الصور */}
              <TouchableOpacity 
                style={[styles.professionalButton, uploadingImage && styles.disabledButton]} 
                onPress={pickAndUploadImage}
                disabled={uploadingImage}
              >
                <View style={styles.buttonContent}>
                  <ImageIcon size={24} color="#FFFFFF" />
                  <Text style={styles.professionalButtonText}>
                    {uploadingImage ? 'جاري رفع الصورة...' : 'إضافة صورة جديدة'}
                  </Text>
                </View>
                {uploadingImage && (
                  <View style={styles.loadingIndicator}>
                    <View style={styles.loadingSpinner} />
                  </View>
                )}
              </TouchableOpacity>
              
              {/* نص توضيحي */}
              <Text style={styles.helpText}>
                يمكنك إضافة عدة صور للمنتج. الصورة الأولى ستكون الصورة الرئيسية.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Category Picker Modal */}
      <Modal visible={showCategoryPicker} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>اختر فئة المنتج</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowCategoryPicker(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد فئات متاحة</Text>
            ) : (
              <View style={styles.categoriesList}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      formData.category === category.name && styles.selectedCategoryItem
                    ]}
                    onPress={() => {
                      handleInputChange('category', category.name);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      formData.category === category.name && styles.selectedCategoryItemText
                    ]}>
                      {category.name}
                    </Text>
                    {category.description && (
                      <Text style={styles.categoryItemDescription}>
                        {category.description}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Seller Picker Modal */}
      <Modal visible={showSellerPicker} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>اختر البائع</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowSellerPicker(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {sellers.length === 0 ? (
              <Text style={styles.emptyText}>لا توجد بائعون متاحون</Text>
            ) : (
              <View style={styles.categoriesList}>
                {sellers.map((seller) => (
                  <TouchableOpacity
                    key={seller.id}
                    style={[
                      styles.categoryItem,
                      (formData as any).seller_id === seller.id && styles.selectedCategoryItem
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...(prev as any), seller_id: seller.id, seller_name: seller.name } as any));
                      setShowSellerPicker(false);
                    }}
                  >
                    <Text style={[
                      styles.categoryItemText,
                      (formData as any).seller_id === seller.id && styles.selectedCategoryItemText
                    ]}>
                      {seller.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  // Professional button styles
  professionalButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  professionalButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 12,
  },
  loadingIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  loadingSpinner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
  },
  // Sizes styles
  sizeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sizeInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  addSizeButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sizesList: {
    marginTop: 8,
  },
  sizeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  sizeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  removeSizeButton: {
    padding: 4,
  },
  // Image styles
  imagePreviewContainer: {
    position: 'relative',
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    borderRadius: 20,
    padding: 8,
  },
  // Multiple images styles
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mainImageText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // Category picker styles
  categoryPickerButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  categoryPickerText: {
    fontSize: 16,
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoriesList: {
    marginTop: 16,
  },
  categoryItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryItem: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  categoryItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  selectedCategoryItemText: {
    color: '#FF6B35',
  },
  categoryItemDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    marginTop: 40,
  },

  // Add field button styles
  addFieldButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  addFieldButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
});
