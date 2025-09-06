import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useUser } from './userContext';

interface AdminContextType {
  isAdmin: boolean;
  currentSection: 'products' | 'offers' | 'orders' | 'analytics' | 'categories' | 'chats';
  setCurrentSection: (section: 'products' | 'offers' | 'orders' | 'analytics' | 'categories' | 'chats') => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [currentSection, setCurrentSection] = useState<'products' | 'offers' | 'orders' | 'analytics' | 'categories' | 'chats'>('products');

  const isAdmin = user?.role === 'admin';

  return (
    <AdminContext.Provider value={{
      isAdmin,
      currentSection,
      setCurrentSection,
    }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
