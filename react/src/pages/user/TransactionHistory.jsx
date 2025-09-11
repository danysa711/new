import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Spin, Tabs, Alert, Space, Modal, Descriptions, message } from 'antd';
import { ReloadOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const TransactionHistory = () => {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistories, setTransactionHistories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [transactionDetail, setTransactionDetail] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch pending transactions
      const pendingResponse = await axiosInstance.get('/api/tripay/pending-transactions');
      setPendingTransactions(pendingResponse.data);
      
      // Fetch transaction histories
      const historyResponse = await axiosInstance.get('/api/tripay/transaction-history');
      setTransactionHistories(historyResponse.data);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      message.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCheckStatus = async (reference) => {
    try {
      setCheckingStatus(true);
      
      const response = await axiosInstance.get(`/api/tripay/transaction-status/${reference}`);
      
      if (response.data && response.data.success) {
        const transaction = response.data.transaction;
        
        // Update transaction in state
        setPendingTransactions(prev => 
          prev.map(trans => 
            trans.reference === reference ? { ...trans, status: transaction.status } : trans
          ).filter(trans => trans.status === 'UNPAID')
        );
        
        // If status changed to PAID, move to transaction histories
        if (transaction.status === 'PAID') {
          setTransactionHistories(prev => [transaction, ...prev]);
          message.success('Pembayaran telah berhasil dikonfirmasi!');
        } else if (transaction.status === 'EXPIRED') {
          setTransactionHistories(prev => [transaction, ...prev]);
          message.warning('Pembayaran telah kedaluwarsa');
        } else {
          message.info('Status pembayaran belum berubah. Silakan coba lagi nanti.');
        }
      } else {
        message.error(response.data.message || 'Gagal memeriksa status pembayaran');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      message.error('Gagal memeriksa status pembayaran');
    } finally {
      setCheckingStatus(false);
    }
  };
  
  const viewTransactionDetail = (transaction) => {
    setTransactionDetail(transaction);
    setDetailModalVisible(true);
  };
  
  const renderPaymentInstructions = (transaction) => {
    if (!transaction) return null;
    
    const { qr_url, payment_code, instructions } = transaction;
    
    return (
      <div style={{ marginTop: 20 }}>
        <Title level={4}>Instruksi Pembayaran</Title>
        
        {transaction.payment_method === 'QRIS' && qr_url && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={qr_url} 
              alt="QRIS Code" 
              style={{ maxWidth: '200px', margin: '20px auto' }} 
            />
            <Text>Scan QR Code di atas menggunakan aplikasi e-wallet Anda</Text>
          </div>
        )}
        
        {transaction.payment_method !== 'QRIS' && payment_code && (
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
        
        {Array.isArray(instructions) && instructions.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 15 }}>
            <Text strong>{section.title}</Text>
            <ul style={{ paddingLeft: 20 }}>
              {section.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ul>
          </div>
        ))}
        
        {typeof instructions === 'string' && (
          <Alert
            message="Petunjuk Pembayaran"
            description={instructions}
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}
        
        {transaction.expired_at && transaction.status === 'UNPAID' && (
          <Alert 
            message="Penting!" 
            description={`Bayar sebelum ${moment(transaction.expired_at).format('DD MMMM YYYY HH:mm')} atau transaksi akan dibatalkan otomatis.`}
            type="warning" 
            showIcon 
            style={{ marginTop: 20 }}
          />
        )}
      </div>
    );
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID':
        return 'success';
      case 'UNPAID':
        return 'warning';
      case 'EXPIRED':
        return 'error';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'PAID':
        return 'LUNAS';
      case 'UNPAID':
        return 'MENUNGGU';
      case 'EXPIRED':
        return 'KEDALUWARSA';
      case 'FAILED':
        return 'GAGAL';
      default:
        return status;
    }
  };
  
  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID':
        return <CheckCircleOutlined />;
      case 'UNPAID':
        return <ClockCircleOutlined />;
      case 'EXPIRED':
      case 'FAILED':
        return <CloseCircleOutlined />;
      default:
        return null;
    }
  };
  
  const pendingColumns = [
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <Text copyable>{text}</Text>
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
      title: 'Batas Waktu',
      dataIndex: 'expired_at',
      key: 'expired_at',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            onClick={() => viewTransactionDetail(record)}
          >
            Detail
          </Button>
          <Button 
            size="small" 
            loading={checkingStatus} 
            onClick={() => handleCheckStatus(record.reference)}
          >
            Cek Status
          </Button>
        </Space>
      ),
    },
  ];
  
  const historyColumns = [
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <Text copyable>{text}</Text>
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
      sorter: (a, b) => a.total_amount - b.total_amount,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
      filters: [
        { text: 'LUNAS', value: 'PAID' },
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
          type="primary" 
          size="small" 
          onClick={() => viewTransactionDetail(record)}
        >
          Detail
        </Button>
      ),
    },
  ];
  
  if (loading && pendingTransactions.length === 0 && transactionHistories.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat data transaksi...</div>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={2}>Riwayat Transaksi</Title>
      
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchTransactions}
        >
          Refresh Data
        </Button>
      </div>
      
      <Tabs defaultActiveKey="pending" type="card">
        <TabPane 
          tab={
            <span>
              Menunggu Pembayaran
              {pendingTransactions.length > 0 && (
                <Tag color="warning" style={{ marginLeft: 8 }}>
                  {pendingTransactions.length}
                </Tag>
              )}
            </span>
          } 
          key="pending"
        >
          {pendingTransactions.length === 0 ? (
            <Alert
              message="Tidak ada transaksi yang menunggu pembayaran"
              description="Semua transaksi Anda telah selesai atau belum ada transaksi yang dibuat."
              type="info"
              showIcon
            />
          ) : (
            <Table
              dataSource={pendingTransactions}
              columns={pendingColumns}
              rowKey="reference"
              pagination={{ pageSize: 5 }}
            />
          )}
        </TabPane>
        
        <TabPane tab="Riwayat Pembayaran" key="history">
          {transactionHistories.length === 0 ? (
            <Alert
              message="Belum ada riwayat transaksi"
              description="Riwayat transaksi akan muncul setelah Anda melakukan pembayaran atau transaksi kedaluwarsa."
              type="info"
              showIcon
            />
          ) : (
            <Table
              dataSource={transactionHistories}
              columns={historyColumns}
              rowKey="reference"
              pagination={{ pageSize: 10 }}
            />
          )}
        </TabPane>
      </Tabs>
      
      {/* Transaction Detail Modal */}
      <Modal
        title="Detail Transaksi"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Tutup
          </Button>,
          transactionDetail?.status === 'UNPAID' && (
            <Button 
              key="check" 
              type="primary" 
              loading={checkingStatus}
              onClick={() => handleCheckStatus(transactionDetail.reference)}
            >
              Cek Status Pembayaran
            </Button>
          )
        ]}
        width={700}
      >
        {transactionDetail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag 
                icon={getStatusIcon(transactionDetail.status)} 
                color={getStatusColor(transactionDetail.status)}
                style={{ padding: '5px 10px', fontSize: '16px' }}
              >
                {getStatusText(transactionDetail.status)}
              </Tag>
            </div>
            
            <Descriptions
              bordered
              column={1}
              size="small"
            >
              <Descriptions.Item label="Referensi">
                <Text copyable>{transactionDetail.reference}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Metode Pembayaran">
                {transactionDetail.payment_name}
              </Descriptions.Item>
              <Descriptions.Item label="Paket">
                {transactionDetail.plan_name}
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah">
                Rp {parseInt(transactionDetail.amount).toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Biaya Admin">
                Rp {parseInt(transactionDetail.fee).toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong>Rp {parseInt(transactionDetail.total_amount).toLocaleString('id-ID')}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {moment(transactionDetail.created_at).format('DD MMMM YYYY HH:mm')}
              </Descriptions.Item>
              {transactionDetail.paid_at && (
                <Descriptions.Item label="Tanggal Pembayaran">
                  {moment(transactionDetail.paid_at).format('DD MMMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {transactionDetail.expired_at && (
                <Descriptions.Item label="Batas Waktu">
                  {moment(transactionDetail.expired_at).format('DD MMMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {transactionDetail.status === 'UNPAID' && renderPaymentInstructions(transactionDetail)}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TransactionHistory;