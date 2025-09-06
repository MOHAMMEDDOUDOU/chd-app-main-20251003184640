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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../lib/userContext';
import { getOrCreateConversation, listMessages, sendMessage } from '../lib/conversations';

interface Props { onClose: () => void; }

const { width: screenWidth } = Dimensions.get('window');

export default function ChatModal({ onClose }: Props) {
  const { user } = useUser();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      if (!user?.id) return;
      setLoading(true);
      try {
        // temporary: assume a single admin user exists with role 'admin'
        const adminId = user.id; // replace with real admin id lookup if needed
        const conv = await getOrCreateConversation({ userId: user.id, adminId });
        setConversationId(conv.id);
        const msgs = await listMessages(conv.id, 100, 0);
        setMessages(msgs);
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  // Auto-refresh messages
  useEffect(() => {
    if (!conversationId) return;

    const refreshMessages = async () => {
      try {
        const msgs = await listMessages(conversationId, 100, 0);
        setMessages(msgs);
      } catch (error) {
        console.error('Error refreshing messages:', error);
      }
    };

    // Refresh immediately
    refreshMessages();

    // Set up interval to refresh every 3 seconds
    const interval = setInterval(refreshMessages, 3000);

    return () => clearInterval(interval);
  }, [conversationId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversationId || !user?.id) return;
    
    const messageText = newMessage.trim();
    setSending(true);
    
    try {
      const msg = await sendMessage({
        conversationId,
        senderId: user.id,
        receiverId: user.id, // replace with real admin id
        messageType: 'text',
        messageContent: messageText,
      });
      
      // Add message to local state immediately
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
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
              <Image source={{ uri: item.sender.profileImageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>المحادثة</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>جاري تحميل المحادثة...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Ionicons name="person-circle" size={40} color="#FF6B35" />
          </View>
          <View>
            <Text style={styles.title}>الدعم الفني</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        renderItem={renderMessage}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>لا توجد رسائل بعد</Text>
            <Text style={styles.emptySubtext}>ابدأ المحادثة مع فريق الدعم</Text>
          </View>
        }
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
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
          onPress={handleSend} 
          disabled={!newMessage.trim() || sending} 
          style={[styles.sendButton, (!newMessage.trim() || sending) && styles.sendButtonDisabled]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 16, 
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB', 
    backgroundColor: '#FFFFFF' 
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    marginRight: 12,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937' 
  },
  subtitle: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  closeButton: { 
    padding: 4 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#6B7280' 
  },
  messagesList: { 
    flex: 1 
  },
  messagesContainer: { 
    padding: 16 
  },
  messageContainer: { 
    flexDirection: 'row', 
    marginBottom: 16, 
    alignItems: 'flex-end' 
  },
  myMessage: { 
    justifyContent: 'flex-end' 
  },
  otherMessage: { 
    justifyContent: 'flex-start' 
  },
  avatarContainer: { 
    marginRight: 8 
  },
  avatar: { 
    width: 32, 
    height: 32, 
    borderRadius: 16 
  },
  avatarPlaceholder: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#FF6B35', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  avatarText: { 
    color: '#FFFFFF', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  messageBubble: { 
    maxWidth: '75%', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 20 
  },
  myBubble: { 
    backgroundColor: '#FF6B35', 
    borderBottomRightRadius: 4 
  },
  otherBubble: { 
    backgroundColor: '#FFFFFF', 
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: { 
    fontSize: 14, 
    lineHeight: 20 
  },
  myMessageText: { 
    color: '#FFFFFF' 
  },
  otherMessageText: { 
    color: '#1F2937' 
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
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyText: { 
    marginTop: 12, 
    fontSize: 16, 
    color: '#6B7280', 
    fontWeight: '600' 
  },
  emptySubtext: { 
    marginTop: 4, 
    fontSize: 14, 
    color: '#9CA3AF' 
  },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    padding: 16, 
    borderTopWidth: 1, 
    borderTopColor: '#E5E7EB', 
    backgroundColor: '#FFFFFF' 
  },
  textInput: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginRight: 8, 
    fontSize: 14, 
    color: '#1F2937', 
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#FF6B35', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  sendButtonDisabled: { 
    backgroundColor: '#D1D5DB' 
  },
});


