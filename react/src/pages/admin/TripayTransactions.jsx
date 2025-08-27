import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Table, Tag, Button, DatePicker, 
  Select, Input, Space, message, Badge, Descriptions, Modal, Tooltip
} from 'antd';
import { 
  SearchOutlined, SyncOutlined, EyeOutlined, 
  CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const TripayTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([moment().subtract(30, 'days'), moment()]);
  const [status, setStatus] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Simulasi data transaksi
  const dummyTransactions = [
    {
      reference: 'T12345678',
      merchant_ref: 'SUB-123-1630000000',
      payment_method: 'BRIVA',
      customer_name: 'John Doe',
      amount: 100000,
      fee: 4000,
      amount_received: 96000,
      status: 'PAID',
      created_at: '2023-08-01T08:00:00+07:00',
      paid_at: '2023-08-01T08:10:00+07:00',
      payment_code: '123456789012345',
    },
    {
      reference: 'T12345679',
      merchant_ref: 'SUB-124-1630000001',
      payment_method: 'QRIS',
      customer_name: 'Jane Smith',
      amount: 270000,
      fee: 2700,
      amount_received: 267300,
      status: 'UNPAID',
      created_at: '2023-08-02T10:00:00+07:00',
      paid_at: null,
      payment_code: 'https://example.com/qr.png',
    },
    {
      reference: 'T12345680',
      merchant_ref: 'SUB-125-1630000002',
      payment_method: 'OVO',
      customer_name: 'Bob Johnson',
      amount: 500000,
      fee: 5000,
      amount_received: 495000,
      status: 'PAID',
      created_at: '2023-08-03T09:00:00+07:00',
      paid_at: '2023-08-03T09:05:00+07:00',
      payment_code: '089912345678',
    },
    {
      reference: 'T12345681',
      merchant_ref: 'SUB-126-1630000003',
      payment_method: 'MANDIRIVA',
      customer_name: 'Alice Cooper',
      amount: 900000,
      fee: 4000,
      amount_received: 896000,
      status: 'EXPIRED',
      created_at: '2023-08-04T14:00:00+07:00',
      paid_at: null,
      payment_code: '123456789012346',
    },
  ];
  
  // Load transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        
        // Simulasi API call
        setTimeout(() => {
          // Filter berdasarkan status dan tanggal
          let filteredData = [...dummyTransactions];
          
          if (status !== 'all') {
            filteredData = filteredData.filter(item => item.status === status);
          }
          
          // Filter berdasarkan tanggal
          if (dateRange && dateRange[0] && dateRange[1]) {
            const startDate = dateRange[0].startOf('day');
            const endDate = dateRange[1].endOf('day');
            
            filteredData = filteredData.filter(item => {
              const createdAt = moment(item.created_at);
              return createdAt.isBetween(startDate, endDate, null, '[]');
            });
          }
          
          // Filter berdasarkan teks pencarian
          if (searchText) {
            const lowerCaseSearch = searchText.toLowerCase();
            filteredData = filteredData.filter(item => 
              item.reference.toLowerCase().includes(lowerCaseSearch) ||
              item.merchant_ref.toLowerCase().includes(lowerCaseSearch) ||
              item.customer_name.toLowerCase().includes(lowerCaseSearch)
            );
          }
          
          setTransactions(filteredData);
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        message.error('Gagal memuat data transaksi');
        setLoading(false);
      }
    };
    
    fetchTransactions();
  }, [status, dateRange, searchText]);
  
  // Status formatter
  const getStatusTag = (status) => {
    const statusMap = {
      'PAID': { color: 'success', text: 'LUNAS' },
      'UNPAID': { color: 'warning', text: 'MENUNGGU' },
      'EXPIRED': { color: 'error', text: 'KEDALUWARSA' },
      'FAILED': { color: 'error', text: 'GAGAL' },
    };
    
    const { color, text } = statusMap[status] || { color: 'default', text: status };
    
    return <Tag color={color}>{text}</Tag>;
  };
  
  // View transaction details
  const showTransactionDetail = (transaction) => {
    setSelectedTransaction(transaction);
    setDetailModalVisible(true);
  };
  
  // Columns for the table
  const columns = [
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <Text copyable>{text}</Text>,
    },
    {
      title: 'Merchant Ref',
      dataIndex: 'merchant_ref',
      key: 'merchant_ref',
      render: (text) => <Text copyable>{text}</Text>,
    },
    {
      title: 'Pembayaran',
      dataIndex: 'payment_method',
      key: 'payment_method',
    },
    {
      title: 'Pelanggan',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Jumlah',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`,
      sorter: (a, b) => a.amount - b.amount,
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
          <Tooltip title="Lihat Detail">
            <Button 
              icon={<EyeOutlined />} 
              onClick={() => showTransactionDetail(record)} 
              type="primary"
              size="small"
            />
          </Tooltip>
          
          {record.status === 'UNPAID' && (
            <Tooltip title="Periksa Status">
              <Button 
                icon={<SyncOutlined />} 
                size="small"
                onClick={() => message.info(`Memeriksa status transaksi ${record.reference}`)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];
  
  return (
    <div>
      <Title level={2}>Transaksi Tripay</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker 
  value={dateRange} 
  onChange={setDateRange} 
  style={{ width: 300 }}
  presets={[
    { label: 'Hari Ini', value: [moment().startOf('day'), moment().endOf('day')] },
    { label: 'Minggu Ini', value: [moment().startOf('week'), moment().endOf('week')] },
    { label: 'Bulan Ini', value: [moment().startOf('month'), moment().endOf('month')] },
    { label: '30 Hari Terakhir', value: [moment().subtract(30, 'days'), moment()] },
  ]}
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
        open={detailModalVisible}
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
                {selectedTransaction.payment_method}
              </Descriptions.Item>
              <Descriptions.Item label="Nama Pelanggan">
                {selectedTransaction.customer_name}
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah Pembayaran">
                Rp {selectedTransaction.amount.toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Biaya">
                Rp {selectedTransaction.fee.toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah Diterima">
                Rp {selectedTransaction.amount_received.toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {moment(selectedTransaction.created_at).format('DD MMMM YYYY HH:mm:ss')}
              </Descriptions.Item>
              {selectedTransaction.paid_at && (
                <Descriptions.Item label="Tanggal Pembayaran">
                  {moment(selectedTransaction.paid_at).format('DD MMMM YYYY HH:mm:ss')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Kode Pembayaran">
                <Text copyable>{selectedTransaction.payment_code}</Text>
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>
    </div>
  );
};

export default TripayTransactions;