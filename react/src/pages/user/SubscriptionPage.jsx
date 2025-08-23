import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Statistic, 
  Alert, Spin, Empty, Space
} from 'antd';
import { 
  WhatsAppOutlined, ClockCircleOutlined, LinkOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';
import { ConnectionContext } from '../../context/ConnectionContext';

const { Title, Text, Paragraph } = Typography;

const SubscriptionPage = () => {
  // Ambil user, updateUserData, dan fetchUserProfile dari AuthContext
  const { user, fetchUserProfile } = useContext(AuthContext);
  const { backendUrl, userBackendUrl } = useContext(ConnectionContext);
  
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const [whatsappSettings, setWhatsappSettings] = useState({
  phone: "6281234567890",
  message: "Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
  });

  // Calculate remaining days
  const calculateRemainingDays = (endDate) => {
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Fungsi untuk membuka WhatsApp dengan pesan request langganan
  const requestSubscription = () => {
    // Pesan WhatsApp dengan format yang berisi informasi user
    const message = `Halo, saya ${user.username} (${user.email}) ingin berlangganan. URL Slug: ${user.url_slug}`;
    const waLink = `https://wa.me/6281234567890?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
  
      // Fetch user subscriptions
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
        
        setActiveSubscription(activeSubData);
        
        // Jika status berlangganan berubah, perbarui user context
        if (fetchUserProfile) {
          fetchUserProfile();
        }
      } catch (err) {
        console.error('Error fetching user subscriptions:', err);
        setActiveSubscription(null);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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

      {/* Active Subscription Section */}
      <Card 
        title={<Title level={4}>Status Langganan</Title>} 
        style={{ marginBottom: 24 }}
      >
        {activeSubscription ? (
          <Row gutter={[24, 24]}>
            <Col span={24}>
              <Statistic
                title="Sisa Waktu Langganan"
                value={calculateRemainingDays(activeSubscription.end_date)}
                suffix="hari"
                valueStyle={{ color: '#3f8600' }}
                prefix={<ClockCircleOutlined />}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong>Mulai: </Text> 
                <Text>{formatDate(activeSubscription.start_date)}</Text>
              </div>
              <div>
                <Text strong>Berakhir: </Text> 
                <Text>{formatDate(activeSubscription.end_date)}</Text>
              </div>
            </Col>
          </Row>
        ) : (
          <Empty 
            description="Anda belum memiliki langganan aktif"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
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