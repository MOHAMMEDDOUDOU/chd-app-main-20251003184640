// ZR Express API Configuration
const ZR_EXPRESS_CONFIG = {
  token: "3541877f95878892f64c98e16277688e902c9221583857bf68d73d5f5ee29234",
  key: "59cd8026082b4ba995da7cd29e296f9b",
  baseUrl: "https://procolis.com/api_v1",
  source: "taziri16",
}

export interface ZRExpressOrder {
  customer_name: string
  customer_phone: string
  customer_address: string
  wilaya: string
  commune: string
  product_name: string
  product_price: number
  quantity: number
  notes?: string
}

export interface ZRExpressResponse {
  success: boolean
  message: string
  order_id?: string
  tracking_number?: string
  shipping_cost?: number
  error?: string
}

// خريطة تحويل اسم الولاية إلى رقمها
const WILAYA_CODES: Record<string, string> = {
  "أدرار": "1", "الشلف": "2", "الأغواط": "3", "أم البواقي": "4", "باتنة": "5", "بجاية": "6", "بسكرة": "7", "بشار": "8", "البليدة": "9", "البويرة": "10", "تمنراست": "11", "تبسة": "12", "تلمسان": "13", "تيارت": "14", "تيزي وزو": "15", "الجزائر": "16", "الجلفة": "17", "جيجل": "18", "سطيف": "19", "سعيدة": "20", "سكيكدة": "21", "سيدي بلعباس": "22", "عنابة": "23", "قالمة": "24", "قسنطينة": "25", "المدية": "26", "مستغانم": "27", "المسيلة": "28", "معسكر": "29", "ورقلة": "30", "وهران": "31", "البيض": "32", "إليزي": "33", "برج بوعريريج": "34", "بومرداس": "35", "الطارف": "36", "تندوف": "37", "تيسمسيلت": "38", "الوادي": "39", "خنشلة": "40", "سوق أهراس": "41", "تيبازة": "42", "ميلة": "43", "عين الدفلى": "44", "النعامة": "45", "عين تموشنت": "46", "غرداية": "47", "غليزان": "48", "تيميمون": "49", "برج باجي مختار": "50", "أولاد جلال": "51", "بني عباس": "52", "عين صالح": "53", "عين قزام": "54", "تقرت": "55", "جانت": "56", "المغير": "57", "المنيعة": "58"
}

// أسعار التوصيل الجديدة
const WILAYAS = [
  { code: 1, name: "أدرار", tarif: 1400, stopDesk: 900 },
  { code: 2, name: "الشلف", tarif: 850, stopDesk: 450 },
  { code: 3, name: "الأغواط", tarif: 950, stopDesk: 550 },
  { code: 4, name: "أم البواقي", tarif: 900, stopDesk: 500 },
  { code: 5, name: "باتنة", tarif: 900, stopDesk: 500 },
  { code: 6, name: "بجاية", tarif: 800, stopDesk: 400 },
  { code: 7, name: "بسكرة", tarif: 950, stopDesk: 550 },
  { code: 8, name: "بشار", tarif: 1200, stopDesk: 800 },
  { code: 9, name: "البليدة", tarif: 600, stopDesk: 350 },
  { code: 10, name: "البويرة", tarif: 750, stopDesk: 400 },
  { code: 11, name: "تمنراست", tarif: 1600, stopDesk: 1200 },
  { code: 12, name: "تبسة", tarif: 1000, stopDesk: 600 },
  { code: 13, name: "تلمسان", tarif: 900, stopDesk: 500 },
  { code: 14, name: "تيارت", tarif: 850, stopDesk: 450 },
  { code: 15, name: "تيزي وزو", tarif: 750, stopDesk: 400 },
  { code: 16, name: "الجزائر", tarif: 500, stopDesk: 300 },
  { code: 17, name: "الجلفة", tarif: 900, stopDesk: 500 },
  { code: 18, name: "جيجل", tarif: 850, stopDesk: 450 },
  { code: 19, name: "سطيف", tarif: 800, stopDesk: 450 },
  { code: 20, name: "سعيدة", tarif: 900, stopDesk: 500 },
  { code: 21, name: "سكيكدة", tarif: 850, stopDesk: 450 },
  { code: 22, name: "سيدي بلعباس", tarif: 900, stopDesk: 500 },
  { code: 23, name: "عنابة", tarif: 900, stopDesk: 500 },
  { code: 24, name: "قالمة", tarif: 900, stopDesk: 500 },
  { code: 25, name: "قسنطينة", tarif: 850, stopDesk: 450 },
  { code: 26, name: "المدية", tarif: 700, stopDesk: 400 },
  { code: 27, name: "مستغانم", tarif: 850, stopDesk: 450 },
  { code: 28, name: "المسيلة", tarif: 850, stopDesk: 450 },
  { code: 29, name: "معسكر", tarif: 850, stopDesk: 450 },
  { code: 30, name: "ورقلة", tarif: 1100, stopDesk: 700 },
  { code: 31, name: "وهران", tarif: 800, stopDesk: 450 },
  { code: 32, name: "البيض", tarif: 1000, stopDesk: 600 },
  { code: 33, name: "إليزي", tarif: 1600, stopDesk: 1200 },
  { code: 34, name: "برج بوعريريج", tarif: 800, stopDesk: 450 },
  { code: 35, name: "بومرداس", tarif: 650, stopDesk: 350 },
  { code: 36, name: "الطارف", tarif: 950, stopDesk: 550 },
  { code: 37, name: "تندوف", tarif: 1500, stopDesk: 1100 },
  { code: 38, name: "تيسمسيلت", tarif: 850, stopDesk: 450 },
  { code: 39, name: "الوادي", tarif: 1000, stopDesk: 600 },
  { code: 40, name: "خنشلة", tarif: 950, stopDesk: 550 },
  { code: 41, name: "سوق أهراس", tarif: 950, stopDesk: 550 },
  { code: 42, name: "تيبازة", tarif: 650, stopDesk: 350 },
  { code: 43, name: "ميلة", tarif: 850, stopDesk: 450 },
  { code: 44, name: "عين الدفلى", tarif: 750, stopDesk: 400 },
  { code: 45, name: "النعامة", tarif: 1100, stopDesk: 700 },
  { code: 46, name: "عين تموشنت", tarif: 850, stopDesk: 450 },
  { code: 47, name: "غرداية", tarif: 1000, stopDesk: 600 },
  { code: 48, name: "غليزان", tarif: 850, stopDesk: 450 },
  { code: 49, name: "تيميمون", tarif: 1400, stopDesk: 900 },
  { code: 50, name: "برج باجي مختار", tarif: 1500, stopDesk: 1100 },
  { code: 51, name: "أولاد جلال", tarif: 1000, stopDesk: 600 },
  { code: 52, name: "بني عباس", tarif: 1300, stopDesk: 900 },
  { code: 53, name: "عين صالح", tarif: 1500, stopDesk: 1100 },
  { code: 54, name: "عين قزام", tarif: 1600, stopDesk: 1200 },
  { code: 55, name: "تقرت", tarif: 1000, stopDesk: 600 },
  { code: 56, name: "جانت", tarif: 1600, stopDesk: 1200 },
  { code: 57, name: "المغير", tarif: 1100, stopDesk: 700 },
  { code: 58, name: "المنيعة", tarif: 1200, stopDesk: 800 },
]

