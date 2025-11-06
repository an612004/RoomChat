import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import useAuth from '../hooks/useAuth';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
  joinPost: (postId: string) => void;
  leavePost: (postId: string) => void;
  joinChatRoom: (roomId: string) => void;
  leaveChatRoom: (roomId: string) => void;
  sendMessage: (roomId: string, message: string) => void;
  onProfileUpdate: (callback: (data: { userId: string; name?: string; avatar?: string }) => void) => void;
  offProfileUpdate: (callback: (data: { userId: string; name?: string; avatar?: string }) => void) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
  joinPost: () => {},
  leavePost: () => {},
  joinChatRoom: () => {},
  leaveChatRoom: () => {},
  sendMessage: () => {},
  onProfileUpdate: () => {},
  offProfileUpdate: () => {},
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    try {
      // Initialize socket connection
      const newSocket = io('http://localhost:3000', {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Connected to Socket.IO server:', newSocket.id);
      setIsConnected(true);
      
      // Authenticate user
      newSocket.emit('authenticate', user.email || user.id);
      newSocket.emit('join_user_room', user.email || user.id);
      newSocket.emit('set_online_status', 'online');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from Socket.IO server:', reason);
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      setIsConnected(false);
    });

    // Online status events
    newSocket.on('user_online', (data) => {
      setOnlineUsers(prev => {
        if (data.status === 'online' && !prev.includes(data.userId)) {
          return [...prev, data.userId];
        } else if (data.status === 'offline') {
          return prev.filter(id => id !== data.userId);
        }
        return prev;
      });
    });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        if (newSocket) {
          newSocket.emit('set_online_status', 'offline');
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('❌ Error initializing Socket.IO:', error);
      setIsConnected(false);
    }
  }, [user]);

  // Helper functions
  const joinPost = (postId: string) => {
    if (socket && isConnected) {
      socket.emit('join_post', postId);
      console.log(`📝 Joined post: ${postId}`);
    }
  };

  const leavePost = (postId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_post', postId);
      console.log(`📝 Left post: ${postId}`);
    }
  };

  const joinChatRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('join_chat_room', roomId);
      console.log(`💬 Joined chat room: ${roomId}`);
    }
  };

  const leaveChatRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_chat_room', roomId);
      console.log(`💬 Left chat room: ${roomId}`);
    }
  };

  const sendMessage = (roomId: string, message: string) => {
    if (socket && isConnected && user) {
      socket.emit('send_message', {
        roomId,
        message,
        userId: user.email || user.id
      });
    }
  };

  // Profile update event handlers
  const onProfileUpdate = (callback: (data: { userId: string; name?: string; avatar?: string }) => void) => {
    if (socket) {
      socket.on('profile_updated', callback);
    }
  };

  const offProfileUpdate = (callback: (data: { userId: string; name?: string; avatar?: string }) => void) => {
    if (socket) {
      socket.off('profile_updated', callback);
    }
  };

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    joinPost,
    leavePost,
    joinChatRoom,
    leaveChatRoom,
    sendMessage,
    onProfileUpdate,
    offProfileUpdate,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;