import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CreateroomProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roomData: { name: string; description: string; inviteUsers?: string }) => void;
}

const Createroom: React.FC<CreateroomProps> = ({ isOpen, onClose, onSubmit }) => {
  const [roomName, setRoomName] = useState("");
  const [roomDescription, setRoomDescription] = useState("");
  const [inviteUsers, setInviteUsers] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomName.trim()) {
      onSubmit({
        name: roomName,
        description: roomDescription,
        inviteUsers: inviteUsers
      });
      
      // Reset form
      setRoomName("");
      setRoomDescription("");
      setInviteUsers("");
      onClose();
    }
  };

  const handleClose = () => {
    setRoomName("");
    setRoomDescription("");
    setInviteUsers("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-96 max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">Tạo phòng mới</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
              Tên phòng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="roomName"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Nhập tên phòng..."
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="roomDescription" className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả phòng
            </label>
            <textarea
              id="roomDescription"
              value={roomDescription}
              onChange={(e) => setRoomDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 resize-none"
              placeholder="Mô tả ngắn gọn về phòng..."
            />
          </div>

          <div className="mb-6">
            <label htmlFor="inviteUsers" className="block text-sm font-medium text-gray-700 mb-2">
              Mời bạn bè (tùy chọn)
            </label>
            <input
              type="text"
              id="inviteUsers"
              value={inviteUsers}
              onChange={(e) => setInviteUsers(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200"
              placeholder="Nhập email hoặc username..."
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors duration-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Tạo phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Createroom;
