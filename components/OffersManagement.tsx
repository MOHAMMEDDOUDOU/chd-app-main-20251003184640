import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
} from 'react-native';
import { Plus, Search, Edit, Trash2 } from 'lucide-react-native';
import { getOffers, deleteOffer, Offer } from '../lib/offers';
import OfferForm from './OfferForm';

export default function OffersManagement() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [deletingOfferId, setDeletingOfferId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageSize = 6;

  // تحميل العروض
  const loadOffers = async () => {
    console.log('🔄 loadOffers تم استدعاؤها');
    try {
      setLoading(true);
      const result = await getOffers();
      console.log('📥 نتيجة getOffers:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ تم تحميل العروض بنجاح، عدد العروض:', result.offers?.length || 0);
        setOffers(result.offers || []);
      } else {
        console.log('❌ فشل في تحميل العروض:', result.error);
        Alert.alert('خطأ', 'فشل في تحميل العروض');
      }
    } catch (error) {
      console.error('❌ خطأ في loadOffers:', error);
      Alert.alert('خطأ', 'حدث خطأ في تحميل العروض');
    } finally {
      setLoading(false);
      console.log('🔄 تم إعادة تعيين حالة التحميل');
    }
  };

  // البحث في العروض
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredOffers(offers);
    } else {
      const filtered = offers.filter(offer =>
        offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredOffers(filtered);
    }
    setPage(0);
  }, [searchQuery, offers]);

  const totalPages = useMemo(() => Math.ceil(filteredOffers.length / pageSize) || 1, [filteredOffers.length]);
  const pagedOffers = useMemo(() => {
    const start = page * pageSize;
    return filteredOffers.slice(start, start + pageSize);
  }, [filteredOffers, page]);

  // تحميل العروض عند فتح الصفحة
  useEffect(() => {
    loadOffers();
  }, []);

  const handleAddOffer = () => {
    setEditingOffer(null);
    setShowOfferForm(true);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setShowOfferForm(true);
  };

  const handleDeleteOffer = (offer: Offer) => {
    console.log('🔘 تم الضغط على زر الحذف للعرض:', offer.name);
    
    // حذف مباشر بدون تأكيد
    const deleteOfferDirectly = async () => {
      try {
        setDeletingOfferId(offer.id);
        console.log('🗑️ بدء حذف العرض:', offer.id, offer.name);
        
        const result = await deleteOffer(offer.id);
        console.log('📥 نتيجة الحذف:', JSON.stringify(result, null, 2));

        if (result && result.success) {
          console.log('✅ تم حذف العرض بنجاح');
          setOffers(prev => {
            const newOffers = prev.filter(o => o.id !== offer.id);
            console.log('📊 عدد العروض بعد الحذف:', newOffers.length);
            return newOffers;
          });
          setFilteredOffers(prev => {
            const newFiltered = prev.filter(o => o.id !== offer.id);
            console.log('📊 عدد العروض المفلترة بعد الحذف:', newFiltered.length);
            return newFiltered;
          });
        } else {
          const errorMsg = result?.error || 'فشل في حذف العرض';
          console.error('❌ فشل في حذف العرض:', errorMsg);
        }
      } catch (error) {
        console.error('❌ خطأ في حذف العرض:', error);
      } finally {
        setDeletingOfferId(null);
        console.log('🔄 تم إعادة تعيين حالة الحذف');
      }
    };

    // تشغيل الحذف مباشرة
    deleteOfferDirectly();
  };

  const handleOfferFormSuccess = () => {
    console.log('🔄 handleOfferFormSuccess تم استدعاؤها');
    loadOffers(); // إعادة تحميل العروض بعد الإضافة/التعديل
  };

  const handleCloseOfferForm = () => {
    setShowOfferForm(false);
    setEditingOffer(null);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} دج`;
  };

  const OfferAdminCard = ({ offer }: { offer: Offer }) => {
    const [aspectRatio, setAspectRatio] = useState(1);

    useEffect(() => {
      const uri = (offer as any).image_url || (offer as any).imageUrl;
      if (uri) {
        Image.getSize(
          uri,
          (w, h) => {
            if (w && h) setAspectRatio(w / h);
          },
          () => setAspectRatio(1)
        );
      } else {
        setAspectRatio(1);
      }
    }, [offer.id, (offer as any).image_url, (offer as any).imageUrl]);

    return (
      <View style={styles.offerCard}>
        {/* Offer Image */}
        <View style={styles.offerImageContainer}>
          {(offer as any).image_url || (offer as any).imageUrl ? (
            <Image 
              source={{ uri: (offer as any).image_url || (offer as any).imageUrl }} 
              style={[styles.offerImage, { height: undefined, aspectRatio }]}
              resizeMode="contain"
              onLoad={({ nativeEvent }) => {
                const w = nativeEvent?.source?.width;
                const h = nativeEvent?.source?.height;
                if (w && h) {
                  setAspectRatio(w / h);
                }
              }}
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>صورة العرض</Text>
            </View>
          )}
        </View>

        {/* Offer Info */}
        <View style={styles.offerInfo}>
          <Text style={styles.offerName} numberOfLines={2}>
            {offer.name}
          </Text>
          <Text style={styles.offerCategory}>
            {offer.category}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.offerPrice}>
              {formatPrice(Number((offer as any).price))}
            </Text>
            {(offer as any).discount_price && (
              <Text style={styles.discountPrice}>
                {formatPrice(Number((offer as any).discount_price))}
              </Text>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditOffer(offer)}
          >
            <Edit size={16} color="#FF6B35" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton, { marginLeft: 8 }]}
            onPress={() => handleDeleteOffer(offer)}
            disabled={deletingOfferId === offer.id}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>جاري تحميل العروض...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>إدارة العروض</Text>
          <Text style={styles.offerCount}>
            {filteredOffers.length} عرض
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddOffer}>
          <Plus size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>إضافة عرض</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Search size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="البحث في العروض..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Offers Grid */}
      <ScrollView style={styles.offersList}>
        {filteredOffers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'لا توجد نتائج للبحث' : 'لا توجد عروض'}
            </Text>
          </View>
        ) : (
          <View style={styles.offersGrid}>
            {pagedOffers.map((offer) => (
              <OfferAdminCard key={offer.id} offer={offer} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Pagination Controls */}
      {filteredOffers.length > pageSize && (
        <View style={styles.pagination}>
          <TouchableOpacity
            style={[styles.navButton, page === 0 && styles.navButtonDisabled]}
            onPress={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <Text style={styles.navButtonText}>السابق</Text>
          </TouchableOpacity>
          <Text style={styles.pageIndicator}>{page + 1} / {totalPages}</Text>
          <TouchableOpacity
            style={[styles.navButton, page >= totalPages - 1 && styles.navButtonDisabled]}
            onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <Text style={styles.navButtonText}>التالي</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Offer Form Modal */}
      <OfferForm
        visible={showOfferForm}
        onClose={handleCloseOfferForm}
        onSuccess={handleOfferFormSuccess}
        offer={editingOffer}
      />
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  offerCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
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
  offersList: {
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
  offersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  offerCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  navButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  navButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  navButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pageIndicator: {
    marginHorizontal: 8,
    color: '#6B7280',
  },
  offerImageContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  offerImage: {
    width: '100%',
  },
  noImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  offerInfo: {
    flex: 1,
  },
  offerName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  offerCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  discountPrice: {
    fontSize: 12,
    color: '#EF4444',
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FFF7ED',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
  },
});
