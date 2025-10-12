import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Package, Tag, ShoppingBag, LogOut, FolderOpen, Users } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../lib/userContext';
import { useAdmin } from '../lib/adminContext';
import ProductsManagement from '../components/ProductsManagement';
import OffersManagement from '../components/OffersManagement';
import OrdersManagement from '../components/OrdersManagement';
import CategoriesManagement from '../components/CategoriesManagement';
import ChatsManagement from '../components/ChatsManagement';
import AdminChatModal from '../components/AdminChatModal';
import UsersManagement from '../components/UsersManagement';
import SellersManagement from '../components/SellersManagement';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useUser();
  const { isAdmin, currentSection, setCurrentSection } = useAdmin();
  const [showChat, setShowChat] = React.useState(false);

  // التحقق من أن المستخدم أدمن
  React.useEffect(() => {
    // تأخير قليل للتأكد من أن React Navigation جاهز
    const timer = setTimeout(() => {
      if (!user) {
        router.replace('/login');
        return;
      }
      
      if (user.role !== 'admin') {
        router.replace('/(tabs)');
        return;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [user, router]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = () => {
    logout();
    router.replace('/welcome');
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'products':
        return <ProductsManagement />;
      case 'offers':
        return <OffersManagement />;
      case 'orders':
        return <OrdersManagement onClose={() => setCurrentSection('products')} />;
      case 'categories':
        return <CategoriesManagement onClose={() => setCurrentSection('products')} />;
      case 'chats':
        return <ChatsManagement onClose={() => setCurrentSection('products')} />;
      case 'users':
        return <UsersManagement onClose={() => setCurrentSection('products')} />;
      case 'sellers':
        return <SellersManagement onClose={() => setCurrentSection('products')} />;
      default:
        return <ProductsManagement />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }] }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>لوحة الإدارة</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Navigation Tabs */}
        <View style={styles.navigationTabs}>
          <TouchableOpacity
            style={[styles.tab, currentSection === 'products' && styles.activeTab]}
            onPress={() => setCurrentSection('products')}
          >
            <Package size={20} color={currentSection === 'products' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, currentSection === 'products' && styles.activeTabText]}>
              المنتجات
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentSection === 'offers' && styles.activeTab]}
            onPress={() => setCurrentSection('offers')}
          >
            <Tag size={20} color={currentSection === 'offers' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, currentSection === 'offers' && styles.activeTabText]}>
              العروض
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentSection === 'orders' && styles.activeTab]}
            onPress={() => setCurrentSection('orders')}
          >
            <ShoppingBag size={20} color={currentSection === 'orders' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, currentSection === 'orders' && styles.activeTabText]}>
              الطلبات
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentSection === 'categories' && styles.activeTab]}
            onPress={() => setCurrentSection('categories')}
          >
            <FolderOpen size={20} color={currentSection === 'categories' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, currentSection === 'categories' && styles.activeTabText]}>
              الفئات
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentSection === 'sellers' && styles.activeTab]}
            onPress={() => setCurrentSection('sellers')}
          >
            <Ionicons name="people" size={20} color={currentSection === 'sellers' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, currentSection === 'sellers' && styles.activeTabText]}>
              البائعون
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, currentSection === 'users' && styles.activeTab]}
            onPress={() => setCurrentSection('users')}
          >
            <Users size={20} color={currentSection === 'users' ? '#FF6B35' : '#666'} />
            <Text style={[styles.tabText, currentSection === 'users' && styles.activeTabText]}>
              المستخدمون
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Content */}
        {currentSection === 'chats' ? (
          <View style={styles.sectionContainer}>{renderSection()}</View>
        ) : (
          <ScrollView style={styles.sectionContainer}>{renderSection()}</ScrollView>
        )}
        {/* Floating Chat Button across all admin sections */}
        <TouchableOpacity style={styles.chatFab} activeOpacity={0.85} onPress={() => setCurrentSection('chats')}>
          <Ionicons name="chatbubbles-outline" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
    elevation: 4,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  logoutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  navigationTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#FFF7ED',
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  sectionContainer: {
    flex: 1,
    padding: 20,
  },
  chatFab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
