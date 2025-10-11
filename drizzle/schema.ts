import { pgTable, index, foreignKey, uuid, varchar, text, numeric, integer, jsonb, timestamp, boolean, inet, unique, serial, check, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const itemType = pgEnum("item_type", ['product', 'offer'])


export const products = pgTable("products", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	discountPrice: numeric("discount_price", { precision: 10, scale:  2 }),
	discountPercentage: integer("discount_percentage"),
	imageUrl: text("image_url"),
	stockQuantity: integer("stock_quantity").default(0).notNull(),
	sizes: jsonb(),
	images: jsonb(),
	category: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	isActive: boolean("is_active").default(true),
	categoryId: integer("category_id"),
	sellerId: uuid("seller_id"),
}, (table) => [
	index("idx_products_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_products_category_id").using("btree", table.categoryId.asc().nullsLast().op("int4_ops")),
	index("idx_products_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_products_price").using("btree", table.price.asc().nullsLast().op("numeric_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [categories.id],
			name: "products_category_id_fkey"
		}),
]);

export const loginAttempts = pgTable("login_attempts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	ipAddress: inet("ip_address"),
	attemptedAt: timestamp("attempted_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	success: boolean().default(false),
}, (table) => [
	index("idx_login_attempts_ip").using("btree", table.ipAddress.asc().nullsLast().op("inet_ops")),
	index("idx_login_attempts_time").using("btree", table.attemptedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_login_attempts_username").using("btree", table.username.asc().nullsLast().op("text_ops")),
]);

export const sessions = pgTable("sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	token: text().notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastActivity: timestamp("last_activity", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_sessions_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_sessions_token").using("btree", table.token.asc().nullsLast().op("text_ops")),
	index("idx_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
	unique("sessions_token_key").on(table.token),
]);

export const offers = pgTable("offers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	discountPrice: numeric("discount_price", { precision: 10, scale:  2 }),
	imageUrl: text("image_url"),
	stockQuantity: integer("stock_quantity").default(0).notNull(),
	sizes: jsonb(),
	images: jsonb(),
	category: varchar({ length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	sellerId: uuid("seller_id"),
}, (table) => [
	index("idx_offers_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_offers_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_offers_price").using("btree", table.price.asc().nullsLast().op("numeric_ops")),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	fullName: varchar("full_name", { length: 100 }).notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	profileImageUrl: text("profile_image_url"),
	role: varchar({ length: 20 }).default('user'),
	pushToken: text("push_token"),
}, (table) => [
	index("idx_users_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_users_phone").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
	index("idx_users_profile_image").using("btree", table.profileImageUrl.asc().nullsLast().op("text_ops")),
	index("idx_users_push_token").using("btree", table.pushToken.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_users_username").using("btree", table.username.asc().nullsLast().op("text_ops")),
	unique("users_username_key").on(table.username),
	unique("users_phone_number_key").on(table.phoneNumber),
]);

export const categories = pgTable("categories", {
	id: serial().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	imageUrl: text("image_url"),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_categories_is_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	unique("categories_name_key").on(table.name),
]);

export const userSettings = pgTable("user_settings", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	notificationsEnabled: boolean("notifications_enabled").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_user_settings_notifications").using("btree", table.notificationsEnabled.asc().nullsLast().op("bool_ops")),
	index("idx_user_settings_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_settings_user_id_fkey"
		}).onDelete("cascade"),
]);

export const notifications = pgTable("notifications", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: varchar({ length: 255 }).notNull(),
	message: text().notNull(),
	type: varchar({ length: 50 }).notNull(),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_notifications_is_read").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("idx_notifications_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	adminId: uuid("admin_id").notNull(),
	status: varchar({ length: 20 }).default('active').notNull(),
	lastMessage: text("last_message"),
	lastMessageAt: timestamp("last_message_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_conversations_last_message_at").using("btree", table.lastMessageAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_conversations_user_status").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_user_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [users.id],
			name: "conversations_admin_id_fk"
		}).onDelete("cascade"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid("conversation_id").notNull(),
	senderId: uuid("sender_id").notNull(),
	receiverId: uuid("receiver_id").notNull(),
	messageType: varchar("message_type", { length: 20 }).default('text').notNull(),
	messageContent: text("message_content"),
	fileUrl: text("file_url"),
	isRead: boolean("is_read").default(false).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	fileName: varchar("file_name", { length: 255 }),
	fileSize: integer("file_size"),
	thumbnailUrl: text("thumbnail_url"),
	duration: integer(),
}, (table) => [
	index("idx_messages_conv_created").using("btree", table.conversationId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_messages_type").using("btree", table.messageType.asc().nullsLast().op("text_ops")),
	index("idx_messages_unread").using("btree", table.conversationId.asc().nullsLast().op("bool_ops"), table.isRead.asc().nullsLast().op("bool_ops")),
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "messages_conversation_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.receiverId],
			foreignColumns: [users.id],
			name: "messages_receiver_id_fk"
		}).onDelete("cascade"),
]);

