// react/src/components/layouts/UserLayout.jsx
import React, { useContext, useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  CodeOutlined,
  KeyOutlined,
  LogoutOutlined,
  SettingOutlined,
  UserOutlined,
  CrownOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography, Tag, Space, Alert, Modal } from "antd";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import OrderTable from "../tables/OrderTable";
import SoftwareTable from "../tables/SoftwareTable";
import VersionTable from "../tables/VersionTable";
import LicenseTable from "../tables/LicenseTable";
import HomeView from "../tables/HomeView";
import { AuthContext } from "../../context/AuthContext";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import ChangePass from "../../pages/ChangePass";
import Subscription from "../../pages/user/Subscription";

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);
  const { subscriptionStatus, requestTrial, isUrlActive } = useContext(SubscriptionContext);
  const [trialModalVisible, setTrialModalVisible] = useState(false);
  const [trialMessage, setTrialMessage] = useState("");
  const [trialLoading, setTrialLoading] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Redirect to login if user is not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const styleLogo = {
    fontSize: "20px",
    color: "white",
    fontWeight: "bold",
  };

  const handleTrialRequest = async () => {
    setTrialLoading(true);
    const result = await requestTrial(trialMessage);
    setTrialLoading(false);
    
    if (result.success) {
      setTrialModalVisible(false);
      Modal.success({
        title: "Permintaan Trial Berhasil",
        content: "Permintaan trial Anda telah dikirim ke admin. Silakan tunggu persetujuan."
      });
    } else {
      Modal.error({
        title: "Permintaan Trial Gagal",
        content: result.error || "Terjadi kesalahan saat meminta trial."
      });
    }
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
            { key: "", label: "Kinterstore", style: styleLogo },
            { key: "/", icon: <HomeOutlined />, label: "Home" },
            { key: "/subscription", icon: <CrownOutlined />, label: "Langganan" },
            { key: "/orders", icon: <ShoppingCartOutlined />, label: "Pesanan" },
            { key: "/software", icon: <AppstoreOutlined />, label: "Produk" },
            { key: "/version", icon: <CodeOutlined />, label: "Variasi Produk" },
            { key: "/license", icon: <KeyOutlined />, label: "Stok" },
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
            {!isUrlActive && (
              <Button 
                type="primary" 
                onClick={() => setTrialModalVisible(true)}
              >
                Minta Trial
              </Button>
            )}
            {isUrlActive ? (
              <Tag color="success">URL Aktif</Tag>
            ) : (
              <Tag color="error">URL Tidak Aktif</Tag>
            )}
            <Space>
              <UserOutlined />
              <Text strong>{user?.username}</Text>
            </Space>
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
          <div style={{ marginBottom: 16 }}>
            <Title level={5}>URL Halaman Anda:</Title>
            <Tag color="blue" style={{ fontSize: 14, padding: "4px 8px" }}>
              {`https://kinterstore.my.id/${user?.url_slug}`}
            </Tag>
            {!isUrlActive && (
              <Alert
                message="Perhatian!"
                description="URL halaman Anda belum aktif. Silakan berlangganan atau minta trial untuk mengaktifkan URL Anda."
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </div>
          
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/orders" element={<OrderTable />} />
            <Route path="/software" element={<SoftwareTable />} />
            <Route path="/version" element={<VersionTable />} />
            <Route path="/license" element={<LicenseTable />} />
            <Route path="/change-password" element={<ChangePass />} />
          </Routes>
        </Content>
      </Layout>
      
      {/* Trial Request Modal */}
      <Modal
        title="Permintaan Trial"
        open={trialModalVisible}
        onOk={handleTrialRequest}
        onCancel={() => setTrialModalVisible(false)}
        confirmLoading={trialLoading}
      >
        <p>Silakan tulis pesan untuk admin mengenai permintaan trial Anda:</p>
        <Input.TextArea
          rows={4}
          value={trialMessage}
          onChange={(e) => setTrialMessage(e.target.value)}
          placeholder="Contoh: Saya ingin mencoba layanan ini selama 7 hari..."
        />
      </Modal>
    </Layout>
  );
};

export default UserLayout;