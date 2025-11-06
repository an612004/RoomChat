import React, { createContext, useContext, useState } from 'react';

interface UserSyncContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const UserSyncContext = createContext<UserSyncContextType | undefined>(undefined);

export const UserSyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <UserSyncContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </UserSyncContext.Provider>
  );
};

export const useUserSync = () => {
  const context = useContext(UserSyncContext);
  if (context === undefined) {
    throw new Error('useUserSync must be used within a UserSyncProvider');
  }
  return context;
};