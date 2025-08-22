import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Steps, Select, Radio, Input, Form, message, Tabs, Timeline
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, BankOutlined, WalletOutlined,
  InfoCircleOutlined, CreditCardOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, DollarOutlined, ReloadOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/const';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SubscriptionPage = () => {
  // Ambil user, updateUserData, dan fetchUserProfile dari AuthContext
  const { user, updateUserData, fetchUserProfile } = useContext(AuthContext);
  
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistories, setTransactionHistories] = useState([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [form] = Form.useForm();

  // Tambahkan console.log untuk debugging
  console.log("AuthContext values:", { user, updateUserData, fetchUserProfile });
  
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

  // Fetch payment methods
  const fetchPaymentMethods = async () => {
    try {
      // Simulasi data metode pembayaran
      setPaymentMethods([
        { code: 'QRIS', name: 'QRIS', type: 'qris', fee: 800 },
        { code: 'BRIVA', name: 'Bank BRI', type: 'bank', fee: 4000 },
        { code: 'MANDIRIVA', name: 'Bank Mandiri', type: 'bank', fee: 4000 },
        { code: 'BNIVA', name: 'Bank BNI', type: 'bank', fee: 4000 },
        { code: 'BCAVA', name: 'Bank BCA', type: 'bank', fee: 4000 },
        { code: 'OVO', name: 'OVO', type: 'ewallet', fee: 2000 },
        { code: 'DANA', name: 'DANA', type: 'ewallet', fee: 2000 },
        { code: 'LINKAJA', name: 'LinkAja', type: 'ewallet', fee: 2000 },
        { code: 'SHOPEEPAY', name: 'ShopeePay', type: 'ewallet', fee: 2000 },
      ]);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      message.error('Gagal memuat metode pembayaran');
    }
  };
  
  // Simulasi data transaksi pending
  const generateDummyPendingTransactions = () => {
    return [
      {
        reference: 'T123456789',
        merchant_ref: 'SUB-123-1637000000',
        payment_method: 'BRIVA',
        payment_name: 'Bank BRI',
        amount: 100000,
        fee: 4000,
        total_amount: 104000,
        status: 'UNPAID',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        expired_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        payment_code: '8888123456789',
        qr_url: null,
        plan_name: '1 Bulan',
        instructions: [
          { title: 'ATM BRI', steps: ['Masukkan kartu ATM & PIN', 'Pilih Menu Lainnya', 'Pilih Menu Pembayaran', 'Pilih BRIVA', 'Masukkan kode BRIVA 8888123456789', 'Ikuti instruksi untuk menyelesaikan'] },
          { title: 'Mobile Banking', steps: ['Login ke aplikasi', 'Pilih Pembayaran', 'Pilih BRIVA', 'Masukkan kode BRIVA 8888123456789', 'Konfirmasi pembayaran'] }
        ]
      },
      {
        reference: 'T987654321',
        merchant_ref: 'SUB-124-1637000001',
        payment_method: 'QRIS',
        payment_name: 'QRIS',
        amount: 270000,
        fee: 800,
        total_amount: 270800,
        status: 'UNPAID',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        expired_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
        payment_code: null,
        qr_url: 'https://tripay.co.id/qr/sample-qr-code.png',
        plan_name: '3 Bulan',
        instructions: [
          { title: 'Scan QR Code', steps: ['Buka aplikasi e-wallet/mobile banking', 'Pilih menu scan QR/QRIS', 'Arahkan kamera ke kode QR', 'Ikuti instruksi untuk menyelesaikan pembayaran'] }
        ]
      }
    ];
  };
  
  // Simulasi data riwayat transaksi
  const generateDummyTransactionHistories = () => {
    return [
      {
        reference: 'T111222333',
        merchant_ref: 'SUB-120-1636000000',
        payment_method: 'OVO',
        payment_name: 'OVO',
        amount: 100000,
        fee: 2000,
        total_amount: 102000,
        status: 'PAID',
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString(),
        plan_name: '1 Bulan'
      },
      {
        reference: 'T444555666',
        merchant_ref: 'SUB-121-1635000000',
        payment_method: 'MANDIRIVA',
        payment_name: 'Bank Mandiri',
        amount: 500000,
        fee: 4000,
        total_amount: 504000,
        status: 'PAID',
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        plan_name: '6 Bulan'
      },
      {
        reference: 'T777888999',
        merchant_ref: 'SUB-122-1634000000',
        payment_method: 'DANA',
        payment_name: 'DANA',
        amount: 270000,
        fee: 2000,
        total_amount: 272000,
        status: 'EXPIRED',
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        paid_at: null,
        plan_name: '3 Bulan'
      }
    ];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch subscription plans dengan error handling yang lebih baik
        try {
          const plansResponse = await axiosInstance.get('/api/subscription-plans');
          setPlans(plansResponse.data);
        } catch (err) {
          console.error('Error fetching subscription plans:', err);
          // Tidak membuat halaman gagal total jika tidak bisa fetch plans
        }

        // Fetch user subscriptions dengan error handling yang lebih baik
        try {
          // Perhatikan perubahan di sini, periksa endpoint yang benar
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
          } else {
            console.error('updateUserData function is undefined!');
          }
        } catch (err) {
          console.error('Error fetching user subscriptions:', err);
          console.error('Error details:', err.response || err);
          // Tampilkan pesan error yang lebih informatif
          if (err.response && err.response.status === 403) {
            setError('Anda tidak memiliki akses ke fitur langganan. Silakan hubungi admin.');
          } else {
            setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
          }
          setSubscriptions([]);
        }

        // Fetch payment methods
        await fetchPaymentMethods();
        
        // Simulasi transaksi pending
        setPendingTransactions(generateDummyPendingTransactions());
        
        // Simulasi riwayat transaksi
        setTransactionHistories(generateDummyTransactionHistories());

      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Set interval untuk memeriksa status langganan setiap 5 menit
    const checkSubscriptionInterval = setInterval(() => {
      if (fetchUserProfile) {
        fetchUserProfile(); // Refresh user data dari server
      }
      fetchData(); // Refresh data langganan
    }, 5 * 60 * 1000);
    
    // Cleanup interval pada unmount
    return () => {
      clearInterval(checkSubscriptionInterval);
    };
  }, [user, updateUserData, fetchUserProfile]);

  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    form.resetFields();
    setPaymentResult(null);
    setPaymentModalVisible(true);
  };
  
  const handleCheckStatus = async (reference) => {
    try {
      setCheckingStatus(true);
      
      // Simulasi pengecekan status
      setTimeout(() => {
        message.info(`Status pembayaran untuk transaksi ${reference} belum berubah. Silakan coba lagi nanti.`);
        setCheckingStatus(false);
      }, 2000);
    } catch (error) {
      message.error('Gagal memeriksa status pembayaran');
      setCheckingStatus(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      
      // Validasi form
      await form.validateFields();
      
      if (!form.getFieldValue('payment_method')) {
        message.warning('Silakan pilih metode pembayaran');
        setPaymentLoading(false);
        return;
      }
      
      // Data formulir
      const formValues = form.getFieldsValue();
      
      // Simulasi pembuatan transaksi di Tripay
      setTimeout(() => {
        const selectedMethod = paymentMethods.find(m => m.code === formValues.payment_method);
        
        const result = {
          reference: 'T' + Math.floor(Math.random() * 1000000000),
          merchant_ref: 'SUB-' + user.id + '-' + Date.now(),
          payment_method: formValues.payment_method,
          payment_name: selectedMethod.name,
          amount: selectedPlan.price,
          fee: selectedMethod.fee,
          total_amount: selectedPlan.price + selectedMethod.fee,
          status: 'UNPAID',
          created_at: new Date().toISOString(),
          expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          payment_code: formValues.payment_method === 'QRIS' ? null : '888812345678',
          qr_url: formValues.payment_method === 'QRIS' ? 'https://tripay.co.id/qr/sample-qr-code.png' : null,
          plan_name: selectedPlan.name,
          instructions: formValues.payment_method === 'QRIS' 
            ? [{ title: 'Scan QR Code', steps: ['Buka aplikasi e-wallet/mobile banking', 'Pilih menu scan QR/QRIS', 'Arahkan kamera ke kode QR', 'Ikuti instruksi untuk menyelesaikan pembayaran'] }]
            : [
                { title: 'ATM', steps: ['Masukkan kartu ATM & PIN', 'Pilih Menu Pembayaran', 'Pilih Virtual Account', `Masukkan kode Virtual Account 888812345678`, 'Ikuti instruksi untuk menyelesaikan'] },
                { title: 'Mobile Banking', steps: ['Login ke aplikasi', 'Pilih Pembayaran', 'Pilih Virtual Account', `Masukkan kode Virtual Account 888812345678`, 'Konfirmasi pembayaran'] }
              ]
        };
        
        // Update pending transactions
        setPendingTransactions([result, ...pendingTransactions]);
        
        setPaymentResult(result);
        setPaymentLoading(false);
        
        // Refresh user profile data to update subscription status
        if (fetchUserProfile) {
          fetchUserProfile();
        }
      }, 2000);
      
    } catch (err) {
      console.error('Error processing payment:', err);
      message.error('Gagal memproses pembayaran');
      setPaymentLoading(false);
    }
  };

  const renderPaymentInstructions = (transaction) => {
    if (!transaction) return null;
    
    const { payment_method, qr_url, payment_code, instructions } = transaction;
    
    return (
      <div style={{ marginTop: 20 }}>
        <Divider />
        <Title level={4}>Instruksi Pembayaran</Title>
        
        {payment_method === 'QRIS' && qr_url && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={qr_url} 
              alt="QRIS Code" 
              style={{ maxWidth: '200px', margin: '20px auto' }} 
            />
            <Text>Scan QR Code di atas menggunakan aplikasi e-wallet Anda</Text>
          </div>
        )}
        
        {payment_method !== 'QRIS' && payment_code && (
          <div>
            <Alert
              message="Kode Pembayaran"
              description={
                <Text copyable strong style={{ fontSize: '16px' }}>
                  {payment_code}
                </Text>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
          </div>
        )}
        
        {instructions?.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 15 }}>
            <Text strong>{section.title}</Text>
            <ul style={{ paddingLeft: 20 }}>
              {section.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        ))}
        
        <Alert 
          message="Penting!" 
          description={`Bayar sebelum ${new Date(transaction.expired_at).toLocaleString('id-ID')} atau transaksi akan dibatalkan otomatis.`}
          type="warning" 
          showIcon 
          style={{ marginTop: 20 }}
        />
      </div>
    );
  };

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
                  {activeSubscription.payment_method || '-'}
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
      
      {/* Pending Payments Section */}
      {pendingTransactions.length > 0 && (
        <Card title={<Title level={4}>Pembayaran Tertunda</Title>} style={{ marginBottom: 24 }}>
          {pendingTransactions.map((transaction, index) => (
            <Card 
              key={transaction.reference}
              type="inner" 
              style={{ marginBottom: index < pendingTransactions.length - 1 ? 16 : 0 }}
              extra={
                <Button 
                  icon={<ReloadOutlined />} 
                  loading={checkingStatus} 
                  onClick={() => handleCheckStatus(transaction.reference)}
                >
                  Cek Status
                </Button>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={16}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Referensi">
                      <Text copyable>{transaction.reference}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Paket">
                      {transaction.plan_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Metode Pembayaran">
                      {transaction.payment_name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total">
                      <Text strong>Rp {transaction.total_amount.toLocaleString('id-ID')}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Batas Waktu">
                      <Text type="danger">
                        {moment(transaction.expired_at).format('DD MMM YYYY HH:mm')}
                      </Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col xs={24} md={8}>
                  <div style={{ 
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '16px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <ClockCircleOutlined style={{ fontSize: 36, color: '#faad14', marginBottom: 16 }} />
                    <Title level={5}>Menunggu Pembayaran</Title>
                    <Button 
                      type="link" 
                      onClick={() => {
                        setPaymentResult(transaction);
                        setPaymentModalVisible(true);
                      }}
                    >
                      Lihat Instruksi Pembayaran
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>
          ))}
        </Card>
      )}

      {/* Available Plans Section */}
      <div id="subscription-plans">
        <Title level={4}>Paket Langganan Tersedia</Title>
        <Row gutter={[16, 16]}>
          {plans.map((plan) => (
            <Col xs={24} sm={12} md={8} lg={6} key={plan.id}>
              <Card
                hoverable
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{plan.name}</span>
                    <Tag color="green">Rp {plan.price.toLocaleString('id-ID')}</Tag>
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
          ))}
          {plans.length === 0 && !error && (
            <Col span={24}>
              <Empty description="Belum ada paket langganan tersedia" />
            </Col>
          )}
        </Row>
      </div>

      <Divider />
      
      {/* Transaction History Tabs */}
      <Tabs defaultActiveKey="subscriptions">
        <TabPane tab="Riwayat Langganan" key="subscriptions">
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
                filters: [
                  { text: 'Aktif', value: 'active' },
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
                },
                filters: [
                  { text: 'Lunas', value: 'paid' },
                  { text: 'Menunggu', value: 'pending' },
                  { text: 'Gagal', value: 'failed' },
                ],
                onFilter: (value, record) => record.payment_status === value,
              },
              {
                title: 'Metode Pembayaran',
                dataIndex: 'payment_method',
                key: 'payment_method',
                render: (method) => method || '-',
              },
            ]}
            pagination={{ pageSize: 5 }}
            locale={{ emptyText: 'Belum ada riwayat langganan' }}
          />
        </TabPane>
        
        <TabPane tab="Riwayat Transaksi" key="transactions">
          <Table
            dataSource={transactionHistories}
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
                dataIndex: 'plan_name',
                key: 'plan_name',
              },
              {
                title: 'Metode',
                dataIndex: 'payment_name',
                key: 'payment_name',
              },
              {
                title: 'Jumlah',
                dataIndex: 'total_amount',
                key: 'total_amount',
                render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
                sorter: (a, b) => a.total_amount - b.total_amount,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (status) => {
                  let color = 'default';
                  let text = status;
                  
                  if (status === 'PAID') {
                    color = 'success';
                    text = 'LUNAS';
                  } else if (status === 'UNPAID') {
                    color = 'warning';
                    text = 'MENUNGGU';
                  } else if (status === 'EXPIRED') {
                    color = 'error';
                    text = 'KEDALUWARSA';
                  } else if (status === 'FAILED') {
                    color = 'error';text = 'GAGAL';
                 }

                 return <Tag color={color}>{text}</Tag>;
               },
               filters: [
                 { text: 'LUNAS', value: 'PAID' },
                 { text: 'MENUNGGU', value: 'UNPAID' },
                 { text: 'KEDALUWARSA', value: 'EXPIRED' },
                 { text: 'GAGAL', value: 'FAILED' },
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
       </TabPane>
     </Tabs>

     {/* Payment Modal */}
     <Modal
       title={paymentResult ? "Detail Transaksi" : "Pembayaran Langganan"}
       open={paymentModalVisible}
       onCancel={() => {
         if (!paymentLoading) setPaymentModalVisible(false);
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
         <Form form={form} layout="vertical">

         <div style={{ marginBottom: 20 }}>
             <Title level={4}>Paket: {selectedPlan.name}</Title>
             <Paragraph>
               <Text strong>Harga:</Text> Rp {selectedPlan.price.toLocaleString('id-ID')}
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
             <Input placeholder="Contoh: 08123456789" />
           </Form.Item>
           
           <Divider />
           
           <Form.Item
             name="payment_method"
             label="Metode Pembayaran"
             rules={[{ required: true, message: 'Harap pilih metode pembayaran' }]}
           >
             <Radio.Group>
               <div style={{ marginBottom: 8 }}><Text strong>Transfer Bank</Text></div>
               <Row gutter={[8, 8]}>
                 {paymentMethods
                   .filter(method => method.type === 'bank')
                   .map(method => (
                     <Col span={12} key={method.code}>
                       <Radio.Button 
                         value={method.code}
                         style={{ 
                           width: '100%', 
                           height: '60px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center'
                         }}
                       >
                         <div style={{ textAlign: 'center' }}>
                           <BankOutlined style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }} />
                           <div>{method.name}</div>
                         </div>
                       </Radio.Button>
                     </Col>
                   ))}
               </Row>
               
               <div style={{ margin: '16px 0 8px' }}><Text strong>E-Wallet</Text></div>
               <Row gutter={[8, 8]}>
                 {paymentMethods
                   .filter(method => method.type === 'ewallet')
                   .map(method => (
                     <Col span={12} key={method.code}>
                       <Radio.Button 
                         value={method.code}
                         style={{ 
                           width: '100%', 
                           height: '60px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center'
                         }}
                       >
                         <div style={{ textAlign: 'center' }}>
                           <WalletOutlined style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }} />
                           <div>{method.name}</div>
                         </div>
                       </Radio.Button>
                     </Col>
                   ))}
               </Row>
               
               <div style={{ margin: '16px 0 8px' }}><Text strong>QRIS</Text></div>
               <Row gutter={[8, 8]}>
                 {paymentMethods
                   .filter(method => method.type === 'qris')
                   .map(method => (
                     <Col span={12} key={method.code}>
                       <Radio.Button 
                         value={method.code}
                         style={{ 
                           width: '100%', 
                           height: '60px',
                           display: 'flex',
                           alignItems: 'center',
                           justifyContent: 'center'
                         }}
                       >
                         <div style={{ textAlign: 'center' }}>
                           <CreditCardOutlined style={{ fontSize: '20px', display: 'block', marginBottom: '4px' }} />
                           <div>{method.name}</div>
                         </div>
                       </Radio.Button>
                     </Col>
                   ))}
               </Row>
             </Radio.Group>
           </Form.Item>
           
           {form.getFieldValue('payment_method') && (
             <div style={{ marginBottom: 16 }}>
               {(() => {
                 const selectedMethod = paymentMethods.find(
                   method => method.code === form.getFieldValue('payment_method')
                 );
                 if (!selectedMethod) return null;
                 
                 return (
                   <Descriptions bordered column={1} size="small">
                     <Descriptions.Item label="Harga Paket">
                       Rp {selectedPlan.price.toLocaleString('id-ID')}
                     </Descriptions.Item>
                     <Descriptions.Item label="Biaya Admin">
                       Rp {selectedMethod.fee.toLocaleString('id-ID')}
                     </Descriptions.Item>
                     <Descriptions.Item label="Total Pembayaran">
                       <Text strong>
                         Rp {(selectedPlan.price + selectedMethod.fee).toLocaleString('id-ID')}
                       </Text>
                     </Descriptions.Item>
                   </Descriptions>
                 );
               })()}
             </div>
           )}
           
           <Form.Item style={{ marginTop: 24 }}>
             <Button 
               type="primary" 
               onClick={handlePayment} 
               loading={paymentLoading}
               disabled={!form.getFieldValue('payment_method')}
               block
             >
               Lanjutkan Pembayaran
             </Button>
           </Form.Item>
         </Form>
       )}
       
       {/* Hasil Pembayaran */}
       {paymentResult && (
         <div>
           {paymentResult.status === 'UNPAID' ? (
             <Result
               status="info"
               title="Menunggu Pembayaran"
               subTitle={`Referensi: ${paymentResult.reference}`}
             />
           ) : paymentResult.status === 'PAID' ? (
             <Result
               status="success"
               title="Pembayaran Berhasil"
               subTitle={`Referensi: ${paymentResult.reference}`}
             />
           ) : (
             <Result
               status="error"
               title={paymentResult.status === 'EXPIRED' ? "Pembayaran Kedaluwarsa" : "Pembayaran Gagal"}
               subTitle={`Referensi: ${paymentResult.reference}`}
             />
           )}
           
           <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
             <Descriptions.Item label="Kode Transaksi">
               <Text copyable>{paymentResult.reference}</Text>
             </Descriptions.Item>
             <Descriptions.Item label="Metode Pembayaran">
               {paymentResult.payment_name}
             </Descriptions.Item>
             <Descriptions.Item label="Jumlah">
               <Text strong>
                 Rp {(paymentResult.amount || 0).toLocaleString('id-ID')}
               </Text>
             </Descriptions.Item>
             <Descriptions.Item label="Biaya Admin">
               Rp {(paymentResult.fee || 0).toLocaleString('id-ID')}
             </Descriptions.Item>
             <Descriptions.Item label="Total Pembayaran">
               <Text strong>
                 Rp {(paymentResult.total_amount || 0).toLocaleString('id-ID')}
               </Text>
             </Descriptions.Item>
             <Descriptions.Item label="Tanggal Dibuat">
               {moment(paymentResult.created_at).format('DD MMMM YYYY HH:mm')}
             </Descriptions.Item>
             {paymentResult.paid_at && (
               <Descriptions.Item label="Tanggal Pembayaran">
                 {moment(paymentResult.paid_at).format('DD MMMM YYYY HH:mm')}
               </Descriptions.Item>
             )}
             {paymentResult.expired_at && paymentResult.status === 'UNPAID' && (
               <Descriptions.Item label="Batas Waktu Pembayaran">
                 <Text type="danger">
                   {moment(paymentResult.expired_at).format('DD MMMM YYYY HH:mm')}
                 </Text>
               </Descriptions.Item>
             )}
             <Descriptions.Item label="Status">
               <Tag color={
                 paymentResult.status === 'PAID' ? 'success' : 
                 paymentResult.status === 'UNPAID' ? 'warning' : 'error'
               }>
                 {paymentResult.status === 'PAID' ? 'LUNAS' : 
                  paymentResult.status === 'UNPAID' ? 'MENUNGGU PEMBAYARAN' : 
                  paymentResult.status === 'EXPIRED' ? 'KEDALUWARSA' : 'GAGAL'}
               </Tag>
             </Descriptions.Item>
           </Descriptions>
           
           {paymentResult.status === 'UNPAID' && renderPaymentInstructions(paymentResult)}
           
           {paymentResult.status === 'UNPAID' && (
             <div style={{ marginTop: 20, textAlign: 'center' }}>
               <Button
                 type="primary"
                 icon={<ReloadOutlined />}
                 loading={checkingStatus}
                 onClick={() => handleCheckStatus(paymentResult.reference)}
               >
                 Periksa Status Pembayaran
               </Button>
             </div>
           )}
         </div>
       )}
     </Modal>
   </div>
 );
};

export default SubscriptionPage;