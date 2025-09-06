import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { TrendingUp, Users, ShoppingBag, DollarSign, Package, Tag } from 'lucide-react-native';
import { getProducts } from '../lib/products';
import { getOffers } from '../lib/offers';
import { getOrders } from '../lib/orders';

interface AnalyticsData {
  totalSales: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalOffers: number;
  monthlySales: number;
  topProducts: Array<{ name: string; sales: number }>;
  topUsers: Array<{ name: string; orders: number }>;
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalOffers: 0,
    monthlySales: 0,
    topProducts: [],
    topUsers: [],
  });
  const [loading, setLoading] = useState(true);

  // تحميل البيانات التحليلية
  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // تحميل البيانات من قاعدة البيانات
      const [productsResult, offersResult, ordersResult] = await Promise.all([
        getProducts(),
        getOffers(),
        getOrders(),
      ]);

      if (productsResult.success && offersResult.success && ordersResult.success) {
        const products = productsResult.products || [];
        const offers = offersResult.offers || [];
        const orders = ordersResult.orders || [];

        // حساب الإحصائيات
        const totalSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const totalOrders = orders.length;
        const totalProducts = products.length;
        const totalOffers = offers.length;

        // حساب أفضل المنتجات
        const productSales: { [key: string]: { sales: number; revenue: number } } = {};
        orders.forEach(order => {
          if (order.itemType === 'product') {
            if (!productSales[order.itemName]) {
              productSales[order.itemName] = { sales: 0, revenue: 0 };
            }
            productSales[order.itemName].sales += order.quantity;
            productSales[order.itemName].revenue += Number(order.totalAmount);
          }
        });

        const topProducts = Object.entries(productSales)
          .map(([name, data]: [string, any]) => ({
            name,
            sales: data.sales,
          }))
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5);

        // حساب أفضل المستخدمين
        const userOrders: { [key: string]: { orders: number; total: number } } = {};
        orders.forEach(order => {
          if (!userOrders[order.customerName]) {
            userOrders[order.customerName] = { orders: 0, total: 0 };
          }
          userOrders[order.customerName].orders += 1;
          userOrders[order.customerName].total += Number(order.totalAmount);
        });

        const topUsers = Object.entries(userOrders)
          .map(([name, data]: [string, any]) => ({
            name,
            orders: data.orders,
          }))
          .sort((a, b) => b.orders - a.orders)
          .slice(0, 5);

        setAnalytics({
          totalSales,
          totalOrders,
          totalUsers: topUsers.length, // عدد المستخدمين الفريدين
          totalProducts,
          totalOffers,
          monthlySales: totalSales / 6, // متوسط المبيعات الشهرية
          topProducts,
          topUsers,
        });
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} دج`;
  };

  const StatCard = ({ title, value, icon: Icon, color }: { title: string; value: string | number; icon: any; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Icon size={24} color={color} />
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  const TopListCard = ({ title, data, icon: Icon, color }: { title: string; data: Array<{ name: string; sales?: number; orders?: number }>; icon: any; color: string }) => (
    <View style={styles.listCard}>
      <View style={styles.listHeader}>
        <Icon size={20} color={color} />
        <Text style={styles.listTitle}>{title}</Text>
      </View>
      <ScrollView style={styles.listContent}>
        {data.map((item, index) => (
          <View key={index} style={styles.listItem}>
            <View style={styles.listItemLeft}>
              <Text style={styles.listItemRank}>#{index + 1}</Text>
              <Text style={styles.listItemName}>{item.name}</Text>
            </View>
            <Text style={styles.listItemValue}>
              {item.sales ? `${item.sales} مبيعات` : `${item.orders} طلبات`}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل التحليلات...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerGradient}>
          <Text style={styles.sectionTitle}>📊 التحليلات والإحصائيات</Text>
          <Text style={styles.sectionSubtitle}>
            نظرة شاملة على أداء النظام والأعمال
          </Text>
        </View>
      </View>

      {/* Enhanced Stats Grid - Mobile Responsive */}
      <View style={styles.statsGrid}>
        <View style={styles.statsRow}>
          <StatCard
            title="إجمالي المبيعات"
            value={formatPrice(analytics.totalSales)}
            icon={DollarSign}
            color="#10B981"
          />
          <StatCard
            title="إجمالي الطلبات"
            value={analytics.totalOrders}
            icon={ShoppingBag}
            color="#3B82F6"
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            title="إجمالي المستخدمين"
            value={analytics.totalUsers}
            icon={Users}
            color="#8B5CF6"
          />
          <StatCard
            title="المبيعات الشهرية"
            value={formatPrice(analytics.monthlySales)}
            icon={TrendingUp}
            color="#F59E0B"
          />
        </View>
      </View>



      {/* Enhanced Top Lists */}
      <View style={styles.listsContainer}>
        <TopListCard
          title="🏆 أفضل المنتجات مبيعاً"
          data={analytics.topProducts}
          icon={Package}
          color="#EF4444"
        />
        <TopListCard
          title="👥 أفضل العملاء"
          data={analytics.topUsers}
          icon={Users}
          color="#8B5CF6"
        />
      </View>

      {/* Enhanced Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.actionsTitle}>⚡ إجراءات سريعة</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>📄 تصدير التقرير</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionButtonContent}>
              <Text style={styles.actionButtonText}>📈 إحصائيات مفصلة</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerGradient: {
    padding: 20,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    marginTop: -20,
    marginBottom: 20,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  statsGrid: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  listContent: {
    maxHeight: 200,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  listItemRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6B7280',
    marginRight: 12,
    minWidth: 30,
  },
  listItemName: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  listItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
