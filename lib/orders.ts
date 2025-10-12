import { db } from './database/config';
import { orders, products, offers, users, sellers } from './database/config';
import { eq } from 'drizzle-orm';
import { NotificationService } from './notifications';

export interface Order {
  id: string;
  itemType: 'product' | 'offer';
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  shippingCost: string;
  totalAmount: string;
  customerName: string;
  phoneNumber: string;
  wilaya: string;
  commune?: string;
  deliveryType: 'home' | 'stopDesk';
  status: 'pending' | 'confirmed' | 'cancelled';
  resellerPrice?: string;
  createdAt: string;
}

export interface CreateOrderData {
  itemType: 'product' | 'offer';
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  shippingCost: number;
  totalAmount: number;
  customerName: string;
  phoneNumber: string;
  wilaya: string;
  commune?: string;
  deliveryType: 'home' | 'stopDesk';
  resellerPrice?: number;
  sellerId?: string; // معرف البائع (إذا كان مسجل الدخول)
  sellerName?: string; // اسم البائع (إذا كان مسجل الدخول)
  resellerPhone?: string; // رقم هاتف البائع
  trackingNumber?: string; // رقم التتبع
  imageUrl?: string; // صورة المنتج
}

// تم إلغاء منطق إنشاء روابط الويب للطلبيات بناءً على طلب العميل

export interface UpdateOrderData {
  // يدعم القيم الإنجليزية المعيارية وكذلك العربية المخزّنة في قاعدة البيانات
  status?:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'in_progress'
    | 'delivered'
    | 'out_of_stock'
    | 'قيد المعالجة'
    | 'تم التأكيد'
    | 'قيد الشحن'
    | 'تم التسليم'
    | 'ملغي'
    | 'نفد المخزون';
  resellerPrice?: number;
  trackingNumber?: string;
}

// الحصول على جميع الطلبات مع معلومات البائع والمشتري والمنتج/العرض الأصلي
export async function getOrders() {
  try {
    const result = await db.query.orders.findMany({
      orderBy: (orders, { desc }) => [desc(orders.createdAt)]
    });
    

    
    // إضافة معلومات البائع والمشتري والمنتج/العرض الأصلي
    const ordersWithUserInfo = await Promise.all(
      result.map(async (order) => {
        let sellerInfo = null;
        let buyerInfo = null;
        let originalItemInfo = null;
        
        // محاولة الحصول على معلومات البائع من sellerId
        if (order.sellerId) {
          try {
            const seller = await db.query.sellers.findFirst({
              where: eq(sellers.id, order.sellerId),
              columns: {
                id: true,
                name: true,
                phoneNumber: true,
              }
            });
            sellerInfo = seller;
          } catch (error) {
            console.error('❌ خطأ في تحميل معلومات البائع:', error);
          }
        } else {
          // محاولة الحصول على البائع من المنتج/العرض المرتبط
          try {
            if (order.itemType === 'product') {
              const product = await db.query.products.findFirst({
                where: eq(products.id, order.itemId),
                columns: {
                  sellerId: true,
                }
              });
              if (product?.sellerId) {
                const seller = await db.query.sellers.findFirst({
                  where: eq(sellers.id, product.sellerId),
                  columns: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                  }
                });
                if (seller) {
                  sellerInfo = seller;
                }
              }
            } else if (order.itemType === 'offer') {
              const offer = await db.query.offers.findFirst({
                where: eq(offers.id, order.itemId),
                columns: {
                  sellerId: true,
                }
              });
              if (offer?.sellerId) {
                const seller = await db.query.sellers.findFirst({
                  where: eq(sellers.id, offer.sellerId),
                  columns: {
                    id: true,
                    name: true,
                    phoneNumber: true,
                  }
                });
                if (seller) {
                  sellerInfo = seller;
                }
              }
            }
          } catch (error) {
            console.error('❌ خطأ في تحميل البائع من المنتج/العرض:', error);
          }
        }
        
        // محاولة الحصول على معلومات المشتري من جدول المستخدمين
        if (order.customerName) {
          try {
            const buyer = await db.query.users.findFirst({
              where: eq(users.fullName, order.customerName),
              columns: {
                id: true,
                fullName: true,
                username: true,
                phoneNumber: true,
              }
            });
            buyerInfo = buyer;
          } catch (error) {
            console.error('Error fetching buyer info:', error);
          }
        }
        
        // محاولة الحصول على معلومات المنتج/العرض الأصلي
        try {
          if (order.itemType === 'product') {
            const product = await db.query.products.findFirst({
              where: eq(products.id, order.itemId),
              columns: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                description: true,
              }
            });
            originalItemInfo = product;
          } else if (order.itemType === 'offer') {
            const offer = await db.query.offers.findFirst({
              where: eq(offers.id, order.itemId),
              columns: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                description: true,
              }
            });
            originalItemInfo = offer;
          }
        } catch (error) {
          console.error('Error fetching original item info:', error);
        }
        
        // محاولة الحصول على اسم البائع (الذي باع السلعة) من جدول المستخدمين باستخدام resellerUserId
        let resellerName = order.sellerName;
        if (!resellerName && order.resellerUserId) {
          try {
            const resellerUser = await db.query.users.findFirst({
              where: eq(users.id, order.resellerUserId),
              columns: {
                fullName: true,
              }
            });
            resellerName = resellerUser?.fullName || null;
          } catch (error) {
            console.error('❌ خطأ في تحميل اسم البائع من جدول المستخدمين:', error);
          }
        }

        const orderWithInfo = {
          ...order,
          seller: sellerInfo,
          buyer: buyerInfo,
          originalItem: originalItemInfo,
          // البائع الذي اشتريت منه السلعة (من جدول sellers)
          sellerName: sellerInfo?.name || null,
          sellerPhone: sellerInfo?.phoneNumber || null,
          // البائع الذي باع السلعة (من بيانات الطلبية الأصلية أو من جدول المستخدمين)
          resellerName: resellerName || null,
          resellerPhone: order.resellerPhone || null
        };
        
        

        
        return orderWithInfo;
      })
    );
    
    return {
      success: true,
      orders: ordersWithUserInfo
    };
  } catch (error) {
    console.error('Error fetching orders:', error);
    return {
      success: false,
      error: 'فشل في تحميل الطلبات'
    };
  }
}

