// react/src/pages/user/SubscriptionPage.jsx (Versi yang Diperbarui)

import React, { useState, useEffect, useContext } from 'react';
import {
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Input, Form, message, Tabs, Timeline,
  Space
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, BankOutlined, WalletOutlined,
  InfoCircleOutlined, CreditCardOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, DollarOutlined, ReloadOutlined,
  PhoneOutlined, DeleteOutlined, ExclamationCircleOutlined,
  UserOutlined, MailOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const SubscriptionPage = () => {
  const { user, fetchUserProfile } = useContext(AuthContext);
  
  // State variables
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  const [form] = Form.useForm();
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Helper Functions
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Format countdown time
  const formatCountdown = (expiredAt) => {
    if (!expiredAt) return '-';
    
    const now = new Date();
    const expired = new Date(expiredAt);
    const diffTime = expired - now;
    
    if (diffTime <= 0) {
      return 'Kedaluwarsa';
    }
    
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours} jam ${diffMinutes} menit`;
  };

  // Event Handlers
  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    form.resetFields();
    setPaymentResult(null);
    setPaymentModalVisible(true);
  };
  
  const handleCancelOrder = (order) => {
    setSelectedOrder(order);
    setCancelModalVisible(true);
  };

  const confirmCancelOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setCancelLoading(true);
      
      await axiosInstance.delete(`/api/subscriptions/order/${selectedOrder.id}`);
      
      // Refresh data
      fetchPendingOrders();
      message.success('Pesanan berhasil dibatalkan');
      
      // Tutup modal
      setCancelModalVisible(false);
      setSelectedOrder(null);
    } catch (error) {
      console.error('Error canceling order:', error);
      message.error('Gagal membatalkan pesanan');
    } finally {
      setCancelLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      
      // Validasi form
      const values = await form.validateFields();
      
      // Kirim permintaan ke server
      const response = await axiosInstance.post('/api/subscriptions/order', {
        plan_id: selectedPlan.id,
        payment_method: 'MANUAL',
        phone_number: values.phone_number
      });
      
      // Tampilkan hasil pembayaran
      setPaymentResult(response.data);
      
      // Refresh data
      fetchPendingOrders();
      
      // Refresh profil pengguna untuk memperbarui status langganan
      if (fetchUserProfile) {
        fetchUserProfile();
      }
      
    } catch (error) {
      console.error('Error processing payment:', error);
      message.error(error.response?.data?.error || 'Gagal memproses pembayaran');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fungsi untuk memuat data
  const fetchSubscriptionPlans = async () => {
    try {
      const response = await axiosInstance.get('/api/subscription-plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      message.error('Gagal memuat data paket langganan');
      // Gunakan data dummy jika API gagal
      setPlans([
        {
          id: 1,
          name: '1 Bulan',
          price: 100000,
          duration_days: 30,
          description: 'Langganan selama 1 bulan'
        },
        {
          id: 2,
          name: '3 Bulan',
          price: 270000,
          duration_days: 90,
          description: 'Langganan selama 3 bulan (Hemat 10%)'
        },
        {
          id: 3,
          name: '6 Bulan',
          price: 500000,
          duration_days: 180,
          description: 'Langganan selama 6 bulan (Hemat 17%)'
        }
      ]);
    }
  };

  const fetchUserSubscriptions = async () => {
    try {
      const response = await axiosInstance.get('/api/subscriptions/user');
      
      // Urutkan berdasarkan tanggal mulai (terbaru dulu)
      const sortedSubs = response.data.sort((a, b) => 
        new Date(b.start_date) - new Date(a.start_date)
      );
      
      setSubscriptions(sortedSubs);

      // Temukan langganan aktif
      const active = response.data.find(
        (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
      );
      
      setActiveSubscription(active);
      
      // Jika status berlangganan berubah, perbarui user context
      if (active && user && !user.hasActiveSubscription && fetchUserProfile) {
        fetchUserProfile();
      }
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      setSubscriptions([]);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const response = await axiosInstance.get('/api/subscriptions/pending');
      setPendingOrders(response.data);
    } catch (error) {
      console.error('Error fetching pending orders:', error);
      setPendingOrders([]);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await axiosInstance.get('/api/payment-settings');
      setPaymentSettings(response.data);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      // Set pengaturan default jika API gagal
      setPaymentSettings({
        payment_expiry_hours: 24,
        qris_image_url: "https://example.com/qris.png",
        account_number: "1234567890",
        account_name: "PT Demo Store",
        bank_name: "BCA",
        max_pending_orders: 3
      });
    }
  };

  // Fetch data saat komponen di-mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Memuat semua data secara paralel
        await Promise.all([
          fetchSubscriptionPlans(),
          fetchUserSubscriptions(),
          fetchPendingOrders(),
          fetchPaymentSettings()
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Gagal memuat data. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Polling untuk memeriksa status langganan setiap 1 menit
    const intervalId = setInterval(() => {
      fetchUserSubscriptions();
      fetchPendingOrders();
    }, 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Render payment instructions
  const renderPaymentInstructions = () => {
    if (!paymentResult || !paymentSettings) return null;
    
    return (
      <div style={{ marginTop: 20 }}>
        <Divider />
        <Title level={4}>Instruksi Pembayaran</Title>
        
        {/* Tampilkan QRIS jika ada */}
        {paymentSettings.qris_image_url && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img 
              src={paymentSettings.qris_image_url} 
              alt="QRIS" 
              style={{ maxWidth: '250px', margin: '20px auto' }} 
            />
            <Text>Scan QR Code di atas menggunakan aplikasi e-wallet atau mobile banking Anda</Text>
          </div>
        )}
        
        {/* Tampilkan Rekening Bank jika ada */}
        {paymentSettings.account_number && (
          <div>
            <Alert
              message={`Rekening ${paymentSettings.bank_name || 'Bank'}`}
              description={
                <>
                  <Text copyable strong style={{ fontSize: '16px' }}>
                    {paymentSettings.account_number}
                  </Text>
                  {paymentSettings.account_name && (
                    <div style={{ marginTop: 8 }}>
                      a/n {paymentSettings.account_name}
                    </div>
                  )}
                </>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
          </div>
        )}
        
        <Alert
          message="Petunjuk Pembayaran"
          description={
            <ol style={{ paddingLeft: 20 }}>
              <li>Transfer sesuai dengan nominal pembayaran ke rekening/QRIS di atas</li>
              <li>Pembayaran akan diverifikasi oleh admin dalam waktu 1x24 jam</li>
              <li>Status langganan Anda akan otomatis diperbarui setelah pembayaran diverifikasi</li>
              <li>Jika dalam {paymentSettings.payment_expiry_hours || 24} jam pembayaran tidak dilakukan, pesanan akan otomatis dibatalkan</li>
            </ol>
          }
          type="info"
          showIcon
          style={{ marginBottom: 20 }}
        />
        
        <Alert 
          message="Penting!" 
          description={`Lakukan pembayaran sebelum ${moment(paymentResult.subscription.expired_at).format('DD MMMM YYYY HH:mm')} atau pesanan akan dibatalkan otomatis.`}
          type="warning" 
          showIcon 
          style={{ marginTop: 20 }}
        />
      </div>
    );
  };

  // Render hasil pembayaran
  const renderPaymentResult = () => {
    if (!paymentResult) return null;

    const { subscription, payment_info } = paymentResult;
    
    return (
      <div>
        <Result
          status="success"
          title="Pesanan Berhasil Dibuat"
          subTitle={
            <div>
              <div>Referensi: {subscription.reference}</div>
              <div>Status: <Tag color="warning">MENUNGGU VERIFIKASI</Tag></div>
            </div>
          }
        />
        
        <Descriptions
          title="Detail Pesanan"
          bordered
          column={1}
          style={{ marginBottom: 20 }}
        >
          <Descriptions.Item label="Referensi">
            <Text copyable>{subscription.reference}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Paket">
            {subscription.plan_name}
          </Descriptions.Item>
          <Descriptions.Item label="Durasi">
            {subscription.duration_days} hari
          </Descriptions.Item>
          <Descriptions.Item label="Jumlah">
            <Text strong>
              {formatCurrency(subscription.amount)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Batas Waktu">
            {moment(subscription.expired_at).format('DD MMMM YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>
        
        {renderPaymentInstructions()}
      </div>
    );
  };

  // Render loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat data langganan...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div>
        <Title level={2}>Langganan</Title>
        <Alert
          message="Terjadi Kesalahan"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          action={
            <Button type="primary" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Langganan</Title>

      {/* Active Subscription Section */}
      <Card 
        title={<Title level={4}>Status Langganan</Title>} 
        style={{ marginBottom: 24 }}
        extra={
          activeSubscription ? (
            <Tag color="success" style={{ fontSize: '14px', padding: '4px 8px' }}>AKTIF</Tag>
          ) : (
            <Tag color="error" style={{ fontSize: '14px', padding: '4px 8px' }}>TIDAK AKTIF</Tag>
          )
        }
      >
        {activeSubscription ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Sisa Waktu Langganan"
                value={calculateRemainingDays(activeSubscription.end_date)}
                suffix="hari"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Mulai Langganan">
                  {formatDate(activeSubscription.start_date)}
                </Descriptions.Item>
                <Descriptions.Item label="Berakhir Pada">
                  {formatDate(activeSubscription.end_date)}
                </Descriptions.Item>
                <Descriptions.Item label="Status Pembayaran">
                  <Tag color={activeSubscription.payment_status === 'paid' ? 'green' : 'orange'}>
                    {activeSubscription.payment_status === 'paid' ? 'LUNAS' : 'MENUNGGU'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Metode Pembayaran">
                  {activeSubscription.payment_method || 'Manual'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        ) : (
          <Result
            status="warning"
            title="Anda belum memiliki langganan aktif"
            subTitle="Silakan pilih paket langganan di bawah untuk mengaktifkan fitur penuh"
            extra={
              <Button type="primary" onClick={() => window.scrollTo({
                top: document.getElementById('subscription-plans').offsetTop - 20,
                behavior: 'smooth'
              })}>
                Lihat Paket Langganan
              </Button>
            }
          />
        )}
      </Card>
      
      {/* Pending Orders Section - New */}
      {pendingOrders.length > 0 && (
        <Card 
          title={<Title level={4}>Pembayaran Menunggu Verifikasi</Title>} 
          style={{ marginBottom: 24 }}
        >
          <Row gutter={[16, 16]}>
            {pendingOrders.map(order => (
              <Col xs={24} sm={12} md={8} key={order.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  actions={[
                    <Button 
                      type="link"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => handleCancelOrder(order)}
                    >
                      Batalkan
                    </Button>
                  ]}
                >
                  <Statistic
                    title={order.SubscriptionPlan?.name || 'Paket Langganan'}
                    value={order.SubscriptionPlan?.price ? formatCurrency(order.SubscriptionPlan.price) : '-'}
                    valueStyle={{ color: '#1677ff' }}
                  />
                  <Divider style={{ margin: '12px 0' }} />
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Text strong>ID: {order.tripay_merchant_ref}</Text>
                    <Text>Durasi: {order.SubscriptionPlan?.duration_days || '-'} hari</Text>
                    <Text type="secondary">
                      <ClockCircleOutlined /> Kedaluwarsa dalam: {formatCountdown(order.expired_at)}
                    </Text>
                  </Space>

                  {/* Tampilkan Instruksi Pembayaran */}
                  <Divider style={{ margin: '12px 0' }} />
                  <div style={{ textAlign: 'center' }}>
                    {order.payment_info?.qris_image_url && (
                      <img 
                        src={order.payment_info.qris_image_url} 
                        alt="QRIS" 
                        style={{ maxWidth: '120px', marginBottom: '12px' }}
                      />
                    )}
                    
                    {order.payment_info?.account_number && (
                      <div>
                        <Text copyable strong>
                          {order.payment_info.account_number}
                        </Text>
                        <br />
                        <Text type="secondary">
                          {order.payment_info.bank_name} a/n {order.payment_info.account_name}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Available Plans Section */}
      <div id="subscription-plans">
        <Title level={4}>Paket Langganan Tersedia</Title>
        <Row gutter={[16, 16]}>
          {plans.length > 0 ? plans.map((plan) => (
            <Col xs={24} sm={12} md={8} lg={6} key={plan.id}>
              <Card
                hoverable
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{plan.name}</span>
                    <Tag color="green">{formatCurrency(plan.price)}</Tag>
                  </div>
                }
                actions={[
                  <Button 
                    type="primary" 
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handlePurchase(plan)}
                    block
                    disabled={pendingOrders.length >= (paymentSettings?.max_pending_orders || 3)}
                  >
                    Beli Sekarang
                  </Button>
                ]}
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{plan.duration_days} hari</Text>
                </div>
                <div>{plan.description || `Langganan standar selama ${plan.name}`}</div>
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Empty description="Belum ada paket langganan tersedia" />
            </Col>
          )}
        </Row>
        
        {pendingOrders.length >= (paymentSettings?.max_pending_orders || 3) && (
          <Alert
            message="Batas Pesanan Tercapai"
            description={`Anda memiliki ${pendingOrders.length} pesanan yang menunggu verifikasi. Selesaikan pembayaran atau batalkan pesanan yang ada untuk membuat pesanan baru.`}
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>

      <Divider />
      
      {/* Subscription History Table */}
      <Title level={4}>Riwayat Langganan</Title>
      <Table
        dataSource={subscriptions}
        rowKey="id"
        columns={[
          {
            title: 'Tanggal Mulai',
            dataIndex: 'start_date',
            key: 'start_date',
            render: (date) => formatDate(date),
            sorter: (a, b) => new Date(b.start_date) - new Date(a.start_date),
            defaultSortOrder: 'descend',
          },
          {
            title: 'Tanggal Berakhir',
            dataIndex: 'end_date',
            key: 'end_date',
            render: (date) => formatDate(date),
          },
          {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status, record) => {
              let color = 'default';
              let displayText = status.toUpperCase();
              
              if (status === 'active') {
                const now = new Date();
                const endDate = new Date(record.end_date);
                
                if (endDate > now) {
                  color = 'success';
                  displayText = 'AKTIF';
                } else {
                  color = 'error';
                  displayText = 'KADALUARSA';
                }
              } else if (status === 'pending') {
                color = 'warning';
                displayText = 'MENUNGGU';
              } else if (status === 'canceled') {
                color = 'error';
                displayText = 'DIBATALKAN';
              }
              
              return <Tag color={color}>{displayText}</Tag>;
            },
            filters: [
              { text: 'Aktif', value: 'active' },
              { text: 'Menunggu', value: 'pending' },
              { text: 'Dibatalkan', value: 'canceled' },
            ],
            onFilter: (value, record) => record.status === value,
          },
          {
            title: 'Status Pembayaran',
            dataIndex: 'payment_status',
            key: 'payment_status',
            render: (status) => {
              const statusMap = {
                'paid': { color: 'green', text: 'LUNAS' },
                'pending': { color: 'orange', text: 'MENUNGGU' },
                'failed': { color: 'red', text: 'GAGAL' }
              };
              
              const { color, text } = statusMap[status] || { color: 'default', text: status.toUpperCase() };
              
              return <Tag color={color}>{text}</Tag>;
            }
          },
          {
            title: 'Metode Pembayaran',
            dataIndex: 'payment_method',
            key: 'payment_method',
            render: (method) => method || 'Manual',
          },
        ]}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: 'Belum ada riwayat langganan' }}
      />

      {/* Payment Modal */}
      <Modal
        title={paymentResult ? "Detail Pesanan" : "Pembayaran Langganan"}
        open={paymentModalVisible}
        onCancel={() => {
          if (!paymentLoading) {
            setPaymentModalVisible(false);
            setPaymentResult(null);
          }
        }}
        footer={
          paymentResult ? [
            <Button key="close" onClick={() => setPaymentModalVisible(false)}>
              Tutup
            </Button>
          ] : null
        }
        width={700}
      >
        {selectedPlan && !paymentResult && (
          <Form form={form} layout="vertical" onFinish={handlePayment}>
            <div style={{ marginBottom: 20 }}>
              <Title level={4}>Paket: {selectedPlan.name}</Title>
              <Paragraph>
                <Text strong>Harga:</Text> {formatCurrency(selectedPlan.price)}
              </Paragraph>
              <Paragraph>
                <Text strong>Durasi:</Text> {selectedPlan.duration_days} hari
              </Paragraph>
              <Paragraph>
                <Text strong>Deskripsi:</Text> {selectedPlan.description || `Langganan standar selama ${selectedPlan.name}`}
              </Paragraph>
            </div>
            
            <Divider />
            
            <Form.Item
              name="name"
              label="Nama Lengkap"
              initialValue={user?.username}
              rules={[{ required: true, message: 'Harap masukkan nama lengkap' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Nama lengkap sesuai identitas" />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="Email"
              initialValue={user?.email}
              rules={[
                { required: true, message: 'Harap masukkan email' },
                { type: 'email', message: 'Format email tidak valid' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email aktif untuk notifikasi" />
            </Form.Item>
            
            <Form.Item
              name="phone_number"
              label="Nomor WhatsApp"
              rules={[
                { required: true, message: 'Harap masukkan nomor WhatsApp' },
                { pattern: /^[0-9+]+$/, message: 'Hanya angka dan tanda + diperbolehkan' }
              ]}
            >
              <Input 
                prefix={<PhoneOutlined />} 
                placeholder="Contoh: 08123456789 atau +628123456789"
                addonBefore="+62"
              />
            </Form.Item>
            
            <div style={{ marginBottom: 16 }}>
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Total Pembayaran">
                  <Text strong style={{ fontSize: 16 }}>
                    {formatCurrency(selectedPlan.price)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </div>
            
            <Alert
              message="Informasi Pembayaran"
              description={
                <ul style={{ paddingLeft: 20 }}>
                  <li>Transfer sesuai dengan nominal pembayaran ke rekening/QRIS yang akan ditampilkan setelah pesanan dibuat</li>
                  <li>Pembayaran akan diverifikasi oleh admin dalam waktu 1x24 jam</li>
                  <li>Status langganan Anda akan otomatis diperbarui setelah pembayaran diverifikasi</li>
                </ul>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
            
            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={paymentLoading}
                disabled={paymentLoading}
                block
              >
                Lanjutkan Pembayaran
              </Button>
            </Form.Item>
          </Form>
        )}
        
        {/* Hasil Pembayaran */}
        {paymentResult && renderPaymentResult()}
        
        {paymentLoading && !paymentResult && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Memproses pembayaran...</div>
          </div>
        )}
      </Modal>

      {/* Cancel Order Confirmation Modal */}
      <Modal
        title="Batalkan Pesanan"
        open={cancelModalVisible}
        onCancel={() => setCancelModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setCancelModalVisible(false)}>
            Tidak
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            danger
            loading={cancelLoading}
            onClick={confirmCancelOrder}
          >
            Ya, Batalkan
          </Button>,
        ]}
      >
        <div style={{ textAlign: 'center' }}>
          <ExclamationCircleOutlined style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
          <Title level={4}>Apakah Anda yakin ingin membatalkan pesanan ini?</Title>
          <Text>Tindakan ini tidak dapat dibatalkan.</Text>
        </div>
      </Modal>
    </div>
  );
};

export default SubscriptionPage;