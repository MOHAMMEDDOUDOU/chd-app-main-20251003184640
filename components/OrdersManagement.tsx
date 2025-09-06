import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Linking,
  Modal,
} from 'react-native';
import { Search, Filter, Eye, Edit, Trash2, MessageCircle, X } from 'lucide-react-native';
import { getOrders, deleteOrder, updateOrder } from '../lib/orders';
import ZRExpressAPI from '../lib/zr-express-api';
import OrderStatusModal from './OrderStatusModal';

// دالة لحساب سعر التوصيل محلياً
const calculateLocalShippingCost = (wilayaCode: string, deliveryType: 'home' | 'stopDesk'): number => {
  // خريطة أسعار التوصيل حسب الولاية
  const WILAYAS = [
    { code: "1", name: "أدرار", tarif: 1400, stopDesk: 900 },
    { code: "2", name: "الشلف", tarif: 850, stopDesk: 450 },
    { code: "3", name: "الأغواط", tarif: 950, stopDesk: 550 },
    { code: "4", name: "أم البواقي", tarif: 900, stopDesk: 500 },
    { code: "5", name: "باتنة", tarif: 900, stopDesk: 500 },
    { code: "6", name: "بجاية", tarif: 800, stopDesk: 400 },
    { code: "7", name: "بسكرة", tarif: 950, stopDesk: 550 },
    { code: "8", name: "بشار", tarif: 1200, stopDesk: 800 },
    { code: "9", name: "البليدة", tarif: 600, stopDesk: 350 },
    { code: "10", name: "البويرة", tarif: 750, stopDesk: 400 },
    { code: "11", name: "تمنراست", tarif: 1600, stopDesk: 1200 },
    { code: "12", name: "تبسة", tarif: 1000, stopDesk: 600 },
    { code: "13", name: "تلمسان", tarif: 900, stopDesk: 500 },
    { code: "14", name: "تيارت", tarif: 850, stopDesk: 450 },
    { code: "15", name: "تيزي وزو", tarif: 750, stopDesk: 400 },
    { code: "16", name: "الجزائر", tarif: 500, stopDesk: 300 },
    { code: "17", name: "الجلفة", tarif: 900, stopDesk: 500 },
    { code: "18", name: "جيجل", tarif: 850, stopDesk: 450 },
    { code: "19", name: "سطيف", tarif: 800, stopDesk: 450 },
    { code: "20", name: "سعيدة", tarif: 900, stopDesk: 500 },
    { code: "21", name: "سكيكدة", tarif: 850, stopDesk: 450 },
    { code: "22", name: "سيدي بلعباس", tarif: 900, stopDesk: 500 },
    { code: "23", name: "عنابة", tarif: 900, stopDesk: 500 },
    { code: "24", name: "قالمة", tarif: 900, stopDesk: 500 },
    { code: "25", name: "قسنطينة", tarif: 850, stopDesk: 450 },
    { code: "26", name: "المدية", tarif: 700, stopDesk: 400 },
    { code: "27", name: "مستغانم", tarif: 850, stopDesk: 450 },
    { code: "28", name: "المسيلة", tarif: 850, stopDesk: 450 },
    { code: "29", name: "معسكر", tarif: 850, stopDesk: 450 },
    { code: "30", name: "ورقلة", tarif: 1100, stopDesk: 700 },
    { code: "31", name: "وهران", tarif: 800, stopDesk: 450 },
    { code: "32", name: "البيض", tarif: 1000, stopDesk: 600 },
    { code: "33", name: "إليزي", tarif: 1400, stopDesk: 900 },
    { code: "34", name: "برج بوعريريج", tarif: 800, stopDesk: 450 },
    { code: "35", name: "بومرداس", tarif: 600, stopDesk: 350 },
    { code: "36", name: "الطارف", tarif: 900, stopDesk: 500 },
    { code: "37", name: "تندوف", tarif: 1600, stopDesk: 1200 },
    { code: "38", name: "تيسمسيلت", tarif: 800, stopDesk: 450 },
    { code: "39", name: "الوادي", tarif: 1200, stopDesk: 800 },
    { code: "40", name: "خنشلة", tarif: 1000, stopDesk: 600 },
    { code: "41", name: "سوق أهراس", tarif: 1000, stopDesk: 600 },
    { code: "42", name: "تيبازة", tarif: 600, stopDesk: 350 },
    { code: "43", name: "ميلة", tarif: 900, stopDesk: 500 },
    { code: "44", name: "عين الدفلى", tarif: 700, stopDesk: 400 },
    { code: "45", name: "النعامة", tarif: 1200, stopDesk: 800 },
    { code: "46", name: "عين تموشنت", tarif: 900, stopDesk: 500 },
    { code: "47", name: "غرداية", tarif: 1100, stopDesk: 700 },
    { code: "48", name: "غليزان", tarif: 700, stopDesk: 400 },
    { code: "49", name: "تيميمون", tarif: 1400, stopDesk: 900 },
    { code: "50", name: "برج باجي مختار", tarif: 1600, stopDesk: 1200 },
    { code: "51", name: "أولاد جلال", tarif: 1000, stopDesk: 600 },
    { code: "52", name: "بني عباس", tarif: 1400, stopDesk: 900 },
    { code: "53", name: "إين صالح", tarif: 1600, stopDesk: 1200 },
    { code: "54", name: "عين قزام", tarif: 1600, stopDesk: 1200 },
    { code: "55", name: "تقرت", tarif: 1200, stopDesk: 800 },
    { code: "56", name: "جانت", tarif: 1600, stopDesk: 1200 },
    { code: "57", name: "المغير", tarif: 1200, stopDesk: 800 },
    { code: "58", name: "المنيعة", tarif: 1200, stopDesk: 800 },
  ];
  
  // البحث عن الولاية في القائمة
  const wilayaData = WILAYAS.find(w => w.code === wilayaCode);
  
  if (!wilayaData) {
    // إذا لم يتم العثور على الولاية، استخدم سعر افتراضي
    return deliveryType === "home" ? 800 : 500;
  }
  
  // تحديد السعر حسب نوع التوصيل
  const shippingCost = deliveryType === "home" ? wilayaData.tarif : wilayaData.stopDesk;
  
  return shippingCost;
};

