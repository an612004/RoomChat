import React, { createContext, useContext, useState, useCallback } from 'react';

interface PostsContextType {
  refreshTrigger: number;
  triggerPostsRefresh: () => void;
}

const PostsContext = createContext<PostsContextType | undefined>(undefined);

export const PostsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerPostsRefresh = useCallback(() => {
    console.log('🔄 PostsContext: Triggering refresh, current:', refreshTrigger);
    setRefreshTrigger(prev => {
      console.log('🔄 PostsContext: New refresh trigger:', prev + 1);
      return prev + 1;
    });
  }, [refreshTrigger]);

  return (
    <PostsContext.Provider value={{ refreshTrigger, triggerPostsRefresh }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePostsRefresh = () => {
  const context = useContext(PostsContext);
  if (context === undefined) {
    throw new Error('usePostsRefresh must be used within a PostsProvider');
  }
  return context;
};

export default PostsContext;