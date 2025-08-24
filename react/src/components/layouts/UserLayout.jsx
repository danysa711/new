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
  DisconnectOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography, Card, Badge, Tag, Spin, Space, Dropdown, Alert, Modal, Tooltip, message } from "antd";
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ConnectionContext } from "../../context/ConnectionContext"; 
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

// Komponen untuk menampilkan status langganan dengan lebih informatif
const SubscriptionStatusBadge = ({ userProfile, activeSubscription }) => {
  // Jika tidak ada langganan aktif
  if (!userProfile.hasActiveSubscription || !activeSubscription) {
    return (
      <Tag color="error" style={{ marginLeft: 8 }}>
        Tidak Aktif
      </Tag>
    );
  }

  // Kalkulasi sisa hari
  const endDate = new Date(activeSubscription.end_date);
  const today = new Date();
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Jika sudah kedaluwarsa
  if (diffDays <= 0) {
    return (
      <Tag color="error" style={{ marginLeft: 8 }}>
        Kedaluwarsa
      </Tag>
    );
  }

  // Jika hampir habis (kurang dari 7 hari)
  if (diffDays <= 7) {
    return (
      <Tooltip title={`Berakhir dalam ${diffDays} hari pada ${endDate.toLocaleDateString('id-ID')}`}>
        <Tag color="warning" style={{ marginLeft: 8 }}>
          Segera Berakhir ({diffDays} hari)
        </Tag>
      </Tooltip>
    );
  }

  // Jika masih aktif dengan banyak waktu tersisa
  return (
    <Tooltip title={`Berakhir pada ${endDate.toLocaleDateString('id-ID')}`}>
      <Tag color="success" style={{ marginLeft: 8 }}>
        Aktif ({diffDays} hari)
      </Tag>
    </Tooltip>
  );
};

// Default settings untuk digunakan saat API gagal
const DEFAULT_SETTINGS = {
  whatsapp: {
    phone: "6281234567890",
    message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
  }
};

// Helper functions untuk localStorage
const getLocalStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (e) {
    console.error(`Error reading from localStorage (${key}):`, e);
    return defaultValue;
  }
};

