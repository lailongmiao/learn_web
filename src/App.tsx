import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

interface User {
  id: number;
  username: string; 
  email: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await axios.get('http://127.0.0.1:3000/api/users')
        setUsers(response.data)
        setError(null)
      } catch (err) {
        console.error('获取用户数据失败:', err)
        setError('获取用户数据失败，请稍后再试')
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  return (
    <>
      <div className="users-container">
        <h2>用户列表</h2>
        
        {loading && <p>加载中...</p>}
        
        {error && <p className="error" style={{ color: 'red' }}>{error}</p>}
        
        {!loading && !error && (
          users.length > 0 ? (
            <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>用户名</th> 
                  <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>邮箱</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
                    <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>没有找到用户数据</p>
          )
        )}
      </div>
    </>
  )
}

export default App
