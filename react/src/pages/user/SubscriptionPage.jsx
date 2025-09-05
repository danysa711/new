// react/src/pages/user/SubscriptionPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Space, Popconfirm, message
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, ClockCircleOutlined, UploadOutlined, 
  DeleteOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import QrisPaymentForm from '../../components/QrisPaymentForm';
import moment from 'moment';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;

const SubscriptionPage = () => {
  // Context
  const { user, updateUserData, fetchUserProfile } = useContext(AuthContext);
  
  // State
  const [pendingPayments, setPendingPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Efek untuk memuat data saat komponen dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch subscription plans
        try {
          const plansResponse = await axiosInstance.get('/api/subscription-plans');
          setPlans(plansResponse.data);
        } catch (err) {
          console.error('Error fetching subscription plans:', err);
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
        
        // Fetch user subscriptions
        try {
          const subsResponse = await axiosInstance.get('/api/subscriptions/user');
          
          // Sort subscriptions by start date (newest first)
          const sortedSubs = subsResponse.data.sort((a, b) => 
            new Date(b.start_date) - new Date(a.start_date)
          );
          
          setSubscriptions(sortedSubs);
          
          // Find active subscription
          const active = subsResponse.data.find(
            (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
          );
          
          setActiveSubscription(active);
          
          // Jika status berlangganan berubah, perbarui user context
          if (updateUserData) {
            if (active && !user.hasActiveSubscription) {
              // Update user data in context
              const updatedUser = { ...user, hasActiveSubscription: true };
              updateUserData(updatedUser);
            } else if (!active && user.hasActiveSubscription) {
              // Update user data in context
              const updatedUser = { ...user, hasActiveSubscription: false };
              updateUserData(updatedUser);
            }
          }
        } catch (err) {
          console.error('Error fetching user subscriptions:', err);
          setSubscriptions([]);
        }
        
        // Tambahkan: Fetch QRIS payments untuk menampilkan di tabel
        try {
          const qrisResponse = await axiosInstance.get('/api/qris-payments');
          // Cari pembayaran QRIS yang menunggu verifikasi (UNPAID)
          let pendingPayments = Array.isArray(qrisResponse.data) ? 
            qrisResponse.data.filter(payment => payment.status === 'UNPAID') : 
            [];
          
          // Filter hanya pembayaran yang belum melewati batas waktu 1 jam
          pendingPayments = pendingPayments.filter(payment => {
            const createdAt = new Date(payment.createdAt);
            const now = new Date();
            const diffMs = now - createdAt;
            const diffHours = diffMs / (1000 * 60 * 60);
            return diffHours <= 1; // Batas waktu 1 jam
          });
          
          // Urutkan berdasarkan tanggal terbaru
          pendingPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          // Batasi hanya 3 pembayaran terbaru
          pendingPayments = pendingPayments.slice(0, 3);
          
          // Tambahkan info pembayaran yang menunggu ke state
          setPendingPayments(pendingPayments);
        } catch (err) {
          console.error('Error fetching QRIS payments:', err);
          setPendingPayments([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, updateUserData]);
  
  // Fungsi untuk membeli paket langganan
  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    setPaymentModalVisible(true);
  };
  
  // Fungsi untuk menutup modal pembayaran
  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedPlan(null);
    
    // Refresh data langganan
    if (fetchUserProfile) {
      fetchUserProfile();
    }
  };
  
  // Fungsi untuk menampilkan modal upload bukti
  const handleUploadProof = (payment) => {
    setSelectedPayment(payment);
    setUploadModalVisible(true);
  };

  // Fungsi untuk membatalkan pembayaran
  const handleCancelPayment = async (reference) => {
    try {
      setLoading(true);
      
      // Kirim permintaan untuk membatalkan pembayaran
      await axiosInstance.post(`/api/qris-payment/${reference}/cancel`);
      
      message.success('Pembayaran berhasil dibatalkan');
      
      // Refresh data
      const qrisResponse = await axiosInstance.get('/api/qris-payments');
      // Cari pembayaran QRIS yang menunggu verifikasi (UNPAID)
      let pendingPayments = Array.isArray(qrisResponse.data) ? 
        qrisResponse.data.filter(payment => payment.status === 'UNPAID') : 
        [];
      
      // Filter hanya pembayaran yang belum melewati batas waktu 1 jam
      pendingPayments = pendingPayments.filter(payment => {
        const createdAt = new Date(payment.createdAt);
        const now = new Date();
        const diffMs = now - createdAt;
        const diffHours = diffMs / (1000 * 60 * 60);
        return diffHours <= 1; // Batas waktu 1 jam
      });
      
      // Urutkan berdasarkan tanggal terbaru
      pendingPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Batasi hanya 3 pembayaran terbaru
      pendingPayments = pendingPayments.slice(0, 3);
      
      // Tambahkan info pembayaran yang menunggu ke state
      setPendingPayments(pendingPayments);
      
    } catch (error) {
      console.error('Error canceling payment:', error);
      message.error('Gagal membatalkan pembayaran');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat data langganan...</div>
      </div>
    );
  }
  
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
      {activeSubscription ? (
        <Card 
          title={<Title level={4}>Status Langganan Anda</Title>} 
          style={{ marginBottom: 24 }}
        >
          <Descriptions bordered>
            <Descriptions.Item label="Status" span={3}>
              <Tag color="success">Aktif</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Tanggal Mulai" span={3}>
              {formatDate(activeSubscription.start_date)}
            </Descriptions.Item>
            <Descriptions.Item label="Tanggal Berakhir" span={3}>
              {formatDate(activeSubscription.end_date)}
            </Descriptions.Item>
            <Descriptions.Item label="Sisa Waktu" span={3}>
              {calculateRemainingDays(activeSubscription.end_date)} hari
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card 
          title={<Title level={4}>Status Langganan Anda</Title>} 
          style={{ marginBottom: 24 }}
        >
          <Alert
            message="Anda belum berlangganan"
            description="Pilih paket langganan di bawah ini untuk mulai menggunakan layanan premium."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        </Card>
      )}
      
      {/* Available Plans Section */}
      <div id="subscription-plans" style={{ marginBottom: 24 }}>
        <Title level={4}>Paket Langganan Tersedia</Title>
        <Row gutter={[16, 16]}>
          {plans.length > 0 ? plans.map((plan) => (
            <Col xs={24} sm={12} md={8} lg={6} key={plan.id}>
              <Card
                hoverable
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{plan.name}</span>
                    <Tag color="green">Rp {parseInt(plan.price).toLocaleString('id-ID')}</Tag>
                  </div>
                }
                actions={[
                  <Button 
                    type="primary" 
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handlePurchase(plan)}
                    block
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
      </div>
      
      {/* Pending Payments Section - Moved below plans */}
      {pendingPayments.length > 0 && (
        <Card 
          title={<Title level={4}>Pembayaran Menunggu Verifikasi</Title>} 
          style={{ marginBottom: 24 }}
        >
          <Alert
            message="Pembayaran Anda Sedang Ditinjau"
            description="Anda memiliki pembayaran yang sedang menunggu verifikasi admin. Langganan akan aktif segera setelah pembayaran diverifikasi."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Table
            dataSource={pendingPayments}
            rowKey="reference"
            columns={[
              {
                title: 'Referensi',
                dataIndex: 'reference',
                key: 'reference',
                render: text => <Text copyable>{text}</Text>
              },
              {
                title: 'Paket',
                key: 'plan',
                render: (_, record) => (
                  record.SubscriptionPlan ? record.SubscriptionPlan.name : '-'
                )
              },
              {
                title: 'Jumlah',
                dataIndex: 'total_amount',
                key: 'amount',
                render: amount => `Rp ${parseFloat(amount).toLocaleString('id-ID')}`
              },
              {
                title: 'Tanggal',
                dataIndex: 'createdAt',
                key: 'date',
                render: date => moment(date).format('DD/MM/YYYY HH:mm')
              },
              {
                title: 'Batas Waktu',
                key: 'expiry',
                render: (_, record) => {
                  const createdAt = new Date(record.createdAt);
                  const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 jam
                  return moment(expiryTime).format('DD/MM/YYYY HH:mm');
                }
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record) => {
                  if (record.payment_proof) {
                    return <Tag color="processing">BUKTI TERKIRIM</Tag>;
                  }
                  return <Tag color="warning">BELUM UPLOAD BUKTI</Tag>;
                }
              },
              {
                title: 'Aksi',
                key: 'action',
                render: (_, record) => (
                  <Space>
                    {!record.payment_proof && (
                      <Button 
                        type="primary" 
                        size="small" 
                        icon={<UploadOutlined />}
                        onClick={() => handleUploadProof(record)}
                      >
                        Upload Bukti
                      </Button>
                    )}
                    {!record.payment_proof && (
                      <Popconfirm
                        title="Batalkan Pembayaran"
                        description="Anda yakin ingin membatalkan pembayaran ini?"
                        onConfirm={() => handleCancelPayment(record.reference)}
                        okText="Ya"
                        cancelText="Tidak"
                      >
                        <Button 
                          danger 
                          size="small" 
                          icon={<DeleteOutlined />}
                        >
                          Batalkan
                        </Button>
                      </Popconfirm>
                    )}
                  </Space>
                )
              }
            ]}
            pagination={false}
          />
        </Card>
      )}
      
      {/* Payment Modal */}
      <Modal
        title="Pembayaran QRIS"
        open={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={null}
        width={700}
      >
        {selectedPlan && (
          <QrisPaymentForm 
            plan={selectedPlan} 
            onFinish={handleClosePaymentModal} 
          />
        )}
      </Modal>
      
      {/* Upload Proof Modal */}
      <Modal
        title="Upload Bukti Pembayaran"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        {selectedPayment && (
          <QrisPaymentForm 
            plan={selectedPayment.SubscriptionPlan || { id: selectedPayment.plan_id, name: 'Langganan', price: selectedPayment.total_amount }}
            paymentData={selectedPayment}
            initialStep={1}
            onFinish={() => {
              setUploadModalVisible(false);
              // Refresh pembayaran
              window.location.reload();
            }}
          />
        )}
      </Modal>
      
      {/* Subscription History Section */}
      <Divider />
      
      <Card title="Riwayat Langganan">
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
                } else if (status === 'canceled') {
                  color = 'warning';
                  displayText = 'DIBATALKAN';
                }
                
                return <Tag color={color}>{displayText}</Tag>;
              },
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
                
                const { color, text } = statusMap[status] || { color: 'default', text: status ? status.toUpperCase() : 'UNKNOWN' };
                
                return <Tag color={color}>{text}</Tag>;
              },
            },
            {
              title: 'Metode Pembayaran',
              dataIndex: 'payment_method',
              key: 'payment_method',
              render: (method) => method || 'QRIS',
            },
          ]}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'Belum ada riwayat langganan' }}
        />
      </Card>
    </div>
  );
};

// Fungsi helper untuk formatDate dan calculateRemainingDays
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const calculateRemainingDays = (endDate) => {
  const end = new Date(endDate);
  const today = new Date();
  const diffTime = end - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export default SubscriptionPage;