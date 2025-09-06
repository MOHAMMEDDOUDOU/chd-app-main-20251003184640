// ZR Express Proxy - حل مشكلة CORS في Expo
// يعمل كوسيط بين Frontend و ZR Express

const ZR_EXPRESS_CONFIG = {
  token: "3541877f95878892f64c98e16277688e902c9221583857bf68d73d5f5ee29234",
  key: "59cd8026082b4ba995da7cd29e296f9b",
  baseUrl: "https://procolis.com/api_v1",
  source: "taziri16",
};

// Proxy function لحل CORS
export async function zrExpressProxy(endpoint: string, data: any): Promise<any> {
  try {
    console.log('🚀 Proxy: إرسال طلب إلى ZR Express');
    console.log('🌐 Endpoint:', endpoint);
    console.log('📦 البيانات:', JSON.stringify(data, null, 2));

    // إرسال الطلب مباشرة إلى ZR Express
    // إضافة token و key إلى body بدلاً من headers لتجنب CORS
    const payloadWithAuth = {
      ...data,
      token: ZR_EXPRESS_CONFIG.token,
      key: ZR_EXPRESS_CONFIG.key,
    };
    
    const response = await fetch(`${ZR_EXPRESS_CONFIG.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'token': ZR_EXPRESS_CONFIG.token,
        'key': ZR_EXPRESS_CONFIG.key,
      },
      body: JSON.stringify(data),
    });

    console.log('📡 استجابة ZR Express:', response.status, response.statusText);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ خطأ من ZR Express:', errorData);
      
      throw new Error(`ZR Express Error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ نجح الطلب إلى ZR Express:', JSON.stringify(result, null, 2));

    return result;

  } catch (error) {
    console.error('❌ خطأ في Proxy:', error);
    throw error;
  }
}

// دالة إنشاء طلبية
export async function createOrderProxy(orderData: any): Promise<any> {
  try {
    // تجهيز بيانات الطلبية
    const colis = [{
      Tracking: orderData.order_number || orderData.tracking_number || "",
      TypeLivraison: orderData.delivery_type === "home" ? "0" : "1",
      TypeColis: "0",
      Confrimee: "",
      Client: orderData.customer_name,
      MobileA: orderData.phone_number,
      MobileB: "",
      Adresse: orderData.address,
      IDWilaya: orderData.wilaya || "1",
      Commune: orderData.commune || "",
      Total: orderData.total_amount?.toString() || "0",
      Note: orderData.notes || "",
      TProduit: orderData.product_name,
      id_Externe: orderData.order_number || "",
      Source: "taziri16"
    }];

    const payload = { Colis: colis };
    
    // استخدام Proxy
    const response = await zrExpressProxy("/add_colis", payload);
    
    return {
      success: response?.COUNT > 0,
      message: "تم إرسال الطلبية إلى ZR Express بنجاح",
      data: response
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error: error
    };
  }
}

// تصدير الكل
export default {
  zrExpressProxy,
  createOrderProxy,
  ZR_EXPRESS_CONFIG
};
