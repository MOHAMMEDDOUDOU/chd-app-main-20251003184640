import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  username: string;
  fullName: string;
  phoneNumber: string;
  profileImageUrl?: string;
  role: 'user' | 'admin';
  token?: string;
}

interface UserContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // تحميل بيانات المستخدم من التخزين المحلي عند بدء التطبيق
    loadUserFromStorage();
  }, []);

  const loadUserFromStorage = async () => {
    console.log('=== LOADING USER FROM STORAGE STARTED ===');
    try {
      // التحقق من البيانات المزيفة أولاً
      console.log('Step 1: Checking for fake data...');
      const existingUserData = await AsyncStorage.getItem('user');
      if (existingUserData) {
        const parsedExistingUser = JSON.parse(existingUserData);
        if (parsedExistingUser.username === 'testuser' || parsedExistingUser.fullName === 'مستخدم تجريبي') {
          console.log('Step 1a: Fake data detected, clearing...');
          await AsyncStorage.removeItem('user');
          console.log('Step 1b: Fake data cleared');
        } else {
          console.log('Step 1a: Valid data found, keeping...');
        }
      }
      
      console.log('Step 2: Getting user data from AsyncStorage...');
      const userData = await AsyncStorage.getItem('user');
      console.log('Step 2a: Raw user data from storage:', userData);
      
      if (userData) {
        console.log('Step 3: Parsing user data...');
        const parsedUser = JSON.parse(userData);
        console.log('Step 3a: Parsed user data:', JSON.stringify(parsedUser, null, 2));
        
        // التحقق من صحة البيانات
        console.log('Step 4: Validating user data...');
        console.log('User data fields:', {
          hasId: !!parsedUser.id,
          hasUsername: !!parsedUser.username,
          hasFullName: !!parsedUser.fullName,
          hasPhoneNumber: !!parsedUser.phoneNumber
        });
        
        // التحقق من أن البيانات ليست مزيفة
        if (parsedUser.username === 'testuser' || parsedUser.fullName === 'مستخدم تجريبي') {
          console.log('Step 4a: FAKE DATA DETECTED - Clearing...');
          await AsyncStorage.removeItem('user');
          setUser(null);
          return;
        }
        
        // إذا كانت البيانات غير مكتملة، نحاول إصلاحها بدلاً من حذفها
        if (!parsedUser.id || !parsedUser.username || !parsedUser.fullName || !parsedUser.phoneNumber) {
          console.log('Step 4b: Incomplete user data detected, attempting to fix...');
          
          // إذا كان لدينا على الأقل username، نحتفظ بالبيانات
          if (parsedUser.username) {
            console.log('Step 4c: Keeping user data with username:', parsedUser.username);
            setUser(parsedUser);
            return;
          } else {
            console.log('Step 4d: No username found, clearing invalid data...');
            await AsyncStorage.removeItem('user');
            setUser(null);
            return;
          }
        }
        
        console.log('Step 5: Setting user state...');
        setUser(parsedUser);
        console.log('Step 5a: setUser called with:', JSON.stringify(parsedUser, null, 2));
        
        // التحقق من أن البيانات تم تحديثها
        console.log('Step 6: Verifying state update...');
        setTimeout(() => {
          console.log('Step 6a: Current user state after update:', JSON.stringify(user, null, 2));
        }, 100);
      } else {
        console.log('Step 3: No user data found in storage');
        setUser(null);
      }
    } catch (error) {
      console.log('=== LOADING USER ERROR ===');
      console.error('Error loading user data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      setUser(null);
    } finally {
      console.log('Step 7: Setting isLoading to false...');
      setIsLoading(false);
      console.log('Step 7a: isLoading set to false');
      console.log('=== LOADING USER FROM STORAGE COMPLETED ===');
    }
  };

  const login = async (userData: User) => {
    console.log('=== USER CONTEXT LOGIN STARTED ===');
    console.log('Input userData:', JSON.stringify(userData, null, 2));
    
    try {
      console.log('Step 1: Converting userData to JSON...');
      const userDataJson = JSON.stringify(userData);
      console.log('Step 1a: JSON string:', userDataJson);
      
      console.log('Step 2: Saving to AsyncStorage...');
      await AsyncStorage.setItem('user', userDataJson);
      console.log('Step 2a: AsyncStorage.setItem completed');
      
      // التحقق من صحة البيانات قبل الحفظ
      console.log('Step 3: Validating user data before saving...');
      console.log('User data fields:', {
        hasId: !!userData.id,
        hasUsername: !!userData.username,
        hasFullName: !!userData.fullName,
        hasPhoneNumber: !!userData.phoneNumber
      });
      
      // التحقق من أن البيانات ليست مزيفة
      if (userData.username === 'testuser' || userData.fullName === 'مستخدم تجريبي') {
        console.log('Step 3a: FAKE DATA DETECTED - Aborting login...');
        throw new Error('بيانات المستخدم غير صحيحة');
      }
      
      // التحقق من الحقول الأساسية فقط
      if (!userData.username) {
        console.log('Step 3b: Missing username, aborting login...');
        throw new Error('اسم المستخدم مطلوب');
      }
      
      console.log('Step 4: Updating React state...');
      setUser(userData);
      console.log('Step 4a: setUser called with:', JSON.stringify(userData, null, 2));
      
      // التحقق من أن البيانات تم حفظها
      console.log('Step 5: Verifying saved data...');
      const savedData = await AsyncStorage.getItem('user');
      console.log('Step 5a: Retrieved from AsyncStorage:', savedData);
      
      // إعادة تحميل البيانات للتأكد من التحديث
      console.log('Step 6: Reloading user data to ensure consistency...');
      await loadUserFromStorage();
      
      // التحقق النهائي من البيانات
      console.log('Step 7: Final verification of user data...');
      const finalUserData = await AsyncStorage.getItem('user');
      console.log('Step 7a: Final user data from storage:', finalUserData);
      console.log('Step 7b: Current user state:', JSON.stringify(user, null, 2));
      
      console.log('=== USER CONTEXT LOGIN COMPLETED ===');
    } catch (error) {
      console.log('=== USER CONTEXT LOGIN ERROR ===');
      console.error('Error saving user data:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      console.log('=== USER CONTEXT LOGIN ERROR END ===');
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Error removing user data:', error);
    }
  };

  console.log('=== USER CONTEXT RENDER ===');
  console.log('Current user state:', JSON.stringify(user, null, 2));
  console.log('Current isLoading state:', isLoading);
  
  // إضافة useEffect لمراقبة تغييرات المستخدم
  React.useEffect(() => {
    console.log('=== USER CONTEXT - USER STATE CHANGED ===');
    console.log('New user state:', JSON.stringify(user, null, 2));
  }, [user]);
  
  return (
    <UserContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
