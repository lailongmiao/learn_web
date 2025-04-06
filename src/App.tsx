import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

interface User {
  id: number;
  username: string; 
  email: string;
}

interface Team {
  id: number;
  name: string;
}

function App() {
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [teamUsers, setTeamUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [teamLoading, setTeamLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [teamError, setTeamError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)

  // 获取所有用户数据
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

  // 获取所有团队数据
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:3000/api/teams')
        setTeams(response.data)
      } catch (err) {
        console.error('获取团队数据失败:', err)
      }
    }

    fetchTeams()
  }, [])

  // 获取选中团队的用户数据
  const fetchTeamUsers = async (teamId: number) => {
    try {
      setTeamLoading(true)
      setSelectedTeamId(teamId)
      setTeamError(null)
      const response = await axios.get(`http://127.0.0.1:3000/api/get_user_info/${teamId}`)
      setTeamUsers(response.data)
    } catch (err) {
      console.error(`获取团队 ${teamId} 的用户数据失败:`, err)
      setTeamError(`获取团队用户数据失败，请稍后再试`)
    } finally {
      setTeamLoading(false)
    }
  }

  return (
    <>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* 团队部分 */}
        <div className="teams-section" style={{ marginBottom: '40px' }}>
          <h2>团队列表</h2>
          <div className="teams-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
            {teams.map(team => (
              <div 
                key={team.id} 
                className={`team-card ${selectedTeamId === team.id ? 'selected' : ''}`}
                style={{ 
                  padding: '10px 20px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  cursor: 'pointer',
                  backgroundColor: selectedTeamId === team.id ? '#e6f7ff' : 'white',
                  borderColor: selectedTeamId === team.id ? '#1890ff' : '#ddd'
                }}
                onClick={() => fetchTeamUsers(team.id)}
              >
                {team.name}
              </div>
            ))}
          </div>
          
          {/* 选中团队的用户列表 */}
          {selectedTeamId && (
            <div className="team-users">
              <h3>团队 {teams.find(t => t.id === selectedTeamId)?.name} 的成员</h3>
              
              {teamLoading && <p>加载中...</p>}
              
              {teamError && <p className="error" style={{ color: 'red' }}>{teamError}</p>}
              
              {!teamLoading && !teamError && (
                teamUsers.length > 0 ? (
                  <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>ID</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>用户名</th> 
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>邮箱</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamUsers.map(user => (
                        <tr key={user.id}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>该团队没有成员</p>
                )
              )}
            </div>
          )}
        </div>
        
        {/* 所有用户列表部分 */}
        <div className="users-section">
          <h2>所有用户列表</h2>
          
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
      </div>
    </>
  )
}

export default App
