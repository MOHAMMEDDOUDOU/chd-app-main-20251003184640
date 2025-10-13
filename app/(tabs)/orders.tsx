import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Package, Clock, CheckCircle, XCircle, MessageCircle, X } from 'lucide-react-native';
import { useUser } from '../../lib/userContext';
import { getOrders } from '../../lib/orders';
import { useRouter } from 'expo-router';

interface Order {
  id: string;
  itemName: string;
  itemType: string;
  unitPrice: number;
  resellerPrice?: number;
  quantity: number;
  customerName: string;
  buyerName?: string;
  phoneNumber: string;
  deliveryType: string;
  wilaya: string;
  commune?: string;
  shippingCost: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  originalItem?: any;
}

export default function UserOrdersScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // تحميل طلبات المستخدم
  const loadUserOrders = async () => {
    try {
      setLoading(true);
      const result = await getOrders();
      if (result.success && result.orders) {
        const userOrders = result.orders.filter((order: any) => {
          const byName = order.customerName && user?.fullName && order.customerName.trim() === user.fullName.trim();
          const byPhone = order.phoneNumber && user?.phoneNumber && order.phoneNumber.replace(/\D/g,'') === user.phoneNumber.replace(/\D/g,'');
          const byReseller = order.resellerUserId && user?.id && order.resellerUserId === user.id; // طلبات أنشأها المستخدم كبائع
          return Boolean(byName || byPhone || byReseller);
        }).map((order: any) => ({
          ...order,
          unitPrice: Number(order.unitPrice),
          resellerPrice: order.resellerPrice ? Number(order.resellerPrice) : undefined,
          quantity: Number(order.quantity),
          shippingCost: Number(order.shippingCost),
          totalAmount: Number(order.totalAmount),
          createdAt: typeof order.createdAt === 'string' ? order.createdAt : new Date(order.createdAt).toISOString(),
        }));
        setOrders(userOrders);
      }
    } catch (error) {
      console.error('Error loading user orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserOrders();
    }
  }, [user]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} دج`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد المعالجة':
        return '#F59E0B';
      case 'مؤكد':
        return '#3B82F6';
      case 'قيد الشحن':
        return '#6366F1';
      case 'تم التسليم':
        return '#10B981';
      case 'ملغية':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'قيد المعالجة':
        return <Clock size={16} color="#F59E0B" />;
      case 'مؤكد':
        return <CheckCircle size={16} color="#3B82F6" />;
      case 'قيد الشحن':
        return <Clock size={16} color="#6366F1" />;
      case 'تم التسليم':
        return <CheckCircle size={16} color="#10B981" />;
      case 'ملغية':
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Package size={16} color="#6B7280" />;
    }
  };

  const openWhatsApp = (phoneNumber: string, message: string) => {
    const url = `whatsapp://send?phone=213${phoneNumber}&text=${encodeURIComponent(message)}`;
    Linking.openURL(url);
  };

  // فتح واتساب لرقم الدعم لطلب الفائدة
  const requestProfitWhatsApp = async (message: string) => {
    const phone = '213562163035';
    const waUrl = `whatsapp://send?phone=${phone}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    try {
      const can = await Linking.canOpenURL(waUrl);
      if (can) await Linking.openURL(waUrl); else await Linking.openURL(webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const computeProfit = (o: any) => {
    const baseOriginal = (o.originalItem?.price != null) ? Number(o.originalItem.price) : Number(o.unitPrice);
    const resell = (o.resellerPrice != null) ? Number(o.resellerPrice) : Number(o.unitPrice);
    const qty = Number(o.quantity || 1);
    const profitPerUnit = Math.max(0, resell - baseOriginal);
    return profitPerUnit * qty;
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  // مجموع الفائدة لكل الطلبيات
  const totalProfit = orders.reduce((sum, o) => sum + computeProfit(o as any), 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل طلباتك...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with back to home */}
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="arrow-back" size={22} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <Text style={styles.orderCount}>{orders.length} طلب</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Package size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
            <Text style={styles.emptyText}>
              لم تقم بأي طلب بعد. ابدأ بالتسوق الآن!
            </Text>
          </View>
        ) : (
          orders.map((order) => {
            const profit = computeProfit(order as any);
            const profitMessage = `مرحباً، أود طلب فائدة طلبية: ${order.itemName} بقيمة ${profit.toLocaleString()} دج`;
            return (
            <TouchableOpacity
              key={order.id}
              style={styles.orderCard}
              onPress={() => handleViewOrder(order)}
              activeOpacity={0.7}
            >
              <View style={styles.orderHeader}>
                <View style={styles.orderInfo}>
                  <Text style={styles.orderName}>
                    طلبية في {order.itemName}
                  </Text>
                  <Text style={styles.orderDate}>
                    {formatDate(order.createdAt)}
                  </Text>
                </View>
                <View style={styles.statusContainer}>
                  {getStatusIcon(order.status)}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                      {order.status}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.orderDetails}>
                <Text style={styles.orderPrice}>
                  {formatPrice(order.totalAmount)}
                </Text>
                <Text style={styles.orderQuantity}>
                  الكمية: {order.quantity}
                </Text>
              </View>
              <View style={styles.profitRow}>
                <Text style={styles.profitText}>الفائدة: {profit.toLocaleString()} دج</Text>
                <TouchableOpacity style={styles.profitButton} onPress={() => requestProfitWhatsApp(profitMessage)}>
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.profitButtonText}>اطلب الفائدة</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Order Details Modal */}
      <Modal visible={showDetailsModal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تفاصيل الطلبية</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>معلومات المنتج</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>اسم المنتج:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.itemName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>السعر:</Text>
                    <Text style={styles.detailValue}>{formatPrice(selectedOrder.unitPrice)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>الكمية:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.quantity}</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>معلومات التوصيل</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>نوع التوصيل:</Text>
                    <Text style={styles.detailValue}>
                      {selectedOrder.deliveryType === 'home' ? 'توصيل للمنزل' : 'توصيل لمركز البريد'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>الولاية:</Text>
                    <Text style={styles.detailValue}>{selectedOrder.wilaya}</Text>
                  </View>
                  {selectedOrder.commune && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>البلدية:</Text>
                      <Text style={styles.detailValue}>{selectedOrder.commune}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>التسعير</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>سعر التوصيل:</Text>
                    <Text style={styles.detailValue}>{formatPrice(selectedOrder.shippingCost)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>السعر الإجمالي:</Text>
                    <Text style={[styles.detailValue, styles.totalPrice]}>
                      {formatPrice(selectedOrder.totalAmount)}
                    </Text>
                  </View>
                  {/* Profit in details */}
                  <View style={[styles.detailRow, { marginTop: 8 }]}>
                    <Text style={styles.detailLabel}>الفائدة:</Text>
                    <Text style={[styles.detailValue, { color: '#10B981', fontWeight: '700' }]}>
                      {(() => {
                        const p = computeProfit(selectedOrder);
                        return `${p.toLocaleString()} دج`;
                      })()}
                    </Text>
                  </View>
                  <View style={[styles.detailRow, { justifyContent: 'flex-end' }]}>
                    <TouchableOpacity
                      style={styles.profitButton}
                      onPress={() => {
                        const p = computeProfit(selectedOrder);
                        const msg = `مرحباً، أود طلب فائدة طلبية: ${selectedOrder.itemName} بقيمة ${p.toLocaleString()} دج`;
                        requestProfitWhatsApp(msg);
                      }}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                      <Text style={styles.profitButtonText}>اطلب الفائدة</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>حالة الطلبية</Text>
                  <View style={styles.statusRow}>
                    {getStatusIcon(selectedOrder.status)}
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                        {selectedOrder.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.whatsappButton}
                  onPress={() => openWhatsApp(selectedOrder.phoneNumber, `استفسار عن طلبية ${selectedOrder.itemName}`)}
                >
                  <MessageCircle size={20} color="#FFFFFF" />
                  <Text style={styles.whatsappButtonText}>تواصل معنا عبر WhatsApp</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Profit Footer with WhatsApp button */}
      <View style={styles.profitFooter}>
        <Text style={styles.profitFooterText}>مجموع الفائدة: {totalProfit.toLocaleString()} دج</Text>
        <TouchableOpacity
          style={styles.profitButton}
          onPress={() => {
            const msg = `مرحباً، أود طلب مجموع الفائدة لطلباتي: ${totalProfit.toLocaleString()} دج`;
            requestProfitWhatsApp(msg);
          }}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.profitButtonText}>اطلب الفائدة</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  orderCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderInfo: {
    flex: 1,
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    lineHeight: 20,
  },
  orderDate: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  orderQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  profitText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '700',
  },
  profitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profitButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  profitFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  profitFooterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
    alignSelf: 'center',
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});