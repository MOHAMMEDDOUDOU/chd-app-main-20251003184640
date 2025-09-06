import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgTable, uuid, varchar, text, decimal, integer, boolean, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';


// Database connection - using hardcoded URL for React Native/Expo
const databaseUrl = "postgresql://neondb_owner:npg_lWDH8R6uOiFN@ep-aged-water-a2koqhuu-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
if (!databaseUrl) {
  throw new Error('NEON_DATABASE_URL environment variable is not set');
}

// Enums
export const orderStatusEnum = pgEnum('order_status', [
  'قيد المعالجة',
  'تم التأكيد',
  'قيد الشحن',
  'تم التسليم',
  'ملغي'
]);

export const deliveryTypeEnum = pgEnum('delivery_type', ['home', 'stopDesk']);
export const itemTypeEnum = pgEnum('item_type', ['product', 'offer']);

// Categories table
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).unique().notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  nameIdx: index('idx_categories_name').on(table.name),
  activeIdx: index('idx_categories_is_active').on(table.isActive),
}));

// Users table
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).unique().notNull(),
  phoneNumber: varchar('phone_number', { length: 20 }).unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 100 }).notNull(),
  profileImageUrl: text('profile_image_url'),
  pushToken: text('push_token'), // Push notification token
  role: varchar('role', { length: 20 }).default('user').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  usernameIdx: index('idx_users_username').on(table.username),
  phoneIdx: index('idx_users_phone').on(table.phoneNumber),
  activeIdx: index('idx_users_active').on(table.isActive),
  profileImageIdx: index('idx_users_profile_image').on(table.profileImageUrl),
  roleIdx: index('idx_users_role').on(table.role),
}));

// Sessions table
export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 255 }).unique().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  lastActivity: timestamp('last_activity', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  tokenIdx: index('idx_sessions_token').on(table.token),
  expiresAtIdx: index('idx_sessions_expires_at').on(table.expiresAt),
}));

// Products table
export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 10, scale: 2 }),
  discountPercentage: integer('discount_percentage'),
  imageUrl: text('image_url'),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  sizes: jsonb('sizes'),
  images: jsonb('images'),
  categoryId: uuid('category_id').references(() => categories.id),
  category: varchar('category', { length: 100 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_products_category').on(table.category),
  categoryIdIdx: index('idx_products_category_id').on(table.categoryId),
  priceIdx: index('idx_products_price').on(table.price),
  createdAtIdx: index('idx_products_created_at').on(table.createdAt),
  activeIdx: index('idx_products_is_active').on(table.isActive),
}));

// Offers table
export const offers = pgTable('offers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal('discount_price', { precision: 10, scale: 2 }),
  imageUrl: text('image_url'),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  sizes: jsonb('sizes'),
  images: jsonb('images'),
  category: varchar('category', { length: 100 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  categoryIdx: index('idx_offers_category').on(table.category),
  priceIdx: index('idx_offers_price').on(table.price),
  createdAtIdx: index('idx_offers_created_at').on(table.createdAt),
}));

// Orders table
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  itemType: itemTypeEnum('item_type').default('product').notNull(),
  itemId: uuid('item_id').notNull(),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  shippingCost: decimal('shipping_cost', { precision: 10, scale: 2 }).default('0').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  customerName: varchar('customer_name', { length: 255 }).notNull(),
  phoneNumber: varchar('phone_number', { length: 30 }).notNull(),
  wilaya: varchar('wilaya', { length: 100 }).notNull(),
  commune: varchar('commune', { length: 100 }),
  deliveryType: deliveryTypeEnum('delivery_type').default('home').notNull(),
  status: orderStatusEnum('status').default('قيد المعالجة').notNull(),
  resellerPrice: decimal('reseller_price', { precision: 10, scale: 2 }),
  orderLink: varchar('order_link', { length: 500 }),
  sellerId: uuid('seller_id').references(() => users.id),
  sellerName: varchar('seller_name', { length: 255 }),
  resellerPhone: varchar('reseller_phone', { length: 30 }),
  trackingNumber: varchar('tracking_number', { length: 50 }),
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  itemIdx: index('idx_orders_item').on(table.itemType, table.itemId),
  createdAtIdx: index('idx_orders_created_at').on(table.createdAt),
  statusIdx: index('idx_orders_status').on(table.status),
  orderLinkIdx: index('idx_orders_order_link').on(table.orderLink),
  sellerIdx: index('idx_orders_seller').on(table.sellerId),
}));

// Login attempts table
export const loginAttempts = pgTable('login_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow(),
  success: boolean('success').default(false),
}, (table) => ({
  usernameIdx: index('idx_login_attempts_username').on(table.username),
  ipIdx: index('idx_login_attempts_ip').on(table.ipAddress),
  timeIdx: index('idx_login_attempts_time').on(table.attemptedAt),
}));

// User settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  notificationsEnabled: boolean('notifications_enabled').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_user_settings_user_id').on(table.userId),
  notificationsIdx: index('idx_user_settings_notifications').on(table.notificationsEnabled),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'order', 'news', 'offer'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  typeIdx: index('idx_notifications_type').on(table.type),
  isReadIdx: index('idx_notifications_is_read').on(table.isRead),
  createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
}));

// Resell Links table
export const resellLinks = pgTable('resell_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  offerId: uuid('offer_id').references(() => offers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  slug: varchar('slug', { length: 80 }).unique().notNull(),
  itemType: itemTypeEnum('item_type').default('product').notNull(),
  resellerPrice: decimal('reseller_price', { precision: 10, scale: 2 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdx: index('idx_resell_user').on(table.userId),
  productIdx: index('idx_resell_product').on(table.productId),
  offerIdx: index('idx_resell_offer').on(table.offerId),
  activeIdx: index('idx_resell_active').on(table.isActive),
}));

// Conversations table
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  adminId: uuid('admin_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_conversations_user_id').on(table.userId),
  statusIdx: index('idx_conversations_status').on(table.status),
  lastMsgIdx: index('idx_conversations_last_message_at').on(table.lastMessageAt),
}));

// Messages table
export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  messageType: varchar('message_type', { length: 20 }).default('text').notNull(),
  messageContent: text('message_content'),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'), // for video/audio in seconds
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  convCreatedIdx: index('idx_messages_conv_created').on(table.conversationId, table.createdAt),
  unreadIdx: index('idx_messages_unread').on(table.conversationId, table.isRead),
  typeIdx: index('idx_messages_type').on(table.messageType),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Offer = typeof offers.$inferSelect;
export type NewOffer = typeof offers.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type UserSettings = typeof userSettings.$inferSelect;
export type NewUserSettings = typeof userSettings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type ResellLink = typeof resellLinks.$inferSelect;
export type NewResellLink = typeof resellLinks.$inferInsert;


// Database connection
// Suppress browser warning for direct SQL in browser (we accept this for Expo prototype)
// @ts-ignore - option supported by @neondatabase/serverless
const sql = neon(databaseUrl, { disableWarningInBrowsers: true } as any);
export const db = drizzle(sql, {
  schema: {
    users,
    sessions,
    products,
    offers,
    orders,
    loginAttempts,
    userSettings,
    notifications,
    conversations,
    messages,
    resellLinks
  }
});

// Enable query logging for debugging
export const queryClient = db;
