import React, { useState } from 'react';

const PostsDebugger: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testPostsAPI = async () => {
    if (!userId.trim()) return;
    
    setLoading(true);
    try {
      console.log('🧪 Testing posts API with userId:', userId);
      
      const response = await fetch(`http://localhost:3000/post/user/${userId}`);
      const data = await response.json();
      
      console.log('📝 API Response:', data);
      setResults(data);
    } catch (error) {
      console.error('❌ API Error:', error);
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  const testDebugAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/post/debug/all-authors');
      const data = await response.json();
      
      console.log('🔍 Debug API Response:', data);
      setResults(data);
    } catch (error) {
      console.error('❌ Debug API Error:', error);
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>🧪 Posts API Debugger</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="Enter userId (ID or email)"
          style={{ 
            padding: '8px 12px', 
            marginRight: '10px', 
            borderRadius: '4px', 
            border: '1px solid #ddd',
            width: '300px'
          }}
        />
        <button 
          onClick={testPostsAPI}
          disabled={loading || !userId.trim()}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Test User Posts'}
        </button>
        
        <button 
          onClick={testDebugAPI}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Loading...' : 'Show All Authors'}
        </button>
      </div>

      {results && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '4px',
          border: '1px solid #ddd',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          <h4>Results:</h4>
          <pre style={{ fontSize: '12px', whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PostsDebugger;