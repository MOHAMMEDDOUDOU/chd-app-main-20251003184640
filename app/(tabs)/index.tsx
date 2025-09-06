import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Heart, Star, ShoppingCart, Bell, Menu, User } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { getProducts, getOffers } from '../../lib/products';
import { createResellLink, createResellLinkForItem } from '../../lib/resellLinks';
import * as Clipboard from 'expo-clipboard';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import UserAvatar from '../../components/UserAvatar';
import CategoriesList from '../../components/CategoriesList';
import { useUser } from '../../lib/userContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationsList from '../../components/NotificationsList';

import { NotificationService } from '../../lib/notifications';
import { updateUserPushToken } from '../../lib/users';
import ChatModal from '../../components/ChatModal';
import * as Notifications from 'expo-notifications';

const { width: INITIAL_SCREEN_WIDTH } = Dimensions.get('window');

interface Product {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: string;
  discountPrice?: string;
  discountPercentage?: number;
  stockQuantity: number;
  category?: string;
  isActive?: boolean;
  isLiked?: boolean;
}

interface Offer {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: string;
  discountPrice?: string;
  stockQuantity: number;
  category?: string;
}



export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoading } = useUser();
  console.log('=== HOMESCREEN RENDER ===');
  console.log('HomeScreen - Current user:', JSON.stringify(user, null, 2));
  console.log('HomeScreen - isLoading:', isLoading);
  
  // طباعة معلومات Avatar
  if (user) {
    console.log('HomeScreen - Avatar will show:', { 
      username: user.username, 
      fullName: user.fullName,
      firstLetter: user.fullName?.charAt(0) || user.username.charAt(0)
    });
  } else {
    console.log('HomeScreen - Avatar will show: User icon (no user logged in)');
  }
  
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [screenWidth, setScreenWidth] = useState(INITIAL_SCREEN_WIDTH);
  const offersScrollRef = useRef<ScrollView>(null);
  const [offerIndex, setOfferIndex] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const scrollToOffer = (index: number) => {
    if (offersScrollRef.current && index >= 0 && index < offers.length) {
      offersScrollRef.current.scrollTo({ x: index * screenWidth, animated: true });
      setOfferIndex(index);
    }
  };

  // مراقبة تغييرات بيانات المستخدم
  useEffect(() => {
    console.log('HomeScreen - User changed:', JSON.stringify(user, null, 2));
    console.log('HomeScreen - User type:', typeof user);
    console.log('HomeScreen - User is null:', user === null);
    console.log('HomeScreen - User is undefined:', user === undefined);
    
    // طباعة معلومات Avatar
    if (user) {
      console.log('HomeScreen - Avatar info:', { 
        username: user.username, 
        fullName: user.fullName,
        firstLetter: user.fullName?.charAt(0) || user.username.charAt(0)
      });
      
      // تحميل عدد الإشعارات غير المقروءة
      loadUnreadCount();
      // تحميل عدد الرسائل غير المقروءة
      loadUnreadMessagesCount();
      
      // Setup push notifications
      setupPushNotifications();
    } else {
      console.log('HomeScreen - No user, showing User icon');
    }
  }, [user]);

  // Setup push notifications
  const setupPushNotifications = async () => {
    if (!user?.id) return;
    
    try {
      // Register for push notifications
      const token = await NotificationService.registerForPushNotifications();
      
      if (token) {
        console.log('Push token received:', token);
        
        // Save token to database
        const result = await updateUserPushToken(user.id, token);
        if (result.success) {
          console.log('Push token saved to database');
        } else {
          console.error('Failed to save push token:', result.error);
        }
      }
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  };

  // تحميل عدد الإشعارات غير المقروءة
  const loadUnreadCount = async () => {
    if (!user?.id) return;
    
    try {
      const result = await NotificationService.getUnreadCount(user.id);
      if (result.success) {
        setUnreadCount(result.count || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // تحميل عدد الرسائل غير المقروءة
  const loadUnreadMessagesCount = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/messages?userId=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      if (data.success) {
        setUnreadMessagesCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error loading unread messages count:', error);
    }
  };
  // تحديث عرض الشاشة للتوافق مع جميع الهواتف
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => {
      // @ts-ignore
      if (subscription?.remove) subscription.remove();
    };
  }, []);

  const horizontalPadding = 20; // من styles.productsSection
  const cardGap = 10; // مسافة تقديرية بين البطاقات
  const cardWidth = Math.floor((screenWidth - horizontalPadding * 2 - cardGap) / 2);


  // تصفية المنتجات المخفضة
  const discountedProducts = products.filter(product => 
    product.discountPrice && parseFloat(product.discountPrice) < parseFloat(product.price)
  );

  // البحث في المنتجات والعروض
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOffers = offers.filter(offer =>
    offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    offer.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasSearchResults = searchQuery.length > 0 && (filteredProducts.length > 0 || filteredOffers.length > 0);



  // تحديث البيانات
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      setError(null);
      const [productsResult, offersResult] = await Promise.all([
        getProducts(),
        getOffers()
      ]);

      if (productsResult.success && productsResult.products) {
        const normalized = productsResult.products.map((p: any) => ({ ...p, isLiked: false }));
        setAllProducts(normalized);
        setProducts(normalized);
      } else {
        setError(productsResult.error || 'خطأ في جلب المنتجات');
      }

      if (offersResult.success && offersResult.offers) {
        setOffers(offersResult.offers as any);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setRefreshing(false);
    }
  };

  // دالة تحميل البيانات
  const loadData = async () => {
    try {
      setError(null);
      setLoading(true);
      const [productsResult, offersResult] = await Promise.all([
        getProducts(),
        getOffers()
      ]);

      if (productsResult.success && productsResult.products) {
        const normalized = productsResult.products.map((p: any) => ({ ...p, isLiked: false }));
        setAllProducts(normalized);
        setProducts(normalized);
      } else {
        setError(productsResult.error || 'خطأ في جلب المنتجات');
      }

      if (offersResult.success && offersResult.offers) {
        setOffers(offersResult.offers as any);
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // جلب البيانات عند تحميل الصفحة
  useEffect(() => {
    loadData();
  }, []);

  // إضافة console log لمراقبة البيانات
  useEffect(() => {
    console.log('🔍 Products data:', products);
    if (products.length > 0) {
      console.log('🖼️ First product image_url:', (products[0] as any).image_url);
    }
  }, [products]);

  useEffect(() => {
    console.log('🔍 Offers data:', offers);
    if (offers.length > 0) {
      console.log('🖼️ First offer image_url:', (offers[0] as any).image_url);
    }
  }, [offers]);

  // إعادة تحميل البيانات عند العودة للصفحة (تم إزالتها بناءً على طلب المستخدم)



  const toggleLike = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, isLiked: !product.isLiked }
        : product
    ));
  };

  // معالجة الضغط على زر "اطلب الآن" → الانتقال لصفحة إدخال السعر وإنشاء رابط إعادة البيع
  const handleOrderNow = async (item: Product | Offer, type: 'product' | 'offer') => {
    console.log('🛒 تم الضغط على "اطلب الآن"', { item, type, user });
    
    if (user) {
      const orderData = {
        itemType: type,
        itemId: item.id,
        itemName: item.name,
        price: parseFloat((item as any).price),
        imageUrl: (item as any).imageUrl,
        sellerId: user.id,
        sellerName: user.fullName || user.username,
      };
      router.push({ pathname: '/create-order', params: { data: JSON.stringify(orderData) } });
    } else {
      // المستخدم ضيف - الانتقال لصفحة تسجيل الدخول أو إنشاء طلب كضيف
      console.log('👤 المستخدم ضيف، الانتقال لصفحة تسجيل الدخول');
      Alert.alert(
        'تسجيل الدخول مطلوب',
        'هل تريد تسجيل الدخول لإنشاء طلبية أم المتابعة كضيف؟',
        [
          {
            text: 'كضيف',
            style: 'default',
            onPress: () => {
              const orderData = {
                itemType: type,
                itemId: item.id,
                itemName: item.name,
                price: parseFloat(item.price),
                imageUrl: item.imageUrl,
              };
              
              console.log('📋 بيانات الطلب كضيف:', orderData);
              Alert.alert(
                'إنشاء طلبية كضيف',
                `سيتم إنشاء طلبية لـ ${item.name}\nالسعر: ${item.price} دج`,
                [
                  {
                    text: 'إنشاء الطلبية',
                    onPress: () => {
                      // هنا سيتم إنشاء الطلبية كضيف
                      console.log('✅ تم إنشاء الطلبية كضيف');
                      Alert.alert('نجح', 'تم إنشاء الطلبية بنجاح!');
                    }
                  },
                  {
                    text: 'إلغاء',
                    style: 'cancel'
                  }
                ]
              );
            }
          },
          {
            text: 'تسجيل الدخول',
            style: 'default',
            onPress: () => router.push('/login')
          },
          {
            text: 'إلغاء',
            style: 'cancel'
          }
        ]
      );
    }
  };

  const ProductCard = ({ product }: { product: Product }) => {
    const [imageAspectRatio, setImageAspectRatio] = useState(1);

    useEffect(() => {
      if (product.imageUrl) {
        Image.getSize(
          product.imageUrl,
          (width, height) => {
            if (width && height) {
              setImageAspectRatio(width / height);
            }
          },
          () => {
            setImageAspectRatio(1);
          }
        );
      } else {
        setImageAspectRatio(1);
      }
    }, [product.imageUrl]);

    // تحديد صورة تجريبية حسب الفئة
    const getDefaultImage = () => {
      // البيانات تأتي من قاعدة البيانات بـ image_url
      const imageUrl = (product as any).image_url || product.imageUrl;
      
      if (imageUrl) return imageUrl;
      
      switch (product.category?.toLowerCase()) {
        case 'electronics':
        case 'إلكترونيات':
          return 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg';
        case 'clothing':
        case 'ملابس':
          return 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg';
        case 'books':
        case 'كتب':
          return 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg';
        case 'home':
        case 'منزل':
          return 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
        case 'sports':
        case 'رياضة':
          return 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg';
        default:
          return 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg';
      }
    };

    // تحديد حالة المخزون (مخفي من المستخدم)
    const getStockStatus = () => {
      const stock = (product as any).stock_quantity || 0;
      if (stock === 0) return { text: 'نفذ المخزون', color: '#EF4444' };
      if (stock <= 5) return { text: `المتبقي: ${stock}`, color: '#F59E0B' };
      return { text: `المتوفر: ${stock}`, color: '#10B981' };
    };

    const stockStatus = getStockStatus();

    return (
      <TouchableOpacity style={[styles.productCard, { width: cardWidth }]} onPress={() => router.push({ pathname: '/product/[id]', params: { id: product.id } })}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: getDefaultImage() }} 
            style={[styles.productImage, { aspectRatio: imageAspectRatio }]}
            resizeMode="contain"
          />
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => toggleLike(product.id)}
          >
            <Heart 
              size={20} 
              color={product.isLiked ? "#FF6B6B" : "#FFFFFF"} 
              fill={product.isLiked ? "#FF6B6B" : "transparent"}
            />
          </TouchableOpacity>
          {product.discountPercentage && product.discountPercentage > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>-{product.discountPercentage}%</Text>
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
          
          <View style={styles.priceContainer}>
            {product.discountPrice && parseFloat(product.discountPrice) < parseFloat(product.price) ? (
              <>
                <Text style={styles.price}>${parseFloat(product.discountPrice).toFixed(2)}</Text>
                <Text style={styles.originalPrice}>${parseFloat(product.price).toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.price}>${parseFloat(product.price).toFixed(2)}</Text>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.addToCartButton}
            onPress={() => handleOrderNow(product, 'product')}
          >
            <LinearGradient
              colors={['#FF6B35', '#FF8C42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addToCartGradient}
            >
              <ShoppingCart size={16} color="#FFFFFF" />
              <Text style={styles.addToCartText}>
                اطلب الآن
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const DiscountCard = ({ product }: { product: Product }) => {
    const [imageAspectRatio, setImageAspectRatio] = useState(1);

    useEffect(() => {
      const imageUrl = (product as any).imageUrl || (product as any).image_url || product.imageUrl;
      if (imageUrl) {
        Image.getSize(
          imageUrl,
          (width, height) => {
            if (width && height) {
              setImageAspectRatio(width / height);
            }
          },
          () => {
            setImageAspectRatio(1);
          }
        );
      } else {
        setImageAspectRatio(1);
      }
    }, [product.imageUrl]);

    // تحديد صورة تجريبية حسب الفئة
    const getDefaultImage = () => {
      const imageUrl = (product as any).image_url || product.imageUrl;
      if (imageUrl) return imageUrl;
      
      switch (product.category?.toLowerCase()) {
        case 'electronics':
        case 'إلكترونيات':
          return 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg';
        case 'clothing':
        case 'ملابس':
          return 'https://images.pexels.com/photos/1884584/pexels-photo-1884584.jpeg';
        case 'books':
        case 'كتب':
          return 'https://images.pexels.com/photos/3747468/pexels-photo-3747468.jpeg';
        case 'home':
        case 'منزل':
          return 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg';
        case 'sports':
        case 'رياضة':
          return 'https://images.pexels.com/photos/3621104/pexels-photo-3621104.jpeg';
        default:
          return 'https://images.pexels.com/photos/788946/pexels-photo-788946.jpeg';
      }
    };

    // تحديد حالة المخزون (مخفي من المستخدم)
    const getStockStatus = () => {
      const stock = (product as any).stock_quantity || 0;
      if (stock === 0) return { text: 'نفذ المخزون', color: '#EF4444' };
      if (stock <= 5) return { text: `المتبقي: ${stock}`, color: '#F59E0B' };
      return { text: `المتوفر: ${stock}`, color: '#10B981' };
    };

    const stockStatus = getStockStatus();

    return (
      <View style={styles.discountCard}>
        <View style={styles.discountImageContainer}>
          <Image 
            source={{ uri: getDefaultImage() }} 
            style={[styles.discountImage, { aspectRatio: imageAspectRatio, height: undefined }]}
            resizeMode="contain"
          />
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>
              {Math.round(((parseFloat(product.price) - parseFloat(product.discountPrice || '0')) / parseFloat(product.price)) * 100)}%
            </Text>
          </View>

        </View>
        <View style={styles.discountContent}>
          <Text style={styles.discountTitle} numberOfLines={2}>{product.name}</Text>
          <View style={styles.discountPriceContainer}>
            {product.discountPrice && parseFloat(product.discountPrice) < parseFloat(product.price) ? (
              <>
                <Text style={styles.discountNewPrice}>${parseFloat(product.discountPrice).toFixed(2)}</Text>
                <Text style={styles.discountOldPrice}>${parseFloat(product.price).toFixed(2)}</Text>
              </>
            ) : (
              <Text style={styles.discountNewPrice}>${parseFloat(product.price).toFixed(2)}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.discountButton}
            onPress={() => handleOrderNow(product, 'product')}
          >
            <Text style={styles.discountButtonText}>
              اشتري الآن
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const OfferCard = ({ offer }: { offer: Offer }) => {
    // تحديد صورة تجريبية للعرض
    const getDefaultImage = () => {
      const imageUrl = (offer as any).image_url || offer.imageUrl;
      
      if (imageUrl) return imageUrl;
      return 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg';
    };

    // تحديد حالة المخزون للعرض (مخفي من المستخدم)
    const getStockStatus = () => {
      const stock = (offer as any).stock_quantity || 0;
      if (stock === 0) return { text: 'نفذ المخزون', color: '#EF4444' };
      if (stock <= 5) return { text: `المتبقي: ${stock}`, color: '#F59E0B' };
      return { text: `المتوفر: ${stock}`, color: '#10B981' };
    };

    const stockStatus = getStockStatus();

    return (
      <TouchableOpacity style={styles.offerCard} onPress={() => router.push({ pathname: '/offer/[id]', params: { id: offer.id } })}>
        <View style={{ position: 'relative' }}>
          <Image 
            source={{ uri: getDefaultImage() }} 
            style={styles.offerImage}
            resizeMode="contain"
          />

        </View>
        <View style={styles.offerContent}>
          <Text style={styles.offerTitle}>{offer.name}</Text>
          <Text style={styles.offerDescription} numberOfLines={2}>{offer.description}</Text>
          <View style={styles.offerPriceContainer}>
            <Text style={styles.offerPrice}>${parseFloat(offer.price).toFixed(2)}</Text>
            {offer.discountPrice && (
              <Text style={styles.offerDiscountPrice}>${parseFloat(offer.discountPrice).toFixed(2)}</Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.offerButton}
            onPress={() => handleOrderNow(offer, 'offer')}
          >
            <Text style={styles.offerButtonText}>
              اطلب الآن
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };





  // معالجة حالات التحميل والأخطاء
  if (loading) {
    return <LoadingSpinner message="جاري تحميل المنتجات..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadData} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* Top Header */}
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Image
              source={{
                uri: 'https://res.cloudinary.com/deh3ejeph/image/upload/v1756463555/logo-removebg-preview_p22obg.png'
              }}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.titleContainer}>
              <Text style={styles.headerTitle}>taziri</Text>
              <Text style={styles.headerSubtitle}>منصة إعادة البيع</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => setShowNotifications(true)}
            >
              <Bell size={22} color="#1F2937" />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationCount}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => {
                if (user) setShowChat(true); else router.push('/login');
              }}
            >
              <Ionicons name="chatbubble-outline" size={22} color="#1F2937" />
              {unreadMessagesCount > 0 && (
                <View style={styles.chatBadge}>
                  <Text style={styles.chatCount}>{unreadMessagesCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={async () => {
                console.log('=== PROFILE BUTTON PRESSED ===');
                console.log('User exists:', !!user);
                console.log('User data:', JSON.stringify(user, null, 2));
                console.log('User type:', typeof user);
                
                // التحقق من البيانات المزيفة قبل التنقل
                try {
                  console.log('Checking for fake data before navigation...');
                  const userData = await AsyncStorage.getItem('user');
                  console.log('User data from AsyncStorage:', userData);
                  
                  if (userData) {
                    const parsedUser = JSON.parse(userData);
                    console.log('Parsed user data from AsyncStorage:', JSON.stringify(parsedUser, null, 2));
                    
                    // حذف البيانات المزيفة فقط
                    if (parsedUser.username === 'testuser' || parsedUser.fullName === 'مستخدم تجريبي') {
                      console.log('Fake data detected, clearing...');
                      await AsyncStorage.removeItem('user');
                      console.log('Fake data cleared');
                    } else {
                      console.log('Valid data found, keeping...');
                    }
                  }
                } catch (error) {
                  console.log('Error checking user data:', error);
                }
                
                if (user) {
                  console.log('Navigating to profile with user data:', {
                    id: user.id,
                    username: user.username,
                    fullName: user.fullName,
                    phoneNumber: user.phoneNumber
                  });
                  router.push('/profile');
                } else {
                  console.log('No user found, navigating to login');
                  router.push('/login');
                }
              }}
            >
              {user ? (
                <View>
                  <UserAvatar 
                    username={user.username} 
                    fullName={user.fullName}
                    profileImageUrl={user.profileImageUrl}
                    size={32}
                    fontSize={14}
                  />
                </View>
              ) : (
                <View>
                  <User size={22} color="#1F2937" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن المنتجات والعروض..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Search Results */}
        {hasSearchResults && (
          <View style={styles.searchResultsContainer}>
            <Text style={styles.searchResultsTitle}>
              نتائج البحث لـ "{searchQuery}"
            </Text>
            
            {/* Products Results */}
            {filteredProducts.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={styles.searchResultsSectionTitle}>
                  المنتجات ({filteredProducts.length})
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsList}
                >
                  {filteredProducts.slice(0, 5).map(product => (
                    <TouchableOpacity key={product.id} style={styles.searchResultItem}>
                      <Image 
                        source={{ 
                          uri: product.imageUrl || 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg' 
                        }} 
                        style={styles.searchResultImage}
                        resizeMode="contain"
                      />
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultTitle} numberOfLines={2}>
                          {product.name}
                        </Text>
                        <Text style={styles.searchResultPrice}>
                          ${parseFloat(product.price).toFixed(2)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Offers Results */}
            {filteredOffers.length > 0 && (
              <View style={styles.searchResultsSection}>
                <Text style={styles.searchResultsSectionTitle}>
                  العروض ({filteredOffers.length})
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.searchResultsList}
                >
                  {filteredOffers.slice(0, 5).map(offer => (
                    <TouchableOpacity key={offer.id} style={styles.searchResultItem}>
                      <Image 
                        source={{ 
                          uri: offer.imageUrl || 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg' 
                        }} 
                        style={styles.searchResultImage}
                        resizeMode="contain"
                      />
                      <View style={styles.searchResultContent}>
                        <Text style={styles.searchResultTitle} numberOfLines={2}>
                          {offer.name}
                        </Text>
                        <Text style={styles.searchResultPrice}>
                          ${parseFloat(offer.price).toFixed(2)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35', '#4ECDC4']}
            tintColor="#FF6B35"
          />
        }
      >
        {/* Hero Section with Offers */}
        {!hasSearchResults && offers.length > 0 && (
          <View style={styles.heroSection}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroTitle}>العروض</Text>
              <Text style={styles.heroSubtitle}>تصفح أحدث العروض</Text>
            </View>
            <View style={styles.carouselContainer}>
              <View style={styles.carouselWrapper}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  ref={offersScrollRef}
                  showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                    setOfferIndex(index);
                  }}
                  contentContainerStyle={styles.carouselContent}
                >
                  {offers.map(offer => (
                    <View key={offer.id} style={{ width: screenWidth, alignItems: 'center' }}>
                      <View style={[styles.carouselOfferCard, { width: screenWidth - 80 }]}>
                        <Image 
                          source={{ 
                            uri: offer.imageUrl || 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg' 
                          }} 
                          style={styles.carouselOfferImage}
                          resizeMode="cover"
                        />
                        <View style={styles.heroOfferContent}>
                          <Text style={styles.heroOfferTitle} numberOfLines={1}>{offer.name}</Text>
                          <View style={styles.heroOfferPriceContainer}>
                            <Text style={styles.heroOfferPrice}>${parseFloat(offer.price).toFixed(2)}</Text>
                            {offer.discountPrice && (
                              <Text style={styles.heroOfferDiscountPrice}>${parseFloat(offer.discountPrice).toFixed(2)}</Text>
                            )}
                          </View>
                          <TouchableOpacity style={styles.heroOfferButton} onPress={() => handleOrderNow(offer, 'offer')}>
                            <Text style={styles.heroOfferButtonText}>اطلب الآن</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              </View>
              
              {/* أزرار التنقل */}
              <View style={styles.navigationButtons}>
                <TouchableOpacity 
                  style={[styles.navButton, offerIndex === 0 && styles.navButtonDisabled]}
                  onPress={() => scrollToOffer(offerIndex - 1)}
                  disabled={offerIndex === 0}
                >
                  <Text style={[styles.navButtonText, offerIndex === 0 && styles.navButtonTextDisabled]}>‹</Text>
                </TouchableOpacity>
                
                <View style={styles.dotsContainer}>
                  {offers.map((_, index) => (
                    <View 
                      key={index} 
                      style={[
                        styles.dot, 
                        index === offerIndex && styles.activeDot
                      ]} 
                    />
                  ))}
                </View>
                
                <TouchableOpacity 
                  style={[styles.navButton, offerIndex === offers.length - 1 && styles.navButtonDisabled]}
                  onPress={() => scrollToOffer(offerIndex + 1)}
                  disabled={offerIndex === offers.length - 1}
                >
                  <Text style={[styles.navButtonText, offerIndex === offers.length - 1 && styles.navButtonTextDisabled]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Categories */}
        <CategoriesList
          onCategorySelect={(categoryName) => {
            setSelectedCategory(categoryName);
            // فلترة المنتجات حسب الفئة دون إعادة تحميل
            if (categoryName) {
              const filtered = allProducts.filter(product => product.category === categoryName);
              setProducts(filtered);
            } else {
              // عرض جميع المنتجات دون إعادة تحميل
              setProducts(allProducts);
            }
          }}
          selectedCategory={selectedCategory}
        />

        {/* Discounts Section */}
        {discountedProducts.length > 0 && (
          <View style={styles.discountsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>تخفيضات</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.discountsContainer}
            >
              {discountedProducts.slice(0, 5).map(product => (
                <DiscountCard key={product.id} product={product} />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Products */}
        {!hasSearchResults && (
          <View style={styles.productsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>المنتجات</Text>
            </View>
            
            <FlatList
              data={products}
              renderItem={({ item }) => <ProductCard product={item} />}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={styles.productRow}
              scrollEnabled={false}
              contentContainerStyle={styles.productsGrid}
              ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#6B7280', paddingVertical: 20 }}>لا يوجد أي منتج</Text>}
            />
          </View>
        )}
      </ScrollView>
      {/* Notifications Modal */}
      {showNotifications && user && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <NotificationsList 
              userId={user.id} 
              onClose={() => {
                setShowNotifications(false);
                loadUnreadCount(); // تحديث العداد عند الإغلاق
              }} 
            />
          </View>
        </View>
      )}

      {/* Chat Modal */}
      {showChat && user && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ChatModal onClose={() => setShowChat(false)} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  headerLogo: {
    width: 36,
    height: 36,
  },
  titleContainer: {
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  chatBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatCount: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  // Search Results Styles
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  searchResultsSection: {
    marginBottom: 15,
  },
  searchResultsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 10,
  },
  searchResultsList: {
    gap: 12,
  },
  searchResultItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    width: 150,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchResultImage: {
    width: '100%',
    height: 80,
    borderRadius: 6,
    marginBottom: 8,
  },
  searchResultContent: {
    gap: 4,
  },
  searchResultTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 16,
  },
  searchResultPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  content: {
    flex: 1,
  },
  // Hero Section Styles
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  heroHeader: {
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  heroOffersContainer: {
    paddingHorizontal: 5,
    gap: 12,
  },
  heroOfferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 200,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  heroOfferImage: {
    width: '100%',
    height: 100,
  },
  carouselOfferCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  carouselContainer: {
    position: 'relative',
  },
  carouselWrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselOfferImage: {
    width: '100%',
    height: 200,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 15,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  navButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  activeDot: {
    backgroundColor: '#FF6B35',
  },
  heroOfferContent: {
    padding: 12,
  },
  heroOfferTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  heroOfferPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroOfferPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  heroOfferDiscountPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  heroOfferButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  heroOfferButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  // Discounts Section Styles
  discountsSection: {
    paddingTop: 25,
  },
  discountsContainer: {
    paddingHorizontal: 15,
    gap: 15,
  },
  discountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 220,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  discountImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountImage: {
    width: '100%',
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FF4757',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  discountContent: {
    padding: 12,
  },
  discountTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 18,
  },
  discountPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  discountNewPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4757',
  },
  discountOldPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  discountButton: {
    backgroundColor: '#FF4757',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  discountButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  categoriesSection: {
    paddingTop: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingHorizontal: 20,
    marginBottom: 15,
  },

  productsSection: {
    paddingTop: 25,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  productsGrid: {
    paddingBottom: 20,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImage: {
    width: '100%',
    height: undefined,
  },
  likeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: '#1F2937',
    marginLeft: 4,
    fontWeight: '600',
  },
  reviews: {
    fontSize: 10,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  originalPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  addToCartButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  addToCartText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  addToCartGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 5,
  },
  loginButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockContainer: {
    marginBottom: 8,
  },
  stockText: {
    fontSize: 12,
    color: '#6B7280',
  },
  stockIndicator: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#10B981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
  },
  stockIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  disabledButton: {
    opacity: 0.6,
  },
  offersSection: {
    paddingTop: 25,
  },
  offersContainer: {
    paddingHorizontal: 15,
    gap: 15,
  },
  offerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: 280,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  offerImage: {
    width: '100%',
    height: 120,
  },
  offerContent: {
    padding: 15,
  },
  offerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 5,
  },
  offerDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 10,
    lineHeight: 20,
  },
  offerPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  offerPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  offerDiscountPrice: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  offerButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  offerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '90%',
    height: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerLogo: {
    width: 36,
    height: 24,
    marginBottom: 6,
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
  },
});