export const resellLinks = pgTable("resell_links", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	productId: uuid("product_id"),
	userId: uuid("user_id").notNull(),
	slug: varchar({ length: 80 }).notNull(),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	offerId: uuid("offer_id"),
	itemType: text("item_type").default('product'),
	resellerPrice: numeric("reseller_price", { precision: 10, scale:  2 }),
}, (table) => [
	index("idx_resell_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_resell_item").using("btree", table.itemType.asc().nullsLast().op("text_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	index("idx_resell_links_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_resell_product").using("btree", table.productId.asc().nullsLast().op("uuid_ops")),
	index("idx_resell_user").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.productId],
			foreignColumns: [products.id],
			name: "resell_links_product_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "resell_links_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.offerId],
			foreignColumns: [offers.id],
			name: "resell_links_offer_id_fkey"
		}).onDelete("cascade"),
	unique("resell_links_slug_key").on(table.slug),
	check("resell_links_item_type_check", sql`item_type = ANY (ARRAY['product'::text, 'offer'::text])`),
	check("check_product_or_offer", sql`((product_id IS NOT NULL) AND (offer_id IS NULL)) OR ((product_id IS NULL) AND (offer_id IS NOT NULL))`),
]);

export const customerOrders = pgTable("customer_orders", {
	id: serial().primaryKey().notNull(),
	resellLinkId: varchar("resell_link_id", { length: 255 }).notNull(),
	itemType: varchar("item_type", { length: 100 }).notNull(),
	itemId: varchar("item_id", { length: 255 }).notNull(),
	itemName: varchar("item_name", { length: 500 }).notNull(),
	originalPrice: numeric("original_price", { precision: 10, scale:  2 }).notNull(),
	resellerPrice: numeric("reseller_price", { precision: 10, scale:  2 }).notNull(),
	quantity: integer().notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	sellerId: varchar("seller_id", { length: 255 }),
	sellerName: varchar("seller_name", { length: 200 }),
	sellerPhone: varchar("seller_phone", { length: 50 }),
	customerName: varchar("customer_name", { length: 200 }).notNull(),
	customerPhone: varchar("customer_phone", { length: 50 }).notNull(),
	deliveryType: varchar("delivery_type", { length: 50 }).notNull(),
	wilaya: integer().notNull(),
	commune: varchar({ length: 200 }),
	notes: text(),
	orderNumber: varchar("order_number", { length: 100 }).notNull(),
	status: varchar({ length: 50 }).default('pending'),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_customer_orders_order_number").using("btree", table.orderNumber.asc().nullsLast().op("text_ops")),
	index("idx_customer_orders_resell_link_id").using("btree", table.resellLinkId.asc().nullsLast().op("text_ops")),
	index("idx_customer_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("customer_orders_order_number_key").on(table.orderNumber),
]);

export const orders = pgTable("orders", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itemType: varchar("item_type", { length: 20 }).default('product').notNull(),
	itemId: uuid("item_id").notNull(),
	itemName: varchar("item_name", { length: 255 }).notNull(),
	quantity: integer().default(1).notNull(),
	unitPrice: numeric("unit_price", { precision: 10, scale:  2 }).notNull(),
	subtotal: numeric({ precision: 10, scale:  2 }).notNull(),
	shippingCost: numeric("shipping_cost", { precision: 10, scale:  2 }).default('0').notNull(),
	totalAmount: numeric("total_amount", { precision: 10, scale:  2 }).notNull(),
	customerName: varchar("customer_name", { length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 30 }).notNull(),
	wilaya: varchar({ length: 100 }).notNull(),
	commune: varchar({ length: 100 }),
	deliveryType: varchar("delivery_type", { length: 20 }).default('home').notNull(),
	status: varchar({ length: 50 }).default('قيد المعالجة').notNull(),
	resellerPrice: numeric("reseller_price", { precision: 10, scale:  2 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	resellerName: varchar("reseller_name", { length: 255 }),
	resellerPhone: varchar("reseller_phone", { length: 30 }),
	resellerUserId: uuid("reseller_user_id"),
	orderLink: varchar("order_link", { length: 500 }),
	sellerId: uuid("seller_id"),
	sellerName: varchar("seller_name", { length: 255 }),
	imageUrl: text("image_url"),
	trackingNumber: varchar("tracking_number", { length: 50 }),
}, (table) => [
	index("idx_orders_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_orders_item").using("btree", table.itemType.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
	index("idx_orders_order_link").using("btree", table.orderLink.asc().nullsLast().op("text_ops")),
	index("idx_orders_reseller").using("btree", table.resellerUserId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_seller").using("btree", table.sellerId.asc().nullsLast().op("uuid_ops")),
	index("idx_orders_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.sellerId],
			foreignColumns: [users.id],
			name: "orders_seller_id_fkey"
		}),
]);

export const sellers = pgTable("sellers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 255 }).notNull(),
	phoneNumber: varchar("phone_number", { length: 30 }),
	location: varchar({ length: 255 }),
	isActive: boolean("is_active").default(true).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("idx_sellers_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_sellers_name").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("idx_sellers_phone").using("btree", table.phoneNumber.asc().nullsLast().op("text_ops")),
]);
