import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { CategoryService, Category } from '../lib/categories';

interface CategoriesListProps {
  onCategorySelect: (categoryName: string) => void;
  selectedCategory?: string;
}

export default function CategoriesList({ onCategorySelect, selectedCategory }: CategoriesListProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await CategoryService.getAllActiveCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>جاري تحميل الفئات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>تسوق حسب الفئات</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* زر الكل */}
        <TouchableOpacity
          style={[
            styles.chip,
            !selectedCategory && styles.chipSelected
          ]}
          onPress={() => onCategorySelect('')}
        >
          <Text style={[styles.chipText, !selectedCategory && styles.chipTextSelected]}>الكل</Text>
        </TouchableOpacity>

        {/* فلاتر نصية للفئات */}
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.chip,
              selectedCategory === category.name && styles.chipSelected
            ]}
            onPress={() => onCategorySelect(category.name)}
          >
            <Text style={[
              styles.chipText,
              selectedCategory === category.name && styles.chipTextSelected
            ]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  chip: {
    marginRight: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipSelected: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FF6B35',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  chipTextSelected: {
    color: '#FF6B35',
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#6B7280',
    paddingVertical: 20,
  },
});
