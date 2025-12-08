import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import {
  DashboardOutlined,
  DollarOutlined,
  PieChartOutlined,
  WalletOutlined,
  TrophyOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/expenses',
      icon: <DollarOutlined />,
      label: 'Expenses',
    },
    {
      key: '/income',
      icon: <WalletOutlined />,
      label: 'Income',
    },
    {
      key: '/budget',
      icon: <PieChartOutlined />,
      label: 'Budget',
    },
    {
      key: '/goals',
      icon: <TrophyOutlined />,
      label: 'Goals',
    },
  ];

  // User dropdown menu
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: logout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        {/* Logo */}
        <div
          style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.1)',
            margin: '16px',
            borderRadius: '8px',
          }}
        >
          <DollarOutlined style={{ fontSize: '24px', color: '#fff' }} />
          {!collapsed && (
            <Text
              strong
              style={{
                color: '#fff',
                marginLeft: '12px',
                fontSize: '16px',
              }}
            >
              Expense Tracker
            </Text>
          )}
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>

      {/* Main Layout */}
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          {/* Collapse Button */}
          <div>
            {React.createElement(
              collapsed ? MenuUnfoldOutlined : MenuFoldOutlined,
              {
                style: { fontSize: '18px', cursor: 'pointer' },
                onClick: () => setCollapsed(!collapsed),
              }
            )}
          </div>

          {/* User Info */}
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar style={{ backgroundColor: '#1890ff' }}>
                {user?.name?.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <div style={{ lineHeight: '20px' }}>
                  <Text strong>{user?.name}</Text>
                </div>
                <div style={{ lineHeight: '16px' }}>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {user?.currency || 'BDT'}
                  </Text>
                </div>
              </div>
            </Space>
          </Dropdown>
        </Header>

        {/* Content */}
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: '#f0f2f5',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;