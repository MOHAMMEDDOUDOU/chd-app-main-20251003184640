import { relations } from "drizzle-orm/relations";
import { categories, products, users, sessions, userSettings, notifications, conversations, messages, resellLinks, offers, orders } from "./schema";

export const productsRelations = relations(products, ({one, many}) => ({
	category: one(categories, {
		fields: [products.categoryId],
		references: [categories.id]
	}),
	resellLinks: many(resellLinks),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	products: many(products),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	sessions: many(sessions),
	userSettings: many(userSettings),
	notifications: many(notifications),
	conversations_userId: many(conversations, {
		relationName: "conversations_userId_users_id"
	}),
	conversations_adminId: many(conversations, {
		relationName: "conversations_adminId_users_id"
	}),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	resellLinks: many(resellLinks),
	orders: many(orders),
}));

export const userSettingsRelations = relations(userSettings, ({one}) => ({
	user: one(users, {
		fields: [userSettings.userId],
		references: [users.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	user_userId: one(users, {
		fields: [conversations.userId],
		references: [users.id],
		relationName: "conversations_userId_users_id"
	}),
	user_adminId: one(users, {
		fields: [conversations.adminId],
		references: [users.id],
		relationName: "conversations_adminId_users_id"
	}),
	messages: many(messages),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	conversation: one(conversations, {
		fields: [messages.conversationId],
		references: [conversations.id]
	}),
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));

export const resellLinksRelations = relations(resellLinks, ({one}) => ({
	product: one(products, {
		fields: [resellLinks.productId],
		references: [products.id]
	}),
	user: one(users, {
		fields: [resellLinks.userId],
		references: [users.id]
	}),
	offer: one(offers, {
		fields: [resellLinks.offerId],
		references: [offers.id]
	}),
}));

export const offersRelations = relations(offers, ({many}) => ({
	resellLinks: many(resellLinks),
}));

export const ordersRelations = relations(orders, ({one}) => ({
	user: one(users, {
		fields: [orders.sellerId],
		references: [users.id]
	}),
}));