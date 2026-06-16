import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Building2,
  FolderKanban,
  Plus,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  Mail,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from 'lucide-react';
import type { User, Role, Department, Project } from '../../shared/types';
import {
  getUsers,
  getRoles,
  getDepartments,
  getProjects,
} from '../services/tenants';
import Card from '../components/Card';
import Table from '../components/Table';
import Tabs from '../components/Tabs';
import Pagination from '../components/Pagination';
import Button from '../components/Button';
import Badge from '../components/Badge';
import StatusBadge from '../components/StatusBadge';
import { formatDate } from '../lib/utils';

export default function Tenants() {
  const [activeTab, setActiveTab] = useState('users');

  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(10);
  const [usersTotal, setUsersTotal] = useState(0);

  const [roles, setRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsPage, setProjectsPage] = useState(1);
  const [projectsPageSize, setProjectsPageSize] = useState(10);
  const [projectsTotal, setProjectsTotal] = useState(0);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await getUsers({ page: usersPage, pageSize: usersPageSize });
      if (response.code === 200) {
        setUsers(response.data.list);
        setUsersTotal(response.data.total);
      } else {
        showToast('error', response.message || '获取用户列表失败');
      }
    } catch (error) {
      showToast('error', '获取用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const response = await getRoles();
      if (response.code === 200) {
        setRoles(response.data);
      } else {
        showToast('error', response.message || '获取角色列表失败');
      }
    } catch (error) {
      showToast('error', '获取角色列表失败');
    } finally {
      setRolesLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const response = await getDepartments();
      if (response.code === 200) {
        setDepartments(response.data);
      } else {
        showToast('error', response.message || '获取部门列表失败');
      }
    } catch (error) {
      showToast('error', '获取部门列表失败');
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const fetchProjects = async () => {
    setProjectsLoading(true);
    try {
      const response = await getProjects({ page: projectsPage, pageSize: projectsPageSize });
      if (response.code === 200) {
        setProjects(response.data.list);
        setProjectsTotal(response.data.total);
      } else {
        showToast('error', response.message || '获取项目列表失败');
      }
    } catch (error) {
      showToast('error', '获取项目列表失败');
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'roles') {
      fetchRoles();
    } else if (activeTab === 'departments') {
      fetchDepartments();
    } else if (activeTab === 'projects') {
      fetchProjects();
    }
  }, [activeTab, usersPage, usersPageSize, projectsPage, projectsPageSize]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleDeptExpand = (id: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedDepts(newExpanded);
  };

  const getDepartmentName = (id: string): string => {
    const findDept = (depts: Department[]): string | null => {
      for (const dept of depts) {
        if (dept.id === id) return dept.name;
        if (dept.children) {
          const found = findDept(dept.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findDept(departments) || '-';
  };

  const getRoleNames = (roleIds: string[]): string => {
    return roleIds
      .map((id) => roles.find((r) => r.id === id)?.name || id)
      .join(', ');
  };

  const renderDepartmentTree = (depts: Department[], level: number = 0) => {
    return depts.map((dept) => (
      <div key={dept.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 hover:bg-dark-50 rounded-lg cursor-pointer ${
            level > 0 ? 'ml-6' : ''
          }`}
          onClick={() => dept.children && dept.children.length > 0 && toggleDeptExpand(dept.id)}
        >
          {dept.children && dept.children.length > 0 ? (
            expandedDepts.has(dept.id) ? (
              <ChevronDown size={16} className="text-dark-400" />
            ) : (
              <ChevronRight size={16} className="text-dark-400" />
            )
          ) : (
            <div className="w-4" />
          )}
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 size={16} className="text-primary-600" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-dark-900">{dept.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" icon={<Edit size={14} />} title="编辑" />
            <Button variant="ghost" size="sm" icon={<Trash2 size={14} className="text-danger-600" />} title="删除" />
          </div>
        </div>
        {dept.children && dept.children.length > 0 && expandedDepts.has(dept.id) && (
          <div>{renderDepartmentTree(dept.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const userColumns = [
    {
      key: 'username',
      title: '用户名',
      dataIndex: 'username' as keyof User,
      render: (record: User) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
            <UserIcon size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.username}</p>
            <p className="text-xs text-dark-500 flex items-center gap-1">
              <Mail size={12} />
              {record.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      title: '邮箱',
      dataIndex: 'email' as keyof User,
      render: (record: User) => <span className="text-dark-600">{record.email}</span>,
    },
    {
      key: 'departmentId',
      title: '部门',
      dataIndex: 'departmentId' as keyof User,
      render: (record: User) => (
        <span className="text-dark-700">{getDepartmentName(record.departmentId)}</span>
      ),
    },
    {
      key: 'roleIds',
      title: '角色',
      dataIndex: 'roleIds' as keyof User,
      render: (record: User) => (
        <div className="flex flex-wrap gap-1">
          {record.roleIds.slice(0, 2).map((roleId) => (
            <Badge key={roleId} variant="info" size="sm">
              {roles.find((r) => r.id === roleId)?.name || roleId}
            </Badge>
          ))}
          {record.roleIds.length > 2 && (
            <Badge variant="default" size="sm">
              +{record.roleIds.length - 2}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      dataIndex: 'status' as keyof User,
      render: (record: User) => <StatusBadge status={record.status} />,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt' as keyof User,
      render: (record: User) => (
        <span className="text-dark-600">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      align: 'right' as const,
      render: (record: User) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" icon={<Eye size={16} />} title="查看" />
          <Button variant="ghost" size="sm" icon={<Edit size={16} />} title="编辑" />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={16} className="text-danger-600" />}
            title="删除"
          />
        </div>
      ),
    },
  ];

  const roleColumns = [
    {
      key: 'name',
      title: '角色名称',
      dataIndex: 'name' as keyof Role,
      render: (record: Role) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
            <Shield size={16} className="text-warning-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.name}</p>
            <p className="text-xs text-dark-500">{record.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'description',
      title: '描述',
      dataIndex: 'code' as keyof Role,
      render: (record: Role) => (
        <span className="text-dark-600">
          {record.code === 'admin'
            ? '系统管理员，拥有所有权限'
            : record.code === 'user'
              ? '普通用户，拥有基础操作权限'
              : record.code === 'viewer'
                ? '只读用户，仅可查看数据'
                : '-'}
        </span>
      ),
    },
    {
      key: 'permissions',
      title: '权限数量',
      dataIndex: 'permissions' as keyof Role,
      render: (record: Role) => (
        <Badge variant="primary">{record.permissions?.length || 0} 个权限</Badge>
      ),
    },
    {
      key: 'userCount',
      title: '用户数量',
      render: (record: Role) => {
        const count = users.filter((u) => u.roleIds.includes(record.id)).length;
        return <Badge variant="info">{count} 个用户</Badge>;
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      align: 'right' as const,
      render: (record: Role) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" icon={<Eye size={16} />} title="查看权限" />
          <Button variant="ghost" size="sm" icon={<Edit size={16} />} title="编辑" />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={16} className="text-danger-600" />}
            title="删除"
          />
        </div>
      ),
    },
  ];

  const projectColumns = [
    {
      key: 'name',
      title: '项目名称',
      dataIndex: 'name' as keyof Project,
      render: (record: Project) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-info-100 rounded-lg flex items-center justify-center">
            <FolderKanban size={16} className="text-info-600" />
          </div>
          <div>
            <p className="font-medium text-dark-900">{record.name}</p>
            <p className="text-xs text-dark-500 truncate max-w-xs">{record.description}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'ownerId',
      title: '负责人',
      dataIndex: 'ownerId' as keyof Project,
      render: (record: Project) => {
        const owner = users.find((u) => u.id === record.ownerId);
        return (
          <span className="text-dark-700">{owner?.username || record.ownerId || '-'}</span>
        );
      },
    },
    {
      key: 'memberCount',
      title: '成员数',
      render: () => <Badge variant="info">{Math.floor(Math.random() * 20) + 1} 人</Badge>,
    },
    {
      key: 'createdAt',
      title: '创建时间',
      dataIndex: 'createdAt' as keyof Project,
      render: (record: Project) => (
        <span className="text-dark-600">{formatDate(record.createdAt)}</span>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: () => <StatusBadge status="active" />,
    },
    {
      key: 'actions',
      title: '操作',
      width: '150px',
      align: 'right' as const,
      render: (record: Project) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" icon={<Eye size={16} />} title="查看" />
          <Button variant="ghost" size="sm" icon={<Edit size={16} />} title="编辑" />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 size={16} className="text-danger-600" />}
            title="删除"
          />
        </div>
      ),
    },
  ];

  const tabItems = [
    { key: 'users', label: '用户管理', icon: <Users size={16} /> },
    { key: 'roles', label: '角色管理', icon: <Shield size={16} /> },
    { key: 'departments', label: '部门管理', icon: <Building2 size={16} /> },
    { key: 'projects', label: '项目管理', icon: <FolderKanban size={16} /> },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${
            toast.type === 'success'
              ? 'bg-success-500 text-white'
              : 'bg-danger-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <Card
        title={
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-dark-900">权限管理</h1>
            {activeTab === 'users' && usersTotal > 0 && (
              <Badge variant="info">{usersTotal} 个用户</Badge>
            )}
            {activeTab === 'roles' && roles.length > 0 && (
              <Badge variant="info">{roles.length} 个角色</Badge>
            )}
            {activeTab === 'projects' && projectsTotal > 0 && (
              <Badge variant="info">{projectsTotal} 个项目</Badge>
            )}
          </div>
        }
        actions={
          <Button icon={<Plus size={18} />}>
            {activeTab === 'users' && '添加用户'}
            {activeTab === 'roles' && '添加角色'}
            {activeTab === 'departments' && '添加部门'}
            {activeTab === 'projects' && '添加项目'}
          </Button>
        }
      >
        <Tabs items={tabItems} activeKey={activeTab} onChange={setActiveTab}>
          {activeTab === 'users' && (
            <div>
              <Table
                columns={userColumns}
                data={users}
                loading={usersLoading}
                rowKey="id"
              />
              {usersTotal > 0 && (
                <div className="mt-4">
                  <Pagination
                    current={usersPage}
                    pageSize={usersPageSize}
                    total={usersTotal}
                    onChange={(newPage, newPageSize) => {
                      setUsersPage(newPage);
                      setUsersPageSize(newPageSize);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'roles' && (
            <Table
              columns={roleColumns}
              data={roles}
              loading={rolesLoading}
              rowKey="id"
            />
          )}

          {activeTab === 'departments' && (
            <div className="space-y-2">
              {departmentsLoading ? (
                <div className="py-12 text-center text-dark-500">加载中...</div>
              ) : departments.length === 0 ? (
                <div className="py-12 text-center text-dark-500">暂无部门数据</div>
              ) : (
                renderDepartmentTree(departments)
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div>
              <Table
                columns={projectColumns}
                data={projects}
                loading={projectsLoading}
                rowKey="id"
              />
              {projectsTotal > 0 && (
                <div className="mt-4">
                  <Pagination
                    current={projectsPage}
                    pageSize={projectsPageSize}
                    total={projectsTotal}
                    onChange={(newPage, newPageSize) => {
                      setProjectsPage(newPage);
                      setProjectsPageSize(newPageSize);
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
