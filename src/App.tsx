import { useState, useEffect } from 'react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'
import './App.css'
import './i18n/config'

interface User {
  id: number;
  username: string; 
  email: string;
  team_id: number | null;
  group_id: number | null;
}

interface Team {
  id: number;
  name: string;
}

interface Group {
  id: number;
  name: string;
  team_id: number;
}

function App() {
  const { t, i18n } = useTranslation();
  const [teams, setTeams] = useState<Team[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [teamUsers, setTeamUsers] = useState<User[]>([])
  const [groupUsers, setGroupUsers] = useState<User[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [teamLoading, setTeamLoading] = useState<boolean>(false)
  const [groupLoading, setGroupLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [teamError, setTeamError] = useState<string | null>(null)
  const [groupError, setGroupError] = useState<string | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null)

  // 切换语言
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // 获取所有团队数据
  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true)
        const response = await axios.get('http://127.0.0.1:3000/api/teams')
        setTeams(response.data)
        setError(null)
      } catch (err) {
        console.error('获取团队数据失败:', err)
        setError(t('teams.error'))
      } finally {
        setLoading(false)
      }
    }

    fetchTeams()
  }, [t])

  // 获取选中团队的用户和组数据
  const fetchTeamData = async (teamId: number) => {
    try {
      setTeamLoading(true)
      setSelectedTeamId(teamId)
      setSelectedGroupId(null)
      setGroupUsers([])
      setTeamError(null)
      
      // 获取团队用户
      const usersResponse = await axios.get(`http://127.0.0.1:3000/api/teams/${teamId}/users`)
      setTeamUsers(usersResponse.data)
      
      // 获取团队下的组
      const groupsResponse = await axios.get(`http://127.0.0.1:3000/api/teams/${teamId}/groups`)
      setGroups(groupsResponse.data)
    } catch (err) {
      console.error(`获取团队 ${teamId} 的数据失败:`, err)
      setTeamError(t('teams.error'))
    } finally {
      setTeamLoading(false)
    }
  }

  // 获取选中组的用户数据
  const fetchGroupUsers = async (groupId: number) => {
    try {
      setGroupLoading(true)
      setSelectedGroupId(groupId)
      setGroupError(null)
      const response = await axios.get(`http://127.0.0.1:3000/api/groups/${groupId}/users`)
      setGroupUsers(response.data)
    } catch (err) {
      console.error(`获取组 ${groupId} 的用户数据失败:`, err)
      setGroupError(t('groups.error'))
    } finally {
      setGroupLoading(false)
    }
  }

  return (
    <>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* 语言切换按钮 */}
        <div style={{ textAlign: 'right', marginBottom: '20px' }}>
          <button 
            onClick={() => changeLanguage('zh')} 
            style={{ marginRight: '10px', padding: '5px 10px' }}
          >
            中文
          </button>
          <button 
            onClick={() => changeLanguage('en')} 
            style={{ padding: '5px 10px' }}
          >
            English
          </button>
        </div>

        {/* 团队部分 */}
        <div className="teams-section" style={{ marginBottom: '40px' }}>
          <h2>{t('teams.title')}</h2>
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
                onClick={() => fetchTeamData(team.id)}
              >
                {team.name}
              </div>
            ))}
          </div>
          
          {/* 选中团队的用户列表 */}
          {selectedTeamId && (
            <div className="team-users">
              <h3>{t('teams.members', { teamName: teams.find(t => t.id === selectedTeamId)?.name })}</h3>
              
              {teamLoading && <p>{t('app.loading')}</p>}
              
              {teamError && <p className="error" style={{ color: 'red' }}>{teamError}</p>}
              
              {!teamLoading && !teamError && (
                teamUsers.length > 0 ? (
                  <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.id')}</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.username')}</th> 
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.email')}</th>
                        <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.groupId')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamUsers.map(user => (
                        <tr key={user.id}>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                          <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.group_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>{t('teams.noMembers')}</p>
                )
              )}
            </div>
          )}
        </div>

        {/* 组部分 - 只在选择了团队时显示 */}
        {selectedTeamId && (
          <div className="groups-section" style={{ marginBottom: '40px' }}>
            <h2>{t('groups.title')} - {teams.find(t => t.id === selectedTeamId)?.name}</h2>
            <div className="groups-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {loading ? (
                <p>{t('app.loading')}</p>
              ) : groups.length > 0 ? (
                groups.map(group => (
                  <div 
                    key={group.id} 
                    className={`group-card ${selectedGroupId === group.id ? 'selected' : ''}`}
                    style={{ 
                      padding: '10px 20px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: selectedGroupId === group.id ? '#e6f7ff' : 'white',
                      borderColor: selectedGroupId === group.id ? '#1890ff' : '#ddd'
                    }}
                    onClick={() => fetchGroupUsers(group.id)}
                  >
                    {group.name}
                  </div>
                ))
              ) : (
                <p>{t('groups.noGroupsInTeam')}</p>
              )}
            </div>
            
            {/* 选中组的用户列表 */}
            {selectedGroupId && (
              <div className="group-users">
                <h3>{t('groups.members', { groupName: groups.find(g => g.id === selectedGroupId)?.name })}</h3>
                
                {groupLoading && <p>{t('app.loading')}</p>}
                
                {groupError && <p className="error" style={{ color: 'red' }}>{groupError}</p>}
                
                {!groupLoading && !groupError && (
                  groupUsers.length > 0 ? (
                    <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.id')}</th>
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.username')}</th> 
                          <th style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>{t('users.columns.email')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupUsers.map(user => (
                          <tr key={user.id}>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.id}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.username}</td>
                            <td style={{ border: '1px solid #ddd', padding: '8px' }}>{user.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p>{t('groups.noMembers')}</p>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export default App
