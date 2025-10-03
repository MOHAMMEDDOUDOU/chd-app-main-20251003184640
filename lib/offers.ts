import { db } from './database/config';
import { offers } from './database/config';
import { eq } from 'drizzle-orm';
import { NotificationService } from './notifications';

export interface Offer {
  id: string;
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  stock_quantity: number;
  sizes?: any;
  images?: any;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOfferData {
  name: string;
  description: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  stock_quantity: number;
  sizes?: any;
  images?: any;
  category: string;
  seller_id?: string;
}

export interface UpdateOfferData {
  name?: string;
  description?: string;
  price?: number;
  discount_price?: number;
  image_url?: string;
  stock_quantity?: number;
  sizes?: any;
  images?: any;
  category?: string;
  seller_id?: string;
}

// الحصول على جميع العروض
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
      where: eq(offers.id, id)
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

// إضافة عرض جديد
export async function createOffer(data: CreateOfferData) {
  try {
    const [newOffer] = await db.insert(offers).values({
      name: data.name,
      description: data.description,
      price: data.price,
      discountPrice: data.discount_price,
      imageUrl: data.image_url,
      stockQuantity: data.stock_quantity,
      sizes: data.sizes,
      images: data.images,
      category: data.category,
      sellerId: data.seller_id || null,
    }).returning();
    
    // إرسال إشعار فوري لجميع المستخدمين عن العرض الجديد
    try {
      const { NotificationService } = await import('./notifications');
      await NotificationService.notifyUsersForNewOffer({
        name: data.name,
        price: data.price,
        description: data.description,
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }
    
    return {
      success: true,
      offer: newOffer
    };
  } catch (error) {
    console.error('Error creating offer:', error);
    return {
      success: false,
      error: 'فشل في إنشاء العرض'
    };
  }
}

// تحديث عرض
export async function updateOffer(id: string, data: UpdateOfferData) {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.discount_price !== undefined) updateData.discountPrice = data.discount_price;
    if (data.image_url !== undefined) updateData.imageUrl = data.image_url;
    if (data.stock_quantity !== undefined) updateData.stockQuantity = data.stock_quantity;
    if (data.sizes !== undefined) updateData.sizes = data.sizes;
    if (data.images !== undefined) updateData.images = data.images;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.seller_id !== undefined) updateData.sellerId = data.seller_id;
    
    const [updatedOffer] = await db.update(offers)
      .set(updateData)
      .where(eq(offers.id, id))
      .returning();
    
    if (!updatedOffer) {
      return {
        success: false,
        error: 'العرض غير موجود'
      };
    }
    
    return {
      success: true,
      offer: updatedOffer
    };
  } catch (error) {
    console.error('Error updating offer:', error);
    return {
      success: false,
      error: 'فشل في تحديث العرض'
    };
  }
}

// حذف عرض
export async function deleteOffer(id: string) {
  try {
    const [deletedOffer] = await db.delete(offers)
      .where(eq(offers.id, id))
      .returning();
    
    if (!deletedOffer) {
      return {
        success: false,
        error: 'العرض غير موجود'
      };
    }
    
    return {
      success: true,
      offer: deletedOffer
    };
  } catch (error) {
    console.error('Error deleting offer:', error);
    return {
      success: false,
      error: 'فشل في حذف العرض'
    };
  }
}
