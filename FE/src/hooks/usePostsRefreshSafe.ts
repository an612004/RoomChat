import { useContext } from 'react';
import PostsContext from '../contexts/PostsContext';

export const usePostsRefreshSafe = () => {
  const context = useContext(PostsContext);
  
  // Nếu không có PostsProvider, trả về một object giả
  if (!context) {
    return {
      refreshTrigger: 0,
      triggerPostsRefresh: () => {}
    };
  }
  
  return context;
};

export default usePostsRefreshSafe;