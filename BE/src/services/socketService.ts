import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

// Define socket event types
interface ServerToClientEvents {
  // Comments
  new_comment: (data: any) => void;
  comment_reaction: (data: any) => void;
  comment_deleted: (data: { postId: string; commentId: string }) => void;

  // Posts
  new_post: (post: any) => void;
  post_updated: (data: any) => void;
  post_liked: (data: { postId: string; userId: string; liked: boolean }) => void;

  // Chat
  new_message: (message: any) => void;
  user_joined: (data: { roomId: string; user: any }) => void;
  user_left: (data: { roomId: string; userId: string }) => void;

  // Notifications
  notification: (notification: any) => void;

  // Online status
  user_online: (data: { userId: string; status: 'online' | 'offline' }) => void;

  // Profile updates
  profile_updated: (data: { userId: string; name?: string; avatar?: string }) => void;
}

interface ClientToServerEvents {
  // Room management
  join_post: (postId: string) => void;
  leave_post: (postId: string) => void;
  join_chat_room: (roomId: string) => void;
  leave_chat_room: (roomId: string) => void;
  join_user_room: (userId: string) => void;

  // Chat
  send_message: (data: { roomId: string; message: string; userId: string }) => void;

  // User status
  set_online_status: (status: 'online' | 'offline') => void;
}

interface InterServerEvents {
  // For scaling with multiple servers
  ping: () => void;
}

interface SocketData {
  userId?: string;
  currentPost?: string;
  chatRooms?: Set<string>;
}

class SocketService {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null = null;
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private onlineUsers: Set<string> = new Set();

  initialize(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      },
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupEventHandlers();
    console.log('✅ Socket.IO initialized successfully');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', (socket: Socket) => {
      console.log('🔌 New socket connection:', socket.id);

      // Authentication - should be called first by client
      socket.on('authenticate', (userId: string) => {
        socket.data.userId = userId;
        this.addUserConnection(userId, socket.id);
        this.setUserOnline(userId);
        console.log(`👤 User ${userId} authenticated with socket ${socket.id}`);
      });

      // Post-related events
      socket.on('join_post', (postId: string) => {
        socket.join(`post_${postId}`);
        socket.data.currentPost = postId;
        console.log(`📝 Socket ${socket.id} joined post_${postId}`);
      });

      socket.on('leave_post', (postId: string) => {
        socket.leave(`post_${postId}`);
        if (socket.data.currentPost === postId) {
          socket.data.currentPost = undefined;
        }
        console.log(`📝 Socket ${socket.id} left post_${postId}`);
      });

      // Chat-related events
      socket.on('join_chat_room', (roomId: string) => {
        socket.join(`chat_${roomId}`);
        if (!socket.data.chatRooms) {
          socket.data.chatRooms = new Set();
        }
        socket.data.chatRooms.add(roomId);
        
        // Notify others in the room
        socket.to(`chat_${roomId}`).emit('user_joined', {
          roomId,
          user: { id: socket.data.userId }
        });
        
        console.log(`💬 Socket ${socket.id} joined chat_${roomId}`);
      });

      socket.on('leave_chat_room', (roomId: string) => {
        socket.leave(`chat_${roomId}`);
        socket.data.chatRooms?.delete(roomId);
        
        // Notify others in the room
        socket.to(`chat_${roomId}`).emit('user_left', {
          roomId,
          userId: socket.data.userId || ''
        });
        
        console.log(`💬 Socket ${socket.id} left chat_${roomId}`);
      });

      socket.on('send_message', (data) => {
        // Broadcast message to all users in the chat room
        socket.to(`chat_${data.roomId}`).emit('new_message', {
          id: Date.now().toString(),
          content: data.message,
          userId: data.userId,
          roomId: data.roomId,
          timestamp: new Date().toISOString()
        });
      });

      // User room for personal notifications
      socket.on('join_user_room', (userId: string) => {
        socket.join(`user_${userId}`);
        console.log(`👤 Socket ${socket.id} joined user_${userId}`);
      });

      // Online status
      socket.on('set_online_status', (status) => {
        if (socket.data.userId) {
          if (status === 'online') {
            this.setUserOnline(socket.data.userId);
          } else {
            this.setUserOffline(socket.data.userId);
          }
        }
      });

      // Disconnect handler
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Socket ${socket.id} disconnected: ${reason}`);
        
        if (socket.data.userId) {
          this.removeUserConnection(socket.data.userId, socket.id);
          
          // If user has no more connections, set offline
          if (!this.userConnections.has(socket.data.userId) || 
              this.userConnections.get(socket.data.userId)?.size === 0) {
            this.setUserOffline(socket.data.userId);
          }
        }
      });
    });
  }

  // Public methods for emitting events
  emitToPost(postId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.to(`post_${postId}`).emit(event, data);
  }

  emitToChatRoom(roomId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.to(`chat_${roomId}`).emit(event, data);
  }

  emitToUser(userId: string, event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.to(`user_${userId}`).emit(event, data);
  }

  emitToAll(event: keyof ServerToClientEvents, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  // Broadcast profile update to all connected clients
  broadcastProfileUpdate(userId: string, updateData: { name?: string; avatar?: string }) {
    if (!this.io) return;
    console.log(`🔄 Broadcasting profile update for ${userId}:`, updateData);
    this.io.emit('profile_updated', {
      userId,
      ...updateData
    });
  }

  // User connection management
  private addUserConnection(userId: string, socketId: string) {
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)!.add(socketId);
  }

  private removeUserConnection(userId: string, socketId: string) {
    const connections = this.userConnections.get(userId);
    if (connections) {
      connections.delete(socketId);
      if (connections.size === 0) {
        this.userConnections.delete(userId);
      }
    }
  }

  private setUserOnline(userId: string) {
    if (!this.onlineUsers.has(userId)) {
      this.onlineUsers.add(userId);
      this.emitToAll('user_online', { userId, status: 'online' });
    }
  }

  private setUserOffline(userId: string) {
    if (this.onlineUsers.has(userId)) {
      this.onlineUsers.delete(userId);
      this.emitToAll('user_online', { userId, status: 'offline' });
    }
  }

  // Utility methods
  getOnlineUsers(): string[] {
    return Array.from(this.onlineUsers);
  }

  getUserConnections(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  // Get singleton instance
  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  private static instance: SocketService;
}

// Export singleton instance
export default SocketService.getInstance();