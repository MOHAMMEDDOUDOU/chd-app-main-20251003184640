import { db, sellers } from './database/config';
import { eq } from 'drizzle-orm';

export interface CreateSellerInput {
  name: string;
  phoneNumber?: string;
  location?: string;
}

export interface UpdateSellerInput {
  name?: string;
  phoneNumber?: string;
  location?: string;
}

export async function createSeller(input: CreateSellerInput) {
  if (!input.name || input.name.trim() === '') {
    return { success: false, error: 'اسم البائع مطلوب' };
  }

  const [row] = await db.insert(sellers).values({
    name: input.name.trim(),
    phoneNumber: input.phoneNumber?.trim() || null,
    location: input.location?.trim() || null,
  }).returning();

  return { success: true, seller: row };
}

export async function listSellers() {
  const rows = await db.select().from(sellers).where(eq(sellers.isActive, true));
  return rows;
}

export async function deleteSeller(id: string) {
  try {
    const [deletedSeller] = await db.delete(sellers)
      .where(eq(sellers.id, id))
      .returning();
    
    if (!deletedSeller) {
      return {
        success: false,
        error: 'البائع غير موجود'
      };
    }
    
    return {
      success: true,
      seller: deletedSeller
    };
  } catch (error) {
    console.error('Error deleting seller:', error);
    return {
      success: false,
      error: 'فشل في حذف البائع'
    };
  }
}

export async function updateSeller(id: string, input: UpdateSellerInput) {
  try {
    const updateData: any = {};
    if (input.name !== undefined) updateData.name = input.name.trim();
    if (input.phoneNumber !== undefined) updateData.phoneNumber = input.phoneNumber.trim() || null;
    if (input.location !== undefined) updateData.location = input.location.trim() || null;

    const [updated] = await db.update(sellers)
      .set(updateData)
      .where(eq(sellers.id, id))
      .returning();

    if (!updated) {
      return { success: false, error: 'البائع غير موجود' };
    }
    return { success: true, seller: updated };
  } catch (error) {
    console.error('Error updating seller:', error);
    return { success: false, error: 'فشل في تعديل البائع' };
  }
}