interface OrdersManagementProps {
  onClose: () => void;
}

export default function OrdersManagement({ onClose }: OrdersManagementProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any | null>(null);

  // تحميل الطلبات
  const loadOrders = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading orders...');
      const result = await getOrders();
      console.log('📥 Orders result:', result);
      
      if (result.success) {
        console.log('✅ Orders loaded successfully, count:', result.orders?.length || 0);
        setOrders(result.orders || []);
      } else {
        console.log('❌ Failed to load orders:', result.error);
        Alert.alert('خطأ', 'فشل في تحميل الطلبات');
      }
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  // البحث في الطلبات
  useEffect(() => {
    let filtered = orders;

    // تصفية حسب البحث
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(order =>
        order.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phoneNumber.includes(searchQuery)
      );
    }

    // تصفية حسب الحالة
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    setFilteredOrders(filtered);
  }, [searchQuery, statusFilter, orders]);

  // تحميل الطلبات عند فتح الصفحة
  useEffect(() => {
    loadOrders();
  }, []);

  // فتح الواتساب مع العميل
  const openWhatsApp = (phoneNumber: string, orderDetails: string) => {
    const formattedPhone = phoneNumber.startsWith('0') ? phoneNumber.substring(1) : phoneNumber;
    const whatsappNumber = `+213${formattedPhone}`;
    const message = `مرحباً، أود تأكيد طلبية:\n${orderDetails}`;
    const whatsappUrl = `whatsapp://send?phone=${whatsappNumber}&text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          Alert.alert('خطأ', 'الواتساب غير مثبت على هذا الجهاز');
        }
      })
      .catch((err) => {
        console.error('Error opening WhatsApp:', err);
        Alert.alert('خطأ', 'فشل في فتح الواتساب');
      });
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrderForDetails(order);
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setShowStatusModal(true);
  };

  const handleDeleteOrder = (order: any) => {
    Alert.alert(
      'تأكيد الحذف',
      `هل أنت متأكد من حذف طلب "${order.itemName}"؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'حذف',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteOrder(order.id);
              if (result.success) {
                Alert.alert('✅ نجح', 'تم حذف الطلب بنجاح');
                loadOrders();
              } else {
                Alert.alert('خطأ', result.error || 'فشل في حذف الطلب');
              }
            } catch (error) {
              console.error('Error deleting order:', error);
              Alert.alert('خطأ', 'حدث خطأ في حذف الطلب');
            }
          },
        },
      ]
    );
  };

  const updateOrderStatus = async (orderId: string, newStatus: any) => {
    try {
      const result = await updateOrder(orderId, { status: newStatus });
      if (result.success) {
        Alert.alert('✅ نجح', 'تم تحديث حالة الطلب بنجاح');
        loadOrders();
        setShowStatusModal(false);
      } else {
        Alert.alert('خطأ', result.error || 'فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة الطلب');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      console.log('🔄 بدء تغيير حالة الطلبية:', { orderId, newStatus });
      
      // البحث عن الطلبية في قائمة الطلبات
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (!orderToUpdate) {
        console.error('❌ لم يتم العثور على الطلبية:', orderId);
        Alert.alert('❌ خطأ', 'لم يتم العثور على الطلبية');
        return;
      }
      
      console.log('📋 بيانات الطلبية المُحددة:', orderToUpdate);
      
      const result = await updateOrder(orderId, { status: newStatus });
      console.log('📊 نتيجة تحديث الحالة:', result);
      
      if (result.success) {
        // إذا تم تأكيد الطلبية، قم بإنشاء طلبية في ZR Express
        if (newStatus === 'confirmed') {
          try {
            console.log('🚀 إنشاء طلبية في ZR Express...');
            
            // إنشاء رقم تتبع فريد
            const trackingNumber = `CHD${Date.now()}`;
            console.log('🔢 رقم التتبع المُنشأ:', trackingNumber);
            
            // تجهيز بيانات الطلبية لـ ZR Express باستخدام البيانات من orderToUpdate
            const orderData = {
              customer_name: orderToUpdate.customerName || 'عميل',
              phone_number: orderToUpdate.phoneNumber || '000000000',
              address: `عنوان ${orderToUpdate.commune || 'غير محدد'}`,
              wilaya: orderToUpdate.wilaya || '16',
              commune: orderToUpdate.commune || 'الجزائر',
              product_name: orderToUpdate.itemName || 'منتج',
              total_amount: orderToUpdate.totalAmount || 0, // استخدام totalAmount من قاعدة البيانات
              quantity: orderToUpdate.quantity || 1,
              delivery_type: orderToUpdate.deliveryType || 'home',
              order_number: trackingNumber,
              notes: "" // حقل فارغ كما طلبت
            };
            
            // إضافة سعر التوصيل للطلبيات التي نوع توصيلها للمكتب
            if (orderData.delivery_type === 'stopDesk') { // تغيير من 'office' إلى 'stopDesk' حسب قاعدة البيانات
              // حساب سعر التوصيل حسب الولاية والبلدية
              const shippingCost = await ZRExpressAPI.calculateShipping(orderData.wilaya, orderData.commune);
              if (shippingCost.success) {
                orderData.total_amount = (orderData.total_amount || 0) + shippingCost.cost;
                console.log('🚚 إضافة سعر التوصيل للمكتب:', shippingCost.cost);
              }
            }
            
            console.log('📦 بيانات الطلبية لـ ZR Express:', orderData);
            
            // إنشاء طلبية في ZR Express مباشرة
            console.log('🚀 إنشاء طلبية مباشرة في ZR Express...');
            const zrResult = await ZRExpressAPI.createOrder(orderData);
            console.log('📡 نتيجة ZR Express:', zrResult);
            
            if (zrResult.success) {
              // حفظ رقم التتبع في قاعدة البيانات
              const finalTrackingNumber = zrResult.data?.Tracking || trackingNumber;
              console.log('💾 حفظ رقم التتبع في قاعدة البيانات:', finalTrackingNumber);
              
              const saveResult = await updateOrder(orderId, { trackingNumber: finalTrackingNumber });
              console.log('💾 نتيجة حفظ رقم التتبع:', saveResult);
              
              if (saveResult.success) {
                Alert.alert('✅ نجح', `تم تأكيد الطلبية وإنشاء طلبية في ZR Express بنجاح!\n\n📦 رقم التتبع: ${finalTrackingNumber}\n📅 تاريخ الإنشاء: ${zrResult.data?.Date_Creation || 'غير متوفر'}\n✅ حالة الطلبية: ${zrResult.data?.MessageRetour || 'Good'}`);
              } else {
                Alert.alert('⚠️ تحذير', `تم تأكيد الطلبية وإنشاء طلبية ZR Express ولكن فشل في حفظ رقم التتبع في قاعدة البيانات`);
              }
            } else {
              console.error('❌ فشل في إنشاء طلبية ZR Express:', zrResult);
              Alert.alert('⚠️ تحذير', `تم تأكيد الطلبية ولكن فشل في إنشاء طلبية ZR Express\nالخطأ: ${zrResult.message || 'خطأ غير معروف'}`);
            }
          } catch (zrError) {
            console.error('❌ خطأ في إنشاء طلبية ZR Express:', zrError);
            Alert.alert('⚠️ تحذير', `تم تأكيد الطلبية ولكن فشل في إنشاء طلبية ZR Express\nالخطأ: ${zrError instanceof Error ? zrError.message : 'خطأ غير معروف'}`);
          }
        } else {
          Alert.alert('✅ نجح', 'تم تحديث حالة الطلب بنجاح');
        }
        
        // Update the order status in the local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId 
              ? { ...order, status: newStatus }
              : order
          )
        );
        
        // Update the selected order for details
        if (selectedOrderForDetails && selectedOrderForDetails.id === orderId) {
          setSelectedOrderForDetails((prev: any) => 
            prev ? { ...prev, status: newStatus } : null
          );
        }
        
        // إعادة تحميل الطلبات لتحديث البيانات
        loadOrders();
      } else {
        Alert.alert('❌ فشل', result.error || 'فشل في تحديث حالة الطلب');
      }
    } catch (error) {
      console.error('❌ خطأ في تحديث حالة الطلبية:', error);
      Alert.alert('خطأ', 'فشل في تحديث حالة الطلب');
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === undefined || price === null) {
      return '0';
    }
    return price.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'confirmed':
        return '#3B82F6';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getDeliveryTypeText = (deliveryType: string) => {
    return deliveryType === 'home' ? 'توصيل للمنزل' : 'توصيل لمركز البريد';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'قيد المعالجة';
      case 'confirmed':
        return 'مؤكد';
      case 'cancelled':
        return 'ملغي';
      default:
        return status || 'غير محدد';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerSectionTitle}>إدارة الطلبات</Text>
          <Text style={styles.orderCount}>
            {filteredOrders.length} طلب
          </Text>
        </View>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث في الطلبات..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <View style={styles.filterContainer}>
        <Filter size={16} color="#6B7280" />
        <Text style={styles.filterLabel}>تصفية حسب الحالة:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'all' && styles.activeFilterButton]}
            onPress={() => setStatusFilter('all')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'all' && styles.activeFilterButtonText]}>
              جميع الطلبات
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'pending' && styles.activeFilterButton]}
            onPress={() => setStatusFilter('pending')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'pending' && styles.activeFilterButtonText]}>
              قيد المعالجة
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'confirmed' && styles.activeFilterButton]}
            onPress={() => setStatusFilter('confirmed')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'confirmed' && styles.activeFilterButtonText]}>
              مؤكد
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, statusFilter === 'cancelled' && styles.activeFilterButton]}
            onPress={() => setStatusFilter('cancelled')}
          >
            <Text style={[styles.filterButtonText, statusFilter === 'cancelled' && styles.activeFilterButtonText]}>
              ملغي
            </Text>
          </TouchableOpacity>
          

        </ScrollView>
      </View>

      {/* Orders List */}
      <ScrollView style={styles.ordersList}>
        {/* Test Button */}


        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all' ? 'لا توجد نتائج للبحث' : 'لا توجد طلبات'}
            </Text>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              {/* Simple Order Design */}
              <View style={styles.simpleRow}>
                {/* Order Name */}
                <View style={styles.orderNameSection}>
                  <Text style={styles.orderName}>
                    طلبية في {order.itemName}
                  </Text>
                  <Text style={styles.orderDate}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>

                {/* Status Badge */}
                <View style={styles.statusSection}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>

                {/* Show Details Button */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => handleViewOrder(order)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsButtonText}>عرض التفاصيل</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Order Status Modal */}
      <OrderStatusModal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        order={selectedOrder}
        onStatusUpdate={updateOrderStatus}
      />

      {/* Order Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.detailsModalContainer}>
            {/* Header with Gradient */}
            <View style={styles.detailsModalHeader}>
              <View style={styles.headerGradient}>
                <View style={styles.headerContent}>
                  <View style={styles.headerLeft}>
                    <Text style={styles.detailsModalTitle}>تفاصيل الطلبية</Text>
                    <Text style={styles.orderIdText}>طلب #{selectedOrderForDetails?.id?.slice(-6) || '000000'}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setShowDetailsModal(false)}
                  >
                    <X size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <ScrollView style={styles.detailsModalContent} showsVerticalScrollIndicator={false}>
              {selectedOrderForDetails && (
                <View style={styles.detailsContent}>
                  {/* Product Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>معلومات المنتج/العرض</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>اسم المنتج/العرض</Text>
                          <Text style={styles.detailValue}>{selectedOrderForDetails.itemName || 'غير محدد'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>السعر الأصلي</Text>
                          <Text style={styles.detailValue}>
                            {selectedOrderForDetails.originalItem?.price 
                              ? formatPrice(Number(selectedOrderForDetails.originalItem.price)) 
                              : formatPrice(Number(selectedOrderForDetails.unitPrice || 0))} دج
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>السعر الذي سيعاد بيعه</Text>
                          <Text style={styles.detailValue}>
                            {formatPrice(Number(selectedOrderForDetails.resellerPrice || selectedOrderForDetails.unitPrice || 0))} دج
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>الكمية</Text>
                          <Text style={[styles.detailValue, { textAlign: 'right' }]}>{selectedOrderForDetails.quantity || 0}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Seller Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>معلومات البائع</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>اسم البائع</Text>
                          <Text style={styles.detailValue}>
                            {selectedOrderForDetails.sellerName || 'غير محدد'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>رقم هاتف البائع</Text>
                          <View style={styles.phoneNumberContainer}>
                            <Text style={styles.phoneNumberText}>
                              +213 {selectedOrderForDetails.resellerPhone || 'غير محدد'}
                            </Text>
                            {selectedOrderForDetails.resellerPhone && (
                              <TouchableOpacity 
                                style={styles.whatsappButton}
                                onPress={() => openWhatsApp(selectedOrderForDetails.resellerPhone, `طلبية في ${selectedOrderForDetails.itemName}`)}
                              >
                                <MessageCircle size={20} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Buyer Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>معلومات المشتري</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>اسم المشتري</Text>
                          <Text style={styles.detailValue}>
                            {selectedOrderForDetails.customerName || 'غير محدد'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>رقم هاتف المشتري</Text>
                          <View style={styles.phoneNumberContainer}>
                            <Text style={styles.phoneNumberText}>
                              +213 {selectedOrderForDetails.phoneNumber || 'غير محدد'}
                            </Text>
                            {selectedOrderForDetails.phoneNumber && (
                              <TouchableOpacity 
                                style={styles.whatsappButton}
                                onPress={() => openWhatsApp(selectedOrderForDetails.phoneNumber, `طلبية في ${selectedOrderForDetails.itemName}`)}
                              >
                                <MessageCircle size={20} color="#FFFFFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Delivery Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>معلومات التوصيل</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>نوع التوصيل</Text>
                          <Text style={styles.detailValue}>
                            {getDeliveryTypeText(selectedOrderForDetails.deliveryType)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>الولاية</Text>
                          <Text style={styles.detailValue}>{selectedOrderForDetails.wilaya || 'غير محدد'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>البلدية</Text>
                          <Text style={styles.detailValue}>{selectedOrderForDetails.commune || 'غير محدد'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>تكلفة التوصيل</Text>
                          <Text style={styles.detailValue}>
                            {(() => {
                              // حساب سعر التوصيل محلياً للطلبات التي نوع توصيلها للمكتب
                              if (selectedOrderForDetails.deliveryType === 'stopDesk') {
                                const wilayaCode = selectedOrderForDetails.wilaya;
                                const shippingCost = calculateLocalShippingCost(wilayaCode, 'stopDesk');
                                return `${formatPrice(shippingCost)} دج (للمكتب)`;
                              } else {
                                // للطلبات التي نوع توصيلها للمنزل، استخدم shippingCost من قاعدة البيانات
                                return `${formatPrice(Number(selectedOrderForDetails.shippingCost || 0))} دج`;
                              }
                            })()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Pricing Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>التكلفة الإجمالية</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>سعر المنتج/العرض</Text>
                          <Text style={styles.detailValue}>
                            {formatPrice(Number(selectedOrderForDetails.resellerPrice || selectedOrderForDetails.unitPrice || 0))} دج
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>تكلفة التوصيل</Text>
                          <Text style={styles.detailValue}>
                            {(() => {
                              // حساب سعر التوصيل محلياً للطلبات التي نوع توصيلها للمكتب
                              if (selectedOrderForDetails.deliveryType === 'stopDesk') {
                                const wilayaCode = selectedOrderForDetails.wilaya;
                                const shippingCost = calculateLocalShippingCost(wilayaCode, 'stopDesk');
                                return `${formatPrice(shippingCost)} دج (للمكتب)`;
                              } else {
                                // للطلبات التي نوع توصيلها للمنزل، استخدم shippingCost من قاعدة البيانات
                                return `${formatPrice(Number(selectedOrderForDetails.shippingCost || 0))} دج`;
                              }
                            })()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.totalRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.totalLabel}>التكلفة الإجمالية</Text>
                          <Text style={styles.totalValue}>
                            {formatPrice(Number(selectedOrderForDetails.totalAmount || 0))} دج
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Date Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>تاريخ الطلبية</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.detailRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>تاريخ إنشاء الطلبية</Text>
                          <Text style={styles.detailValue}>
                            {formatDate(selectedOrderForDetails.createdAt)}
                          </Text>
                        </View>
                      </View>
                      
                      {selectedOrderForDetails.trackingNumber && (
                        <View style={styles.detailRow}>
                          <View style={styles.detailTextContainer}>
                            <Text style={styles.detailLabel}>رقم التتبع ZR Express</Text>
                            <Text style={[styles.detailValue, { color: '#FF6B35', fontWeight: 'bold' }]}>
                              {selectedOrderForDetails.trackingNumber}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Status Section */}
                  <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.sectionTitle}>حالة الطلبية</Text>
                    </View>
                    <View style={styles.sectionContent}>
                      <View style={styles.statusRow}>
                        <View style={styles.detailTextContainer}>
                          <Text style={styles.detailLabel}>الحالة الحالية</Text>
                          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrderForDetails.status) + '20' }]}>
                            <Text style={[styles.statusText, { color: getStatusColor(selectedOrderForDetails.status) }]}>
                              {getStatusText(selectedOrderForDetails.status)}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.statusButtonsContainer}>
                        <Text style={styles.statusButtonsLabel}>تغيير الحالة:</Text>
                        <View style={styles.statusButtonsRow}>
                          <TouchableOpacity
                            style={[
                              styles.statusButton,
                              selectedOrderForDetails.status === 'confirmed' && styles.activeStatusButton
                            ]}
                            onPress={() => handleStatusChange(selectedOrderForDetails.id, 'confirmed')}
                          >
                            <Text style={[
                              styles.statusButtonText,
                              selectedOrderForDetails.status === 'confirmed' && styles.activeStatusButtonText
                            ]}>
                              مؤكد
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.statusButton,
                              selectedOrderForDetails.status === 'cancelled' && styles.activeStatusButton
                            ]}
                            onPress={() => handleStatusChange(selectedOrderForDetails.id, 'cancelled')}
                          >
                            <Text style={[
                              styles.statusButtonText,
                              selectedOrderForDetails.status === 'cancelled' && styles.activeStatusButtonText
                            ]}>
                              ملغي
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[
                              styles.statusButton,
                              selectedOrderForDetails.status === 'pending' && styles.activeStatusButton
                            ]}
                            onPress={() => handleStatusChange(selectedOrderForDetails.id, 'pending')}
                          >
                            <Text style={[
                              styles.statusButtonText,
                              selectedOrderForDetails.status === 'pending' && styles.activeStatusButtonText
                            ]}>
                              قيد المعالجة
                            </Text>
                          </TouchableOpacity>
                          

                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flex: 1,
  },
  headerSectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  filterContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#FF6B35',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  ordersList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  simpleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNameSection: {
    flex: 1,
    marginRight: 12,
  },
  orderName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusSection: {
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    overflow: 'hidden',
  },
  detailsModalHeader: {
    backgroundColor: '#FF6B35',
  },
  headerGradient: {
    backgroundColor: '#FF6B35',
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  detailsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  orderIdText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsModalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  detailsContent: {
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  sectionHeader: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionContent: {
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#FF6B3520',
  },
  totalLabel: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 4,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 18,
    color: '#FF6B35',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusButtonsContainer: {
    marginTop: 16,
  },
  statusButtonsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  statusButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  activeStatusButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  activeStatusButtonText: {
    color: '#FFFFFF',
  },
  phoneNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  phoneNumberText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '600',
  },
  whatsappButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
