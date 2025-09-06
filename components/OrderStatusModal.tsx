import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { Order } from '../lib/orders';

interface OrderStatusModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  onStatusUpdate: (orderId: string, status: Order['status']) => void;
}

const statusOptions: { value: Order['status']; label: string; color: string }[] = [
  { value: 'قيد المعالجة', label: 'قيد المعالجة', color: '#F59E0B' },
  { value: 'تم التأكيد', label: 'تم التأكيد', color: '#3B82F6' },
  { value: 'في الطريق', label: 'في الطريق', color: '#8B5CF6' },
  { value: 'تم التسليم', label: 'تم التسليم', color: '#10B981' },
  { value: 'ملغي', label: 'ملغي', color: '#EF4444' },
];

export default function OrderStatusModal({ visible, onClose, order, onStatusUpdate }: OrderStatusModalProps) {
  if (!order) return null;

  const handleStatusSelect = (status: Order['status']) => {
    onStatusUpdate(order.id, status);
    onClose();
  };

  const getStatusColor = (status: Order['status']) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption?.color || '#6B7280';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>تحديث حالة الطلب</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View style={styles.orderInfo}>
              <Text style={styles.orderTitle}>معلومات الطلب</Text>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>المنتج:</Text>
                <Text style={styles.infoValue}>{order.itemName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الكمية:</Text>
                <Text style={styles.infoValue}>{order.quantity}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>السعر الإجمالي:</Text>
                <Text style={styles.infoValue}>{Number(order.totalAmount).toLocaleString()} دج</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>العميل:</Text>
                <Text style={styles.infoValue}>{order.customerName}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>رقم الهاتف:</Text>
                <Text style={styles.infoValue}>{order.phoneNumber}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الولاية:</Text>
                <Text style={styles.infoValue}>{order.wilaya}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>الحالة الحالية:</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
            </View>

            {/* Status Options */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>اختر الحالة الجديدة</Text>
              
              {statusOptions.map((statusOption) => (
                <TouchableOpacity
                  key={statusOption.value}
                  style={[
                    styles.statusOption,
                    order.status === statusOption.value && styles.selectedStatus
                  ]}
                  onPress={() => handleStatusSelect(statusOption.value)}
                >
                  <View style={[styles.statusIndicator, { backgroundColor: statusOption.color }]} />
                  <Text style={[
                    styles.statusOptionText,
                    order.status === statusOption.value && styles.selectedStatusText
                  ]}>
                    {statusOption.label}
                  </Text>
                  {order.status === statusOption.value && (
                    <Check size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    paddingHorizontal: 20,
  },
  orderInfo: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statusSection: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  selectedStatus: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusOptionText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedStatusText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
