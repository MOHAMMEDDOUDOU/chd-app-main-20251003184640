import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  Dimensions,
} from 'react-native';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react-native';
import { CategoryService, Category } from '../lib/categories';

interface CategoriesManagementProps {
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 48) / 2; // عرض البطاقة مع المسافات

// ألوان للفئات
const categoryColors = [
  '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function CategoriesManagement({ onClose }: CategoriesManagementProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  // تحميل الفئات
  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('خطأ', 'فشل في تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // إعادة تعيين النموذج
  const resetForm = () => {
    setFormData({
      name: '',
    });
    setEditingCategory(null);
  };

  // فتح نموذج إضافة فئة جديدة
  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // فتح نموذج تعديل فئة
  const openEditForm = (category: Category) => {
    setFormData({
      name: category.name,
    });
    setEditingCategory(category);
    setShowForm(true);
  };

  // حفظ الفئة
  const saveCategory = async () => {
    if (!formData.name.trim()) {
      Alert.alert('خطأ', 'اسم الفئة مطلوب');
      return;
    }

    try {
      if (editingCategory) {
        const updatedCategory = await CategoryService.updateCategory(editingCategory.id, { name: formData.name });
        // تحديث مباشر في القائمة
        setCategories(prev => prev.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        ));
        Alert.alert('✅ نجح', 'تم تحديث الفئة بنجاح');
      } else {
        const newCategory = await CategoryService.createCategory({ name: formData.name });
        // إضافة مباشر للقائمة
        setCategories(prev => [newCategory, ...prev]);
        Alert.alert('✅ نجح', 'تم إنشاء الفئة بنجاح');
      }
      
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('خطأ', 'فشل في حفظ الفئة');
    }
  };

  // حذف فئة
  const deleteCategory = async (category: Category) => {
    try {
      await CategoryService.deleteCategory(category.id);
      setCategories(prev => prev.filter(cat => cat.id !== category.id));
    } catch (error) {
      console.error('Error deleting category:', error);
      Alert.alert('خطأ', 'فشل في حذف الفئة');
    }
  };

  // تغيير حالة الفئة (مؤشر فقط بدون زر)
  const toggleCategoryStatus = async (category: Category) => {
    try {
      const updatedCategory = await CategoryService.toggleCategoryStatus(category.id);
      // تحديث مباشر في القائمة
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? updatedCategory : cat
      ));
    } catch (error) {
      console.error('Error toggling category status:', error);
      Alert.alert('خطأ', 'فشل في تغيير حالة الفئة');
    }
  };

  // الحصول على لون الفئة
  const getCategoryColor = (categoryId: any) => {
    try {
      const key = String(categoryId ?? '');
      if (key.length === 0) return categoryColors[0];
      // توليد رقم هاش بسيط مستقر
      let hash = 0;
      for (let i = 0; i < key.length; i++) {
        hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
      }
      const index = hash % categoryColors.length;
      return categoryColors[index];
    } catch {
      return categoryColors[0];
    }
  };

  // عرض صف الفئة
  const renderCategoryCard = ({ item: category }: { item: Category }) => {
    const categoryColor = getCategoryColor(category.id);
    
    return (
      <View style={[styles.categoryRowItem, { borderLeftColor: categoryColor }]}> 
        {/* الاسم والحالة */}
        <View style={styles.categoryRowInfo}>
          <Text style={styles.categoryRowName} numberOfLines={1}>
            {category.name}
          </Text>
          <View style={styles.categoryStatusContainer}>
            <View style={[
              styles.statusIndicator,
              { backgroundColor: category.isActive ? '#10B981' : '#6B7280' }
            ]} />
          </View>
        </View>

        {/* الإجراءات */}
        <View style={styles.categoryRowActions}>
          <TouchableOpacity
            style={[styles.rowActionButton, styles.editButton]}
            onPress={() => openEditForm(category)}
          >
            <Edit size={16} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rowActionButton, styles.deleteButton]}
            onPress={() => deleteCategory(category)}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>إدارة الفئات</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Add Button */}
        <TouchableOpacity style={styles.addButton} onPress={openAddForm}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة فئة جديدة</Text>
        </TouchableOpacity>

        {/* Categories List */}
        {loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.loadingText}>جاري التحميل...</Text>
          </View>
        ) : categories.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>لا توجد فئات</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategoryCard}
            keyExtractor={(item) => item.id}
            numColumns={1}
            contentContainerStyle={styles.categoriesListCompact}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Category Form Modal */}
      <Modal visible={showForm} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowForm(false)}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>اسم الفئة *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="أدخل اسم الفئة"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveButton} onPress={saveCategory}>
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {editingCategory ? 'تحديث الفئة' : 'إنشاء الفئة'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 16,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  categoriesListCompact: {
    paddingBottom: 12,
  },
  categoryRowItem: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    borderLeftWidth: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  categoryRowInfo: {
    flex: 1,
    paddingRight: 10,
  },
  categoryRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  categoryStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowActionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#EFF6FF',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
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
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
