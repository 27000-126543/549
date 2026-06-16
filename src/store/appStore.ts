import { create } from 'zustand';
import type { Tenant, Department, Role, Project } from '../../shared/types';

interface AppState {
  sidebarCollapsed: boolean;
  currentTenant: Tenant | null;
  departments: Department[];
  roles: Role[];
  projects: Project[];
  notifications: any[];
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
  setDepartments: (departments: Department[]) => void;
  setRoles: (roles: Role[]) => void;
  setProjects: (projects: Project[]) => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  currentTenant: null,
  departments: [],
  roles: [],
  projects: [],
  notifications: [],

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
  setDepartments: (departments) => set({ departments }),
  setRoles: (roles) => set({ roles }),
  setProjects: (projects) => set({ projects }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [...state.notifications, { id: Date.now().toString(), ...notification }],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
