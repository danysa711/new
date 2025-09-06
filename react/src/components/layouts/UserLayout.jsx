// File: react/src/components/layouts/UserLayout.jsx

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
  CopyOutlined,
  WalletOutlined
} from "@ant-design/icons";
import { Button, Layout, Menu, theme, Typography, Card, Badge, Tag, Spin, Space, Dropdown, Alert, Modal, Row, Col, message } from 'antd';
import { Routes, Route, useNavigate, useLocation, useParams, Navigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ConnectionContext } from "../../context/ConnectionContext"; // Import ConnectionContext
import OrderTable from "../tables/OrderTable";
import HomeView from "../tables/HomeView";
import ChangePass from "../../pages/ChangePass";
import SubscriptionPage from "../../pages/user/SubscriptionPage";
import UserPaymentPage from "../../pages/user/UserPaymentPage";
import SoftwareTable from "../tables/SoftwareTable";
import VersionTable from "../tables/VersionTable";
import LicenseTable from "../tables/LicenseTable";
import BackendSettings from "../../pages/user/BackendSettings"; // Impor halaman BackendSettings (buat setelah ini)
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
  const { token, logout, user, fetchUserProfile } = useContext(AuthContext);
  
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
    const fetchUserProfile = async () => {
     try {
       setLoading(true);
       setError(null);
       
       const response = await axiosInstance.get(`/api/user/public/${slug}`);
       setUserProfile(response.data.user);
     } catch (err) {
       setError("Failed to load user profile");
     } finally {
       setLoading(false);
     }
   };
   
   fetchUserProfile();
 }, [token, slug, user, navigate]);

 if (!token) {
   return <Navigate to="/login" />;
 }

 if (loading) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <Spin size="large" spinning={true}>
        <div style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>Loading...</div>
        </div>
      </Spin>
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
 const apiUrl = `${backendUrl || 'https://db.kinterstore.my.id'}/api/public/user/${slug}`;

 
  // Fungsi untuk membuka WhatsApp dengan pesan request trial
const requestTrial = async () => {
  try {
    // Tampilkan loading message
    const hide = message.loading('Memuat pengaturan trial...', 0);
    
    // Variabel untuk menyimpan pengaturan
    let whatsappNumber, messageTemplate, isEnabled;
    
    try {
      // Coba dapatkan dari API
      const response = await axiosInstance.get('/api/settings/whatsapp-trial');
      console.log('API response:', response.data);
      
      whatsappNumber = response.data.whatsappNumber;
      messageTemplate = response.data.messageTemplate;
      isEnabled = response.data.isEnabled;
      
      console.log('Berhasil mengambil data dari API');
    } catch (apiError) {
      console.warn('Gagal mengambil data dari API, beralih ke localStorage', apiError);
      
      // Fallback ke localStorage
      whatsappNumber = localStorage.getItem('whatsapp_trial_number');
      messageTemplate = localStorage.getItem('whatsapp_trial_template');
      isEnabled = localStorage.getItem('whatsapp_trial_enabled') !== 'false';
      
      // Jika localStorage juga kosong, gunakan nilai default hardcoded
      if (!whatsappNumber) whatsappNumber = '6281284712684';
      if (!messageTemplate) messageTemplate = 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}';
      if (isEnabled === null) isEnabled = true;
      
      console.log('Menggunakan data dari localStorage atau default');
    } finally {
      // Hentikan loading
      hide();
    }
    
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
    
    // Hasilkan URL WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
    
    // Buka WhatsApp di tab baru
    window.open(whatsappUrl, '_blank');
    
    console.log('WhatsApp dibuka dengan URL:', whatsappUrl);
  } catch (error) {
    console.error('Error dalam requestTrial:', error);
    message.error('Terjadi kesalahan. Silakan coba lagi nanti.');
  }
};

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
           { key: `/user/page/${slug}`, icon: <HomeOutlined />, label: "Beranda" },
           { key: `/user/page/${slug}/subscription`, icon: <ShoppingOutlined />, label: "Langganan" },
           { key: `/user/page/${slug}/payment`, icon: <WalletOutlined />, label: "Pembayaran" },
           { key: `/user/page/${slug}/orders`, icon: <VideoCameraOutlined />, label: "Pesanan" },
           { key: `/user/page/${slug}/software`, icon: <AppstoreOutlined />, label: "Produk" },
           { key: `/user/page/${slug}/version`, icon: <ApartmentOutlined />, label: "Variasi Produk" },
           { key: `/user/page/${slug}/license`, icon: <KeyOutlined />, label: "Stok" },
           { key: `/user/page/${slug}/change-password`, icon: <SettingOutlined />, label: "Ganti Password" },
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
                 key: '3',
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
         <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ margin: 0 }}>{apiUrl}</Paragraph>
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
           <Route path="/payment" element={<UserPaymentPage />} />
           <Route path="/orders" element={<OrderTable />} />
           <Route path="/software" element={<SoftwareTable />} />
           <Route path="/version" element={<VersionTable />} />
           <Route path="/license" element={<LicenseTable />} />
           <Route path="/backend-settings" element={<BackendSettings />} /> {/* Tambahkan rute ini */}
           <Route path="/change-password" element={<ChangePass />} />
         </Routes>
       </Content>
     </Layout>
   </Layout>
 );
};

export default UserLayout;