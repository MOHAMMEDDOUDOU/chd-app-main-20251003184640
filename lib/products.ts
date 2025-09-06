import { db } from './database/config';
import { products } from './database/config';
import { eq } from 'drizzle-orm';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  discount_percentage?: number;
  image_url?: string;
  stock_quantity: number;
  sizes?: any;
  images?: any;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  discount_percentage?: number;
  image_url?: string;
  stock_quantity: number;
  sizes?: any;
  images?: any;
  category: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  discount_price?: number;
  discount_percentage?: number;
  image_url?: string;
  stock_quantity?: number;
  sizes?: any;
  images?: any;
  category?: string;
  is_active?: boolean;
}

// الحصول على جميع المنتجات
export async function getProducts() {
  try {
    const result = await db.query.products.findMany({
      orderBy: (products, { desc }) => [desc(products.createdAt)]
    });
    
    return {
      success: true,
      products: result
    };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      error: 'فشل في تحميل المنتجات'
    };
  }
}

// الحصول على منتج واحد
export async function getProduct(id: string) {
  try {
    const result = await db.query.products.findFirst({
      where: eq(products.id, id)
    });
    
    if (!result) {
      return {
        success: false,
        error: 'المنتج غير موجود'
      };
    }
    
    return {
      success: true,
      product: result
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      success: false,
      error: 'فشل في تحميل المنتج'
    };
  }
}

// إضافة منتج جديد
export async function createProduct(data: CreateProductData) {
  try {
    const [newProduct] = await db.insert(products).values({
      name: data.name,
      description: data.description,
      price: data.price,
      discountPrice: data.discount_price,
      discountPercentage: data.discount_percentage,
      imageUrl: data.image_url,
      stockQuantity: data.stock_quantity,
      sizes: data.sizes,
      images: data.images,
      category: data.category,
      isActive: true,
    }).returning();
    
    // إرسال إشعار فوري لجميع المستخدمين عن المنتج الجديد
    try {
      const { NotificationService } = await import('./notifications');
      await NotificationService.notifyUsersForNewProduct({
        name: data.name,
        price: data.price,
        description: data.description,
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }
    
    return {
      success: true,
      product: newProduct
    };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      success: false,
      error: 'فشل في إنشاء المنتج'
    };
  }
}

// تحديث منتج
export async function updateProduct(id: string, data: UpdateProductData) {
  try {
    const [updatedProduct] = await db.update(products)
      .set({
        name: data.name,
        description: data.description,
        price: data.price,
        discountPrice: data.discount_price,
        discountPercentage: data.discount_percentage,
        imageUrl: data.image_url,
        stockQuantity: data.stock_quantity,
        sizes: data.sizes,
        images: data.images,
        category: data.category,
        isActive: data.is_active,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    if (!updatedProduct) {
      return {
        success: false,
        error: 'المنتج غير موجود'
      };
    }
    
    return {
      success: true,
      product: updatedProduct
    };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      success: false,
      error: 'فشل في تحديث المنتج'
    };
  }
}

// حذف منتج
export async function deleteProduct(id: string) {
  try {
    const [deletedProduct] = await db.delete(products)
      .where(eq(products.id, id))
      .returning();
    
    if (!deletedProduct) {
      return {
        success: false,
        error: 'المنتج غير موجود'
      };
    }
    
    return {
      success: true,
      product: deletedProduct
    };
  } catch (error) {
    console.error('Error deleting product:', error);
    return {
      success: false,
      error: 'فشل في حذف المنتج'
    };
  }
}

// الحصول على العروض
export async function getOffers() {
  try {
    const result = await db.query.offers.findMany({
      orderBy: (offers, { desc }) => [desc(offers.createdAt)]
    });
    
    return {
      success: true,
      offers: result
    };
  } catch (error) {
    console.error('Error fetching offers:', error);
    return {
      success: false,
      error: 'فشل في تحميل العروض'
    };
  }
}

// الحصول على عرض واحد
export async function getOffer(id: string) {
  try {
    const result = await db.query.offers.findFirst({
      where: eq((offers as any).id, id)
    });
    
    if (!result) {
      return {
        success: false,
        error: 'العرض غير موجود'
      };
    }
    
    return {
      success: true,
      offer: result
    };
  } catch (error) {
    console.error('Error fetching offer:', error);
    return {
      success: false,
      error: 'فشل في تحميل العرض'
    };
  }
}
