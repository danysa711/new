import React, { useContext, useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CreditCardOutlined,
  ShoppingOutlined,
  WhatsAppOutlined,
  WalletOutlined,
  QrcodeOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography } from "antd";
import { Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import HomeView from "../tables/HomeView";
import ChangePass from "../../pages/ChangePass";
import UserManagement from "../../pages/admin/UserManagement";
import SubscriptionManagement from "../../pages/admin/SubscriptionManagement";
import SubscriptionPlans from "../../pages/admin/SubscriptionPlans";
import WhatsappBaileys from "../../pages/admin/WhatsappBaileys";
import QrisPayment from "../../pages/admin/QrisPayment";

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout, user } = useContext(AuthContext);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Check if user is admin
  if (!token || !user || user.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  const styleLogo = {
    fontSize: "20px",
    color: "white",
    fontWeight: "bold",
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="md"
        collapsedWidth="0"
        onCollapse={(collapsed) => setCollapsed(collapsed)}
      >
        <div className="demo-logo-vertical" />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            if (key === "logout") {
              logout();
            } else {
              navigate(key);
            }
          }}
          items={[
            { key: "", label: "Admin Panel", style: styleLogo },
            { key: "/admin/dashboard", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "/admin/users", icon: <TeamOutlined />, label: "Kelola User" },
            { 
              key: "subscription-menu", 
              icon: <ShoppingOutlined />, 
              label: "Langganan",
              children: [
                { key: "/admin/subscriptions", label: "Daftar Langganan" },
                { key: "/admin/subscription-plans", label: "Paket Langganan" },
              ]
            },
            // Menu pembayaran QRIS
            { key: "/admin/qris-payment", icon: <QrcodeOutlined />, label: "Verifikasi QRIS" },
            // Menu WhatsApp Baileys
            { key: "/admin/whatsapp-baileys", icon: <WhatsAppOutlined />, label: "WhatsApp Baileys" },
            { key: "/admin/change-password", icon: <SettingOutlined />, label: "Ganti Password" },
            { key: "logout", icon: <LogoutOutlined />, label: "Keluar", danger: true },
          ]}
        />
      </Sider>
      <Layout style={{ flex: 1 }}>
        <Header
          style={{
            padding: "0 16px",
            background: colorBgContainer,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: "16px",
                width: 48,
                height: 48,
              }}
            />
            <Title level={4} style={{ margin: 0, marginLeft: 16 }}>
              Admin Panel
            </Title>
          </div>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ marginRight: 16 }}>
              <UserOutlined /> {user.username}
            </div>
            <Button type="primary" danger onClick={logout}>
              Logout
            </Button>
          </div>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            flex: 1,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Routes>
            <Route path="/dashboard" element={<HomeView />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/subscription-plans" element={<SubscriptionPlans />} />
            <Route path="/whatsapp-baileys" element={<WhatsappBaileys />} />
            <Route path="/qris-payment" element={<QrisPayment />} />
            <Route path="/change-password" element={<ChangePass />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;