// دالة لحساب تكلفة الشحن الجديدة
export function calculateShippingCost(wilaya: string, deliveryType: "home" | "office", quantity: number = 1): number {
  // البحث عن الولاية في القائمة
  const wilayaData = WILAYAS.find(w => w.name === wilaya)
  
  if (!wilayaData) {
    // إذا لم يتم العثور على الولاية، استخدم سعر افتراضي
    return deliveryType === "home" ? 800 : 500
  }
  
  // تحديد السعر حسب نوع التوصيل (بدون خصم للكمية)
  const shippingCost = deliveryType === "home" ? wilayaData.tarif : wilayaData.stopDesk
  
  return shippingCost
}

export class ZRExpressAPI {
  private static async makeRequest(endpoint: string, data: any): Promise<any> {
    try {
      // استخدام خادم Vercel في الإنتاج
      const serverUrl = "https://v0-verceldeploy.vercel.app";
      const apiEndpoint = "/api/zr-express";
      
      console.log("🌐 إرسال طلب عبر Express Server إلى:", `${serverUrl}${apiEndpoint}`);
      console.log("📦 البيانات المرسلة:", JSON.stringify(data, null, 2));
      
      const response = await fetch(`${serverUrl}${apiEndpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderData: data }),
      });
      
      console.log("📡 استجابة HTTP:", response.status, response.statusText);
      
      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.message || resJson.error || `HTTP error! status: ${response.status}`);
      }
      
      // Express Server returns data in .data field, but we need the full response
      return resJson;
    } catch (error) {
      console.error("ZR Express API Error:", error);
      throw error;
    }
  }

  static async createOrder(orderData: any): Promise<any> {
    try {
      // تجهيز بيانات الطلبية حسب وثيقة procolis
      const wilayaCode = WILAYA_CODES[orderData.wilaya] || "1"
      
      // تحديد البلدية حسب نوع التوصيل
      let commune = orderData.commune || ""
      if (orderData.delivery_type === "office") {
        // في حالة التوصيل للمكتب، اترك حقل البلدية فارغاً
        commune = ""
      }
      
      const colis = [{
        Tracking: orderData.order_number || orderData.tracking_number || "",
        TypeLivraison: orderData.delivery_type === "home" ? "0" : "1",
        TypeColis: "0",
        Confrimee: "",
        Client: orderData.customer_name,
        MobileA: orderData.phone_number,
        MobileB: "",
        Adresse: orderData.address,
        IDWilaya: wilayaCode,
        Commune: commune,
        Total: orderData.total_amount?.toString() || "0",
        Note: orderData.notes || "",
        TProduit: orderData.product_name,
        id_Externe: orderData.order_number || "",
        Source: "taziri16"
      }]
      // إرسال فقط Colis؛ الخادم (Vercel) يضيف token/key من Environment Variables
      const payload = { Colis: colis }
      const response = await this.makeRequest("/add_colis", payload)
      return {
        success: response?.success === true || response?.status === "success" || false,
        message: response?.message || "تم إرسال الطلبية إلى ZR Express",
        data: response
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
        error: error
      }
    }
  }

  static async calculateShipping(wilaya: string, commune: string): Promise<{ cost: number; success: boolean }> {
    try {
      const response = await this.makeRequest("/shipping/calculate", {
        wilaya,
        commune,
      })
      return {
        success: true,
        cost: response.shipping_cost || 0,
      }
    } catch (error) {
      return {
        success: false,
        cost: 0,
      }
    }
  }

  static async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.makeRequest("/test", {})
      return {
        success: true,
        message: "Connection successful",
      }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Connection failed",
      }
    }
  }
}

// دالة لجلب الولايات المتاحة
export function getAvailableWilayas(): string[] {
  return WILAYAS.map(wilaya => wilaya.name)
}

// دالة لجلب البلديات المتاحة بناءً على الولاية
export function getAvailableCommunes(wilaya: string): string[] {
  const { WILAYAS_COMMUNES } = require('./wilayas-communes')
  return WILAYAS_COMMUNES[wilaya] || []
}

// تصدير ZRExpressAPI كـ default export
export default ZRExpressAPI;
