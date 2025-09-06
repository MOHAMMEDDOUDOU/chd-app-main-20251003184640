import { db } from './database/config';
import { categories } from './database/config';
import { eq, and, desc } from 'drizzle-orm';

export interface Category {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  imageUrl?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export class CategoryService {
  // إنشاء فئة جديدة
  static async createCategory(data: CreateCategoryData): Promise<Category> {
    try {
      const [category] = await db.insert(categories).values({
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
      }).returning();

      return category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('فشل في إنشاء الفئة');
    }
  }

  // الحصول على جميع الفئات النشطة
  static async getAllActiveCategories(): Promise<Category[]> {
    try {
      const result = await db.select().from(categories)
        .where(eq(categories.isActive, true))
        .orderBy(desc(categories.createdAt));

      return result;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('فشل في جلب الفئات');
    }
  }

  // الحصول على جميع الفئات (للإدارة)
  static async getAllCategories(): Promise<Category[]> {
    try {
      const result = await db.select().from(categories)
        .orderBy(desc(categories.createdAt));

      return result;
    } catch (error) {
      console.error('Error fetching all categories:', error);
      throw new Error('فشل في جلب جميع الفئات');
    }
  }

  // الحصول على فئة واحدة
  static async getCategoryById(id: string): Promise<Category | null> {
    try {
      const [category] = await db.select().from(categories)
        .where(eq(categories.id, id));

      return category || null;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error('فشل في جلب الفئة');
    }
  }

  // تحديث فئة
  static async updateCategory(id: string, data: UpdateCategoryData): Promise<Category> {
    try {
      const [category] = await db.update(categories)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      if (!category) {
        throw new Error('الفئة غير موجودة');
      }

      return category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('فشل في تحديث الفئة');
    }
  }

  // حذف فئة
  static async deleteCategory(id: string): Promise<void> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('فشل في حذف الفئة');
    }
  }

  // تفعيل/إلغاء تفعيل فئة
  static async toggleCategoryStatus(id: string): Promise<Category> {
    try {
      const category = await this.getCategoryById(id);
      if (!category) {
        throw new Error('الفئة غير موجودة');
      }

      const [updatedCategory] = await db.update(categories)
        .set({
          isActive: !category.isActive,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      return updatedCategory;
    } catch (error) {
      console.error('Error toggling category status:', error);
      throw new Error('فشل في تغيير حالة الفئة');
    }
  }

  // البحث في الفئات
  static async searchCategories(query: string): Promise<Category[]> {
    try {
      const result = await db.select().from(categories)
        .where(
          and(
            eq(categories.isActive, true),
            // يمكن إضافة بحث أكثر تعقيداً هنا
          )
        )
        .orderBy(desc(categories.createdAt));

      // فلترة النتائج حسب النص
      return result.filter(category => 
        category.name.toLowerCase().includes(query.toLowerCase()) ||
        category.description?.toLowerCase().includes(query.toLowerCase())
      );
    } catch (error) {
      console.error('Error searching categories:', error);
      throw new Error('فشل في البحث في الفئات');
    }
  }
}
