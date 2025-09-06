import { db, resellLinks, products, offers, users, type NewResellLink } from './database/config';
import { and, desc, eq } from 'drizzle-orm';

function generateSlug(length = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function createResellLink(productId: string, userId: string, resellerPrice?: number) {
  // Ensure unique slug
  let slug = '';
  for (let i = 0; i < 5; i++) {
    const candidate = generateSlug(12);
    const exists = await db.select({ id: resellLinks.id }).from(resellLinks).where(eq(resellLinks.slug, candidate)).limit(1);
    if (exists.length === 0) { slug = candidate; break; }
  }
  if (!slug) throw new Error('Failed to generate unique slug');

  // Try with itemType (new schema); fallback to legacy without itemType
  try {
    const [row] = await db.insert(resellLinks).values({ 
      productId, 
      userId, 
      slug, 
      itemType: 'product' as any,
      resellerPrice: resellerPrice ? resellerPrice.toString() : null
    } as any).returning();
    return row;
  } catch (_err) {
    const [row] = await db.insert(resellLinks).values({ 
      productId, 
      userId, 
      slug,
      resellerPrice: resellerPrice ? resellerPrice.toString() : null
    } as any).returning();
    return row;
  }
}

export async function createResellLinkForItem(itemType: 'product' | 'offer', itemId: string, userId: string, resellerPrice?: number) {
  if (itemType === 'product') {
    return createResellLink(itemId, userId, resellerPrice);
  }

  // For offers - use offer_id column
  console.log('🔍 إنشاء رابط للعرض باستخدام offer_id:', { itemType, itemId, userId, resellerPrice });
  
  let slug = '';
  for (let i = 0; i < 5; i++) {
    const candidate = generateSlug(12);
    const exists = await db.select({ id: resellLinks.id }).from(resellLinks).where(eq(resellLinks.slug, candidate)).limit(1);
    if (exists.length === 0) { slug = candidate; break; }
  }
  if (!slug) throw new Error('Failed to generate unique slug');

  try {
    console.log('📝 إدراج العرض في offer_id مع السعر:', resellerPrice);
    const [row] = await db.insert(resellLinks).values({ 
      userId, 
      slug, 
      offerId: itemId, // Use offer_id for offers
      productId: null, // Explicit null for products
      itemType: 'offer' as any,
      resellerPrice: resellerPrice ? resellerPrice.toString() : null
    } as any).returning();
    console.log('✅ نجح الإدراج:', row);
    return row;
  } catch (err) {
    console.log('❌ فشل الإدراج:', err);
    throw new Error(`فشل في إنشاء رابط إعادة البيع للعرض: ${err}`);
  }
}

export async function getResellLinkBySlug(slug: string) {
  try {
    const [row] = await db.select({
      id: resellLinks.id,
      slug: resellLinks.slug,
      isActive: resellLinks.isActive,
      itemType: (resellLinks as any).itemType,
      createdAt: resellLinks.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
      },
      offer: {
        id: offers.id,
        name: offers.name,
        description: offers.description,
        price: offers.price,
        imageUrl: offers.imageUrl,
      },
      seller: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(resellLinks)
    .leftJoin(products, eq(resellLinks.productId, products.id))
    .leftJoin(offers, eq(resellLinks.offerId, offers.id))
    .innerJoin(users, eq(resellLinks.userId, users.id))
    .where(eq(resellLinks.slug, slug))
    .limit(1);
    return row || null;
  } catch (_err) {
    // Legacy fallback (without offer joins / itemType)
    const [row] = await db.select({
      id: resellLinks.id,
      slug: resellLinks.slug,
      isActive: resellLinks.isActive,
      createdAt: resellLinks.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        imageUrl: products.imageUrl,
      },
      seller: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(resellLinks)
    .innerJoin(products, eq(resellLinks.productId, products.id))
    .innerJoin(users, eq(resellLinks.userId, users.id))
    .where(eq(resellLinks.slug, slug))
    .limit(1);
    return row || null;
  }
}

export async function listUserResellLinks(userId: string) {
  try {
    const rows = await db.select({
      id: resellLinks.id,
      slug: resellLinks.slug,
      isActive: resellLinks.isActive,
      itemType: (resellLinks as any).itemType,
      createdAt: resellLinks.createdAt,
      product: {
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        price: products.price,
      },
      offer: {
        id: offers.id,
        name: offers.name,
        imageUrl: offers.imageUrl,
        price: offers.price,
      }
    })
    .from(resellLinks)
    .leftJoin(products, eq(resellLinks.productId, products.id))
    .leftJoin(offers, eq(resellLinks.offerId, offers.id))
    .where(and(eq(resellLinks.userId, userId), eq(resellLinks.isActive, true)))
    .orderBy(desc(resellLinks.createdAt));
    return rows;
  } catch (_err) {
    // Legacy fallback without offers
    const rows = await db.select({
      id: resellLinks.id,
      slug: resellLinks.slug,
      isActive: resellLinks.isActive,
      createdAt: resellLinks.createdAt,
      product: {
        id: products.id,
        name: products.name,
        imageUrl: products.imageUrl,
        price: products.price,
      }
    })
    .from(resellLinks)
    .innerJoin(products, eq(resellLinks.productId, products.id))
    .where(and(eq(resellLinks.userId, userId), eq(resellLinks.isActive, true)))
    .orderBy(desc(resellLinks.createdAt));
    return rows as any;
  }
}

export async function deactivateResellLink(id: string, userId: string) {
  await db.update(resellLinks)
    .set({ isActive: false })
    .where(and(eq(resellLinks.id, id), eq(resellLinks.userId, userId)));
}


