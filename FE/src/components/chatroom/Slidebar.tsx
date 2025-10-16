import { useState } from "react";
import {
  Plus,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Users,
  LogOut,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import Createroom from "./Createroom";

export default function LeftSidebar() {
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [activeRoom, setActiveRoom] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(true); // Test: modal should appear immediately
  const { user } = useAuth();
  const navigate = useNavigate();

  const chatRooms = [
    { id: 1, name: "General Chat", members: 128, unread: 0 },
    { id: 2, name: "IELTS Practice", members: 45, unread: 0 },
    { id: 3, name: "Tech Talk", members: 156, unread: 12 },
    { id: 4, name: "Random Fun", members: 203, unread: 0 },
    { id: 5, name: "Study Corner", members: 67, unread: 5 },
  ];

  const handleCreateRoom = () => {
    console.log("Create room button clicked!"); 
    setShowCreateForm(true);
  };

  const handleSubmitRoom = (roomData: { name: string; description: string; inviteUsers?: string }) => {
    // TODO: Add actual room creation logic here
    console.log("Creating room:", roomData);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  return (
    <div className="relative flex-shrink-0">
      {/* Nút mở lại sidebar khi bị đóng */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="absolute top-1/2 left-0 -translate-y-1/2 z-50 
                   bg-gradient-to-r from-purple-500 to-pink-500 
                   hover:from-purple-400 hover:to-pink-400 
                   text-white p-3 rounded-r-xl shadow-lg border border-purple-300
                   transition-all duration-300 hover:scale-105 hover:shadow-purple-300/30"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`h-screen sidebar-gradient 
                    text-gray-700 border-r border-purple-200 shadow-xl
                    transition-all duration-300 ease-in-out
                    ${!open ? "w-0 overflow-hidden" : collapsed ? "w-16" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-purple-200 
                         header-gradient">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center shadow-md transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fdf4ff 100%)', border: '1px solid #e879f9' }}
                >
                </div>
                {/* <div 
                  className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border animate-pulse"
                  style={{ backgroundColor: '#22c55e', borderColor: '#ffffff' }}
                ></div> */}
              </div>
              {!collapsed && (
                <div>
                  <h2 className="font-bold text-sm text-white drop-shadow-sm">
                    Chat Room
                  </h2>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!collapsed ? (
                <button
                  onClick={() => setCollapsed(true)}
              
                  title="Thu gọn"
                >
                  <ChevronLeft size={14} />
                </button>
              ) : (
                <button
                  onClick={() => setCollapsed(false)}
                  
                  title="Mở rộng"
                >
                  <Menu size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Nút tạo phòng */}
          <div className="p-3 border-b border-purple-200">
            <button
              onClick={handleCreateRoom}
              className={`group relative ${
                collapsed 
                  ? "w-10 h-10 rounded-lg flex items-center justify-center mx-auto" 
                  : "w-full py-2.5 px-3 rounded-lg"
              } button-gradient hover:opacity-90
              text-white font-medium shadow-md
              transition-all duration-300 hover:scale-[1.02]`}
              title={collapsed ? "Tạo phòng mới" : undefined}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Plus
                  size={16}
                  className="group-hover:rotate-90 transition-transform duration-300"
                  style={{ color: 'white' }}
                />
                {!collapsed && (
                  <span className="text-xs font-semibold" style={{ color: 'white' }}>Tạo phòng</span>
                )}
              </div>
            </button>
          </div>

          {/* Danh sách phòng */}
          <div className="flex-1 p-2.5 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 
                         scrollbar-track-transparent">
            {!collapsed && (
              <div className="flex items-center justify-between mb-3">
                {/* <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
                  Kênh
                </h3>
                <div className="px-1.5 py-0.5 bg-purple-100 rounded-md">
                  <span className="text-xs font-bold text-purple-700">{chatRooms.length}</span>
                </div> */}
              </div>
            )}
            
            <div className={`${collapsed ? "flex flex-col items-center gap-2" : "space-y-1.5"}`}>
              {chatRooms.map((room, index) => {
                const isActive = activeRoom === room.id;
                
                return (
                  <button
                    key={room.id}
                    onClick={() => setActiveRoom(room.id)}
                    className={`group relative transition-all duration-300 
                      ${collapsed 
                        ? "w-10 h-10 rounded-lg flex items-center justify-center" 
                        : "w-full p-2.5 rounded-lg text-left"
                      }
                      ${isActive
                        ? "room-active"
                        : "bg-white room-hover border border-purple-200 shadow-sm"
                      }`}
                    title={collapsed ? room.name : undefined}
                  >
                    <div className={`${collapsed ? "" : "flex items-center gap-2.5"}`}>
                      <div className="relative">
                        <div 
                          className="w-7 h-7 flex items-center justify-center rounded-lg shadow-sm
                                     transition-all duration-300 border"
                          style={{
                            backgroundColor: isActive ? 
                              (['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'][index]) :
                              '#f3f4f6',
                            color: isActive ? 'white' : '#6b7280',
                            borderColor: isActive ? 
                              (['#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4', '#10b981'][index]) :
                              '#e5e7eb'
                          }}
                        >
                          <span className="text-xs font-bold">{room.id}</span>
                        </div>
                        
                        {/* Unread badge */}
                        {room.unread > 0 && (
                          <div 
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 text-xs font-bold rounded-full flex items-center justify-center shadow-sm"
                            style={{ backgroundColor: '#ef4444', color: 'white' }}
                          >
                            {room.unread > 9 ? '9+' : room.unread}
                          </div>
                        )}
                      </div>

                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <h4 className={`font-medium text-sm truncate
                                          ${isActive ? "text-white" : "text-gray-700"}`}>
                              {room.name}
                            </h4>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                              <span style={{ color: '#6b7280' }}>Online</span>
                            </div>
                            
                            <div className="flex items-center gap-1 text-gray-500">
                              <Users size={11} />
                              <span className="font-medium">{room.members}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer - User Profile */}
          <div className="mt-auto p-3 border-t border-purple-200 bg-purple-50">
            {!collapsed ? (
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={user?.avatar }
                    alt="User Avatar"
                    className="avatar-small"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border" 
                       style={{ backgroundColor: '#22c55e', borderColor: '#ffffff' }}></div>
                </div>

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate block">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs flex items-center gap-1" style={{ color: '#22c55e' }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#22c55e' }}></div>
                    Online
                  </span>
                </div>

                <button
                  onClick={() => navigate("/home")}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-100
                           transition-all duration-300 hover:scale-105 border border-transparent hover:border-red-200"
                  title="Đăng xuất"
                >
                  <LogOut size={14} />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={user?.avatar || "/default-avatar.png"}
                    alt="User Avatar"
                    className="w-5 h-5 rounded-full object-cover border border-purple-300 shadow-sm"
                    title={user?.name || "User"}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border"
                       style={{ backgroundColor: '#22c55e', borderColor: '#ffffff' }}></div>
                </div>
                
                <button
                  onClick={() => navigate("/home")}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-100
                           transition-all duration-300 hover:scale-105 border border-transparent hover:border-red-200"
                  title="Đăng xuất"
                >
                  <LogOut size={13} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Room Modal */}
      <Createroom
        isOpen={showCreateForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitRoom}
      />
    </div>
  );
}
