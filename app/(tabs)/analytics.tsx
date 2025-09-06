import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, DollarSign, ShoppingBag, Users, Calendar, Award } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const salesData = {
  todaySales: 1250,
  monthSales: 15420,
  totalOrders: 89,
  newCustomers: 23,
  topCategories: [
    { name: 'إلكترونيات', sales: 45, percentage: 35 },
    { name: 'أزياء', sales: 32, percentage: 25 },
    { name: 'منزل', sales: 28, percentage: 22 },
    { name: 'رياضة', sales: 23, percentage: 18 },
  ],
};

export default function AnalyticsScreen() {
  const StatCard = ({ 
    title, 
    value, 
    icon, 
    colors,
    change
  }: { 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    colors: string[];
    change?: string;
  }) => (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <View style={styles.statHeader}>
        <View style={styles.statIconContainer}>
          {icon}
        </View>
        {change && (
          <View style={styles.changeContainer}>
            <Text style={styles.changeText}>{change}</Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </LinearGradient>
  );

  const CategoryItem = ({ category }: { category: typeof salesData.topCategories[0] }) => (
    <View style={styles.categoryItem}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{category.name}</Text>
        <Text style={styles.categorySales}>{category.sales} مبيعة</Text>
      </View>
      <View style={styles.categoryProgress}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${category.percentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.categoryPercentage}>{category.percentage}%</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التحليلات</Text>
        <TouchableOpacity style={styles.periodButton}>
          <Calendar size={20} color="#667eea" />
          <Text style={styles.periodText}>هذا الشهر</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="مبيعات اليوم"
            value={`$${salesData.todaySales}`}
            icon={<DollarSign size={24} color="#FFFFFF" />}
            colors={['#667eea', '#764ba2']}
            change="+12%"
          />
          <StatCard
            title="مبيعات الشهر"
            value={`$${salesData.monthSales}`}
            icon={<TrendingUp size={24} color="#FFFFFF" />}
            colors={['#f093fb', '#f5576c']}
            change="+8%"
          />
          <StatCard
            title="إجمالي الطلبات"
            value={salesData.totalOrders.toString()}
            icon={<ShoppingBag size={24} color="#FFFFFF" />}
            colors={['#4facfe', '#00f2fe']}
            change="+15%"
          />
          <StatCard
            title="عملاء جدد"
            value={salesData.newCustomers.toString()}
            icon={<Users size={24} color="#FFFFFF" />}
            colors={['#43e97b', '#38f9d7']}
            change="+23%"
          />
        </View>

        {/* Top Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>أفضل الفئات</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>عرض الكل</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.categoriesContainer}>
            {salesData.topCategories.map((category, index) => (
              <CategoryItem key={index} category={category} />
            ))}
          </View>
        </View>

        {/* Performance Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>رؤى الأداء</Text>
          
          <View style={styles.insightsContainer}>
            <View style={styles.insightCard}>
              <Award size={24} color="#FFD700" />
              <Text style={styles.insightTitle}>أداء ممتاز</Text>
              <Text style={styles.insightDescription}>
                مبيعاتك هذا الشهر أعلى بـ 25% من الشهر الماضي
              </Text>
            </View>
            
            <View style={styles.insightCard}>
              <TrendingUp size={24} color="#10B981" />
              <Text style={styles.insightTitle}>نمو مستمر</Text>
              <Text style={styles.insightDescription}>
                عدد العملاء الجدد في ازدياد مستمر
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>إجراءات سريعة</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <ShoppingBag size={24} color="#667eea" />
              <Text style={styles.actionText}>إضافة منتج</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Users size={24} color="#667eea" />
              <Text style={styles.actionText}>إدارة العملاء</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <TrendingUp size={24} color="#667eea" />
              <Text style={styles.actionText}>تقرير مفصل</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton}>
              <Award size={24} color="#667eea" />
              <Text style={styles.actionText}>العروض</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
  periodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 5,
  },
  periodText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    paddingTop: 20,
    gap: 10,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  categorySales: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoryProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
    minWidth: 35,
  },
  insightsContainer: {
    gap: 15,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 15,
    marginBottom: 5,
  },
  insightDescription: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginLeft: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
  },
});