import { useState, ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Workflow,
  LayoutDashboard,
  ListTodo,
  GitBranch,
  CheckSquare,
  Activity,
  BarChart3,
  AlertTriangle,
  Users,
  Settings,
  Menu,
  Bell,
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAppStore } from '../store/appStore';
import Button from './Button';
import Badge from './Badge';

interface LayoutProps {
  children: ReactNode;
}

interface MenuItem {
  key: string;
  label: string;
  icon: ReactNode;
  path: string;
  badge?: number;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, notifications } = useAppStore();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { key: 'tasks', label: '任务管理', icon: <ListTodo size={20} />, path: '/tasks' },
    { key: 'scheduling', label: '调度管理', icon: <GitBranch size={20} />, path: '/scheduling' },
    { key: 'approvals', label: '审批中心', icon: <CheckSquare size={20} />, path: '/approvals', badge: 3 },
    { key: 'monitoring', label: '监控中心', icon: <Activity size={20} />, path: '/monitoring' },
    { key: 'analytics', label: '分析报表', icon: <BarChart3 size={20} />, path: '/analytics' },
    { key: 'exceptions', label: '异常处理', icon: <AlertTriangle size={20} />, path: '/exceptions', badge: 5 },
    { key: 'tenants', label: '权限管理', icon: <Users size={20} />, path: '/tenants' },
    { key: 'settings', label: '系统设置', icon: <Settings size={20} />, path: '/settings' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex bg-dark-50">
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-white shadow-sidebar transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center px-4 border-b border-dark-100">
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center w-full' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <Workflow className="w-6 h-6 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-dark-900 leading-tight">任务调度</h1>
                <p className="text-xs text-dark-500">企业级平台</p>
              </div>
            )}
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.key}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`
              }
            >
              <span className="relative">
                {item.icon}
                {item.badge && !sidebarCollapsed && (
                  <span className="absolute -top-1.5 -right-1.5">
                    <Badge variant="danger">{item.badge}</Badge>
                  </span>
                )}
              </span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && sidebarCollapsed && (
                    <Badge variant="danger">{item.badge}</Badge>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <header className="h-16 bg-white border-b border-dark-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSidebar}
              icon={<Menu size={20} />}
            />
            <div>
              <h2 className="font-semibold text-dark-900">
                {menuItems.find((m) => location.pathname.startsWith(m.path))?.label || '仪表盘'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell size={20} />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full" />
              )}
            </Button>

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-50 transition-colors"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={16} className="text-primary-600" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-dark-900">{user?.username}</p>
                  <p className="text-xs text-dark-500">系统管理员</p>
                </div>
                <ChevronDown size={16} className="text-dark-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-dark-100 py-1">
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-dark-700 hover:bg-dark-50 flex items-center gap-2"
                    onClick={() => navigate('/profile')}
                  >
                    <User size={16} />
                    个人中心
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left text-sm text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    退出登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
