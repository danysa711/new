import React, { useContext, useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShoppingOutlined,
  HomeOutlined,
  AppstoreOutlined,
  ApartmentOutlined,
  KeyOutlined,
  WhatsAppOutlined,
  DownOutlined,
  LinkOutlined,
  WarningOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography, Card, Badge, Tag, Spin, Space, Dropdown, Alert, Modal } from "antd";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ConnectionContext } from "../../context/ConnectionContext"; // Import ConnectionContext
import OrderTable from "../tables/OrderTable";
import HomeView from "../tables/HomeView";
import ChangePass from "../../pages/ChangePass";
import SubscriptionPage from "../../pages/user/SubscriptionPage";
import SoftwareTable from "../tables/SoftwareTable";
import VersionTable from "../tables/VersionTable";
import LicenseTable from "../tables/LicenseTable";
import axiosInstance from "../../services/axios";

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const { token, logout, user, fetchUserProfile, updateUserData } = useContext(AuthContext);
  
  // Mengambil konteks koneksi
  const { isConnected, connectionStatus, backendUrl } = useContext(ConnectionContext);
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Check if current user is authorized to view this page
  useEffect(() => {
    if (!token) {
      return;
    }
    
    // If not the user's own page and not an admin, redirect to their own page
    if (user?.url_slug !== slug && user?.role !== "admin") {
      navigate(`/user/page/${user.url_slug}`);
      return;
    }
    
    // Load user profile data
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get(`/api/user/public/${slug}`);
        setUserProfile(response.data.user);
        
        // Jika ini adalah halaman pengguna saat ini, perbarui status langganan
        if (user && user.url_slug === slug) {
          // Fetch profil pengguna lengkap untuk memperbarui status langganan
          if (fetchUserProfile) {
            await fetchUserProfile();
          }
          
          // Periksa apakah status langganan pada profil publik berbeda dengan status di AuthContext
          const hasActiveSubscription = response.data.user.hasActiveSubscription;
          if (user.hasActiveSubscription !== hasActiveSubscription && updateUserData) {
            const updatedUser = { ...user, hasActiveSubscription };
            updateUserData(updatedUser);
          }
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    
    loadUserProfile();
    
    // Set interval untuk memeriksa status langganan setiap 5 menit
    const refreshInterval = setInterval(() => {
      loadUserProfile();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [token, slug, user, navigate, fetchUserProfile, updateUserData]);

  // Fungsi untuk memperbarui profil dan status langganan secara manual
  const refreshUserProfile = async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      
      // Perbarui profil pengguna
      if (fetchUserProfile) {
        await fetchUserProfile();
      }
      
      // Perbarui profil publik
      const response = await axiosInstance.get(`/api/user/public/${slug}`);
      setUserProfile(response.data.user);
      
      // Notifikasi sukses
      Modal.success({
        title: 'Profil Berhasil Diperbarui',
        content: 'Status langganan telah diperbarui',
        okText: 'OK',
      });
    } catch (err) {
      console.error("Error refreshing user profile:", err);
      Modal.error({
        title: 'Gagal Memperbarui Profil',
        content: 'Terjadi kesalahan saat memperbarui profil. Silakan coba lagi.',
        okText: 'OK',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Card>
          <Title level={3}>Error</Title>
          <Text type="danger">{error}</Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  // If user profile not found
  if (!userProfile) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Card>
          <Title level={3}>User Not Found</Title>
          <Text>The requested user page does not exist.</Text>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate("/")}>
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // API URL yang dapat digunakan orang lain untuk mengakses data halaman ini
  const apiUrl = `https://www.db.kinterstore.my.id/api/user/${slug}`;

  // Fungsi untuk membuka WhatsApp dengan pesan request trial
  const requestTrial = () => {
    // Pesan WhatsApp dengan format yang berisi informasi user
    const message = `Halo, saya ${user.username} (${user.email}) ingin request trial untuk langganan. URL Slug: ${user.url_slug}`;
    const waLink = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
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
        <div style={{ color: "white", padding: "16px", textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          <UserOutlined style={{ fontSize: 24 }} />
          {!collapsed && (
            <div style={{ marginTop: 8 }}>
              <Title level={5} style={{ color: "white", margin: 0 }}>
                {userProfile.username}
              </Title>
              <Badge 
                status={userProfile.hasActiveSubscription ? "success" : "error"} 
                text={
                  <Text style={{ color: "white" }}>
                    {userProfile.hasActiveSubscription ? "Active" : "Inactive"}
                  </Text>
                } 
              />
            </div>
          )}
        </div>
        
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => {
            if (key === "logout") {
              logout();
            } else if (key === "trial") {
              requestTrial();
            } else {
              navigate(key);
            }
          }}
          items={[
            { key: `/user/page/${slug}`, icon: <HomeOutlined />, label: "Home" },
            { key: `/user/page/${slug}/subscription`, icon: <ShoppingOutlined />, label: "Langganan" },
            { key: `/user/page/${slug}/orders`, icon: <VideoCameraOutlined />, label: "Pesanan" },
            { key: `/user/page/${slug}/software`, icon: <AppstoreOutlined />, label: "Produk" },
            { key: `/user/page/${slug}/version`, icon: <ApartmentOutlined />, label: "Variasi Produk" },
            { key: `/user/page/${slug}/license`, icon: <KeyOutlined />, label: "Stok" },
            { key: `/user/page/${slug}/change-password`, icon: <SettingOutlined />, label: "Ganti Password" },
            { key: "trial", icon: <WhatsAppOutlined />, label: "Request Trial" },
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
              {userProfile.username}'s Page
            </Title>
            {userProfile.hasActiveSubscription ? (
              <Tag color="success" style={{ marginLeft: 8 }}>Active</Tag>
            ) : (
              <Tag color="error" style={{ marginLeft: 8 }}>Inactive</Tag>
            )}
          </div>
          
          {/* Dropdown untuk Request Trial dan Logout */}
          <Dropdown
            menu={{
              items: [
                {
                  key: '1',
                  label: 'Request Trial',
                  icon: <WhatsAppOutlined />,
                  onClick: requestTrial
                },
                {
                  key: '2',
                  label: 'Pengaturan Koneksi',
                  icon: <LinkOutlined />,
                  onClick: () => navigate("/connection-settings")
                },
                {
                  key: '3',
                  label: 'Logout',
                  icon: <LogoutOutlined />,
                  danger: true,
                  onClick: logout
                }
              ]
            }}
          >
            <Button type="primary">
              <Space>
                Akun
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </Header>
        
        {/* Connection Status & API URL Banner */}
        <div style={{ 
          padding: "8px 16px", 
          background: "#f0f2f5", 
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Space>
            <Text strong>Backend URL: </Text>
            <Paragraph copyable style={{ margin: 0 }}>{backendUrl || "Not configured"}</Paragraph>
          </Space>
          <Space>
            <Text>Status: </Text>
            <Tag color={isConnected ? "success" : "error"}>
              {isConnected ? "Terhubung" : "Terputus"}
            </Tag>
            <Button 
              icon={<ReloadOutlined />} 
              size="small"
              onClick={refreshUserProfile}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>
        
        {/* Tampilkan peringatan jika langganan kedaluwarsa, tapi tetap izinkan akses ke halaman */}
        {connectionStatus === 'subscription_expired' && (
          <Alert
            message="Langganan Kedaluwarsa"
            description="Koneksi ke API terputus karena langganan Anda telah berakhir. Beberapa fitur mungkin tidak berfungsi dengan baik. Silakan perbarui langganan Anda."
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            action={
              <Button type="primary" size="small" onClick={() => navigate(`/user/page/${slug}/subscription`)}>
                Perbarui Langganan
              </Button>
            }
            closable
            style={{ margin: "8px 16px 0" }}
          />
        )}
        
        {/* API URL Banner */}
        <div style={{ 
          padding: "8px 16px", 
          background: "#f0f2f5", 
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Text strong>API URL: </Text>
          <Paragraph copyable style={{ margin: 0 }}>{apiUrl}</Paragraph>
        </div>
        
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
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/orders" element={<OrderTable />} />
            <Route path="/software" element={<SoftwareTable />} />
            <Route path="/version" element={<VersionTable />} />
            <Route path="/license" element={<LicenseTable />} />
            <Route path="/change-password" element={<ChangePass />} />
          </Routes>
        </Content>
      </Layout>
    </Layout>
  );
};

export default UserLayout;