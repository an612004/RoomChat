import React, { useState, useEffect } from 'react';
import Header from '../components/Header';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersResponse = await fetch('http://localhost:3000/auth/users');
      const usersData = await usersResponse.json();
      
      // Fetch login history
      const historyResponse = await fetch('http://localhost:3000/auth/login-history');
      const historyData = await historyResponse.json();
      
      if (usersData.success) {
        setUsers(usersData.users);
      }
      
      if (historyData.success) {
        setLoginHistory(historyData.loginHistory);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Firebase Data Dashboard</h1>
        
        {/* Users Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Registered Users ({users.length})
            </h2>
          </div>
          <div className="p-6">
            {users.length === 0 ? (
              <p className="text-gray-500">No users found in Firebase</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Avatar</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Provider</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr key={user.id || index} className="border-b border-gray-200">
                        <td>
                          <div className='avatar'>
                            <img 
                            src={user.avatar} 
                            alt={user.name}
                            className="w-8 h-8 rounded-full"
                          />
                          </div>
                        </td>
                        <td className="px-4 py-2 font-medium">{user.name}</td>
                        <td className="px-4 py-2 text-gray-600">{user.email}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            {user.provider}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Login History Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Login History ({loginHistory.length})
            </h2>
          </div>
          <div className="p-6">
            {loginHistory.length === 0 ? (
              <p className="text-gray-500">No login history found in Firebase</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">User ID</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Provider</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Login Time</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginHistory.map((login, index) => (
                      <tr key={login.id || index} className="border-b border-gray-200">
                        <td className="px-4 py-2 font-mono text-sm">{login.userId}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {login.provider}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-600">
                          {login.loginTime ? new Date(login.loginTime.seconds * 1000).toLocaleString() : 'N/A'}
                        </td>
                        <td className="px-4 py-2 text-gray-600">{login.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            🔄 Refresh Data
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;