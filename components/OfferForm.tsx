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
  Image,
} from 'react-native';
import { X, Save, Image as ImageIcon, Plus, Trash2 } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { createOffer, updateOffer, Offer } from '../lib/offers';
import { CloudinaryService } from '../lib/cloudinary';
import { listSellers } from '../lib/sellers';

interface OfferFormProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  offer?: Offer | null;
}

export default function OfferForm({ visible, onClose, onSuccess, offer }: OfferFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discount_price: '',
    stock_quantity: '',
    image_url: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showDiscountPrice, setShowDiscountPrice] = useState(false);
  const [sellers, setSellers] = useState<Array<{ id: string; name: string }>>([]);
  const [showSellerPicker, setShowSellerPicker] = useState(false);

  // تحميل بيانات العرض للتعديل (دعم snake_case وcamelCase)
  useEffect(() => {
    if (offer && visible) {
      const o: any = offer as any;
      const imageUrl = o.image_url || o.imageUrl || '';
      const priceVal = o.price !== undefined && o.price !== null ? String(o.price) : '';
      const discountPriceVal = o.discount_price ?? o.discountPrice;
      const stockQtyVal = o.stock_quantity ?? o.stockQuantity;
      const imgs: string[] | undefined = o.images;

      setFormData(prev => ({
        ...prev,
        name: o.name || '',
        description: o.description || '',
        price: priceVal,
        discount_price: discountPriceVal !== undefined && discountPriceVal !== null ? String(discountPriceVal) : '',
        stock_quantity: stockQtyVal !== undefined && stockQtyVal !== null ? String(stockQtyVal) : '',
        image_url: imageUrl,
      }));

      if (Array.isArray(imgs) && imgs.length > 0) {
        setImages(imgs);
      } else if (imageUrl) {
        setImages([imageUrl]);
      } else {
        setImages([]);
      }

      // إظهار الحقول الاختيارية إذا كانت تحتوي على بيانات
      setShowDescription(!!(o.description));
      setShowDiscountPrice(!!(discountPriceVal));
    }
    if (!offer && visible) {
      // إعادة تعيين النموذج للعرض الجديد
      setFormData({
        name: '',
        description: '',
        price: '',
        discount_price: '',
        stock_quantity: '',
        image_url: '',
      });
      setImages([]);
      setShowDescription(false);
      setShowDiscountPrice(false);
    }
  }, [offer, visible]);

  // ضبط البائع (seller_id, seller_name) عند فتح نافذة التعديل بعد تحميل قائمة البائعين
  useEffect(() => {
    if (!offer || !visible) return;
    const o: any = offer as any;
    const sid: string | undefined = o.seller_id || o.sellerId;
    if (!sid) return;
    const seller = sellers.find(s => s.id === sid);
    setFormData(prev => ({ ...(prev as any), seller_id: sid, seller_name: seller?.name || (prev as any).seller_name } as any));
  }, [offer, visible, sellers]);

  useEffect(() => {
    const loadSellers = async () => {
      try {
        const data = await listSellers();
        setSellers(data);
      } catch (error) {
        console.error('Error loading sellers:', error);
      }
    };
    loadSellers();
  }, []);

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
      const imageUrl = await CloudinaryService.uploadImage(asset.uri, 'offers');
      
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
    } catch (error: any) {
      console.error('❌ خطأ في رفع الصورة:', error);
      Alert.alert('❌ خطأ', `فشل في رفع الصورة: ${error.message || 'خطأ غير معروف'}`);
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
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'اسم العرض مطلوب');
      return false;
    }
    if (!formData.price.trim()) {
      Alert.alert('خطأ', 'سعر العرض مطلوب');
      return false;
    }
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      Alert.alert('خطأ', 'سعر العرض يجب أن يكون رقم موجب');
      return false;
    }
    if (!formData.stock_quantity.trim()) {
      Alert.alert('خطأ', 'كمية المخزون مطلوبة');
      return false;
    }
    if (isNaN(Number(formData.stock_quantity)) || Number(formData.stock_quantity) < 0) {
      Alert.alert('خطأ', 'كمية المخزون يجب أن تكون رقم موجب');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // حساب نسبة الخصم تلقائياً
      let discount_percentage = undefined;
      if (formData.discount_price && formData.price) {
        const originalPrice = Number(formData.price);
        const discountPrice = Number(formData.discount_price);
        if (discountPrice < originalPrice) {
          discount_percentage = Math.round(((originalPrice - discountPrice) / originalPrice) * 100);
        }
      }

      const offerData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: Number(formData.price),
        discount_price: formData.discount_price ? Number(formData.discount_price) : undefined,
        discount_percentage,
        stock_quantity: Number(formData.stock_quantity),
        category: 'عروض', // قيمة افتراضية للفئة
        image_url: formData.image_url.trim() || undefined,
        seller_id: (formData as any).seller_id || undefined,
      };

      let result;
      if (offer) {
        // تحديث عرض موجود
        result = await updateOffer(offer.id, offerData);
      } else {
        // إضافة عرض جديد
        result = await createOffer(offerData);
      }

      if (result.success) {
        // إغلاق النموذج مباشرة بدون Alert
        onSuccess();
        onClose();
      } else {
        Alert.alert('خطأ', result.error || 'حدث خطأ غير متوقع');
      }
    } catch (error) {
      console.error('Error saving offer:', error);
      Alert.alert('خطأ', 'حدث خطأ في حفظ العرض');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            {offer ? 'تعديل العرض' : 'إضافة عرض جديد'}
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
          {/* All Fields Together */}
          <View style={styles.formContainer}>
            {/* Required Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>اسم العرض *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => handleInputChange('name', value)}
                placeholder="أدخل اسم العرض"
                placeholderTextColor="#9CA3AF"
              />
            </View>

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

            {/* Seller */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>البائع</Text>
              <TouchableOpacity
                style={styles.optionalButton}
                onPress={() => setShowSellerPicker(true)}
              >
                <Plus size={16} color="#FF6B35" />
                <Text style={styles.optionalButtonText}>
                  {(formData as any).seller_name || 'اختر البائع'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Optional Fields as Buttons */}
            {!showDescription && (
              <TouchableOpacity
                style={styles.optionalButton}
                onPress={() => setShowDescription(true)}
              >
                <Plus size={16} color="#FF6B35" />
                <Text style={styles.optionalButtonText}>إضافة وصف</Text>
              </TouchableOpacity>
            )}

            {showDescription && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>وصف العرض</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                  placeholder="أدخل وصف العرض"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            )}

            {!showDiscountPrice && (
              <TouchableOpacity
                style={styles.optionalButton}
                onPress={() => setShowDiscountPrice(true)}
              >
                <Plus size={16} color="#FF6B35" />
                <Text style={styles.optionalButtonText}>إضافة سعر خصم</Text>
              </TouchableOpacity>
            )}

            {showDiscountPrice && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>سعر التخفيض (دج)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.discount_price}
                  onChangeText={(value) => handleInputChange('discount_price', value)}
                  placeholder="اختياري"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
            )}

            {/* قسم الصور */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>صور العرض</Text>
              
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
                يمكنك إضافة عدة صور للعرض. الصورة الأولى ستكون الصورة الرئيسية.
              </Text>
            </View>
          </View>
          </ScrollView>
        </View>
      </Modal>
      {/* Seller Picker Modal */}
      <Modal visible={showSellerPicker} animationType="slide">
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowSellerPicker(false)}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>اختر البائع</Text>
            <View style={{ width: 20 }} />
          </View>
          <ScrollView style={styles.content}>
            {sellers.length === 0 ? (
              <Text style={styles.helpText}>لا توجد بائعون متاحون</Text>
            ) : (
              <View style={styles.formContainer}>
                {sellers.map((seller) => (
                  <TouchableOpacity
                    key={seller.id}
                    style={styles.optionalButton}
                    onPress={() => {
                      setFormData(prev => ({ ...(prev as any), seller_id: seller.id, seller_name: seller.name } as any));
                      setShowSellerPicker(false);
                    }}
                  >
                    <Text style={styles.optionalButtonText}>{seller.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
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
  formContainer: {
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
  optionalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  optionalButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 8,
  },
  // أنماط الصور
  imagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imagePreviewContainer: {
    position: 'relative',
    width: 80,
    height: 80,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImageBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mainImageText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  professionalButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  professionalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 20,
  },
  loadingSpinner: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRadius: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
