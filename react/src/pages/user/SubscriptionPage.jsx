// File: src/pages/user/SubscriptionPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Input, Form, message, Tabs, 
  Timeline, Image, Skeleton
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, BankOutlined, WalletOutlined,
  InfoCircleOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, DollarOutlined, ReloadOutlined
} from '@ant-design/icons';
import axios from 'axios'; // Tambahkan impor ini
import axiosInstance from '../../services/axios';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';
import { ConnectionContext } from '../../context/ConnectionContext';
import API from '../../services/const';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const SubscriptionPage = () => {
  // Context dari AuthContext
  const { user, updateUserData, fetchUserProfile } = useContext(AuthContext);
  const { connectionStatus, isConnected } = useContext(ConnectionContext);
  
  // State variables
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistories, setTransactionHistories] = useState([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [qrisImage, setQrisImage] = useState('');
  const [qrisImageLoading, setQrisImageLoading] = useState(false);
  const [paymentExpiry, setPaymentExpiry] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [fetchingPending, setFetchingPending] = useState(false);
  const [form] = Form.useForm();
  const [statusMap, setStatusMap] = useState({});
  const defaultQrisUrl = `${axiosInstance.defaults.baseURL || ''}/default-qris.png`;

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

  // Fetch subscription plans
  const fetchSubscriptionPlans = async () => {
    try {
      console.log('Mengambil data paket langganan...');
      const response = await axiosInstance.get('/api/subscription-plans');
      console.log('Data paket langganan diterima:', response.data);
      setPlans(response.data);
    } catch (err) {
      console.error('Error mengambil paket langganan:', err);
      // Fallback jika terjadi error
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

  // Fetch pending transactions
  const fetchPendingTransactions = async () => {
    try {
      console.log('Mengambil transaksi yang tertunda...');
      setFetchingPending(true);
      
      const response = await axiosInstance.get('/api/qris/pending');
      console.log('Data transaksi tertunda:', response.data);
      
      // Pastikan response.data adalah array
      if (Array.isArray(response.data)) {
        // Hanya tampilkan 3 transaksi terbaru
        const latestPending = response.data.slice(0, 3);
        setPendingTransactions(latestPending);
        
        // Set countdown untuk transaksi pertama jika ada
        if (latestPending.length > 0) {
          const firstTransaction = latestPending[0];
          if (firstTransaction.expired_at) {
            setPaymentExpiry(new Date(firstTransaction.expired_at));
          }
        }
      } else {
        console.warn('Respons bukan array, menggunakan array kosong');
        setPendingTransactions([]);
      }
    } catch (err) {
      console.error('Error mengambil transaksi tertunda:', err);
      setPendingTransactions([]);
      message.error('Gagal memuat transaksi tertunda', 3);
    } finally {
      setFetchingPending(false);
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    try {
      console.log('Mengambil riwayat transaksi...');
      setFetchingHistory(true);
      
      const response = await axiosInstance.get('/api/qris/history');
      console.log('Data riwayat transaksi:', response.data);
      
      // Pastikan response.data adalah array
      if (Array.isArray(response.data)) {
        setTransactionHistories(response.data);
      } else {
        console.warn('Respons bukan array, menggunakan array kosong');
        setTransactionHistories([]);
      }
    } catch (err) {
      console.error('Error mengambil riwayat transaksi:', err);
      setTransactionHistories([]);
      message.error('Gagal memuat riwayat transaksi', 3);
    } finally {
      setFetchingHistory(false);
    }
  };

  // Fetch QRIS image
  const fetchQrisImage = async () => {
  try {
    setQrisImageLoading(true);
    console.log('Memuat gambar QRIS...');
    
    const response = await axiosInstance.get('/api/qris/image');
    console.log('Response gambar QRIS:', response.data);


    
    if (response.data && response.data.imageUrl) {
      setQrisImage(response.data.imageUrl);
      console.log('Gambar QRIS berhasil dimuat:', response.data.imageUrl);

      console.log('Attempting to load QRIS image from:', response.data.imageUrl);
    } else {
      // Gunakan gambar placeholder dengan URL lengkap
      const defaultImageUrl = `${axiosInstance.defaults.baseURL || ''}/default-qris.png`;
      setQrisImage(defaultImageUrl);
      console.warn('Tidak ada URL gambar QRIS yang valid, menggunakan default:', defaultImageUrl);
    }
  } catch (err) {
    console.error('Error mengambil gambar QRIS:', err);
    // Gunakan gambar placeholder dengan URL lengkap
    const defaultImageUrl = `${axiosInstance.defaults.baseURL || ''}/default-qris.png`;
    setQrisImage(defaultImageUrl);
    message.warning('Gagal memuat gambar QRIS, menggunakan gambar default');
  } finally {
    setQrisImageLoading(false);
  }
};

  // Handle purchase
  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    form.resetFields();
    setPaymentResult(null);
    fetchQrisImage();
    setPaymentModalVisible(true);
  };

  // Handle payment confirmation
  const handlePaymentConfirmation = async () => {
  try {
    setPaymentLoading(true);
    
    // Validasi form
    const values = await form.validateFields();
    console.log('Form values:', values);
    
    // Buat transaksi QRIS baru
    console.log('Membuat transaksi QRIS dengan data:', {
      plan_id: selectedPlan.id,
      user_id: user.id,
      amount: selectedPlan.price
    });
    
    const response = await axiosInstance.post('/api/qris/create', {
      plan_id: selectedPlan.id,
      user_id: user.id,
      amount: selectedPlan.price
    });
    
    console.log('Response dari create QRIS:', response.data);
    
    if (response.data && response.data.success) {
      const transaction = response.data.transaction;
      
      // Update transaksi tertunda
      setPendingTransactions([transaction, ...pendingTransactions].slice(0, 3));
      
      // Set hasil pembayaran
      setPaymentResult(transaction);
      
      // Set waktu kedaluwarsa
      if (transaction.expired_at) {
        setPaymentExpiry(new Date(transaction.expired_at));
      }
      
      // Load gambar QRIS
      console.log('Memuat gambar QRIS untuk transaksi baru');
      await fetchQrisImage();
      
      message.success('Permintaan pembayaran berhasil dibuat');
    } else {
      throw new Error(response.data?.message || 'Gagal membuat permintaan pembayaran');
    }
  } catch (err) {
    console.error('Error membuat permintaan pembayaran:', err);
    message.error('Gagal membuat permintaan pembayaran: ' + (err.message || 'Terjadi kesalahan'));
  } finally {
    setPaymentLoading(false);
  }
};

  // Handle check payment status
  const handleCheckStatus = async (transactionId) => {
  try {
    setCheckingStatus(true);
    console.log('Memeriksa status pembayaran untuk ID:', transactionId);

    const response = await axiosInstance.get(`/api/qris/status/${transactionId}`);
    console.log('Response status pembayaran:', response.data);

    if (response.data && response.data.success) {
      const currentStatus = response.data.status;

      // ✅ Simpan status ke dalam state map
      setStatusMap(prev => ({ ...prev, [transactionId]: currentStatus }));

      // ✅ Jika status berubah jadi verified/rejected → refresh data
      if (currentStatus === 'verified' || currentStatus === 'rejected' || currentStatus === 'expired') {
        fetchPendingTransactions();
        fetchTransactionHistory();
        if (fetchUserProfile) fetchUserProfile();
      }
    } else {
      throw new Error(response.data?.message || 'Gagal memeriksa status pembayaran');
    }
  } catch (err) {
    console.error('Error memeriksa status pembayaran:', err);
    Modal.error({
      title: 'Gagal Memeriksa Status',
      content: 'Gagal memeriksa status pembayaran: ' + (err.response?.data?.error || err.message || 'Terjadi kesalahan')
    });
  } finally {
    setCheckingStatus(false);
  }
};

  // Handle payment confirmation (I already paid)
  const handleIHavePaid = async (transactionId) => {
  try {
    setPaymentLoading(true);
    console.log('Mengirim konfirmasi pembayaran untuk ID:', transactionId);
    
    const response = await axiosInstance.post(`/api/qris/confirm/${transactionId}`);
    console.log('Response konfirmasi pembayaran:', response.data);
    
    if (response.data && response.data.success) {
      // Tutup modal pembayaran jika terbuka
      setPaymentModalVisible(false);
      setPaymentResult(null); // Reset payment result
      
      // Gunakan Modal.success alih-alih message.success
      Modal.success({
        title: 'Konfirmasi Berhasil',
        content: 'Konfirmasi pembayaran dikirim. Admin akan segera memverifikasi pembayaran Anda.',
        onOk: () => {
          // Refresh data setelah modal ditutup
          fetchPendingTransactions();
        }
      });
      
      // Update status transaksi menjadi "waiting_verification"
      const updatedTransactions = pendingTransactions.map(t => {
        if (t.id === transactionId) {
          return { ...t, status: 'waiting_verification' };
        }
        return t;
      });
      
      setPendingTransactions(updatedTransactions);
      
      // Refresh data transaksi
      setTimeout(() => {
        fetchPendingTransactions();
      }, 1000);
    } else {
      throw new Error(response.data?.message || 'Gagal mengirim konfirmasi pembayaran');
    }
  } catch (err) {
    console.error('Error mengirim konfirmasi pembayaran:', err);
    Modal.error({
      title: 'Konfirmasi Gagal',
      content: 'Gagal mengirim konfirmasi pembayaran: ' + (err.response?.data?.error || err.message || 'Terjadi kesalahan')
    });
  } finally {
    setPaymentLoading(false);
  }
};

  // Render payment instructions
  const renderPaymentInstructions = (transaction) => {
  if (!transaction) return null;
  
  return (
    <div style={{ marginTop: 20 }}>
      <Divider />
      <Title level={4}>Instruksi Pembayaran</Title>
      
      <div style={{ textAlign: 'center' }}>
        {qrisImageLoading ? (
          <Spin tip="Memuat gambar QRIS..." style={{ margin: '20px auto' }} />
        ) : (
          <div style={{ position: 'relative' }}>
            <Image 
              src={qrisImage || '/uploads/default-qris.png'} 
              alt="QRIS Code" 
              style={{ maxWidth: '250px', margin: '20px auto', border: '1px solid #eee' }} 
              fallback={defaultQrisUrl}
              preview={false}
              onError={(e) => {
                console.error('Error loading QRIS image, using fallback');
                // Set fallback manual jika Image fallback tidak bekerja
                e.target.src = defaultQrisUrl;
              }}
            />
            
            {/* Tambahkan overlay jika menggunakan gambar default */}
            {qrisImage === '/uploads/default-qris.png' && (
              <div style={{ 
                position: 'absolute', 
                top: 0, 
                left: 0, 
                right: 0, 
                bottom: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                backgroundColor: 'rgba(0,0,0,0.1)' 
              }}>
                <Alert
                  message="Gambar QRIS Demo"
                  description="Ini adalah gambar QRIS contoh. Admin belum mengkonfigurasi gambar QRIS sebenarnya."
                  type="warning"
                  showIcon
                />
              </div>
            )}
          </div>
        )}
        
        <div style={{ marginTop: 10 }}>
          <Text strong>Nomor Pesanan: </Text>
          <Text copyable>{transaction.order_number}</Text>
        </div>
        <Text style={{ display: 'block', marginTop: 5 }}>
          Scan QR Code di atas menggunakan aplikasi e-wallet Anda
        </Text>
        
        {transaction.amount && (
        <Text strong style={{ display: 'block', marginTop: 10, fontSize: '16px' }}>
          Total Pembayaran: Rp {new Intl.NumberFormat('id-ID').format(transaction.amount)}
        </Text>
      )}
        
        {countdown && (
          <div style={{ marginTop: 10 }}>
            <Text type="warning">Batas waktu pembayaran: {countdown}</Text>
          </div>
        )}
      </div>
      
      <Alert 
        message="Penting!" 
        description="Setelah melakukan pembayaran, klik tombol 'Saya Sudah Bayar' di bawah."
        type="warning" 
        showIcon 
        style={{ marginTop: 20 }}
      />
      
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Button 
          type="primary" 
          size="large"
          loading={paymentLoading} 
          onClick={() => handleIHavePaid(transaction.id)}
          disabled={paymentLoading || transaction.status === 'waiting_verification'}
        >
          {paymentLoading ? 'Memproses...' : 
           transaction.status === 'waiting_verification' ? 'Menunggu Verifikasi Admin' : 
           'Saya Sudah Bayar'}
        </Button>
      </div>
    </div>
  );
};

  // Initialize countdown timer
  useEffect(() => {
    if (paymentExpiry) {
      const timer = setInterval(() => {
        const now = new Date();
        const expiry = new Date(paymentExpiry);
        const diff = expiry - now;
        
        if (diff <= 0) {
          clearInterval(timer);
          setCountdown(null);
          // Refresh pending transactions
          fetchPendingTransactions();
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [paymentExpiry]);

  // Initial data fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Memulai pengambilan data...');
        setLoading(true);
        setError(null);

        // Fetch subscription plans
        await fetchSubscriptionPlans();

        // Fetch user subscriptions
        try {
          console.log('Mengambil data langganan pengguna...');
          const subsResponse = await axiosInstance.get('/api/subscriptions/user');
          
          // Sort subscriptions by start date (newest first)
          const sortedSubs = subsResponse.data.sort((a, b) => 
            new Date(b.start_date) - new Date(a.start_date)
          );
          
          console.log('Data langganan diterima:', sortedSubs);
          setSubscriptions(sortedSubs);

          // Find active subscription
          const active = subsResponse.data.find(
            (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
          );
          
          setActiveSubscription(active);
          
          // Update user context if subscription status changed
          if (updateUserData) {
            if (active && !user.hasActiveSubscription) {
              const updatedUser = { ...user, hasActiveSubscription: true };
              updateUserData(updatedUser);
            } else if (!active && user.hasActiveSubscription) {
              const updatedUser = { ...user, hasActiveSubscription: false };
              updateUserData(updatedUser);
            }
          }
        } catch (err) {
          console.error('Error mengambil data langganan pengguna:', err);
          setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
          setSubscriptions([]);
        }

        // Fetch pending transactions
        await fetchPendingTransactions();
        
        // Fetch transaction history
        await fetchTransactionHistory();

      } catch (err) {
        console.error('Error mengambil data:', err);
        setError('Gagal memuat data. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
        console.log('Pengambilan data selesai');
      }
    };

    fetchData();
    
    // Set interval untuk memeriksa status langganan setiap 5 menit
    const checkSubscriptionInterval = setInterval(() => {
      if (fetchUserProfile) {
        fetchUserProfile();
      }
      fetchPendingTransactions();
      fetchTransactionHistory();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(checkSubscriptionInterval);
  }, [user, updateUserData, fetchUserProfile]);

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
        title={<Title level={4}>Status Langganan Saat Ini</Title>} 
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
                    <Tag color="green">Rp {new Intl.NumberFormat('id-ID').format(plan.price)}</Tag>
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

      {/* Pending Transactions Section */}
      <div style={{ marginTop: 24 }}>
        <Title level={4}>Pembayaran Menunggu Verifikasi</Title>
        
        {fetchingPending ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Card loading={true} />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Card loading={true} />
            </Col>
          </Row>
        ) : pendingTransactions.length > 0 ? (
          <Row gutter={[16, 16]}>
            {pendingTransactions.map((transaction) => (
              <Col xs={24} sm={12} md={8} key={transaction.id}>
                <Card
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Pesanan #{transaction.order_number}</span>
                      <Tag color="orange">MENUNGGU</Tag>
                    </div>
                  }
                >
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Paket">
                      {transaction.plan_name || 'Paket Langganan'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Jumlah">
                      <Text strong>
                        Rp {transaction.amount ? new Intl.NumberFormat('id-ID').format(transaction.amount) : '0'}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tanggal">
                      {moment(transaction.created_at).format('DD MMM YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={
                        statusMap[transaction.id] === 'verified' ? 'green' :
                        statusMap[transaction.id] === 'rejected' ? 'red' :
                        statusMap[transaction.id] === 'expired' ? 'orange' :
                        transaction.status === 'waiting_verification' ? 'blue' : 
                        transaction.status === 'pending' ? 'orange' : 'default'
                      }>
                        {
                        statusMap[transaction.id]
                      ? statusMap[transaction.id].toUpperCase()
                      : (
                        transaction.status === 'waiting_verification' ? 'MENUNGGU VERIFIKASI' :
                        transaction.status === 'pending' ? 'MENUNGGU PEMBAYARAN' :
                        transaction.status.toUpperCase()
                        )
                        }
                      </Tag>
              </Descriptions.Item>
                  </Descriptions>
                  
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <Button 
                      type="primary" 
                      onClick={() => {
                        setPaymentResult(transaction);
                        fetchQrisImage();
                        setPaymentModalVisible(true);
                      }}
                    >
                      Detail Pembayaran
                    </Button>
                    
                    <Button
                      type="link"
                      icon={<ReloadOutlined />}
                      loading={checkingStatus}
                      onClick={() => handleCheckStatus(transaction.id)}
                      style={{ marginLeft: 8 }}
                    >
                      Cek Status
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Tidak ada pembayaran tertunda" />
        )}
      </div>
      
      <Divider />
      
      {/* Transaction History Tabs */}
      <Tabs 
        defaultActiveKey="subscriptions"
        items={[
          {
            key: "transactions",
            label: "Riwayat Transaksi",
            children: (
              fetchingHistory ? (
                <div>
                  <Skeleton active paragraph={{ rows: 5 }} />
                </div>
              ) : (
                <Table
                  dataSource={transactionHistories}
                  rowKey="id"
                  columns={[
                    {
                      title: 'No. Pesanan',
                      dataIndex: 'order_number',
                      key: 'order_number',
                      render: text => <Text copyable>{text}</Text>
                    },
                    {
                      title: 'Paket',
                      dataIndex: 'plan_name',
                      key: 'plan_name',
                    },
                    {
                      title: 'Jumlah',
                      dataIndex: 'amount',
                      key: 'amount',
                      render: (amount) => `Rp ${new Intl.NumberFormat('id-ID').format(amount || 0)}`,
                      sorter: (a, b) => a.amount - b.amount,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => {
                        let color = 'default';
                        let text = status;
                        
                        if (status === 'verified') {
                          color = 'success';
                          text = 'TERVERIFIKASI';
                        } else if (status === 'pending') {
                          color = 'warning';
                          text = 'MENUNGGU';
                        } else if (status === 'waiting_verification') {
                          color = 'blue';
                          text = 'MENUNGGU VERIFIKASI';
                        } else if (status === 'expired') {
                          color = 'error';
                          text = 'KEDALUWARSA';
                        } else if (status === 'rejected') {
                          color = 'error';
                          text = 'DITOLAK';
                        } else if (status === 'failed') {
                          color = 'error';
                          text = 'GAGAL';
                        }

                        return <Tag color={color}>{text}</Tag>;
                      },
                      filters: [
                        { text: 'TERVERIFIKASI', value: 'verified' },
                        { text: 'MENUNGGU', value: 'pending' },
                        { text: 'MENUNGGU VERIFIKASI', value: 'waiting_verification' },
                        { text: 'KEDALUWARSA', value: 'expired' },
                        { text: 'DITOLAK', value: 'rejected' },
                        { text: 'GAGAL', value: 'failed' },
                      ],
                      onFilter: (value, record) => record.status === value,
                    },
                    {
                      title: 'Tanggal',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
                      sorter: (a, b) => moment(a.created_at).unix() - moment(b.created_at).unix(),
                      defaultSortOrder: 'descend',
                    },
                    {
                      title: 'Aksi',
                      key: 'action',
                      render: (_, record) => (
                        <Button 
                          type="link"
                          onClick={() => {
                            setPaymentResult(record);
                            setPaymentModalVisible(true);
                          }}
                        >
                          Detail
                        </Button>
                      ),
                    },
                  ]}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'Belum ada riwayat transaksi' }}
                />
              )
            )
          }
        ]}
      />

      {/* Payment Modal */}
<Modal
  title={paymentResult ? "Detail Transaksi" : "Pembayaran Langganan"}
  open={paymentModalVisible}
  onCancel={() => {
    if (!paymentLoading) {
      setPaymentModalVisible(false);
      setPaymentResult(null); // Reset payment result saat modal ditutup
    }
  }}
  footer={
    paymentResult ? [
      <Button key="close" onClick={() => {
        setPaymentModalVisible(false);
        setPaymentResult(null); // Reset payment result
      }}>
        Tutup
      </Button>
    ] : null
  }
  width={700}
  maskClosable={!paymentLoading} // Mencegah modal ditutup saat loading
>
  {/* Modal content */}
  {selectedPlan && !paymentResult && (
    <div>
      <div style={{ marginBottom: 20 }}>
        <Title level={4}>Paket: {selectedPlan.name}</Title>
        <Paragraph>
          <Text strong>Harga:</Text> Rp {new Intl.NumberFormat('id-ID').format(selectedPlan.price)}
        </Paragraph>
        <Paragraph>
          <Text strong>Durasi:</Text> {selectedPlan.duration_days} hari
        </Paragraph>
        <Paragraph>
          <Text strong>Deskripsi:</Text> {selectedPlan.description || `Langganan standar selama ${selectedPlan.name}`}
        </Paragraph>
      </div>
      
      <Divider />
      
      <Form form={form} layout="vertical" onFinish={handlePaymentConfirmation}>
        <Form.Item
          name="name"
          label="Nama Lengkap"
          rules={[{ required: true, message: 'Harap masukkan nama lengkap' }]}
          initialValue={user?.username}
        >
          <Input placeholder="Nama lengkap sesuai identitas" />
        </Form.Item>
        
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Harap masukkan email' },
            { type: 'email', message: 'Format email tidak valid' }
          ]}
          initialValue={user?.email}
        >
          <Input placeholder="Email aktif untuk notifikasi pembayaran" />
        </Form.Item>
        
        <Form.Item
          name="phone"
          label="Nomor Telepon"
          rules={[
            { required: true, message: 'Harap masukkan nomor telepon' },
            { pattern: /^[0-9+]+$/, message: 'Hanya angka dan tanda + diperbolehkan' }
          ]}
        >
          <Input placeholder="Contoh: 081234567890" />
        </Form.Item>
        
        <div style={{ marginTop: 16 }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Harga Paket">
              Rp {new Intl.NumberFormat('id-ID').format(selectedPlan.price)}
            </Descriptions.Item>
            <Descriptions.Item label="Total Pembayaran">
              <Text strong>
                Rp {new Intl.NumberFormat('id-ID').format(selectedPlan.price)}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
        
        <Form.Item style={{ marginTop: 24 }}>
          <Button 
            type="primary" 
            htmlType="submit"
            loading={paymentLoading}
            disabled={paymentLoading}
            block
          >
            {paymentLoading ? 'Memproses...' : 'Lanjutkan Pembayaran'}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )}
  
  {/* Payment Result */}
  {paymentResult && (
    <div>
      {/* Payment Details */}
      <Result
        status={
          paymentResult.status === 'verified' ? 'success' :
          paymentResult.status === 'rejected' ? 'error' :
          paymentResult.status === 'expired' ? 'warning' :
          'info'
        }
        title={
          paymentResult.status === 'verified' ? "Pembayaran Terverifikasi" :
          paymentResult.status === 'rejected' ? "Pembayaran Ditolak" :
          paymentResult.status === 'expired' ? "Pembayaran Kedaluwarsa" :
          paymentResult.status === 'waiting_verification' ? "Menunggu Verifikasi" :
          "Menunggu Pembayaran"
        }
        subTitle={
          <div>
            <div>Nomor Pesanan: {paymentResult.order_number}</div>
            <div>
              Status: 
              <Tag color={
                paymentResult.status === 'verified' ? 'success' :
                paymentResult.status === 'rejected' ? 'error' :
                paymentResult.status === 'expired' ? 'warning' :
                paymentResult.status === 'waiting_verification' ? 'blue' :
                'orange'
              } style={{ marginLeft: 8 }}>
                {
                  paymentResult.status === 'verified' ? 'TERVERIFIKASI' :
                  paymentResult.status === 'rejected' ? 'DITOLAK' :
                  paymentResult.status === 'expired' ? 'KEDALUWARSA' :
                  paymentResult.status === 'waiting_verification' ? 'MENUNGGU VERIFIKASI' :
                  'MENUNGGU PEMBAYARAN'
                }
              </Tag>
            </div>
          </div>
        }
      />
      
      <Descriptions
        title="Detail Transaksi"
        bordered
        column={1}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Nomor Pesanan">
          <Text copyable>{paymentResult.order_number}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Metode Pembayaran">
          QRIS
        </Descriptions.Item>
        <Descriptions.Item label="Paket">
          {paymentResult.plan_name || 'Paket Langganan'}
        </Descriptions.Item>
        <Descriptions.Item label="Jumlah">
          <Text strong>Rp {new Intl.NumberFormat('id-ID').format(paymentResult.amount || 0)}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Tanggal Dibuat">
          {moment(paymentResult.created_at).format('DD MMMM YYYY HH:mm')}
        </Descriptions.Item>
        {paymentResult.verified_at && (
          <Descriptions.Item label="Tanggal Verifikasi">
            {moment(paymentResult.verified_at).format('DD MMMM YYYY HH:mm')}
          </Descriptions.Item>
        )}
        {paymentResult.expired_at && paymentResult.status === 'pending' && (
          <Descriptions.Item label="Batas Waktu Pembayaran">
            <Text type="danger">
              {moment(paymentResult.expired_at).format('DD MMMM YYYY HH:mm')}
            </Text>
          </Descriptions.Item>
        )}
      </Descriptions>
      
      {/* Payment Instructions for pending or waiting_verification status */}
      {(paymentResult.status === 'pending' || paymentResult.status === 'waiting_verification') && 
        renderPaymentInstructions(paymentResult)
      }
      
      {/* Check status button for pending or waiting_verification status */}
      {(paymentResult.status === 'pending' || paymentResult.status === 'waiting_verification') && (
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={checkingStatus}
            onClick={() => handleCheckStatus(paymentResult.id)}
          >
            Periksa Status Pembayaran
          </Button>
        </div>
      )}
    </div>
  )}
  
  {/* Loading indicator */}
  {paymentLoading && !paymentResult && (
    <div style={{ textAlign: 'center', padding: '30px' }}>
      <Spin size="large" />
      <div style={{ marginTop: '16px' }}>Memproses pembayaran...</div>
    </div>
  )}
</Modal>
    </div>
  );
};

export default SubscriptionPage;