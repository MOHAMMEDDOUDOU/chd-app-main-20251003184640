import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../lib/userContext';
import { getOrCreateConversation, listMessages, sendMessage, getConversations } from '../lib/conversations';

interface Props { 
  onClose: () => void; 
}

const { width: screenWidth } = Dimensions.get('window');

export default function AdminChatModal({ onClose }: Props) {
  const { user } = useUser();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // تحميل جميع المحادثات للأدمن
  useEffect(() => {
    (async () => {
      if (!user?.id || user.role !== 'admin') return;
      setLoading(true);
      try {
        const convs = await getConversations(user.id);
        setConversations(convs);
        if (convs.length > 0) {
          setSelectedConversation(convs[0]);
        }
      } catch (error) {
        console.error('Error loading conversations:', error);
        Alert.alert('خطأ', 'فشل في تحميل المحادثات');
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // تحميل الرسائل عند اختيار محادثة
  useEffect(() => {
    if (!selectedConversation) return;

    const loadMessages = async () => {
      try {
        const msgs = await listMessages(selectedConversation.id, 100, 0);
        setMessages(msgs);
        // التمرير إلى آخر رسالة
        setTimeout(() => {
          if (flatListRef.current && msgs.length > 0) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 100);
      } catch (error) {
        console.error('Error loading messages:', error);
      }
    };

    loadMessages();

    // تحديث الرسائل كل 3 ثوان
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConversation || !user?.id) return;
    
    const messageText = newMessage.trim();
    setSending(true);
    
    try {
      const msg = await sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.id,
        receiverId: selectedConversation.userId, // إرسال للمستخدم
        messageType: 'text',
        messageContent: messageText,
      });
      
      // إضافة الرسالة للحالة المحلية
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
      
      // التمرير إلى آخر رسالة
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('خطأ', 'فشل في إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isOwnMessage = item.senderId === user?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
        <View style={[
          styles.messageBubble,
          isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isOwnMessage ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.messageContent}
          </Text>
          <Text style={styles.messageTime}>
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
    const isSelected = selectedConversation?.id === item.id;
    
    return (
      <TouchableOpacity 
        style={[styles.conversationItem, isSelected && styles.selectedConversation]}
        onPress={() => setSelectedConversation(item)}
      >
        <View style={styles.conversationAvatar}>
          <Text style={styles.avatarText}>
            {item.user?.fullName?.charAt(0) || item.user?.username?.charAt(0) || '?'}
          </Text>
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationName}>
            {item.user?.fullName || item.user?.username || 'مستخدم غير معروف'}
          </Text>
          <Text style={styles.conversationLastMessage} numberOfLines={1}>
            {item.lastMessage?.messageContent || 'لا توجد رسائل'}
          </Text>
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.loadingText}>جاري تحميل المحادثات...</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>المحادثات</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Conversations List */}
          <View style={styles.conversationsList}>
            <Text style={styles.sectionTitle}>المحادثات ({conversations.length})</Text>
            <FlatList
              data={conversations}
              renderItem={renderConversation}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              style={styles.conversationsFlatList}
            />
          </View>

          {/* Messages */}
          <View style={styles.messagesContainer}>
            {selectedConversation ? (
              <>
                {/* Conversation Header */}
                <View style={styles.conversationHeader}>
                  <View style={styles.conversationAvatar}>
                    <Text style={styles.avatarText}>
                      {selectedConversation.user?.fullName?.charAt(0) || selectedConversation.user?.username?.charAt(0) || '?'}
                    </Text>
                  </View>
                  <View style={styles.conversationInfo}>
                    <Text style={styles.conversationName}>
                      {selectedConversation.user?.fullName || selectedConversation.user?.username || 'مستخدم غير معروف'}
                    </Text>
                    <Text style={styles.conversationStatus}>متصل</Text>
                  </View>
                </View>

                {/* Messages List */}
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                />

                {/* Message Input */}
                <KeyboardAvoidingView 
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  style={styles.inputContainer}
                >
                  <TextInput
                    style={styles.textInput}
                    value={newMessage}
                    onChangeText={setNewMessage}
                    placeholder="اكتب رسالتك هنا..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity 
                    style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                    onPress={handleSend}
                    disabled={!newMessage.trim() || sending}
                  >
                    {sending ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Ionicons name="send" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </KeyboardAvoidingView>
              </>
            ) : (
              <View style={styles.noConversationContainer}>
                <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                <Text style={styles.noConversationText}>اختر محادثة للبدء</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  conversationsList: {
    width: 300,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  conversationsFlatList: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedConversation: {
    backgroundColor: '#FEF3C7',
  },
  conversationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  conversationLastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  conversationStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  unreadBadge: {
    backgroundColor: '#FF6B35',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesContainer: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  ownMessageBubble: {
    backgroundColor: '#FF6B35',
  },
  otherMessageBubble: {
    backgroundColor: '#F3F4F6',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  noConversationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noConversationText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});
