import React from 'react';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const Notfound: React.FC = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen text-center bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Ảnh 404 có hiệu ứng mờ dần */}
      <motion.img
        src="/404_NotFound.png"
        alt="404 Not Found"
        className="w-1/3 max-w-sm mb-8 drop-shadow-lg"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      />

      {/* Tiêu đề */}
      <motion.h1
        className="text-3xl font-bold text-gray-800 mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Oops! You’re entering a restricted area 🚫
      </motion.h1>

      {/* Mô tả */}
      <motion.p
        className="text-gray-600 text-lg mb-8 max-w-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        The page you are trying to access is not available or you don’t have permission to view it.
      </motion.p>

      {/* Nút quay lại */}
      <motion.a
        href="/"
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-md transition-all duration-300 hover:scale-105"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <Home className="w-5 h-5" />
        Go to Login
      </motion.a>
    </div>
  );
};

export default Notfound;
