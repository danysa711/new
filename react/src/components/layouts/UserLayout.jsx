import React, { useContext, useState, useEffect } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
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
  CopyOutlined,
  WalletOutlined,
  QuestionCircleOutlined,
  FileTextOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography, Card, Badge, Tag, Space, Dropdown, Alert, Modal, message, Divider, Spin } from 'antd';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ConnectionContext } from "../../context/ConnectionContext";
import OrderTable from "../tables/OrderTable";
import UserHomeView from "../../pages/user/UserHomeView";
import ChangePass from "../../pages/ChangePass";
import SubscriptionPage from "../../pages/user/SubscriptionPage";
import SoftwareTable from "../tables/SoftwareTable";
import VersionTable from "../tables/VersionTable";
import LicenseTable from "../tables/LicenseTable";
import BackendSettings from "../../pages/user/BackendSettings";
import PrivacyPolicy from "../../pages/info/PrivacyPolicy";
import TermsOfService from "../../pages/info/TermsOfService";
import HelpCenter from "../../pages/info/HelpCenter";
import Logo from "../common/Logo";
import { logger } from '../../utils/logger';
import axiosInstance from "../../services/axios";

const { Header, Sider, Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const UserLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [error, setError] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [showPendingAlert, setShowPendingAlert] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { slug } = useParams();
  const { token, logout, user } = useContext(AuthContext);
  
  // Mengambil konteks koneksi
  const { isConnected, connectionStatus, backendUrl } = useContext(ConnectionContext);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  // Check if user is authenticated
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  
  // If not the user's own page and not an admin, redirect to their own page
  if (user?.url_slug !== slug && user?.role !== "admin") {
    return <Navigate to={`/user/page/${user.url_slug}`} replace />;
  }

  // Efek samping untuk fetch data
  useEffect(() => {
    if (!user || !slug || !token) return;
    
    setLoading(true);
    
    // Load user profile data
    const fetchUserProfile = async () => {
      try {
        setError(null);
        const response = await axiosInstance.get(`/api/user/public/${slug}`);
        setUserProfile(response.data.user);
        
        // Cek transaksi yang pending
        try {
          const pendingTransactionsResponse = await axiosInstance.get('/api/tripay/pending-transactions');
          const pendingTrans = pendingTransactionsResponse.data;
          
          setPendingTransactions(pendingTrans);
          setShowPendingAlert(false); // Selalu sembunyikan alert terlepas dari jumlah transaksi pending
        } catch (err) {
          logger.error("Error fetching pending transactions:", err);
        }
        
        setLoading(false);
      } catch (err) {
        logger.error("Error fetching user profile:", err);
        // Cek apakah komponen masih mounted
        if (user && slug) {
          setError("Failed to load user profile");
        }
        setLoading(false);
      }
    };
    
    fetchUserProfile();
    
    // Set interval untuk memeriksa transaksi pending setiap 5 menit
    const pendingTransactionsInterval = setInterval(async () => {
      if (!user || !slug || !token) return;
      
      try {
        const pendingTransactionsResponse = await axiosInstance.get('/api/tripay/pending-transactions');
        setPendingTransactions(pendingTransactionsResponse.data);
        setShowPendingAlert(false); // Selalu false meskipun ada transaksi pending
      } catch (err) {
        logger.error("Error checking pending transactions:", err);
      }
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(pendingTransactionsInterval);
    };
  }, [token, slug, user]);

  // Modal untuk menampilkan informasi bantuan cepat
  const HelpModal = () => {
    return (
      <Modal 
        title="Bantuan" 
        open={showHelpModal} 
        onCancel={() => setShowHelpModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowHelpModal(false)}>
            Tutup
          </Button>,
          <Button 
            key="help" 
            type="primary" 
            onClick={() => {
              setShowHelpModal(false);
              navigate(`/user/page/${slug}/help-center`);
            }}
          >
            Pusat Bantuan Lengkap
          </Button>,
        ]}
        width={700}
      >
        <Divider />
        <Title level={4}>Kontak Bantuan</Title>
        <Paragraph>
          Jika Anda membutuhkan bantuan lebih lanjut, silakan hubungi kami melalui:
        </Paragraph>
        <ul>
          <li>WhatsApp: +6281284712684</li>
        </ul>
        
        <Button 
          type="primary" 
          icon={<WhatsAppOutlined />} 
          onClick={() => {
            window.open('https://wa.me/6281284712684?text=Halo,%20saya%20membutuhkan%20bantuan%20dengan%20Kinterstore', '_blank');
          }}
          style={{ marginTop: 16 }}
        >
          Hubungi via WhatsApp
        </Button>
      </Modal>
    );
  };

  // Fungsi untuk membuka WhatsApp dengan pesan request trial
  const requestTrial = async () => {
    try {
      const hide = message.loading('Memuat pengaturan trial...', 0);
      
      try {
        // Gunakan endpoint publik
        const response = await axiosInstance.get('/api/settings/whatsapp-public');
        logger.log('API response:', response.data);
        
        // Gunakan format yang baru
        const whatsappNumber = response.data.whatsappNumber;
        const messageTemplate = response.data.messageTemplate;
        const isEnabled = response.data.trialEnabled;
        
        hide();
        
        // Periksa apakah fitur diaktifkan
        if (!isEnabled) {
          message.info('Fitur request trial saat ini tidak aktif. Silakan hubungi admin.');
          return;
        }
        
        // Hasilkan pesan dengan mengganti placeholder dengan data pengguna aktual
        let finalMessage = messageTemplate;
        if (user) {
          finalMessage = finalMessage.replace(/{username}/g, user.username || '');
          finalMessage = finalMessage.replace(/{email}/g, user.email || '');
          finalMessage = finalMessage.replace(/{url_slug}/g, user.url_slug || '');
        }
        
        // Buka WhatsApp
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
        window.open(whatsappUrl, '_blank');
        
      } catch (apiError) {
       logger.warn('Gagal mengambil data dari API, beralih ke localStorage', apiError);
        hide();
        
        // Fallback ke localStorage
        const whatsappNumber = localStorage.getItem('whatsapp_number') || '6281284712684';
        const messageTemplate = localStorage.getItem('whatsapp_trial_template') || 
          'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}';
        
        // Hasilkan pesan
        let finalMessage = messageTemplate;
        if (user) {
          finalMessage = finalMessage.replace(/{username}/g, user.username || '');
          finalMessage = finalMessage.replace(/{email}/g, user.email || '');
          finalMessage = finalMessage.replace(/{url_slug}/g, user.url_slug || '');
        }
        
        // Buka WhatsApp
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
        window.open(whatsappUrl, '_blank');
        
        message.warning('Menggunakan pengaturan lokal karena server tidak dapat diakses');
      }
    } catch (error) {
      logger.error('Error dalam requestTrial:', error);
      message.error('Terjadi kesalahan. Silakan coba lagi nanti.');
    }
  };

  // Tampilkan loading screen
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <Card>
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
            <Title level={3} style={{ marginTop: 16 }}>Memuat...</Title>
            <Text>Harap tunggu sementara kami memuat halaman Anda.</Text>
          </div>
        </Card>
      </div>
    );
  }

  // Tangani kasus error
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

  // Tangani kasus profile tidak ditemukan
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

  // Force isConnected to true if user has active subscription
  const effectiveIsConnected = user.hasActiveSubscription ? true : isConnected;
  const effectiveConnectionStatus = user.hasActiveSubscription ? "connected" : connectionStatus;

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
        {/* Logo Kinterstore */}
        <Logo collapsed={collapsed} />
        
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
            { key: `/user/page/${slug}`, icon: <HomeOutlined />, label: "Beranda" },
            { 
              key: `/user/page/${slug}/subscription`, 
              icon: <WalletOutlined />, 
              label: "Langganan"
            },
            { key: `/user/page/${slug}/orders`, icon: <ShoppingOutlined />, label: "Pesanan" },
            { key: `/user/page/${slug}/software`, icon: <AppstoreOutlined />, label: "Produk" },
            { key: `/user/page/${slug}/version`, icon: <ApartmentOutlined />, label: "Variasi Produk" },
            { key: `/user/page/${slug}/license`, icon: <KeyOutlined />, label: "Stok" },
            
            { key: `/user/page/${slug}/change-password`, icon: <SettingOutlined />, label: "Ganti Password" },
            { type: 'divider' },
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
          
          {/* Menu dan tombol atas kanan */}
          <Space>
            {/* Link dengan urutan yang diubah: Ketentuan Layanan - Kebijakan Privasi - Pusat Bantuan */}
            <Button 
              type="text" 
              onClick={() => navigate(`/user/page/${slug}/terms-of-service`)}
            >
              Ketentuan Layanan
            </Button>
            <Button 
              type="text" 
              onClick={() => navigate(`/user/page/${slug}/privacy-policy`)}
            >
              Kebijakan Privasi
            </Button>
            <Button 
              type="text" 
              onClick={() => navigate(`/user/page/${slug}/help-center`)}
            >
              Pusat Bantuan
            </Button>
            
            {/* Tombol Hubungi Kami (dulu Bantuan) dengan tambahan menu dropdown untuk Request Trial */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: '1',
                    label: 'Request Trial',
                    icon: <WhatsAppOutlined />,
                    onClick: requestTrial
                  }
                ]
              }}
            >
              <Button 
                type="text"
                icon={<QuestionCircleOutlined />}
                onClick={() => setShowHelpModal(true)}
              >
                Hubungi Kami
              </Button>
            </Dropdown>
            
            {/* Dropdown untuk Logout (sudah tidak ada Request Trial) */}
            <Dropdown
              menu={{
                items: [
                  {
                    key: '1',
                    label: 'Keluar',
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
          </Space>
        </Header>
        
        {/* Connection Status Banner - Menghilangkan bagian API URL */}
        <div style={{ 
          padding: "8px 16px", 
          background: "#f0f2f5", 
          borderBottom: "1px solid #e8e8e8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <Space>
            <Text strong>Database Connection: </Text>
            <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>
              {user?.backend_url || backendUrl || 'https://db.kinterstore.my.id'}
            </Paragraph>
          </Space>
          <Space>
            <Text>Status: </Text>
            <Tag color={effectiveIsConnected ? "success" : "error"}>
              {effectiveIsConnected ? "Terhubung" : "Terputus"}
            </Tag>
          </Space>
        </div>
        
        {/* Tampilkan peringatan jika langganan kedaluwarsa, tapi tetap izinkan akses ke halaman */}
        {effectiveConnectionStatus === 'subscription_expired' && (
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
            <Route path="/" element={<UserHomeView />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/orders" element={<OrderTable />} />
            <Route path="/software" element={<SoftwareTable />} />
            <Route path="/version" element={<VersionTable />} />
            <Route path="/license" element={<LicenseTable />} />
            <Route path="/backend-settings" element={<BackendSettings />} />
            
            <Route path="/change-password" element={<ChangePass />} />
            <Route path="/help-center" element={<HelpCenter />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
          </Routes>
        </Content>
        
        <Footer style={{ textAlign: 'center' }}>
          <div>
            <strong>Kinterstore</strong> - Sistem Pengiriman Produk Otomatis untuk Shopee © 2025
          </div>
          <div style={{ marginTop: 8 }}>
            <Space>
              <Button 
                type="link" 
                onClick={() => navigate(`/user/page/${slug}/terms-of-service`)}
              >
                Ketentuan Layanan
              </Button>
              <Button 
                type="link" 
                onClick={() => navigate(`/user/page/${slug}/privacy-policy`)}
              >
                Kebijakan Privasi
              </Button>
              <Button 
                type="link" 
                onClick={() => navigate(`/user/page/${slug}/help-center`)}
              >
                Pusat Bantuan
              </Button>
            </Space>
          </div>
        </Footer>
        
        {/* Modal Bantuan */}
        <HelpModal />
      </Layout>
    </Layout>
  );
};

export default UserLayout;