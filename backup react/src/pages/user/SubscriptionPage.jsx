// react/src/pages/user/SubscriptionPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Steps, Select, Radio, Input, Form, message, Tabs
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, BankOutlined, WalletOutlined,
  InfoCircleOutlined, CreditCardOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, DollarOutlined, ReloadOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import { PaymentContext } from '../../context/PaymentContext'; // Import PaymentContext
import moment from 'moment';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

const SubscriptionPage = () => {
  // Context
  const { user, updateUserData, fetchUserProfile } = useContext(AuthContext);
  const { 
    paymentMethods, 
    tripayEnabled, 
    loading: paymentContextLoading,
    pendingTransactions,
    transactionHistory,
    refreshTransactions,
    refreshHistory,
    checkTransactionStatus,
    createManualTransaction,
    createTripayTransaction
  } = useContext(PaymentContext);
  
  // State
  const [useDetailedPaymentView, setUseDetailedPaymentView] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [form] = Form.useForm();
  
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
    
    // Set initial form values
    form.setFieldsValue({
      name: user?.username,
      email: user?.email
    });
    
    setPaymentResult(null);
    setPaymentModalVisible(true);
  };
  
  // Fungsi untuk melakukan pembayaran
  const handleSubmitPayment = () => {
    handlePayment(
      form, 
      selectedPlan, 
      paymentMethods, 
      setPaymentLoading, 
      setPaymentResult, 
      setPendingTransactions, 
      createManualTransaction, 
      createTripayTransaction, 
      fetchUserProfile
    );
  };
  
  // Fungsi untuk memeriksa status pembayaran
  const handleCheckStatus = async (reference) => {
    try {
      setCheckingStatus(true);
      
      const result = await checkTransactionStatus(reference);
      
      if (result.success) {
        if (result.newStatus === 'PAID') {
          message.success('Pembayaran telah berhasil diverifikasi!');
          
          // Refresh user profile data to update subscription status
          if (fetchUserProfile) {
            await fetchUserProfile();
          }
          
          // Close modal
          setPaymentModalVisible(false);
        } else {
          message.info('Status pembayaran belum berubah, silakan coba beberapa saat lagi');
        }
      } else {
        message.info(result.message || 'Status pembayaran belum berubah');
      }
      
      setCheckingStatus(false);
    } catch (error) {
      console.error('Error checking payment status:', error);
      message.error('Gagal memeriksa status pembayaran');
      setCheckingStatus(false);
    }
  };
  
  if (loading || paymentContextLoading) {
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
          renderPaymentForm(form, selectedPlan, paymentMethods, paymentLoading, useDetailedPaymentView, handleSubmitPayment)
        )}
        
        {/* Hasil Pembayaran */}
        {paymentResult && (
          renderPaymentResult(paymentResult, checkingStatus, handleCheckStatus)
        )}
        
        {paymentLoading && !paymentResult && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Memproses pembayaran...</div>
          </div>
        )}
      </Modal>
      
      {/* Subscription History Section */}
      <Divider />
      
      {/* Transaction History Tabs */}
      <Tabs 
        defaultActiveKey="subscriptions"
        items={[
          {
            key: "subscriptions",
            label: "Riwayat Langganan",
            children: (
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
                      
                      const { color, text } = statusMap[status] || { color: 'default', text: status.toUpperCase() };
                      
                      return <Tag color={color}>{text}</Tag>;
                    },
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
            )
          },
          {
            key: "transactions",
            label: "Riwayat Transaksi",
            children: (
              <Table
                dataSource={transactionHistory}
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
                    render: (amount) => `Rp ${parseInt(amount).toLocaleString('id-ID')}`,
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
                        color = 'error';
                        text = 'GAGAL';
                      }

                      return <Tag color={color}>{text}</Tag>;
                    },
                  },
                  {
                    title: 'Tanggal',
                    dataIndex: 'createdAt',
                    key: 'createdAt',
                    render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
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
          }
        ]}
      />
    </div>
  );
};

