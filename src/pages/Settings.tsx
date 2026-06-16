import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Globe,
  Palette,
  Mail,
  Webhook,
  Server,
  RefreshCw,
  Timer,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Switch from '../components/Switch';

export default function Settings() {
  const [activeSection, setActiveSection] = useState('basic');

  const [systemName, setSystemName] = useState('企业级任务调度平台');
  const [timezone, setTimezone] = useState('Asia/Shanghai');
  const [language, setLanguage] = useState('zh-CN');

  const [minPasswordLength, setMinPasswordLength] = useState(8);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireLowercase, setRequireLowercase] = useState(true);
  const [requireNumber, setRequireNumber] = useState(true);
  const [requireSpecialChar, setRequireSpecialChar] = useState(false);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [lockoutDuration, setLockoutDuration] = useState(30);
  const [sessionTimeout, setSessionTimeout] = useState(3600);
  const [showPassword, setShowPassword] = useState(false);

  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('noreply@example.com');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [smtpFrom, setSmtpFrom] = useState('任务调度平台 <noreply@example.com>');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [enableEmailNotification, setEnableEmailNotification] = useState(true);
  const [enableWebhook, setEnableWebhook] = useState(false);

  const [maxConcurrency, setMaxConcurrency] = useState(100);
  const [retryStrategy, setRetryStrategy] = useState('exponential');
  const [maxRetries, setMaxRetries] = useState(3);
  const [initialDelay, setInitialDelay] = useState(1000);
  const [maxDelay, setMaxDelay] = useState(60000);
  const [multiplier, setMultiplier] = useState(2);
  const [taskTimeout, setTaskTimeout] = useState(3600);
  const [enableAutoRetry, setEnableAutoRetry] = useState(true);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (section: string) => {
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      showToast('success', '保存成功');
    } catch (error) {
      showToast('error', '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const timezoneOptions = [
    { label: 'Asia/Shanghai (UTC+8) 北京', value: 'Asia/Shanghai' },
    { label: 'Asia/Tokyo (UTC+9) 东京', value: 'Asia/Tokyo' },
    { label: 'Asia/Singapore (UTC+8) 新加坡', value: 'Asia/Singapore' },
    { label: 'America/New_York (UTC-5) 纽约', value: 'America/New_York' },
    { label: 'America/Los_Angeles (UTC-8) 洛杉矶', value: 'America/Los_Angeles' },
    { label: 'Europe/London (UTC+0) 伦敦', value: 'Europe/London' },
    { label: 'Europe/Paris (UTC+1) 巴黎', value: 'Europe/Paris' },
    { label: 'UTC 协调世界时', value: 'UTC' },
  ];

  const languageOptions = [
    { label: '简体中文', value: 'zh-CN' },
    { label: '繁體中文', value: 'zh-TW' },
    { label: 'English', value: 'en-US' },
    { label: '日本語', value: 'ja-JP' },
    { label: '한국어', value: 'ko-KR' },
  ];

  const retryStrategyOptions = [
    { label: '固定间隔', value: 'fixed' },
    { label: '指数退避', value: 'exponential' },
    { label: '线性递增', value: 'linear' },
  ];

  const sections = [
    { key: 'basic', label: '基本设置', icon: <Globe size={16} /> },
    { key: 'security', label: '安全设置', icon: <Shield size={16} /> },
    { key: 'notification', label: '通知设置', icon: <Bell size={16} /> },
    { key: 'scheduling', label: '调度配置', icon: <Clock size={16} /> },
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

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 flex-shrink-0">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <SettingsIcon size={20} className="text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-dark-900">系统设置</h2>
                <p className="text-xs text-dark-500">配置系统参数</p>
              </div>
            </div>
            <nav className="space-y-1">
              {sections.map((section) => (
                <button
                  key={section.key}
                  onClick={() => setActiveSection(section.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    activeSection === section.key
                      ? 'bg-primary-50 text-primary-600 font-medium'
                      : 'text-dark-600 hover:bg-dark-50 hover:text-dark-900'
                  }`}
                >
                  {section.icon}
                  {section.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          {activeSection === 'basic' && (
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Globe size={16} className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900">基本设置</h3>
                    <p className="text-xs text-dark-500">配置系统基础信息</p>
                  </div>
                </div>
              }
              actions={
                <Button
                  icon={<Save size={18} />}
                  onClick={() => handleSave('basic')}
                  loading={saving}
                >
                  保存设置
                </Button>
              }
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="系统名称"
                    placeholder="请输入系统名称"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    icon={<Palette size={18} />}
                  />
                  <div>
                    <label className="label">系统 Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Palette size={24} className="text-primary-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-dark-500 mb-2">
                          建议上传 200x200 像素的 PNG 或 JPG 图片
                        </p>
                        <Button variant="secondary" size="sm">
                          上传 Logo
                        </Button>
                      </div>
                    </div>
                  </div>
                  <Select
                    label="时区"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    options={timezoneOptions}
                  />
                  <Select
                    label="语言"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    options={languageOptions}
                  />
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-danger-100 rounded-lg flex items-center justify-center">
                    <Shield size={16} className="text-danger-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900">安全设置</h3>
                    <p className="text-xs text-dark-500">配置密码策略和安全选项</p>
                  </div>
                </div>
              }
              actions={
                <Button
                  icon={<Save size={18} />}
                  onClick={() => handleSave('security')}
                  loading={saving}
                >
                  保存设置
                </Button>
              }
            >
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Lock size={16} className="text-dark-400" />
                    密码策略
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="最小密码长度"
                      type="number"
                      value={minPasswordLength}
                      onChange={(e) => setMinPasswordLength(parseInt(e.target.value))}
                      min={6}
                      max={32}
                    />
                    <div className="space-y-3 pt-7">
                      <Switch
                        checked={requireUppercase}
                        onChange={setRequireUppercase}
                        label="要求包含大写字母"
                      />
                      <Switch
                        checked={requireLowercase}
                        onChange={setRequireLowercase}
                        label="要求包含小写字母"
                      />
                      <Switch
                        checked={requireNumber}
                        onChange={setRequireNumber}
                        label="要求包含数字"
                      />
                      <Switch
                        checked={requireSpecialChar}
                        onChange={setRequireSpecialChar}
                        label="要求包含特殊字符"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-100">
                  <h4 className="text-sm font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-dark-400" />
                    登录限制
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="最大登录尝试次数"
                      type="number"
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(parseInt(e.target.value))}
                      min={1}
                      max={20}
                    />
                    <Input
                      label="锁定时长（分钟）"
                      type="number"
                      value={lockoutDuration}
                      onChange={(e) => setLockoutDuration(parseInt(e.target.value))}
                      min={1}
                      max={1440}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-100">
                  <h4 className="text-sm font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Timer size={16} className="text-dark-400" />
                    会话超时
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="会话超时时间（秒）"
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                      min={300}
                      max={86400}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'notification' && (
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-warning-100 rounded-lg flex items-center justify-center">
                    <Bell size={16} className="text-warning-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900">通知设置</h3>
                    <p className="text-xs text-dark-500">配置邮件和 Webhook 通知</p>
                  </div>
                </div>
              }
              actions={
                <Button
                  icon={<Save size={18} />}
                  onClick={() => handleSave('notification')}
                  loading={saving}
                >
                  保存设置
                </Button>
              }
            >
              <div className="space-y-8">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-dark-900 flex items-center gap-2">
                      <Mail size={16} className="text-dark-400" />
                      邮件服务器
                    </h4>
                    <Switch
                      checked={enableEmailNotification}
                      onChange={setEnableEmailNotification}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="SMTP 服务器地址"
                      placeholder="smtp.example.com"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      disabled={!enableEmailNotification}
                    />
                    <Input
                      label="SMTP 端口"
                      placeholder="587"
                      value={smtpPort}
                      onChange={(e) => setSmtpPort(e.target.value)}
                      disabled={!enableEmailNotification}
                    />
                    <Input
                      label="SMTP 用户名"
                      placeholder="noreply@example.com"
                      value={smtpUser}
                      onChange={(e) => setSmtpUser(e.target.value)}
                      disabled={!enableEmailNotification}
                    />
                    <div className="relative">
                      <Input
                        label="SMTP 密码"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入密码"
                        value={smtpPassword}
                        onChange={(e) => setSmtpPassword(e.target.value)}
                        disabled={!enableEmailNotification}
                        suffix={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-dark-400 hover:text-dark-600"
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        }
                      />
                    </div>
                    <Input
                      label="发件人地址"
                      placeholder="任务调度平台 <noreply@example.com>"
                      value={smtpFrom}
                      onChange={(e) => setSmtpFrom(e.target.value)}
                      disabled={!enableEmailNotification}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-100">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold text-dark-900 flex items-center gap-2">
                      <Webhook size={16} className="text-dark-400" />
                      Webhook 通知
                    </h4>
                    <Switch checked={enableWebhook} onChange={setEnableWebhook} />
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    <Input
                      label="Webhook 地址"
                      placeholder="https://example.com/webhook"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      disabled={!enableWebhook}
                      icon={<Webhook size={18} />}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          {activeSection === 'scheduling' && (
            <Card
              title={
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-info-100 rounded-lg flex items-center justify-center">
                    <Clock size={16} className="text-info-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-dark-900">调度配置</h3>
                    <p className="text-xs text-dark-500">配置任务调度和重试策略</p>
                  </div>
                </div>
              }
              actions={
                <Button
                  icon={<Save size={18} />}
                  onClick={() => handleSave('scheduling')}
                  loading={saving}
                >
                  保存设置
                </Button>
              }
            >
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Server size={16} className="text-dark-400" />
                    并发配置
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="最大并发任务数"
                      type="number"
                      value={maxConcurrency}
                      onChange={(e) => setMaxConcurrency(parseInt(e.target.value))}
                      min={1}
                      max={10000}
                    />
                    <div className="pt-7">
                      <Switch
                        checked={enableAutoRetry}
                        onChange={setEnableAutoRetry}
                        label="启用自动重试"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-100">
                  <h4 className="text-sm font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <RefreshCw size={16} className="text-dark-400" />
                    重试策略
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                      label="重试策略"
                      value={retryStrategy}
                      onChange={(e) => setRetryStrategy(e.target.value)}
                      options={retryStrategyOptions}
                      disabled={!enableAutoRetry}
                    />
                    <Input
                      label="最大重试次数"
                      type="number"
                      value={maxRetries}
                      onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                      min={0}
                      max={10}
                      disabled={!enableAutoRetry}
                    />
                    <Input
                      label="初始延迟（毫秒）"
                      type="number"
                      value={initialDelay}
                      onChange={(e) => setInitialDelay(parseInt(e.target.value))}
                      min={100}
                      max={300000}
                      disabled={!enableAutoRetry}
                    />
                    <Input
                      label="最大延迟（毫秒）"
                      type="number"
                      value={maxDelay}
                      onChange={(e) => setMaxDelay(parseInt(e.target.value))}
                      min={1000}
                      max={600000}
                      disabled={!enableAutoRetry}
                    />
                    {retryStrategy === 'exponential' && (
                      <Input
                        label="退避倍数"
                        type="number"
                        value={multiplier}
                        onChange={(e) => setMultiplier(parseFloat(e.target.value))}
                        min={1.1}
                        max={10}
                        step={0.1}
                        disabled={!enableAutoRetry}
                      />
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-100">
                  <h4 className="text-sm font-semibold text-dark-900 mb-4 flex items-center gap-2">
                    <Timer size={16} className="text-dark-400" />
                    超时配置
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="任务超时时间（秒）"
                      type="number"
                      value={taskTimeout}
                      onChange={(e) => setTaskTimeout(parseInt(e.target.value))}
                      min={60}
                      max={86400}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
