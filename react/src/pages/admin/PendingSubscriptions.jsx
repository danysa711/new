// react/src/pages/admin/PendingSubscriptions.jsx (Diperbarui dengan History Pembelian)

import React, { useState, useEffect } from 'react';
import {
  Table, Button, Space, Tag, Card, Typography, message, 
  Modal, Descriptions, Spin, Empty, Popconfirm, Badge,
  Alert, Row, Col, Statistic, Tooltip, Tabs, Divider
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  ClockCircleOutlined, ExclamationCircleOutlined,
  UserOutlined, MailOutlined, PhoneOutlined,
  HistoryOutlined, FileSearchOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PendingSubscriptions = () => {
  const [loading, setLoading] = useState(false);
  const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    expiringSoon: 0
  });
  
  // State untuk history pembelian
  const [userHistory, setUserHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch pending subscriptions
  const fetchPendingSubscriptions = async () => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.get('/api/subscriptions/pending/admin');
      
      // Sort by creation date (newest first)
      const sortedData = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setPendingSubscriptions(sortedData);
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayCount = response.data.filter(sub => 
        new Date(sub.createdAt) >= today
      ).length;
      
      const expiringSoon = response.data.filter(sub => {
        const expireDate = new Date(sub.expired_at);
        const now = new Date();
        const diff = expireDate - now;
        // Consider "expiring soon" if less than 3 hours remaining
        return diff > 0 && diff <= 3 * 60 * 60 * 1000;
      }).length;
      
      setStats({
        total: response.data.length,
        today: todayCount,
        expiringSoon: expiringSoon
      });
    } catch (error) {
      console.error('Error fetching pending subscriptions:', error);
      message.error('Gagal memuat data langganan tertunda');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch user's subscription history
  const fetchUserSubscriptionHistory = async (userId) => {
    if (!userId) return;
    
    try {
      setHistoryLoading(true);
      
      const response = await axiosInstance.get(`/api/subscriptions/history/${userId}`);
      
      // Sort by creation date (newest first)
      const sortedHistory = response.data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setUserHistory(sortedHistory);
    } catch (error) {
      console.error('Error fetching user subscription history:', error);
      message.error('Gagal memuat riwayat langganan pengguna');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingSubscriptions();
    
    // Poll for updates every minute
    const intervalId = setInterval(() => {
      fetchPendingSubscriptions();
    }, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle view subscription details
  const handleViewDetails = (subscription) => {
    setSelectedSubscription(subscription);
    
    // Fetch user's subscription history when viewing details
    if (subscription.User?.id) {
      fetchUserSubscriptionHistory(subscription.User.id);
    }
    
    setModalVisible(true);
  };

  // Handle verify subscription
  const handleVerifySubscription = async (subscription) => {
    try {
      setVerifyLoading(true);
      
      await axiosInstance.post('/api/subscriptions/verify', {
        subscription_id: subscription.id,
        action: 'approve'
      });
      
      message.success('Pembayaran berhasil diverifikasi');
      fetchPendingSubscriptions();
      
      if (modalVisible) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error verifying subscription:', error);
      message.error('Gagal memverifikasi pembayaran');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle reject subscription
  const handleRejectSubscription = async (subscription) => {
    try {
      setRejectLoading(true);
      
      await axiosInstance.post('/api/subscriptions/verify', {
        subscription_id: subscription.id,
        action: 'reject'
      });
      
      message.success('Pembayaran berhasil ditolak');
      fetchPendingSubscriptions();
      
      if (modalVisible) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error rejecting subscription:', error);
      message.error('Gagal menolak pembayaran');
    } finally {
      setRejectLoading(false);
    }
  };

  // Calculate time remaining
  const calculateTimeRemaining = (expiredAt) => {
    const now = new Date();
    const expireDate = new Date(expiredAt);
    const diffMs = expireDate - now;
    
    if (diffMs <= 0) {
      return <Text type="danger">Kedaluwarsa</Text>;
    }
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours < 1) {
      return <Text type="danger">{diffMinutes} menit</Text>;
    } else if (diffHours < 3) {
      return <Text type="warning">{diffHours} jam {diffMinutes} menit</Text>;
    } else {
      return <Text>{diffHours} jam {diffMinutes} menit</Text>;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Table columns
  const columns = [
    {
      title: 'Pengguna',
      dataIndex: 'User',
      key: 'user',
      render: (user) => (
        <Space direction="vertical" size={0}>
          <Space>
            <UserOutlined />
            <Text strong>{user?.username}</Text>
          </Space>
          <Space>
            <MailOutlined />
            <Text>{user?.email}</Text>
          </Space>
          <Space>
            <PhoneOutlined />
            <Text>{user?.phone || '-'}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Paket',
      dataIndex: 'SubscriptionPlan',
      key: 'plan',
      render: (plan) => (
        <Space direction="vertical" size={0}>
          <Text strong>{plan?.name}</Text>
          <Text>{plan?.duration_days} hari</Text>
          <Text type="success">{plan?.price ? formatCurrency(plan.price) : '-'}</Text>
        </Space>
      ),
    },
    {
      title: 'ID Pesanan',
      dataIndex: 'tripay_merchant_ref',
      key: 'reference',
      render: (text) => (
        <Text copyable>{text}</Text>
      ),
    },
    {
      title: 'Tanggal Dibuat',
      dataIndex: 'createdAt',
      key: 'created_at',
      render: (date) => (
        <Tooltip title={moment(date).format('DD MMM YYYY HH:mm:ss')}>
          {moment(date).fromNow()}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Sisa Waktu',
      dataIndex: 'expired_at',
      key: 'time_remaining',
      render: (date) => calculateTimeRemaining(date),
      sorter: (a, b) => new Date(a.expired_at) - new Date(b.expired_at)
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Detail
          </Button>
          <Popconfirm
            title="Verifikasi pembayaran ini?"
            description="Tindakan ini akan mengaktifkan langganan pengguna."
            onConfirm={() => handleVerifySubscription(record)}
            okText="Ya"
            cancelText="Tidak"
            icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          >
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Verifikasi
            </Button>
          </Popconfirm>
          <Popconfirm
            title="Tolak pembayaran ini?"
            description="Tindakan ini akan menolak pembayaran dan membatalkan langganan."
            onConfirm={() => handleRejectSubscription(record)}
            okText="Ya"
            cancelText="Tidak"
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          >
            <Button
              type="primary"
              size="small"
              danger
              icon={<CloseCircleOutlined />}
            >
              Tolak
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // Columns for history table
  const historyColumns = [
    {
      title: 'Tanggal',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Paket',
      key: 'plan',
      render: (_, record) => (
        <Text>{record.SubscriptionPlan?.name || '-'}</Text>
      ),
    },
    {
      title: 'Durasi',
      key: 'duration',
      render: (_, record) => (
        <Text>{record.SubscriptionPlan?.duration_days || '-'} hari</Text>
      ),
    },
    {
      title: 'Harga',
      key: 'price',
      render: (_, record) => (
        <Text>{record.SubscriptionPlan?.price ? formatCurrency(record.SubscriptionPlan.price) : '-'}</Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        if (status === 'active') {
          const now = new Date();
          const endDate = new Date(record.end_date);
          
          if (endDate > now) {
            return <Tag color="success">AKTIF</Tag>;
          } else {
            return <Tag color="error">KADALUWARSA</Tag>;
          }
        } else if (status === 'pending') {
          return <Tag color="warning">MENUNGGU</Tag>;
        } else if (status === 'canceled') {
          return <Tag color="error">DIBATALKAN</Tag>;
        }
        
        return <Tag>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Pembayaran',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => {
        if (status === 'paid') {
          return <Tag color="success">LUNAS</Tag>;
        } else if (status === 'pending') {
          return <Tag color="warning">MENUNGGU</Tag>;
        } else if (status === 'failed') {
          return <Tag color="error">GAGAL</Tag>;
        }
        
        return <Tag>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={2}>Pesanan Menunggu Verifikasi</Title>
      
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Menunggu Verifikasi"
              value={stats.total}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Pesanan Baru Hari Ini"
              value={stats.today}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Kedaluwarsa Dalam 3 Jam"
              value={stats.expiringSoon}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card>
        <Table
          loading={loading}
          dataSource={pendingSubscriptions}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: (
              <Empty
                description="Tidak ada pesanan menunggu verifikasi"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
      
      {/* Subscription Detail Modal with Tabs */}
      <Modal
        title="Detail Pesanan"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={
          selectedSubscription ? [
            <Button 
              key="reject" 
              danger
              loading={rejectLoading}
              onClick={() => handleRejectSubscription(selectedSubscription)}
            >
              Tolak Pembayaran
            </Button>,
            <Button 
              key="verify" 
              type="primary" 
              loading={verifyLoading}
              onClick={() => handleVerifySubscription(selectedSubscription)}
            >
              Verifikasi Pembayaran
            </Button>,
          ] : null
        }
        width={800}
      >
        {selectedSubscription ? (
          <Tabs defaultActiveKey="details">
            <TabPane 
              tab={
                <span>
                  <FileSearchOutlined />
                  Detail Pesanan
                </span>
              } 
              key="details"
            >
              <Descriptions title="Informasi Pengguna" bordered column={1}>
                <Descriptions.Item label="Username">
                  {selectedSubscription.User?.username || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedSubscription.User?.email || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Nomor Telepon">
                  {selectedSubscription.User?.phone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="URL Slug">
                  {selectedSubscription.User?.url_slug || '-'}
                </Descriptions.Item>
              </Descriptions>
              
              <Divider />
              
              <Descriptions title="Detail Pesanan" bordered column={1}>
                <Descriptions.Item label="ID Pesanan">
                  <Text copyable>{selectedSubscription.tripay_merchant_ref}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Tanggal Dibuat">
                  {moment(selectedSubscription.createdAt).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="Batas Waktu">
                  {moment(selectedSubscription.expired_at).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="Sisa Waktu">
                  {calculateTimeRemaining(selectedSubscription.expired_at)}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="warning">MENUNGGU VERIFIKASI</Tag>
                </Descriptions.Item>
              </Descriptions>
              
              <Divider />
              
              <Descriptions title="Informasi Paket Langganan" bordered column={1}>
                <Descriptions.Item label="Nama Paket">
                  {selectedSubscription.SubscriptionPlan?.name || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Durasi">
                  {selectedSubscription.SubscriptionPlan?.duration_days || '-'} hari
                </Descriptions.Item>
                <Descriptions.Item label="Harga">
                  <Text strong type="success">
                    {selectedSubscription.SubscriptionPlan?.price ? 
                      formatCurrency(selectedSubscription.SubscriptionPlan.price) : 
                      '-'
                    }
                  </Text>
                </Descriptions.Item>
              </Descriptions>
              
              <Alert
                message="Petunjuk"
                description="Verifikasi pembayaran ini jika pengguna telah melakukan pembayaran sesuai dengan nominal yang ditentukan. Tindakan ini akan mengaktifkan langganan pengguna."
                type="info"
                showIcon
                style={{ marginTop: 16 }}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <HistoryOutlined />
                  Riwayat Pembelian
                </span>
              } 
              key="history"
            >
              {historyLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                  <Spin />
                  <div style={{ marginTop: 8 }}>Memuat riwayat pembelian...</div>
                </div>
              ) : (
                <>
                  <Alert
                    message="Riwayat Pembelian Pengguna"
                    description={`Berikut adalah riwayat pembelian langganan oleh ${selectedSubscription.User?.username || 'pengguna ini'}.`}
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  
                  {userHistory.length > 0 ? (
                    <Table
                      dataSource={userHistory}
                      columns={historyColumns}
                      rowKey="id"
                      pagination={{ pageSize: 5 }}
                    />
                  ) : (
                    <Empty 
                      description="Pengguna belum memiliki riwayat pembelian sebelumnya"
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                    />
                  )}
                  
                  <div style={{ marginTop: 16 }}>
                    <Descriptions bordered>
                      <Descriptions.Item label="Total Pembelian" span={3}>
                        {userHistory.length}
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Langganan Aktif" span={3}>
                        {userHistory.filter(sub => 
                          sub.status === 'active' && new Date(sub.end_date) > new Date()
                        ).length}
                      </Descriptions.Item>
                      <Descriptions.Item label="Total Pembayaran Berhasil" span={3}>
                        {userHistory.filter(sub => sub.payment_status === 'paid').length}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                </>
              )}
            </TabPane>
          </Tabs>
        ) : (
          <Spin size="large" />
        )}
      </Modal>
    </div>
  );
};

export default PendingSubscriptions;