// ================ PART 1: Handle Payment Form =================
const handlePayment = async (form, selectedPlan, paymentMethods, setPaymentLoading, setPaymentResult, setPendingTransactions, createManualTransaction, createTripayTransaction, fetchUserProfile) => {
  try {
    setPaymentLoading(true);
    
    // Validasi form
    const values = await form.validateFields();
    
    if (!values.payment_method) {
      message.warning('Silakan pilih metode pembayaran');
      setPaymentLoading(false);
      return;
    }
    
    // Log untuk debugging
    console.log('Form values:', values);
    console.log('Selected plan:', selectedPlan);
    
    // Cari metode pembayaran yang dipilih
    const selectedMethod = paymentMethods.find(m => m.code === values.payment_method);
    console.log('Selected payment method:', selectedMethod);
    
    if (!selectedMethod) {
      message.error('Metode pembayaran tidak valid');
      setPaymentLoading(false);
      return;
    }
    
    // Data dasar untuk transaksi
    const transactionData = {
      plan_id: selectedPlan.id,
      payment_method_code: values.payment_method,
      name: values.name,
      email: values.email,
      phone: values.phone
    };
    
    let result;
    
    // Jika metode pembayaran manual
    if (selectedMethod.isManual) {
      result = await createManualTransaction(transactionData);
    } else {
      // Jika metode Tripay
      result = await createTripayTransaction(transactionData);
    }
    
    if (result.success) {
      setPaymentResult(result.data);
      
      // Refresh user profile to update subscription status after successful payment creation
      if (fetchUserProfile) {
        fetchUserProfile();
      }
    } else {
      message.error(result.message || 'Gagal membuat transaksi');
    }
    
    setPaymentLoading(false);
  } catch (err) {
    console.error('Error processing payment:', err);
    message.error('Gagal memproses pembayaran: ' + (err.message || 'Terjadi kesalahan'));
    setPaymentLoading(false);
  }
};

