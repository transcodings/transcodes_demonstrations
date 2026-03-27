import {
  DashboardOutlined,
  ProjectOutlined,
  ShopOutlined,
  LineChartOutlined,
  WalletOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { IResourceItem } from '@refinedev/core';

export const resources: IResourceItem[] = [
  {
    name: 'dashboard',
    list: '/',
    meta: {
      label: 'Dashboard',
      icon: <DashboardOutlined />,
    },
  },
  {
    name: 'companies',
    list: '/companies',
    show: '/companies/:id',
    create: '/companies/new',
    edit: '/companies/edit/:id',
    meta: {
      label: 'Customers',
      icon: <ShopOutlined />,
    },
  },
  {
    name: 'tasks',
    list: '/tasks',
    create: '/tasks/new',
    edit: '/tasks/edit/:id',
    meta: {
      label: 'Tasks',
      icon: <ProjectOutlined />,
    },
  },
  {
    name: 'revenue',
    list: '/revenue',
    meta: {
      label: 'Revenue',
      icon: <LineChartOutlined />,
    },
  },
  {
    name: 'payout',
    list: '/payout',
    meta: {
      label: 'Payouts',
      icon: <WalletOutlined />,
    },
  },
  {
    name: 'profile',
    list: '/profile',
    meta: {
      label: 'Profile',
      icon: <UserOutlined />,
    },
  },
];
