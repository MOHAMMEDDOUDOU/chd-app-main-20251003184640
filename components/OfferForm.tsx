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
import { createOffer, updateOffer, Offer } from '../lib/offers';
import { CloudinaryService } from '../lib/cloudinary';
import * as ImagePicker from 'expo-image-picker';

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

  // تحميل بيانات العرض للتعديل
  useEffect(() => {
    if (offer) {
      setFormData({
        name: offer.name || '',
        description: offer.description || '',
        price: offer.price.toString() || '',
        discount_price: offer.discount_price?.toString() || '',
        stock_quantity: offer.stock_quantity?.toString() || '',
        image_url: offer.image_url || '',
      });
      // تحميل الصور المتعددة إذا كانت موجودة
      if (offer.image_url) {
        setImages([offer.image_url]);
      } else {
        setImages([]);
      }
      // إظهار الحقول الاختيارية إذا كانت تحتوي على بيانات
      setShowDescription(!!offer.description);
      setShowDiscountPrice(!!offer.discount_price);
    } else {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // اختيار صورة من المعرض
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('خطأ', 'نحتاج إذن المعرض لاختيار صورة');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('خطأ', 'حدث خطأ في اختيار الصورة');
    }
  };

  // رفع الصورة إلى Cloudinary
  const uploadImage = async (imageUri: string) => {
    try {
      setUploadingImage(true);
      
      console.log('🚀 بدء رفع الصورة...');
      const imageUrl = await CloudinaryService.uploadImage(imageUri, 'offers');
      
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
                onPress={pickImage}
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
