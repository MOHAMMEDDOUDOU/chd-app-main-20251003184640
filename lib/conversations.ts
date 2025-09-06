import { db, conversations, messages, users } from './database/config';
import { and, asc, desc, eq } from 'drizzle-orm';

export interface CreateConversationInput {
  userId: string;
  adminId: string;
}

export interface SendMessageInput {
  conversationId: string;
  senderId: string;
  receiverId: string;
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file';
  messageContent?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  thumbnailUrl?: string;
  duration?: number; // for video/audio in seconds
}

export async function getOrCreateConversation({ userId, adminId }: CreateConversationInput) {
  const existing = await db.select()
    .from(conversations)
    .where(and(eq(conversations.userId, userId), eq(conversations.status, 'active')))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  const [conv] = await db.insert(conversations).values({
    userId,
    adminId,
    status: 'active'
  }).returning();
  return conv;
}

export async function listMessages(conversationId: string, limit = 50, offset = 0) {
  const rows = await db.select({
    id: messages.id,
    conversationId: messages.conversationId,
    senderId: messages.senderId,
    receiverId: messages.receiverId,
    messageType: messages.messageType,
    messageContent: messages.messageContent,
    fileUrl: messages.fileUrl,
    fileName: messages.fileName,
    fileSize: messages.fileSize,
    thumbnailUrl: messages.thumbnailUrl,
    duration: messages.duration,
    isRead: messages.isRead,
    createdAt: messages.createdAt,
    sender: {
      id: users.id,
      username: users.username,
      fullName: users.fullName,
      profileImageUrl: users.profileImageUrl,
    }
  })
  .from(messages)
  .innerJoin(users, eq(messages.senderId, users.id))
  .where(eq(messages.conversationId, conversationId))
  .orderBy(asc(messages.createdAt))
  .limit(limit);
  // Apply offset via slice to keep compatibility
  const paged = offset > 0 ? rows.slice(offset, offset + limit) : rows;
  return paged;
}

export async function sendMessage(input: SendMessageInput) {
  const [msg] = await db.insert(messages).values({
    conversationId: input.conversationId,
    senderId: input.senderId,
    receiverId: input.receiverId,
    messageType: input.messageType ?? 'text',
    messageContent: input.messageContent,
    fileUrl: input.fileUrl,
    fileName: input.fileName,
    fileSize: input.fileSize,
    thumbnailUrl: input.thumbnailUrl,
    duration: input.duration,
    isRead: false,
  }).returning();

  // Update conversation with last message info
  let lastMessageText = input.messageContent || '';
  if (input.fileUrl) {
    switch (input.messageType) {
      case 'image':
        lastMessageText = '📷 صورة';
        break;
      case 'video':
        lastMessageText = '🎥 فيديو';
        break;
      case 'audio':
        lastMessageText = '🎵 صوت';
        break;
      case 'file':
        lastMessageText = '📎 ملف';
        break;
      default:
        lastMessageText = '📎 مرفق';
    }
  }

  await db.update(conversations)
    .set({
      lastMessage: lastMessageText,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, input.conversationId));

  return msg;
}

export async function markAsRead(conversationId: string, readerId: string) {
  await db.update(messages)
    .set({ isRead: true })
    .where(and(eq(messages.conversationId, conversationId), eq(messages.receiverId, readerId), eq(messages.isRead, false)));
}

export async function listAdminConversations(adminId: string) {
  // Get all users with their conversation info (if exists)
  const rows = await db.select({
    userId: users.id,
    username: users.username,
    fullName: users.fullName,
    profileImageUrl: users.profileImageUrl,
    lastMessage: conversations.lastMessage,
    lastMessageAt: conversations.lastMessageAt,
    updatedAt: conversations.updatedAt,
    conversationId: conversations.id,
  })
  .from(users)
  .leftJoin(conversations, and(
    eq(conversations.userId, users.id),
    eq(conversations.adminId, adminId),
    eq(conversations.status, 'active')
  ))
  .where(eq(users.role, 'user'))
  // Keep a stable alphabetical order; UI may float unread to top
  .orderBy(asc(users.fullName));
  
  // إضافة عدد الرسائل لكل محادثة (بدون استخدام sql)
  const conversationsWithCounts = await Promise.all(
    rows.map(async (row) => {
      if (row.conversationId) {
        try {
          const messageCount = await db.select()
            .from(messages)
            .where(eq(messages.conversationId, row.conversationId));

          const unread = await db.select()
            .from(messages)
            .where(and(
              eq(messages.conversationId, row.conversationId),
              eq(messages.receiverId, adminId),
              eq(messages.isRead, false)
            ));
          
          return {
            ...row,
            messageCount: messageCount.length,
            unreadCount: unread.length
          };
        } catch (error) {
          console.error('Error counting messages:', error);
          return {
            ...row,
            messageCount: 0,
            unreadCount: 0
          };
        }
      }
      return {
        ...row,
        messageCount: 0,
        unreadCount: 0
      };
    })
  );
  
  return conversationsWithCounts;
}

// Get or create conversation for admin with a specific user
export async function getOrCreateAdminConversation({ userId, adminId }: CreateConversationInput) {
  // First, try to find existing active conversation
  const existing = await db.select()
    .from(conversations)
    .where(and(
      eq(conversations.userId, userId),
      eq(conversations.adminId, adminId),
      eq(conversations.status, 'active')
    ))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // If no active conversation exists, create a new one
  const [conv] = await db.insert(conversations).values({
    userId,
    adminId,
    status: 'active'
  }).returning();
  
  return conv;
}

// Get conversation by user ID for admin
export async function getConversationByUserId(userId: string, adminId: string) {
  const [conv] = await db.select()
    .from(conversations)
    .where(and(
      eq(conversations.userId, userId),
      eq(conversations.adminId, adminId),
      eq(conversations.status, 'active')
    ))
    .limit(1);
  
  return conv;
}

export async function closeConversation(conversationId: string) {
  await db.update(conversations)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(conversations.id, conversationId));
}

// جلب جميع المحادثات للأدمن مع معلومات المستخدمين والرسائل
export async function getConversations(adminId: string) {
  try {
    // جلب جميع المحادثات النشطة للأدمن
    const conversationsData = await db.select({
      id: conversations.id,
      userId: conversations.userId,
      status: conversations.status,
      lastMessage: conversations.lastMessage,
      lastMessageAt: conversations.lastMessageAt,
      updatedAt: conversations.updatedAt,
      createdAt: conversations.createdAt,
      user: {
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        profileImageUrl: users.profileImageUrl,
      }
    })
    .from(conversations)
    .innerJoin(users, eq(conversations.userId, users.id))
    .where(and(
      eq(conversations.adminId, adminId),
      eq(conversations.status, 'active')
    ))
    .orderBy(desc(conversations.lastMessageAt), desc(conversations.updatedAt));

    // إضافة عدد الرسائل غير المقروءة لكل محادثة
    const conversationsWithUnreadCount = await Promise.all(
      conversationsData.map(async (conv) => {
        try {
          const unreadMessages = await db.select()
            .from(messages)
            .where(and(
              eq(messages.conversationId, conv.id),
              eq(messages.receiverId, adminId),
              eq(messages.isRead, false)
            ));
          
          return {
            ...conv,
            unreadCount: unreadMessages.length
          };
        } catch (error) {
          console.error('Error counting unread messages:', error);
          return {
            ...conv,
            unreadCount: 0
          };
        }
      })
    );

    return conversationsWithUnreadCount;
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw error;
  }
}