const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error(`Error writing to localStorage (${key}):`, e);
    return false;
  }
};

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileFetched, setProfileFetched] = useState(false); // Flag untuk mencegah infinite updates
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [localMenuStatus, setLocalMenuStatus] = useState({
    software: "connected",
    version: "connected",
    license: "connected"
  });

  // Inisialisasi dari localStorage atau default
  const storedSettings = getLocalStorage('app_settings', DEFAULT_SETTINGS);
  
  // Tambahkan state untuk menyimpan pengaturan WhatsApp
  const [whatsappSettings, setWhatsappSettings] = useState(storedSettings.whatsapp);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const { token, logout, user, fetchUserProfile } = useContext(AuthContext);
  
  // Mengambil konteks koneksi
  const { 
    isConnected, 
    connectionStatus, 
    backendUrl, 
    userBackendUrl, 
    menuConnectionStatus,
    checkConnection 
  } = useContext(ConnectionContext);
  
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Mendengarkan perubahan status koneksi menu
  useEffect(() => {
    const handleMenuStatusChange = (event) => {
      const { menuType, status } = event.detail;
      setLocalMenuStatus(prev => ({
        ...prev,
        [menuType]: status
      }));
    };
    
    window.addEventListener('menuConnectionStatusChanged', handleMenuStatusChange);
    
    return () => {
      window.removeEventListener('menuConnectionStatusChanged', handleMenuStatusChange);
    };
  }, []);

  // Listen for subscription status changes
  useEffect(() => {
    const handleSubscriptionStatusChange = () => {
      // Force refresh user profile
      if (fetchUserProfile) {
        fetchUserProfile();
      }
      
      // Re-check connection status
      if (checkConnection) {
        checkConnection();
      }
    };
    
    window.addEventListener('subscriptionStatusChanged', handleSubscriptionStatusChange);
    
    return () => {
      window.removeEventListener('subscriptionStatusChanged', handleSubscriptionStatusChange);
    };
  }, [fetchUserProfile, checkConnection]);

  // Sync dengan status menu dari context
  useEffect(() => {
    setLocalMenuStatus(menuConnectionStatus);
  }, [menuConnectionStatus]);

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
  
  // Only fetch profile if it hasn't been fetched yet or if slug changes
  if (!profileFetched) {
    // Load user profile data
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axiosInstance.get(`/api/user/public/${slug}`);
        setUserProfile(response.data.user);
        setProfileFetched(true);  // Mark profile as fetched
        
        // Fetch active subscription
        try {
          const subsResponse = await axiosInstance.get('/api/subscriptions/user');
          const activeSubData = subsResponse.data.find(
            (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
          );
          if (activeSubData) {
            setActiveSubscription(activeSubData);
            setLocalStorage('user_subscription', activeSubData);
          }
        } catch (subsErr) {
          console.error('Error fetching subscription:', subsErr);
          setActiveSubscription(getLocalStorage('user_subscription', null));
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserProfile();
  }
}, [token, slug, user, navigate, profileFetched]);

  // Dalam useEffect, tambahkan kode untuk mengambil pengaturan
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosInstance.get('/api/settings');
        if (response.data && response.data.whatsapp) {
          setWhatsappSettings(response.data.whatsapp);
          setLocalStorage('app_settings', response.data);
        }
      } catch (err) {
        console.error('Error fetching WhatsApp settings:', err);
        // Gunakan data dari localStorage (sudah diinisialisasi di state)
      }
    };
    
    fetchSettings();
  }, []);

  // Force refresh when user subscription status changes in auth context
  useEffect(() => {
    if (user && userProfile) {
      // If user subscription status changes, update userProfile accordingly
      if (user.hasActiveSubscription !== userProfile.hasActiveSubscription) {
        setUserProfile({
          ...userProfile,
          hasActiveSubscription: user.hasActiveSubscription
        });
      }
    }
  }, [user?.hasActiveSubscription]);

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
  const apiUrl = userBackendUrl || `${backendUrl}/api/user/${slug}`;

  // Perbarui fungsi requestTrial
  const requestTrial = () => {
    // Format pesan dengan mengganti variabel
    const message = whatsappSettings.message
      .replace('{username}', user.username || '')
      .replace('{email}', user.email || '')
      .replace('{purpose}', 'request trial untuk langganan')
      .replace('{url_slug}', user.url_slug || '');
    
    const waLink = `https://wa.me/${whatsappSettings.phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };
  
  // Force refresh subscription status
  const handleRefreshSubscription = async () => {
  try {
    if (fetchUserProfile) {
      await fetchUserProfile();
    }
    
    // Juga coba ambil data langganan
    try {
      const subsResponse = await axiosInstance.get('/api/subscriptions/user');
      const activeSubData = subsResponse.data.find(
        (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
      );
      if (activeSubData) {
        setActiveSubscription(activeSubData);
        setLocalStorage('user_subscription', activeSubData);
      } else {
        setActiveSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription on refresh:', err);
    }
    
    if (checkConnection) {
      await checkConnection();
    }
    
    message.success('Status langganan berhasil diperbarui');
  } catch (error) {
    message.error('Gagal memperbarui status langganan');
  }
};

  // Menu dengan status koneksi
  const menuItems = [
    { 
      key: `/user/page/${slug}`, 
      icon: <HomeOutlined />, 
      label: "Home",
      status: "connected" // Home selalu terhubung
    },
    { 
      key: `/user/page/${slug}/subscription`, 
      icon: <ShoppingOutlined />, 
      label: "Langganan",
      status: "connected" // Langganan selalu terhubung
    },
    { 
      key: `/user/page/${slug}/orders`, 
      icon: <VideoCameraOutlined />, 
      label: "Pesanan",
      status: "connected" // Pesanan selalu terhubung
    },
    { 
      key: `/user/page/${slug}/software`, 
      icon: <AppstoreOutlined />, 
      label: "Produk",
      status: localMenuStatus.software
    },
    { 
      key: `/user/page/${slug}/version`, 
      icon: <ApartmentOutlined />, 
      label: "Variasi Produk",
      status: localMenuStatus.version
    },
    { 
      key: `/user/page/${slug}/license`, 
      icon: <KeyOutlined />, 
      label: "Stok",
      status: localMenuStatus.license
    },
    { 
      key: `/user/page/${slug}/change-password`, 
      icon: <SettingOutlined />, 
      label: "Ganti Password",
      status: "connected" // Ganti Password selalu terhubung
    },
    { 
      key: "trial", 
      icon: <WhatsAppOutlined />, 
      label: "Request Trial",
      status: "connected" // Request Trial selalu terhubung
    },
    { 
      key: "logout", 
      icon: <LogoutOutlined />, 
      label: "Keluar", 
      danger: true,
      status: "connected" // Logout selalu terhubung
    },
  ];

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
          items={menuItems.map(item => ({
            key: item.key,
            icon: item.status === "disconnected" ? 
              <Tooltip title="Koneksi terputus karena langganan kedaluwarsa">
                <Badge 
                  count={<DisconnectOutlined style={{ color: 'red' }} />} 
                  offset={[10, 0]}
                >
                  {item.icon}
                </Badge>
              </Tooltip> : 
              item.icon,
            label: item.label,
            danger: item.danger,
            style: item.status === "disconnected" ? { opacity: 0.7 } : {}
          }))}
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
          <SubscriptionStatusBadge userProfile={userProfile} activeSubscription={activeSubscription} />
          <Button 
            type="link" 
            icon={<ReloadOutlined />} 
            onClick={handleRefreshSubscription} 
           title="Refresh Status Langganan"
          >
            Refresh
          </Button>
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
          </Space>
        </div>
       
        {/* Tampilkan peringatan jika langganan kedaluwarsa, tapi tetap izinkan akses ke halaman */}
        {connectionStatus === 'subscription_expired' && (
          <Alert
            message="Langganan Kedaluwarsa"
            description="Koneksi ke API terputus karena langganan Anda telah berakhir. Menu Produk, Variasi Produk, dan Stok tidak akan berfungsi dengan baik. Silakan perbarui langganan Anda."
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
       
        {/* User Backend URL Banner */}
        <div style={{ 
          padding: "8px 16px", 
          background: "#f0f2f5", 
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Text strong>User Backend URL: </Text>
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