// ================ PART 2: RENDER PAYMENT FORM =================
const renderPaymentForm = (form, selectedPlan, paymentMethods, paymentLoading, useDetailedPaymentView, handlePayment) => (
  <Form form={form} layout="vertical" onFinish={handlePayment}>
    <div style={{ marginBottom: 20 }}>
      <Title level={4}>Paket: {selectedPlan.name}</Title>
      <Paragraph>
        <Text strong>Harga:</Text> Rp {parseInt(selectedPlan.price).toLocaleString('id-ID')}
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
    
    <Divider />
    
    <Form.Item
      name="payment_method"
      label="Metode Pembayaran"
      rules={[{ required: true, message: 'Harap pilih metode pembayaran' }]}
    >
      {/* Opsi 1: Tampilan Kategorisasi (Bank, E-Wallet, QRIS) */}
      {useDetailedPaymentView ? (
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
                      {method.isManual && <Tag color="green" size="small">Manual</Tag>}
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
                      {method.isManual && <Tag color="green" size="small">Manual</Tag>}
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
                      {method.isManual && <Tag color="green" size="small">Manual</Tag>}
                    </div>
                  </Radio.Button>
                </Col>
              ))}
          </Row>
        </Radio.Group>
      ) : (
        /* Opsi 2: Tampilan Sederhana (inline buttons) */
        <Radio.Group buttonStyle="solid">
          {paymentMethods.map((method) => (
            <Radio.Button 
              key={method.code} 
              value={method.code} 
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {method.name}
              {method.fee > 0 && <Text type="secondary"> (+{method.fee})</Text>}
              {method.isManual && <Tag color="green" style={{ marginLeft: 4 }}>Manual</Tag>}
            </Radio.Button>
          ))}
        </Radio.Group>
      )}
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
                Rp {parseInt(selectedPlan.price).toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Biaya Admin">
                Rp {parseInt(selectedMethod.fee || 0).toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Pembayaran">
                <Text strong>
                  Rp {parseInt(selectedPlan.price + (selectedMethod.fee || 0)).toLocaleString('id-ID')}
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
        htmlType="submit"
        loading={paymentLoading}
        disabled={paymentLoading || !form.getFieldValue('payment_method')}
        block
      >
        Lanjutkan Pembayaran
      </Button>
    </Form.Item>
  </Form>
);

// ================ PART 3: RENDER PAYMENT INSTRUCTIONS =================
const renderPaymentInstructions = (payment) => {
  if (!payment) return null;
  
  const { payment_type, qr_url, payment_code, instructions, account_name, payment_method } = payment;
  
  // Jika pembayaran manual
  if (payment_type === 'manual') {
    return (
      <div style={{ marginTop: 20 }}>
        <Divider />
        <Title level={4}>Instruksi Pembayaran</Title>
        
        {payment_method && payment_method.includes('QRIS') && qr_url && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={qr_url} 
              alt="QRIS Code" 
              style={{ maxWidth: '200px', margin: '20px auto' }} 
            />
            <Text>Scan QR Code di atas menggunakan aplikasi e-wallet Anda</Text>
          </div>
        )}
        
        {payment_code && payment_method && !payment_method.includes('QRIS') && (
          <div>
            <Alert
              message={payment_method.includes('BANK') ? "Rekening Tujuan" : "Akun Tujuan"}
              description={
                <>
                  <Text copyable strong style={{ fontSize: '16px' }}>
                    {payment_code}
                  </Text>
                  {account_name && (
                    <div style={{ marginTop: 8 }}>
                      a/n {account_name}
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
        
        {instructions && (
          <Alert
            message="Petunjuk Pembayaran"
            description={instructions}
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}
        
        <Alert 
          message="Penting!" 
          description="Setelah melakukan pembayaran, silakan konfirmasi ke admin untuk aktivasi langganan Anda. Anda juga dapat menekan tombol 'Periksa Status Pembayaran' secara berkala untuk memperbarui status pembayaran."
          type="warning" 
          showIcon 
          style={{ marginTop: 20 }}
        />
      </div>
    );
  }
  
  // Jika pembayaran Tripay
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
      
      {payment_method && payment_method !== 'QRIS' && payment_code && (
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
      
      {instructions && (
        <>
          {typeof instructions === 'string' && instructions.startsWith('[') ? (
            // Jika instructions dalam format JSON string, parsing dan tampilkan
            (() => {
              try {
                const parsedInstructions = JSON.parse(instructions);
                return (
                  <div>
                    {Array.isArray(parsedInstructions) && parsedInstructions.map((section, idx) => (
                      <div key={idx} style={{ marginBottom: 15 }}>
                        <Text strong>{section.title}</Text>
                        <ul style={{ paddingLeft: 20 }}>
                          {section.steps && Array.isArray(section.steps) && section.steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                );
              } catch (e) {
                // Jika gagal parsing, tampilkan sebagai text biasa
                return (
                  <Alert
                    message="Petunjuk Pembayaran"
                    description={instructions}
                    type="info"
                    showIcon
                    style={{ marginBottom: 20 }}
                  />
                );
              }
            })()
          ) : (
            <Alert
              message="Petunjuk Pembayaran"
              description={instructions}
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}
        </>
      )}
      
      {payment.expired_at && (
        <Alert 
          message="Penting!" 
          description={`Bayar sebelum ${new Date(payment.expired_at).toLocaleString('id-ID')} atau transaksi akan dibatalkan otomatis.`}
          type="warning" 
          showIcon 
          style={{ marginTop: 20 }}
        />
      )}
    </div>
  );
};

// ================ PART 4: RENDER PAYMENT RESULT =================
const renderPaymentResult = (transaction, checkingStatus, handleCheckStatus) => {
  return (
    <div>
      <Result
        status="success"
        title="Pembayaran Berhasil Dibuat"
        subTitle={
          <div>
            <div>Referensi: {transaction.reference}</div>
            <div>Status: <Tag color="warning">MENUNGGU PEMBAYARAN</Tag></div>
          </div>
        }
      />
      
      <Descriptions
        title="Detail Transaksi"
        bordered
        column={1}
        style={{ marginBottom: 20 }}
      >
        <Descriptions.Item label="Referensi">
          <Text copyable>{transaction.reference}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Metode Pembayaran">
          {transaction.payment_name}
        </Descriptions.Item>
        <Descriptions.Item label="Paket">
          {transaction.plan_name}
        </Descriptions.Item>
        <Descriptions.Item label="Jumlah">
          Rp {parseInt(transaction.amount).toLocaleString('id-ID')}
        </Descriptions.Item>
        {transaction.fee > 0 && (
          <Descriptions.Item label="Biaya Admin">
            Rp {parseInt(transaction.fee).toLocaleString('id-ID')}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Total">
          <Text strong>Rp {parseInt(transaction.total_amount).toLocaleString('id-ID')}</Text>
        </Descriptions.Item>
        <Descriptions.Item label="Batas Waktu">
          {new Date(transaction.expired_at).toLocaleString('id-ID')}
        </Descriptions.Item>
      </Descriptions>
      
      {renderPaymentInstructions(transaction)}
      
      <div style={{ marginTop: 20, textAlign: 'center' }}>
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          loading={checkingStatus}
          onClick={() => handleCheckStatus(transaction.reference)}
        >
          Periksa Status Pembayaran
        </Button>
      </div>
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