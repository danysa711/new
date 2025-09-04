// react/src/pages/user/SubscriptionPage.jsx
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Space, Upload, message
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, ClockCircleOutlined, UploadOutlined
} from '@ant-design/icons';
import { uploadPaymentProof } from '../../services/axios'; // Import fungsi uploadPaymentProof
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
  const [selectedPaymentReference, setSelectedPaymentReference] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Efek untuk memuat data saat komponen dimuat
  // pages/user/SubscriptionPage.jsx - perbaikan bagian useEffect untuk memuat data

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Kode yang sama seperti di useEffect untuk memuat data
    // (copy semua isi useEffect di sini)
    
    setLoading(false);
  } catch (err) {
    console.error('Error fetching subscription data:', err);
    setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
    setLoading(false);
  }
};

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
        
        // Pastikan qrisResponse.data adalah array
        let qrisData = [];
        if (Array.isArray(qrisResponse.data)) {
          qrisData = qrisResponse.data;
        } else if (qrisResponse.data && qrisResponse.data.data && Array.isArray(qrisResponse.data.data)) {
          qrisData = qrisResponse.data.data;
        } else {
          console.warn("Respons QRIS payments bukan array:", qrisResponse.data);
          qrisData = [];
        }
        
        // Filter pembayaran yang belum kedaluwarsa (kurang dari 1 jam)
        const now = new Date();
        const pendingPayments = qrisData
          .filter(payment => payment.status === 'UNPAID') // Hanya yang menunggu pembayaran
          .filter(payment => {
            const createdAt = new Date(payment.createdAt);
            const timeDiff = now - createdAt; // dalam milidetik
            return timeDiff < 60 * 60 * 1000; // kurang dari 1 jam
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // Urutkan terbaru dulu
          .slice(0, 3); // Ambil maksimal 3 item
        
        // Set ke state
        setPendingPayments(pendingPayments);
        
        // Auto reject payments that are older than 1 hour
        const expiredPayments = qrisData
          .filter(payment => payment.status === 'UNPAID')
          .filter(payment => {
            const createdAt = new Date(payment.createdAt);
            const timeDiff = now - createdAt; // dalam milidetik
            return timeDiff >= 60 * 60 * 1000; // lebih dari atau sama dengan 1 jam
          });
          
        // Reject expired payments
        for (const payment of expiredPayments) {
          try {
            await axiosInstance.put(`/api/admin/qris-payment/${payment.reference}/verify?admin=true`, 
              { status: 'REJECTED' }
            );
            console.log(`Auto rejected expired payment: ${payment.reference}`);
          } catch (err) {
            console.error(`Failed to auto reject payment ${payment.reference}:`, err);
          }
        }
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
  
  // Set interval untuk auto-refresh setiap 30 detik
  const intervalId = setInterval(fetchData, 30000);
  return () => clearInterval(intervalId);
}, [user, updateUserData]);

// Fungsi untuk membatalkan pembayaran
const handleCancelPayment = async (reference) => {
  try {
    const result = await axiosInstance.put(`/api/admin/qris-payment/${reference}/verify?admin=true`, 
      { status: 'REJECTED' }
    );
    
    if (result.data && result.data.success) {
      message.success('Pembayaran berhasil dibatalkan');
      // Refresh data
      fetchData();
    } else {
      message.error('Gagal membatalkan pembayaran');
    }
  } catch (error) {
    console.error("Error cancelling payment:", error);
    message.error('Gagal membatalkan pembayaran: ' + (error.message || 'Unknown error'));
  }
};

// Fungsi untuk mengunggah bukti pembayaran
const handleUploadProof = async (reference) => {
  // Tampilkan dialog upload
  setUploadModalVisible(true);
  setSelectedPaymentReference(reference);
};

// Dialog upload bukti pembayaran
const renderUploadModal = () => (
  <Modal
    title="Upload Bukti Pembayaran"
    visible={uploadModalVisible}
    onCancel={() => {
      setUploadModalVisible(false);
      setUploadFile(null);
    }}
    footer={[
      <Button 
        key="cancel" 
        onClick={() => {
          setUploadModalVisible(false);
          setUploadFile(null);
        }}
      >
        Batal
      </Button>,
      <Button 
        key="upload" 
        type="primary"
        loading={uploadLoading}
        disabled={!uploadFile}
        onClick={handleSubmitUpload}
      >
        Upload
      </Button>
    ]}
  >
    <Upload
      beforeUpload={(file) => {
        setUploadFile(file);
        return false;
      }}
      fileList={uploadFile ? [uploadFile] : []}
      onRemove={() => setUploadFile(null)}
      accept="image/*"
    >
      <Button icon={<UploadOutlined />}>Pilih File Bukti Pembayaran</Button>
    </Upload>
    <div style={{ marginTop: 16 }}>
      <Text type="secondary">
        Upload bukti pembayaran berupa screenshot atau foto. Pastikan informasi pembayaran terlihat jelas.
      </Text>
    </div>
  </Modal>
);

// Handler submit upload
const handleSubmitUpload = async () => {
  if (!uploadFile || !selectedPaymentReference) {
    message.error('File bukti pembayaran harus dipilih');
    return;
  }
  
  setUploadLoading(true);
  try {
    const result = await uploadPaymentProof(selectedPaymentReference, uploadFile);
    
    if (result && result.success) {
      message.success('Bukti pembayaran berhasil diunggah');
      setUploadModalVisible(false);
      setUploadFile(null);
      // Refresh data
      fetchData();
    } else {
      message.error(result?.message || 'Gagal mengunggah bukti pembayaran');
    }
  } catch (error) {
    console.error("Error uploading proof:", error);
    message.error('Gagal mengunggah bukti pembayaran: ' + (error.message || 'Unknown error'));
  } finally {
    setUploadLoading(false);
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
          title: 'Status',
          key: 'status',
          render: () => <Tag color="processing">MENUNGGU VERIFIKASI</Tag>
        }
      ]}
      pagination={false}
    />
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
                
                const { color, text } = statusMap[status] || { color: 'default', text: status.toUpperCase() };
                
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