// الحصول على طلب واحد
export async function getOrder(id: string) {
  try {
    const result = await db.query.orders.findFirst({
      where: eq(orders.id, id)
    });
    
    if (!result) {
      return {
        success: false,
        error: 'الطلب غير موجود'
      };
    }
    
    return {
      success: true,
      order: result
    };
  } catch (error) {
    console.error('Error fetching order:', error);
    return {
      success: false,
      error: 'فشل في تحميل الطلب'
    };
  }
}

// إضافة طلب جديد
export async function createOrder(data: CreateOrderData) {
  try {
    const [newOrder] = await db.insert(orders).values({
      itemType: data.itemType,
      itemId: data.itemId,
      itemName: data.itemName,
      quantity: data.quantity,
      unitPrice: data.unitPrice.toString(),
      subtotal: data.subtotal.toString(),
      shippingCost: data.shippingCost.toString(),
      totalAmount: data.totalAmount.toString(),
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      wilaya: data.wilaya,
      commune: data.commune,
      deliveryType: data.deliveryType,
      resellerPrice: data.resellerPrice ? data.resellerPrice.toString() : null,
      sellerId: data.sellerId || null,
      sellerName: data.sellerName || null,
      resellerPhone: data.resellerPhone || null,
      trackingNumber: data.trackingNumber || null,
      imageUrl: data.imageUrl || null,
    }).returning();
    
    // إرسال إشعار للأدمن والبائع عن الطلبية الجديدة
    await NotificationService.notifyAdminAndSellerForNewOrder({
      customerName: data.customerName,
      itemName: data.itemName,
      totalAmount: data.totalAmount,
      sellerId: data.sellerId, // معرف البائع (إذا كان موجود)
      sellerName: data.sellerName, // اسم البائع (إذا كان موجود)
    });
    
    return {
      success: true,
      order: newOrder
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      success: false,
      error: 'فشل في إنشاء الطلب'
    };
  }
}

// تحديث طلب
export async function updateOrder(id: string, data: UpdateOrderData) {
  try {
    const updateData: any = {};
    
    if (data.status !== undefined) updateData.status = data.status;
    if (data.resellerPrice !== undefined) updateData.resellerPrice = data.resellerPrice.toString();
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    
    const [updatedOrder] = await db.update(orders)
      .set(updateData)
      .where(eq(orders.id, id))
      .returning();
    
    if (!updatedOrder) {
      return {
        success: false,
        error: 'الطلب غير موجود'
      };
    }
    
    return {
      success: true,
      order: updatedOrder
    };
  } catch (error) {
    console.error('Error updating order:', error);
    return {
      success: false,
      error: 'فشل في تحديث الطلب'
    };
  }
}

// حذف طلب
export async function deleteOrder(id: string) {
  try {
    const [deletedOrder] = await db.delete(orders)
      .where(eq(orders.id, id))
      .returning();
    
    if (!deletedOrder) {
      return {
        success: false,
        error: 'الطلب غير موجود'
      };
    }
    
    return {
      success: true,
      order: deletedOrder
    };
  } catch (error) {
    console.error('Error deleting order:', error);
    return {
      success: false,
      error: 'فشل في حذف الطلب'
    };
  }
}

// الحصول على الطلبات حسب الحالة
export async function getOrdersByStatus(
  status:
    | 'pending'
    | 'confirmed'
    | 'cancelled'
    | 'in_progress'
    | 'delivered'
    | 'out_of_stock'
) {
  try {
    // تحويل الحالة الإنجليزية إلى العربية
  const statusMap = {
      pending: 'قيد المعالجة' as const,
      confirmed: 'تم التأكيد' as const,
      cancelled: 'ملغي' as const,
      in_progress: 'قيد الشحن' as const,
      delivered: 'تم التسليم' as const,
      out_of_stock: 'نفد المخزون' as const,
    };
    
    const arabicStatus = statusMap[status];
    
    const result = await db.query.orders.findMany({
      where: eq(orders.status, arabicStatus),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)]
    });
    
    return {
      success: true,
      orders: result
    };
  } catch (error) {
    console.error('Error fetching orders by status:', error);
    return {
      success: false,
      error: 'فشل في تحميل الطلبات'
    };
  }
}

// الحصول على الطلبات الخاصة بمستخدم (كبائع/مُعيد بيع)
export async function getOrdersByResellerUser(userId: string) {
  try {
    const result = await db.query.orders.findMany({
      where: eq(orders.resellerUserId, userId),
      orderBy: (orders, { desc }) => [desc(orders.createdAt)]
    });

    return { success: true, orders: result };
  } catch (error) {
    console.error('Error fetching orders by reseller user:', error);
    return { success: false, error: 'فشل في تحميل طلبات المستخدم' };
  }
}
