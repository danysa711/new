import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Typography, Spin, Space, Select, Input, message, Modal, Descriptions, Statistic, Row, Col } from 'antd';
import { ReloadOutlined, SearchOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const TripayTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [transactionDetail, setTransactionDetail] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/tripay/all-transactions');
      setTransactions(response.data);
      
      // Hitung total jumlah
      let total = 0;
      let paid = 0;
      
      response.data.forEach(transaction => {
        const amount = parseFloat(transaction.total_amount) || 0;
        total += amount;
        
        if (transaction.status === 'PAID') {
          paid += amount;
        }
      });
      
      setTotalAmount(total);
      setPaidAmount(paid);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      message.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };
  
  const viewTransactionDetail = async (reference) => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/api/tripay/transaction-detail/${reference}`);
      setTransactionDetail(response.data.transaction);
      setDetailModalVisible(true);
    } catch (err) {
      console.error('Error fetching transaction detail:', err);
      message.error('Gagal memuat detail transaksi');
    } finally {
      setLoading(false);
    }
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
  
  const handleSearch = () => {
    // Filter transactions based on search text and status
    return transactions.filter(transaction => {
      // Filter by status
      if (filterStatus !== 'all' && transaction.status !== filterStatus) {
        return false;
      }
      
      // Filter by search text
      if (searchText && !(
        transaction.reference?.toLowerCase().includes(searchText.toLowerCase()) ||
        transaction.merchant_ref?.toLowerCase().includes(searchText.toLowerCase()) ||
        (transaction.username && transaction.username.toLowerCase().includes(searchText.toLowerCase())) ||
        (transaction.email && transaction.email.toLowerCase().includes(searchText.toLowerCase()))
      )) {
        return false;
      }
      
      return true;
    });
  };
  
  const resetFilters = () => {
    setFilterStatus('all');
    setSearchText('');
  };
  
  const columns = [
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <Text copyable>{text}</Text>,
    },
    {
      title: 'User',
      dataIndex: 'username',
      key: 'username',
      render: (username, record) => (
        <div>
          <div>{username || 'Unknown User'}</div>
          <small>{record.email}</small>
        </div>
      ),
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
      title: 'Status Pembayaran',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
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
      title: 'Tanggal Pembayaran',
      dataIndex: 'paid_at',
      key: 'paid_at',
      render: (date) => date ? moment(date).format('DD MMM YYYY HH:mm') : '-',
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />}
            onClick={() => viewTransactionDetail(record.reference)}
          >
            Detail
          </Button>
        </Space>
      ),
    },
  ];
  
  if (loading && transactions.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat data transaksi...</div>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={2}>Transaksi Tripay</Title>
      
      {/* Statistik Transaksi */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Transaksi" 
              value={transactions.length} 
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Nilai Transaksi" 
              value={totalAmount} 
              prefix="Rp" 
              formatter={(value) => `${parseInt(value).toLocaleString('id-ID')}`}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic 
              title="Total Nilai Pembayaran Lunas" 
              value={paidAmount} 
              prefix="Rp" 
              formatter={(value) => `${parseInt(value).toLocaleString('id-ID')}`}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>
      
      <Card style={{ marginBottom: 20 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input 
            placeholder="Cari referensi/user" 
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
          />
          
          <Select 
            placeholder="Filter Status" 
            style={{ width: 150 }} 
            value={filterStatus}
            onChange={setFilterStatus}
          >
            <Option value="all">Semua Status</Option>
            <Option value="PAID">LUNAS</Option>
            <Option value="UNPAID">MENUNGGU</Option>
            <Option value="EXPIRED">KEDALUWARSA</Option>
            <Option value="FAILED">GAGAL</Option>
          </Select>
          
          <Button onClick={resetFilters}>Reset Filter</Button>
          
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchTransactions}
          >
            Refresh Data
          </Button>
        </Space>
        
        <Table
          dataSource={handleSearch()}
          columns={columns}
          rowKey="reference"
          pagination={{ pageSize: 10 }}
          size="middle"
          loading={loading}
          summary={(pageData) => {
            let totalPageAmount = 0;
            pageData.forEach(({ total_amount }) => {
              totalPageAmount += parseFloat(total_amount) || 0;
            });
            
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}><strong>Total Halaman Ini:</strong></Table.Summary.Cell>
                <Table.Summary.Cell index={4}>
                  <Text strong>Rp {parseInt(totalPageAmount).toLocaleString('id-ID')}</Text>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} colSpan={4}></Table.Summary.Cell>
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
      
      {/* Transaction Detail Modal */}
      <Modal
        title="Detail Transaksi"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Tutup
          </Button>
        ]}
        width={700}
      >
        {transactionDetail ? (
          <div>
            <Descriptions
              title="Informasi Transaksi"
              bordered
              column={1}
              layout="vertical"
            >
              <Descriptions.Item label="Referensi">
                <Text copyable>{transactionDetail.reference}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Merchant Ref">
                {transactionDetail.merchant_ref}
              </Descriptions.Item>
              <Descriptions.Item label="Status Pembayaran">
                <Tag icon={getStatusIcon(transactionDetail.status)} color={getStatusColor(transactionDetail.status)}>
                  {getStatusText(transactionDetail.status)}
                </Tag>
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
              <Descriptions.Item label="Total Pembayaran">
                <Text strong>Rp {parseInt(transactionDetail.total_amount).toLocaleString('id-ID')}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {moment(transactionDetail.created_at).format('DD MMMM YYYY HH:mm:ss')}
              </Descriptions.Item>
              {transactionDetail.paid_at && (
                <Descriptions.Item label="Tanggal Pembayaran">
                  {moment(transactionDetail.paid_at).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
              {transactionDetail.expired_at && (
                <Descriptions.Item label="Tanggal Kedaluwarsa">
                  {moment(transactionDetail.expired_at).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
              {transactionDetail.payment_code && (
                <Descriptions.Item label="Kode Pembayaran">
                  <Text copyable>{transactionDetail.payment_code}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {transactionDetail.qr_url && (
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <img 
                  src={transactionDetail.qr_url} 
                  alt="QR Code" 
                  style={{ maxWidth: '200px' }} 
                />
                <div>QR Code Pembayaran</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
            <div>Memuat detail transaksi...</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TripayTransactions;