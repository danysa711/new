// react/src/pages/user/UserPaymentPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Spin, 
  Empty, Alert, Space, Tabs, Statistic, Modal, Image
} from 'antd';
import { 
  WalletOutlined, CheckCircleOutlined, 
  CloseCircleOutlined, ClockCircleOutlined,
  EyeOutlined, ReloadOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const UserPaymentPage = () => {
  const { user } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    failed: 0
  });
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Memuat data transaksi
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      // Fetch pembayaran QRIS
      const qrisResponse = await axiosInstance.get('/api/qris-payments');
      
      // Format data untuk tampilan
      const formattedQris = qrisResponse.data.map(payment => ({
        ...payment,
        payment_type: 'QRIS',
        payment_name: 'QRIS',
        created_date: payment.createdAt
      }));
      
      // Pisahkan transaksi pending dan semua transaksi
      const pending = formattedQris.filter(tx => tx.status === 'UNPAID');
      const all = formattedQris;
      
      setTransactions(all);
      setPendingTransactions(pending);
      
      // Hitung statistik
      setStats({
        total: all.length,
        pending: all.filter(tx => tx.status === 'UNPAID').length,
        paid: all.filter(tx => tx.status === 'PAID').length,
        failed: all.filter(tx => ['EXPIRED', 'REJECTED'].includes(tx.status)).length
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchTransactions();
    
    // Set interval untuk refresh data setiap 30 detik
    const intervalId = setInterval(() => {
      fetchTransactions();
    }, 30000);
    
    // Clear interval pada unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Tampilkan bukti pembayaran
  const viewPaymentProof = (payment) => {
    setSelectedPayment(payment);
    setViewModalVisible(true);
  };
  
  // Render status transaksi
  const renderStatus = (status) => {
    let color = 'default';
    let text = status;
    
    switch (status) {
      case 'PAID':
        color = 'success';
        text = 'SUKSES';
        break;
      case 'UNPAID':
        color = 'processing';
        text = 'MENUNGGU';
        break;
      case 'EXPIRED':
        color = 'error';
        text = 'KEDALUWARSA';
        break;
      case 'REJECTED':
        color = 'error';
        text = 'DITOLAK';
        break;
      default:
        break;
    }
    
    return <Tag color={color}>{text}</Tag>;
  };

  // Kolom tabel
  const columns = [
    {
      title: 'ID Transaksi',
      dataIndex: 'reference',
      key: 'reference',
      render: text => <Text copyable style={{ fontSize: '12px' }}>{text}</Text>
    },
    {
      title: 'Metode',
      dataIndex: 'payment_name',
      key: 'payment_name',
      render: () => 'QRIS'
    },
    {
      title: 'Jumlah',
      dataIndex: 'total_amount',
      key: 'amount',
      render: amount => `Rp ${parseFloat(amount).toLocaleString('id-ID')}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: renderStatus
    },
    {
      title: 'Tanggal',
      dataIndex: 'created_date',
      key: 'date',
      render: date => moment(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Bukti',
      key: 'proof',
      render: (_, record) => record.payment_proof ? (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => viewPaymentProof(record)}
        >
          Lihat
        </Button>
      ) : '-'
    }
  ];

  return (
    <div>
      <Title level={2}>Pembayaran</Title>
      
      {/* Statistik Pembayaran */}
      <div style={{ marginBottom: 24 }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <Statistic 
              title="Total Transaksi" 
              value={stats.total} 
              prefix={<WalletOutlined />} 
            />
            <Statistic 
              title="Menunggu" 
              value={stats.pending} 
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Statistic 
              title="Sukses" 
              value={stats.paid} 
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Statistic 
              title="Gagal" 
              value={stats.failed} 
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </div>
        </Card>
      </div>
      
      {/* Tabel Transaksi */}
      <Card
        title="Riwayat Transaksi"
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchTransactions}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Tabs defaultActiveKey="pending">
          <TabPane tab="Menunggu Pembayaran" key="pending">
            <Table 
              dataSource={pendingTransactions} 
              columns={columns} 
              rowKey="reference" 
              loading={loading}
              locale={{ emptyText: 'Tidak ada transaksi menunggu' }}
              pagination={{ pageSize: 5 }}
            />
            
            {pendingTransactions.length === 0 && !loading && (
              <Empty description="Tidak ada pembayaran tertunda" />
            )}
          </TabPane>
          <TabPane tab="Semua Transaksi" key="all">
            <Table 
              dataSource={transactions} 
              columns={columns} 
              rowKey="reference" 
              loading={loading}
              locale={{ emptyText: 'Belum ada riwayat transaksi' }}
              pagination={{ pageSize: 5 }}
            />
          </TabPane>
        </Tabs>
      </Card>
      
      {/* Modal untuk menampilkan bukti pembayaran */}
      <Modal
        title="Detail Pembayaran"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Tutup
          </Button>
        ]}
        width={700}
      >
        {selectedPayment && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Text strong>Referensi:</Text> <Text copyable>{selectedPayment.reference}</Text>
              <br />
              <Text strong>Status:</Text> {renderStatus(selectedPayment.status)}
              <br />
              <Text strong>Jumlah:</Text> Rp {parseFloat(selectedPayment.total_amount).toLocaleString('id-ID')}
              <br />
              <Text strong>Tanggal:</Text> {moment(selectedPayment.createdAt).format('DD/MM/YYYY HH:mm')}
            </div>
            
            <Alert
              message={
                selectedPayment.status === 'UNPAID' 
                  ? "Pembayaran Anda sedang menunggu verifikasi admin" 
                  : selectedPayment.status === 'PAID' 
                    ? "Pembayaran Anda telah berhasil diverifikasi" 
                    : "Pembayaran Anda ditolak atau kedaluwarsa"
              }
              type={
                selectedPayment.status === 'UNPAID' 
                  ? "warning" 
                  : selectedPayment.status === 'PAID' 
                    ? "success" 
                    : "error"
              }
              showIcon
              style={{ marginBottom: 20 }}
            />
            
            {selectedPayment.payment_proof && (
              <div style={{ textAlign: 'center' }}>
                <Text strong>Bukti Pembayaran</Text>
                <div style={{ marginTop: 10 }}>
                  <Image
                    src={selectedPayment.payment_proof}
                    alt="Bukti Pembayaran"
                    style={{ maxHeight: '400px' }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default UserPaymentPage;