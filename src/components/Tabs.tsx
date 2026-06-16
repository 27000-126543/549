import { ReactNode, useState } from 'react';

interface TabItem {
  key: string;
  label: string;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  children: ReactNode;
}

export default function Tabs({
  items,
  defaultActiveKey,
  activeKey,
  onChange,
  children,
}: TabsProps) {
  const [internalKey, setInternalKey] = useState(defaultActiveKey || items[0]?.key);
  const currentKey = activeKey !== undefined ? activeKey : internalKey;

  const handleTabClick = (key: string) => {
    if (activeKey === undefined) {
      setInternalKey(key);
    }
    onChange?.(key);
  };

  return (
    <div>
      <div className="border-b border-dark-200 mb-6">
        <nav className="flex gap-1">
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => handleTabClick(item.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                currentKey === item.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-dark-500 hover:text-dark-700 hover:border-dark-300'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
