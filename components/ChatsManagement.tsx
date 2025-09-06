import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';
import { listAdminConversations, listMessages, sendMessage, getOrCreateAdminConversation } from '../lib/conversations';

interface Props { onClose: () => void; }

const { width: screenWidth } = Dimensions.get('window');

export default function ChatsManagement(_: Props) {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-refresh messages when a conversation is selected
  useEffect(() => {
    if (!selectedConversation?.id) return;

    const refreshMessages = async () => {
      try {
        const msgs = await listMessages(selectedConversation.id, 200, 0);
        setMessages(msgs);
      } catch (error) {
        console.error('Error refreshing messages:', error);
      }
    };

    refreshMessages();
    const interval = setInterval(refreshMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedConversation?.id]);

  // Auto-refresh conversations list
  useEffect(() => {
    if (!user || user.role !== 'admin') return;

    const refreshConversations = async () => {
      try {
        const rows = await listAdminConversations(user.id);
        
        // تجميع المحادثات حسب المستخدم (محادثة واحدة لكل مستخدم)
        const uniqueConversations = new Map();
        
        rows.forEach((row: any) => {
          const userId = row.userId;
          if (!uniqueConversations.has(userId) || 
              (row.lastMessageAt && row.lastMessageAt > uniqueConversations.get(userId).lastMessageAt)) {
            uniqueConversations.set(userId, {
              ...row,
              profileImageUrl: typeof row.profileImageUrl === 'string' ? row.profileImageUrl.trim() : null
            });
          }
        });

        const data = Array.from(uniqueConversations.values());
        
        // ترتيب حسب الرسائل غير المقروءة ثم آخر رسالة
        const sorted = data.sort((a, b) => {
          const au = a.unreadCount || 0;
          const bu = b.unreadCount || 0;
          if (au !== bu) return bu - au;
          
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
        
        setConversations(sorted);
      } catch (error) {
        console.error('Error refreshing conversations:', error);
      }
    };

    refreshConversations();
    const interval = setInterval(refreshConversations, 10000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const loadConversations = async () => {
    if (!user || user.role !== 'admin') { 
      setError('غير مصرح'); 
      setLoading(false); 
      return; 
    }
    
    setLoading(true);
    try {
      const rows = await listAdminConversations(user.id);
      
      // تجميع المحادثات حسب المستخدم (محادثة واحدة لكل مستخدم)
      const uniqueConversations = new Map();
      
      rows.forEach((row: any) => {
        const userId = row.userId;
        if (!uniqueConversations.has(userId) || 
            (row.lastMessageAt && row.lastMessageAt > uniqueConversations.get(userId).lastMessageAt)) {
          uniqueConversations.set(userId, {
            ...row,
            profileImageUrl: typeof row.profileImageUrl === 'string' ? row.profileImageUrl.trim() : null
          });
        }
      });

      const data = Array.from(uniqueConversations.values());
      
      // ترتيب حسب الرسائل غير المقروءة ثم آخر رسالة
      const sorted = data.sort((a, b) => {
        const au = a.unreadCount || 0;
        const bu = b.unreadCount || 0;
        if (au !== bu) return bu - au;
        
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
      
      setConversations(sorted);
    } catch (e) {
      setError('فشل في تحميل المحادثات');
    } finally {
      setLoading(false);
    }
  };

  const openConversation = async (userData: any) => {
    setSelectedConversation(userData);
    setShowChatModal(true);
    setMessages([]);
    setLoadingMessages(true);
    
    try {
      const conv = await getOrCreateAdminConversation({
        userId: userData.userId,
        adminId: user!.id
      });
      
      setSelectedConversation({
        ...userData,
        id: conv.id
      });
      
      const msgs = await listMessages(conv.id, 100, 0);
      setMessages(msgs);
      
      if (!userData.conversationId) {
        setConversations(prev => prev.map(conv => 
          conv.userId === userData.userId 
            ? { ...conv, conversationId: conv.id }
            : conv
        ));
      }
    } catch (error) {
      Alert.alert('خطأ', 'فشل في تحميل الرسائل');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation?.id || !user?.id) return;
    
    const messageText = newMessage.trim();
    setSending(true);
    
    try {
      const msg = await sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.id,
        receiverId: selectedConversation.userId,
        messageType: 'text',
        messageContent: messageText,
      });
      
      setMessages(prev => [...prev, { 
        ...msg, 
        sender: { 
          id: user.id, 
          fullName: user.fullName, 
          username: user.username, 
          profileImageUrl: user.profileImageUrl 
        } 
      }]);
      
      setNewMessage('');
    } catch (error) {
      Alert.alert('خطأ', 'فشل في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === user?.id;
    
    const renderMessageContent = () => {
      // Only handle text messages now
      return (
        <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
          {item.messageContent}
        </Text>
          );
    };

    return (
      <View style={[styles.messageContainer, isMine ? styles.myMessage : styles.otherMessage]}>
        {!isMine && (
          <View style={styles.avatarContainer}>
            {item.sender?.profileImageUrl ? (
              <Image source={{ uri: item.sender.profileImageUrl }} style={styles.messageAvatar} />
            ) : (
              <View style={styles.messageAvatarPlaceholder}>
                <Text style={styles.messageAvatarText}>
                  {item.sender?.fullName?.charAt(0) || item.sender?.username?.charAt(0) || '?'}
                </Text>
              </View>
            )}
          </View>
        )}
        
        <View style={[styles.messageBubble, isMine ? styles.myBubble : styles.otherBubble]}>
          {renderMessageContent()}
          <Text style={[styles.messageTime, isMine ? styles.myMessageTime : styles.otherMessageTime]}>
            {new Date(item.createdAt).toLocaleTimeString('ar-SA', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
      </View>
    );
  };

  const renderConversation = ({ item }: { item: any }) => {
    const hasUnread = (item.unreadCount || 0) > 0;
    const lastMessageTime = item.lastMessageAt ? new Date(item.lastMessageAt) : null;
    
    return (
      <TouchableOpacity 
        style={[styles.conversationCard, hasUnread && styles.unreadConversation]} 
        onPress={() => openConversation(item)}
        activeOpacity={0.7}
      >
        {/* User Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {item.profileImageUrl ? (
              <Image 
                source={{ uri: item.profileImageUrl }} 
                style={styles.userAvatar}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={['#FF6B35', '#FF8C42']}
                style={styles.avatarGradient}
              >
                <Text style={styles.avatarText}>
                  {item.fullName?.charAt(0) || item.username?.charAt(0) || '?'}
                </Text>
              </LinearGradient>
            )}
            
            {/* Online Status Indicator */}
            <View style={styles.onlineIndicator}>
              <View style={styles.onlineIndicatorInner} />
            </View>
            
            {/* Unread Badge */}
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount > 99 ? '99+' : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Conversation Info */}
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.userName, hasUnread && styles.unreadUserName]} numberOfLines={1}>
              {item.fullName || item.username || 'مستخدم غير معروف'}
            </Text>
            {lastMessageTime && (
              <Text style={styles.timeText}>
                {lastMessageTime.toLocaleTimeString('ar-SA', { 
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            )}
          </View>
          
          <Text style={[styles.lastMessage, hasUnread && styles.unreadLastMessage]} numberOfLines={2}>
            {item.lastMessage || 'لم يبدأ المحادثة بعد'}
          </Text>
          
          <View style={styles.conversationFooter}>
            <Text style={styles.userIdText}>
              @{item.username}
            </Text>
            {item.messageCount > 0 && (
              <Text style={styles.messageCountText}>
                {item.messageCount} رسالة
              </Text>
            )}
          </View>
        </View>

        {/* Action Indicator */}
        <View style={styles.actionIndicator}>
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={hasUnread ? "#FF6B35" : "#9CA3AF"} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري تحميل المحادثات...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadConversations}>
            <Text style={styles.retryButtonText}>إعادة المحاولة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={['#FF6B35', '#FF8C42']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Ionicons name="chatbubbles" size={24} color="#FFFFFF" />
              <Text style={styles.headerTitle}>المحادثات</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.userId}
        renderItem={renderConversation}
        style={styles.conversationsList}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContent : styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={['#F3F4F6', '#E5E7EB']}
              style={styles.emptyIconContainer}
            >
              <Ionicons name="people-outline" size={48} color="#9CA3AF" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>لا توجد محادثات</Text>
            <Text style={styles.emptySubtext}>
              ستظهر هنا المحادثات عندما يبدأ المستخدمون بالتواصل معك
            </Text>
          </View>
        }
        refreshing={loading}
        onRefresh={loadConversations}
      />

      {/* Enhanced Chat Modal */}
      <Modal
        visible={showChatModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <LinearGradient
              colors={['#FF6B35', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.chatHeaderGradient}
            >
              <View style={styles.chatHeaderContent}>
                <TouchableOpacity onPress={() => setShowChatModal(false)} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <View style={styles.chatUserInfo}>
                  <View style={styles.chatAvatarContainer}>
                    {selectedConversation?.profileImageUrl ? (
                      <Image source={{ uri: selectedConversation.profileImageUrl }} style={styles.chatAvatar} />
                    ) : (
                      <View style={styles.chatAvatarPlaceholder}>
                        <Text style={styles.chatAvatarText}>
                          {(selectedConversation?.fullName || selectedConversation?.username || '?').charAt(0)}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.chatUserDetails}>
                    <Text style={styles.chatUserName}>
                      {selectedConversation?.fullName || selectedConversation?.username || 'مستخدم غير معروف'}
                    </Text>
                  </View>
                </View>

                
              </View>
            </LinearGradient>
          </View>

          {/* Messages Area */}
          <View style={styles.messagesArea}>
            <FlatList
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContainer}
              ListEmptyComponent={
                !loadingMessages ? (
                  <View style={styles.emptyMessagesContainer}>
                    <View style={styles.emptyMessagesIcon}>
                      <Ionicons name="chatbubble-outline" size={48} color="#E5E7EB" />
                    </View>
                    <Text style={styles.emptyMessagesTitle}>ابدأ المحادثة</Text>
                    <Text style={styles.emptyMessagesText}>
                      أرسل رسالة لبدء المحادثة مع {selectedConversation?.fullName || 'المستخدم'}
                    </Text>
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          </View>

          {/* Enhanced Message Input */}
          <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.messageInput}
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="اكتب رسالتك هنا..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  maxLength={500}
                />
                
                <TouchableOpacity 
                  onPress={handleSend} 
                  disabled={!newMessage.trim() || sending} 
                  style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <LinearGradient
                      colors={['#FF6B35', '#FF8C42']}
                      style={styles.sendButtonGradient}
                    >
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 12,
  },
  conversationsList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  conversationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  unreadConversation: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
    backgroundColor: '#FFF7ED',
  },
  avatarSection: {
    marginRight: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicatorInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  unreadUserName: {
    fontWeight: '700',
    color: '#FF6B35',
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 6,
  },
  unreadLastMessage: {
    color: '#374151',
    fontWeight: '500',
  },
  conversationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userIdText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messageCountText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  actionIndicator: {
    marginLeft: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  
  // Chat Modal Styles
  chatContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  chatHeader: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  chatHeaderGradient: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  chatHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  chatUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatAvatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chatUserDetails: {
    flex: 1,
  },
  chatUserName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chatOptionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    backgroundColor: '#FF6B35',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  myMessageTime: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  otherMessageTime: {
    color: '#6B7280',
    textAlign: 'left',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyMessagesIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyMessagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyMessagesText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  inputArea: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});