import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Statistic, 
  Alert, Spin, Empty, Space, Progress, Tag, Tooltip, Modal
} from 'antd';
import { 
  WhatsAppOutlined, ClockCircleOutlined, LinkOutlined,
  ExclamationCircleOutlined, ReloadOutlined, CalendarOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';
import { ConnectionContext } from '../../context/ConnectionContext';

const { Title, Text, Paragraph } = Typography;

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

const SubscriptionPage = () => {
  // Ambil user, updateUserData, dan fetchUserProfile dari AuthContext
  const { user, fetchUserProfile } = useContext(AuthContext);
  const { backendUrl, userBackendUrl, checkConnection } = useContext(ConnectionContext);
  
  // Inisialisasi dari localStorage atau default
  const storedSubscription = getLocalStorage('user_subscription', null);
  const storedSettings = getLocalStorage('app_settings', DEFAULT_SETTINGS);
  
  const [activeSubscription, setActiveSubscription] = useState(storedSubscription);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [whatsappSettings, setWhatsappSettings] = useState(storedSettings.whatsapp);
  const [refreshing, setRefreshing] = useState(false);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate remaining days
  const calculateRemainingDays = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Calculate percentage of subscription used
  const calculateProgressPercentage = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    
    const totalDuration = end - start;
    const elapsed = today - start;
    
    // Jika sudah lewat tanggal akhir
    if (today > end) return 100;
    
    // Jika belum mencapai tanggal mulai
    if (today < start) return 0;
    
    return Math.floor((elapsed / totalDuration) * 100);
  };
  
  // Perbarui fungsi requestSubscription
  const requestSubscription = () => {
    // Format pesan dengan mengganti variabel
    const message = whatsappSettings.message
      .replace('{username}', user?.username || '')
      .replace('{email}', user?.email || '')
      .replace('{purpose}', 'berlangganan')
      .replace('{url_slug}', user?.url_slug || '');
    
    const waLink = `https://wa.me/${whatsappSettings.phone}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleRefreshSubscription = async () => {
    try {
      setRefreshing(true);
      
      // Refresh user profile untuk mendapatkan status langganan terbaru
      if (fetchUserProfile) {
        await fetchUserProfile();
      }
      
      // Re-fetch subscription data
      await fetchData();
      
      // Re-check connection status
      if (checkConnection) {
        await checkConnection();
      }
      
      Modal.success({
        title: 'Status Berhasil Diperbarui',
        content: 'Status langganan Anda telah berhasil diperbarui.',
      });
    } catch (error) {
      console.error("Error refreshing subscription status:", error);
      Modal.error({
        title: 'Gagal Memperbarui Status',
        content: 'Terjadi kesalahan saat memperbarui status langganan. Silakan coba lagi nanti.',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Fetch user subscriptions - pertama coba dari API
      try {
        const subsResponse = await axiosInstance.get('/api/subscriptions/user');
        
        // Sort subscriptions by start date (newest first)
        const subsData = subsResponse.data.sort((a, b) => 
          new Date(b.start_date) - new Date(a.start_date)
        );
        
        // Find active subscription
        const activeSubData = subsResponse.data.find(
          (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
        );
        
        // Simpan ke localStorage untuk fallback
        if (activeSubData) {
          setLocalStorage('user_subscription', activeSubData);
        }
        
        setActiveSubscription(activeSubData);
      } catch (err) {
        console.error('Error fetching user subscriptions:', err);
        
        // Jika user aktif tapi tidak ada data langganan, buat sementara
        if (user?.hasActiveSubscription && !activeSubscription) {
          console.log('Creating temporary subscription data for active user');
          const tempSubscription = {
            id: 0,
            user_id: user.id,
            start_date: new Date().toISOString(),
            end_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
            status: "active",
            payment_status: "paid",
            payment_method: "manual",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          setLocalStorage('user_subscription', tempSubscription);
          setActiveSubscription(tempSubscription);
        } else if (storedSubscription) {
          console.log('Using local subscription data');
          setActiveSubscription(storedSubscription);
        }
      }
      
      // Jika status berlangganan berubah, perbarui user context
      if (fetchUserProfile) {
        try {
          await fetchUserProfile();
        } catch (profileErr) {
          console.error('Error updating user profile:', profileErr);
        }
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  // Dalam useEffect, tambahkan kode untuk mengambil pengaturan
  useEffect(() => {
    // Coba ambil dari API
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
    
    const fetchSubscriptions = async () => {
      try {
        await fetchData();
      } catch (err) {
        console.error('Error in fetchData:', err);
        setLoading(false);
      }
    };
    
    // Panggil kedua fungsi secara terpisah agar jika salah satu gagal, yang lain tetap berjalan
    fetchSettings();
    fetchSubscriptions();
  }, []);

  // API URL
  const apiUrl = userBackendUrl || `${backendUrl}/api/user/${user?.url_slug}`;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Langganan</Title>

      {/* API URL */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>URL API</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Backend URL:</Text>
          <Paragraph copyable style={{ marginBottom: 16 }}>{backendUrl}</Paragraph>
          
          <Text strong>User Backend URL:</Text>
          <Paragraph copyable>{apiUrl}</Paragraph>
        </Space>
      </Card>

      {/* Status Langganan Section */}
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Status Langganan</Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefreshSubscription}
              loading={refreshing}
            >
              Refresh Status
            </Button>
          </div>
        } 
        style={{ marginBottom: 24 }}
      >
        {activeSubscription ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card bordered={false} style={{ background: '#f9f9f9' }}>
                <Statistic
                  title="Sisa Waktu Langganan"
                  value={calculateRemainingDays(activeSubscription.end_date)}
                  suffix="hari"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<ClockCircleOutlined />}
                />
                <Progress 
                  percent={calculateProgressPercentage(
                    activeSubscription.start_date, 
                    activeSubscription.end_date
                  )} 
                  status={
                    calculateRemainingDays(activeSubscription.end_date) <= 7 
                      ? "exception" 
                      : "active"
                  }
                  style={{ marginTop: 16 }}
                />
              </Card>
            </Col>
            
            <Col xs={24} md={12}>
              <div style={{ marginBottom: 16 }}>
                <Space align="center">
                  <CalendarOutlined />
                  <Text strong>Tanggal Mulai: </Text> 
                  <Text>{formatDate(activeSubscription.start_date)}</Text>
                </Space>
              </div>
              <div style={{ marginBottom: 16 }}>
                <Space align="center">
                  <CalendarOutlined />
                  <Text strong>Tanggal Berakhir: </Text> 
                  <Text>{formatDate(activeSubscription.end_date)}</Text>
                </Space>
              </div>
              <div>
                <Space align="center">
                  <Text strong>Status Pembayaran: </Text> 
                  <Tag color={
                    activeSubscription.payment_status === 'paid' ? 'success' : 
                    activeSubscription.payment_status === 'pending' ? 'warning' : 'error'
                  }>
                    {activeSubscription.payment_status === 'paid' ? 'LUNAS' : 
                     activeSubscription.payment_status === 'pending' ? 'MENUNGGU' : 'GAGAL'}
                  </Tag>
                </Space>
              </div>
            </Col>
            
            {calculateRemainingDays(activeSubscription.end_date) <= 7 && (
              <Col span={24}>
                <Alert
                  message="Langganan Akan Segera Berakhir"
                  description={`Langganan Anda akan berakhir dalam ${calculateRemainingDays(activeSubscription.end_date)} hari. Silakan perbarui langganan Anda untuk menghindari gangguan layanan.`}
                  type="warning"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  style={{ marginTop: 16 }}
                />
              </Col>
            )}
          </Row>
        ) : (
          <div>
            <Empty 
              description="Anda belum memiliki langganan aktif"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <Alert
              message="Langganan Tidak Aktif"
              description="Beberapa fitur aplikasi tidak tersedia karena Anda belum berlangganan. Silakan hubungi admin untuk mengaktifkan langganan."
              type="error"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          </div>
        )}
        
        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Button 
            type="primary" 
            size="large" 
            icon={<WhatsAppOutlined />}
            onClick={requestSubscription}
          >
            Hubungi Admin untuk Berlangganan
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionPage;