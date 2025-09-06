import * as Crypto from 'expo-crypto';

// تكوين Cloudinary
const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dldvpyait/image/upload';
const API_KEY = '492293214411789';
const API_SECRET = 'zx7-Eyg7oPWpIKObKC62rhmMDPA';

export class CloudinaryService {
  // رفع صورة واحدة - مع التوقيع الصحيح
  static async uploadImage(imageUri: string, folder: string = 'products'): Promise<string> {
    try {
      console.log('🚀 بدء رفع الصورة إلى Cloudinary...');
      console.log('📁 URI:', imageUri);
      console.log('📂 المجلد:', folder);

      // إنشاء timestamp
      const timestamp = Math.round(new Date().getTime() / 1000);

      // إنشاء FormData
      const formData = new FormData();
      
      // معالجة الصورة بشكل مختلف حسب النوع
      if (typeof imageUri === 'string') {
        // إذا كان string، نحتاج لتحويله إلى blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('file', blob, 'image.jpg');
      } else {
        // إذا كان object، استخدم الطريقة العادية
        formData.append('file', {
          uri: (imageUri as any).uri || imageUri,
          type: 'image/jpeg',
          name: 'image.jpg'
        } as any);
      }
      
      formData.append('api_key', API_KEY);
      formData.append('timestamp', timestamp.toString());
      formData.append('folder', folder);

      // إنشاء التوقيع
      const signatureParams = {
        folder: folder,
        timestamp: timestamp
      };
      const signature = await this.generateSignature(signatureParams);
      formData.append('signature', signature);

      console.log('📤 إرسال الطلب إلى Cloudinary مع التوقيع...');
      console.log('🔑 التوقيع:', signature);

      // رفع الصورة
      const response = await fetch(CLOUDINARY_URL, {
        method: 'POST',
        body: formData
      });

      console.log('📥 استلام الرد...');
      console.log('🔢 رمز الاستجابة:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ في الاستجابة:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.error) {
        console.error('❌ خطأ من Cloudinary:', result.error);
        throw new Error(result.error.message || 'خطأ في رفع الصورة');
      }

      console.log('✅ نجح رفع الصورة!');
      console.log('🔗 رابط الصورة:', result.secure_url);
      console.log('🆔 معرف الصورة:', result.public_id);

      return result.secure_url;
    } catch (error) {
      console.error('❌ خطأ في رفع الصورة:', error);
      throw new Error('فشل في رفع الصورة');
    }
  }

  // حذف صورة من Cloudinary
  static async deleteImage(publicId: string): Promise<void> {
    try {
      console.log('🗑️ بدء حذف الصورة من Cloudinary...');
      console.log('🆔 معرف الصورة:', publicId);

      const timestamp = Math.round(new Date().getTime() / 1000);
      const signature = await this.generateSignature({ 
        public_id: publicId,
        timestamp: timestamp
      });

      const response = await fetch(`https://api.cloudinary.com/v1_1/dldvpyait/image/destroy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          public_id: publicId,
          api_key: API_KEY,
          timestamp: timestamp,
          signature: signature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ نجح حذف الصورة!');
      console.log('📊 النتيجة:', result);
    } catch (error) {
      console.error('❌ خطأ في حذف الصورة:', error);
      throw error;
    }
  }

  // استخراج معرف الصورة من الرابط
  static getPublicIdFromUrl(url: string): string | null {
    try {
      const match = url.match(/\/v\d+\/([^.]+)/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('❌ خطأ في استخراج معرف الصورة:', error);
      return null;
    }
  }

  // إنشاء التوقيع
  private static async generateSignature(params: Record<string, any>): Promise<string> {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    const stringToSign = sortedParams + API_SECRET;
    
    // استخدام expo-crypto للتوقيع
    const signature = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA1,
      stringToSign,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    return signature;
  }
}
