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
  password: string;
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

interface LoginForm {
  username: string;
  password: string;
}

interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
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
  
  // 登录相关状态
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [showLogin, setShowLogin] = useState<boolean>(true) // true显示登录表单，false显示注册表单
  const [loginForm, setLoginForm] = useState<LoginForm>({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState<RegisterForm>({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  })
  const [authError, setAuthError] = useState<string | null>(null)

  // 切换语言
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // 处理登录表单变化
  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理注册表单变化
  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 提交登录表单
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      const response = await axios.post('http://127.0.0.1:3000/api/login', {
        username: loginForm.username,
        password: loginForm.password
      });
      
      setCurrentUser(response.data);
      setIsLoggedIn(true);
      // 清空表单
      setLoginForm({ username: '', password: '' });
      
      // 登录成功后加载团队数据
      fetchTeams();
    } catch (err: any) {
      console.error('登录失败:', err);
      // 根据服务器返回的错误信息设置合适的错误提示
      if (err.response) {
        const errorMessage = err.response.data;
        if (errorMessage.includes('用户不存在')) {
          setAuthError(t('auth.userNotFound'));
        } else if (errorMessage.includes('密码错误')) {
          setAuthError(t('auth.invalidPassword'));
        } else {
          setAuthError(t('auth.loginError'));
        }
      } else {
        setAuthError(t('auth.loginError'));
      }
    }
  };

  // 提交注册表单
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证密码
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError(t('auth.passwordMismatch'));
      return;
    }
    
    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerForm.email)) {
      setAuthError(t('auth.emailInvalid'));
      return;
    }
    
    // 验证用户名不为空
    if (!registerForm.username.trim()) {
      setAuthError(t('auth.usernameRequired'));
      return;
    }
    
    // 验证密码长度
    if (registerForm.password.length < 6) {
      setAuthError(t('auth.passwordTooShort'));
      return;
    }
    
    try {
      setAuthError(null);
      await axios.post('http://127.0.0.1:3000/api/register', {
        username: registerForm.username,
        email: registerForm.email,
        password: registerForm.password
      });
      
      // 注册成功，显示成功信息并跳转到登录页
      setAuthError(null);
      // 清空表单
      setRegisterForm({ username: '', email: '', password: '', confirmPassword: '' });
      
      // 显示注册成功信息
      alert(t('auth.registerSuccess'));
      
      // 转到登录页面
      setShowLogin(true);
    } catch (err: any) {
      console.error('注册失败:', err);
      
      // 解析后端返回的错误信息
      if (err.response) {
        const errorMessage = err.response.data;
        
        if (errorMessage.includes('验证错误')) {
          if (errorMessage.includes('email')) {
            setAuthError(t('auth.emailInvalid'));
          } else if (errorMessage.includes('username')) {
            setAuthError(t('auth.usernameRequired'));
          } else if (errorMessage.includes('password')) {
            setAuthError(t('auth.passwordTooShort'));
          } else {
            setAuthError(t('auth.validationError'));
          }
        } else if (errorMessage.includes('duplicate key')) {
          if (errorMessage.includes('username')) {
            setAuthError(t('auth.usernameTaken'));
          } else if (errorMessage.includes('email')) {
            setAuthError(t('auth.emailTaken'));
          } else {
            setAuthError(t('auth.registerError'));
          }
        } else {
          setAuthError(t('auth.registerError'));
        }
      } else {
        setAuthError(t('auth.registerError'));
      }
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedTeamId(null);
    setSelectedGroupId(null);
    setTeams([]);
    setGroups([]);
    setTeamUsers([]);
    setGroupUsers([]);
  };

  // 获取所有团队数据
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

  // 渲染登录表单
  const renderLoginForm = () => (
    <div className="login-form" style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <h2>{t('auth.login')}</h2>
      {authError && <p style={{ color: 'red' }}>{authError}</p>}
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.username')}</label>
          <input 
            type="text" 
            name="username" 
            value={loginForm.username} 
            onChange={handleLoginChange} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
      <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.password')}</label>
          <input 
            type="password" 
            name="password" 
            value={loginForm.password} 
            onChange={handleLoginChange} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
      </div>
        <button 
          type="submit" 
          style={{ 
            padding: '10px', 
            backgroundColor: '#1890ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          {t('auth.loginButton')}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        {t('auth.noAccount')} 
        <button 
          onClick={() => { setShowLogin(false); setAuthError(null); }} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#1890ff', 
            cursor: 'pointer', 
            textDecoration: 'underline'
          }}
        >
          {t('auth.register')}
        </button>
        </p>
      </div>
  );

  // 渲染注册表单
  const renderRegisterForm = () => (
    <div className="register-form" style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <h2>{t('auth.register')}</h2>
      {authError && <p style={{ color: 'red' }}>{authError}</p>}
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.username')}</label>
          <input 
            type="text" 
            name="username" 
            value={registerForm.username} 
            onChange={handleRegisterChange} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.email')}</label>
          <input 
            type="email" 
            name="email" 
            value={registerForm.email} 
            onChange={handleRegisterChange} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.password')}</label>
          <input 
            type="password" 
            name="password" 
            value={registerForm.password} 
            onChange={handleRegisterChange} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '5px' }}>{t('auth.confirmPassword')}</label>
          <input 
            type="password" 
            name="confirmPassword" 
            value={registerForm.confirmPassword} 
            onChange={handleRegisterChange} 
            required 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            padding: '10px', 
            backgroundColor: '#1890ff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer'
          }}
        >
          {t('auth.registerButton')}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        {t('auth.haveAccount')} 
        <button 
          onClick={() => { setShowLogin(true); setAuthError(null); }} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#1890ff', 
            cursor: 'pointer', 
            textDecoration: 'underline'
          }}
        >
          {t('auth.login')}
        </button>
      </p>
    </div>
  );

  // 渲染用户已登录后的内容
  const renderLoggedInContent = () => (
    <>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        {/* 顶部栏 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px',
          padding: '10px',
          borderBottom: '1px solid #ddd'
        }}>
          <h1>{t('app.title')}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* 显示当前用户信息 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px' }}>{t('auth.welcome')}, {currentUser?.username}</span>
              <button onClick={handleLogout} style={{ padding: '5px 10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                {t('auth.logout')}
              </button>
            </div>
            
            {/* 语言切换按钮 */}
            <div>
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
          </div>
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
  );

  return (
    <>
      {isLoggedIn ? renderLoggedInContent() : (showLogin ? renderLoginForm() : renderRegisterForm())}
    </>
  )
}

export default App
