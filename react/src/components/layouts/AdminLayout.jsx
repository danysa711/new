// react/src/components/layouts/AdminLayout.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined,
  CrownOutlined,
  PayCircleOutlined,
  LogoutOutlined,
  SettingOutlined,
  DashboardOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography, Space } from "antd";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import ChangePass from "../../pages/ChangePass";
import HomeView from "../tables/HomeView";
import UserManagement from "../../pages/admin/UserManagement";
import SubscriptionManagement from "../../pages/admin/SubscriptionManagement";
import SubscriptionPlanManagement from "../../pages/admin/SubscriptionPlanManagement";
import TripaySettings from "../../pages/admin/TripaySettings";
import PaymentMethodManagement from "../../pages/admin/PaymentMethodManagement";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Redirect to login if user is not logged in or not admin
  useEffect(() => {
    if (!user) {
      navigate("/login");
    } else if (user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

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
              logout(); // Logout user
            } else {
              navigate(key);
            }
          }}
          items={[
            { key: "", label: "Admin Panel", style: styleLogo },
            { key: "/", icon: <DashboardOutlined />, label: "Dashboard" },
            { key: "/admin/users", icon: <UserOutlined />, label: "Kelola User" },
            { key: "/admin/subscriptions", icon: <CrownOutlined />, label: "Langganan" },
            { key: "/admin/plans", icon: <CrownOutlined />, label: "Paket Langganan" },
            { key: "/admin/payment-methods", icon: <PayCircleOutlined />, label: "Metode Pembayaran" },
            { key: "/admin/tripay", icon: <PayCircleOutlined />, label: "Tripay" },
            { key: "/change-password", icon: <SettingOutlined />, label: "Ganti Password" },
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
          <Space>
            <UserOutlined />
            <Text strong>{user?.username} (Admin)</Text>
          </Space>
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
            <Route path="/" element={<HomeView />} />
            <Route path="/admin/users" element={<UserManagement />} />
            <Route path="/admin/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/admin/plans" element={<SubscriptionPlanManagement />} />
            <Route path="/admin/payment-methods" element={<PaymentMethodManagement />} />
            <Route path="/admin/tripay" element={<TripaySettings />} />
            <Route path="/change-password" element={<ChangePass />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;