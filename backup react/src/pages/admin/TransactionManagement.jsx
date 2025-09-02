import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Table, Tag, Button, DatePicker, 
  Select, Input, Space, message, Badge, Descriptions, Modal, Tooltip, 
  Tabs, Alert, Statistic, Row, Col, Popconfirm
} from 'antd';
import { 
  SearchOutlined, SyncOutlined, EyeOutlined, 
  CheckCircleOutlined, CloseCircleOutlined,
  InfoCircleOutlined, ReloadOutlined, CopyOutlined,
  DollarOutlined, BankOutlined, QrcodeOutlined,
  WalletOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [status, setStatus] = useState('all');
  const [paymentType, setPaymentType] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [transactionStats, setTransactionStats] = useState({
    total: 0,
    totalPaid: 0,
    totalPending: 0,
    totalAmount: 0,
    paidAmount: 0
  });
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Fungsi untuk memuat data transaksi
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      
      // Format filter
      const startDate = dateRange[0].format('YYYY-MM-DD');
      const endDate = dateRange[1].format('YYYY-MM-DD');
      
      const filters = {
        startDate,
        endDate,
        status: status !== 'all' ? status : undefined,
        paymentType: paymentType !== 'all' ? paymentType : undefined,
        search: searchText || undefined
      };
      
      // Kirim request ke API
      const response = await axiosInstance.post('/api/transactions/filter', filters);
      
      if (response.data && Array.isArray(response.data.transactions)) {
        setTransactions(response.data.transactions);
        
        // Set statistik
        setTransactionStats({
          total: response.data.stats.total || 0,
          totalPaid: response.data.stats.totalPaid || 0,
          totalPending: response.data.stats.totalPending || 0,
          totalAmount: response.data.stats.totalAmount || 0,
          paidAmount: response.data.stats.paidAmount || 0
        });
      } else {
        message.error('Format respons tidak valid');
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      message.error('Gagal memuat data transaksi');
      setLoading(false);
    }
  };
  
  // Muat transaksi saat filter berubah
  useEffect(() => {
    if (dateRange && dateRange.length === 2) {
      fetchTransactions();
    }
  }, [dateRange, status, paymentType, searchText]);
  
  // Fungsi untuk memperbarui status transaksi
  const updateTransactionStatus = async (reference, newStatus) => {
    try {
      setCheckingStatus(true);
      
      // Kirim request ke API
      const response = await axiosInstance.put(`/api/transactions/${reference}/status`, {
        status: newStatus
      });
      
      if (response.data && response.data.success) {
        message.success(`Status transaksi berhasil diubah menjadi ${newStatus}`);
        
        // Refresh data transaksi
        fetchTransactions();
        
        // Tutup modal jika sedang terbuka
        if (detailModalVisible) {
          setDetailModalVisible(false);
        }
      } else {
        message.error(response.data?.message || 'Gagal memperbarui status transaksi');
      }
    } catch (error) {
      console.error('Error updating transaction status:', error);
      message.error('Gagal memperbarui status transaksi');
    } finally {
      setCheckingStatus(false);
    }
  };
  
  // Fungsi untuk memeriksa status transaksi di gateway pembayaran
  const checkPaymentStatus = async (reference) => {
    try {
      setCheckingStatus(true);
      
      // Kirim request ke API
      const response = await axiosInstance.get(`/api/transactions/${reference}/check`);
      
      if (response.data && response.data.success) {
        message.success('Status transaksi berhasil diperbarui');
        
        // Refresh data transaksi
        fetchTransactions();
        
        // Tutup modal jika sedang terbuka
        if (detailModalVisible) {
          setDetailModalVisible(false);
        }
      } else {
        message.info(response.data?.message || 'Status transaksi belum berubah');
      }
    } catch (error) {
      console.error('Error checking transaction status:', error);
      message.error('Gagal memeriksa status transaksi');
    } finally {
      setCheckingStatus(false);
    }
  };
  
  // Fungsi untuk menampilkan detail transaksi
  const showTransactionDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };
  
  // Fungsi untuk menyalin teks ke clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    message.success('Teks berhasil disalin');
  };
  
  // Status formatter
  const getStatusTag = (status) => {
    const statusMap = {
      'PAID': { color: 'success', icon: <CheckCircleOutlined />, text: 'LUNAS' },
      'UNPAID': { color: 'warning', icon: <ClockCircleOutlined />, text: 'MENUNGGU' },
      'EXPIRED': { color: 'error', icon: <CloseCircleOutlined />, text: 'KEDALUWARSA' },
      'FAILED': { color: 'error', icon: <CloseCircleOutlined />, text: 'GAGAL' },
    };
    
    const { color, icon, text } = statusMap[status] || { color: 'default', icon: <InfoCircleOutlined />, text: status };
    
    return <Tag color={color} icon={icon}>{text}</Tag>;
  };
  
  // Columns for the table
  const columns = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => (
        <Space>
          <Text>{text}</Text>
          <Button type="text" icon={<CopyOutlined />} onClick={() => copyToClipboard(text)} size="small" />
        </Space>
      ),
    },
    {
      title: 'Pelanggan',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text, record) => (
        <>
          <div>{text}</div>
          <div>
            <small>{record.customer_email}</small>
          </div>
        </>
      ),
    },
    {
      title: 'Metode',
      dataIndex: 'payment_name',
      key: 'payment_name',
      render: (text, record) => (
        <Tag icon={
          record.payment_type === 'manual' ? 
            (record.payment_method.includes('QRIS') ? <QrcodeOutlined /> : 
             record.payment_method.includes('BANK') ? <BankOutlined /> : <WalletOutlined />) : 
            <InfoCircleOutlined />
        }>
          {text}
        </Tag>
      ),
      filters: [
        { text: 'Tripay', value: 'tripay' },
        { text: 'Manual', value: 'manual' },
      ],
      onFilter: (value, record) => record.payment_type === value,
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
      render: (status) => getStatusTag(status),
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
        <Space>
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => showTransactionDetail(record)} 
            type="primary"
            size="small"
          />
          
          {record.status === 'UNPAID' && (
            <>
              <Button 
                icon={<SyncOutlined />} 
                size="small"
                onClick={() => checkPaymentStatus(record.reference)}
                loading={checkingStatus}
              >
                Cek Status
              </Button>
              
              <Popconfirm
                title="Konfirmasi pembayaran ini sebagai LUNAS?"
                onConfirm={() => updateTransactionStatus(record.reference, 'PAID')}
              >
                <Button 
                  icon={<CheckCircleOutlined />} 
                  size="small"
                  type="primary"
                  style={{ backgroundColor: '#52c41a' }}
                >
                  Set Lunas
                </Button>
              </Popconfirm>
            </>
          )}
          
          {record.status === 'UNPAID' && (
            <Popconfirm
              title="Set transaksi ini sebagai GAGAL?"
              onConfirm={() => updateTransactionStatus(record.reference, 'FAILED')}
            >
              <Button 
                icon={<CloseCircleOutlined />} 
                size="small"
                danger
              >
                Set Gagal
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];
  
  return (
    <div>
      <Title level={2}>Manajemen Transaksi</Title>
      
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Transaksi"
              value={transactionStats.total}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Transaksi Lunas"
              value={transactionStats.totalPaid}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Transaksi Pending"
              value={transactionStats.totalPending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Pendapatan"
              value={transactionStats.paidAmount}
              valueStyle={{ color: '#3f8600' }}
              prefix={<DollarOutlined />}
              suffix="Rp"
            />
          </Card>
        </Col>
      </Row>
      
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker 
            value={dateRange} 
            onChange={setDateRange} 
            style={{ width: 300 }}
            allowClear={false}
            ranges={{
              'Hari Ini': [moment().startOf('day'), moment().endOf('day')],
              'Minggu Ini': [moment().startOf('week'), moment().endOf('week')],
              'Bulan Ini': [moment().startOf('month'), moment().endOf('month')],
              '30 Hari Terakhir': [moment().subtract(30, 'days'), moment()],
            }}
          />
          
          <Select 
            value={status} 
            onChange={setStatus} 
            style={{ width: 140 }}
            placeholder="Filter Status"
          >
            <Option value="all">Semua Status</Option>
            <Option value="PAID">Lunas</Option>
            <Option value="UNPAID">Menunggu</Option>
            <Option value="EXPIRED">Kedaluwarsa</Option>
            <Option value="FAILED">Gagal</Option>
          </Select>
          
          <Select 
            value={paymentType} 
            onChange={setPaymentType} 
            style={{ width: 160 }}
            placeholder="Tipe Pembayaran"
          >
            <Option value="all">Semua Tipe</Option>
            <Option value="tripay">Tripay</Option>
            <Option value="manual">Manual</Option>
          </Select>
          
          <Input 
            placeholder="Cari referensi atau nama" 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 200 }}
            prefix={<SearchOutlined />}
            allowClear
          />
        </Space>
        
        <Table 
          dataSource={transactions} 
          columns={columns} 
          rowKey="reference" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
      
      <Modal
        title="Detail Transaksi"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Tutup
          </Button>
        ]}
        width={700}
      >
        {selectedTransaction && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {selectedTransaction.status === 'PAID' ? (
                <Badge status="success" text={<Text strong style={{ fontSize: 16 }}>LUNAS</Text>} />
              ) : selectedTransaction.status === 'UNPAID' ? (
                <Badge status="warning" text={<Text strong style={{ fontSize: 16 }}>MENUNGGU PEMBAYARAN</Text>} />
              ) : (
                <Badge status="error" text={<Text strong style={{ fontSize: 16 }}>{selectedTransaction.status}</Text>} />
              )}
            </div>
            
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Reference">
                <Text copyable>{selectedTransaction.reference}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Merchant Reference">
                <Text copyable>{selectedTransaction.merchant_ref}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Metode Pembayaran">
                {selectedTransaction.payment_name}
              </Descriptions.Item>
              <Descriptions.Item label="Tipe Pembayaran">
                <Tag color={selectedTransaction.payment_type === 'tripay' ? 'blue' : 'green'}>
                  {selectedTransaction.payment_type === 'tripay' ? 'Tripay' : 'Manual'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nama Pelanggan">
                {selectedTransaction.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Email Pelanggan">
                {selectedTransaction.customer_email}
              </Descriptions.Item>
              <Descriptions.Item label="Nomor Telepon">
                {selectedTransaction.customer_phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Paket Langganan">
                {selectedTransaction.plan_name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah Pembayaran">
                Rp {selectedTransaction.amount.toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Biaya Admin">
                Rp {selectedTransaction.fee.toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Total">
                <Text strong>Rp {selectedTransaction.total_amount.toLocaleString('id-ID')}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {moment(selectedTransaction.created_at).format('DD MMMM YYYY HH:mm:ss')}
              </Descriptions.Item>
              {selectedTransaction.paid_at && (
                <Descriptions.Item label="Tanggal Pembayaran">
                  {moment(selectedTransaction.paid_at).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
              {selectedTransaction.expired_at && (
                <Descriptions.Item label="Batas Waktu">
                  {moment(selectedTransaction.expired_at).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {selectedTransaction.status === 'UNPAID' && selectedTransaction.payment_type === 'manual' && (
              <div style={{ marginTop: 20 }}>
                <Alert
                  message="Instruksi Pembayaran Manual"
                  description={
                    <>
                      {selectedTransaction.payment_method.includes('QRIS') && selectedTransaction.qr_url && (
                        <div style={{ textAlign: 'center', marginBottom: 10 }}>
                          <img 
                            src={selectedTransaction.qr_url} 
                            alt="QR Code" 
                            style={{ maxWidth: 200, margin: '0 auto' }} 
                          />
                        </div>
                      )}
                      
                      {selectedTransaction.payment_code && !selectedTransaction.payment_method.includes('QRIS') && (
                        <div style={{ marginBottom: 10 }}>
                          <Text strong>Nomor Rekening/Akun:</Text> 
                          <Text copyable>{selectedTransaction.payment_code}</Text>
                          {selectedTransaction.account_name && (
                            <div>
                              <Text strong>Atas Nama:</Text> {selectedTransaction.account_name}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {selectedTransaction.instructions && (
                        <div>
                          <Text strong>Instruksi:</Text>
                          <div>{selectedTransaction.instructions}</div>
                        </div>
                      )}
                    </>
                  }
                  type="info"
                  showIcon
                />
              </div>
            )}
            
            {selectedTransaction.status === 'UNPAID' && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  icon={<SyncOutlined />}
                  loading={checkingStatus}
                  onClick={() => checkPaymentStatus(selectedTransaction.reference)}
                >
                  Periksa Status Pembayaran
                </Button>
                
                <Space>
                  <Popconfirm
                    title="Konfirmasi pembayaran ini sebagai LUNAS?"
                    onConfirm={() => updateTransactionStatus(selectedTransaction.reference, 'PAID')}
                  >
                    <Button 
                      icon={<CheckCircleOutlined />} 
                      type="primary"
                      style={{ backgroundColor: '#52c41a' }}
                    >
                      Set Lunas
                    </Button>
                  </Popconfirm>
                  
                  <Popconfirm
                    title="Set transaksi ini sebagai GAGAL?"
                    onConfirm={() => updateTransactionStatus(selectedTransaction.reference, 'FAILED')}
                  >
                    <Button 
                      icon={<CloseCircleOutlined />} 
                      danger
                    >
                      Set Gagal
                    </Button>
                  </Popconfirm>
                </Space>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default TransactionManagement;