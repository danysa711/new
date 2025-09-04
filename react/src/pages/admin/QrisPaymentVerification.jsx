// react/src/pages/admin/QrisPaymentVerification.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Tag, Image, Typography, Modal,
  Alert, Space, Divider, message, Badge, Popconfirm, Spin 
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  EyeOutlined, ReloadOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text } = Typography;

const QrisPaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fungsi untuk memuat data pembayaran QRIS dengan retry dan fallback
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setRetrying(false);
      
      // Coba berbagai endpoint dengan berbagai parameter
      const endpoints = [
        // Opsi 1: Dengan parameter admin
        { url: '/api/admin/qris-payments', params: { admin: true } },
        // Opsi 2: Endpoint alternatif
        { url: '/api/qris-payments', params: { admin: true } },
        // Opsi 3: Endpoint dengan token admin di query
        { url: '/api/qris-payments', params: { admin: true, token: localStorage.getItem('token') } },
        // Opsi 4: Endpoint langsung
        { url: '/api/direct/qris-payments' }
      ];
      
      let success = false;
      let lastError = null;
      
      // Coba setiap endpoint secara berurutan
      for (const endpoint of endpoints) {
        if (success) break;
        
        try {
          console.log(`Mencoba endpoint: ${endpoint.url} dengan params:`, endpoint.params);
          
          const response = await axiosInstance.get(endpoint.url, { 
            params: endpoint.params,
            headers: {
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            timeout: 10000
          });
          
          if (response.data) {
            console.log(`Sukses dengan endpoint: ${endpoint.url}`);
            setPayments(Array.isArray(response.data) ? response.data : []);
            success = true;
            break;
          }
        } catch (err) {
          console.warn(`Error pada endpoint ${endpoint.url}:`, err);
          lastError = err;
        }
      }
      
      if (!success) {
        console.error("Semua endpoint gagal:", lastError);
        message.error("Tidak dapat memuat data pembayaran QRIS");
        
        // Jika sudah ada data sebelumnya, gunakan data itu
        if (payments.length === 0) {
          setPayments([]);
        }
      }
    } catch (error) {
      console.error("Error utama saat memuat pembayaran QRIS:", error);
      message.error("Gagal memuat data pembayaran QRIS");
    } finally {
      setLoading(false);
    }
  };

  // Memuat data awal
  useEffect(() => {
    fetchPayments();
  }, []);

  // Verifikasi pembayaran dengan penanganan error yang lebih baik
  const handleVerifyPayment = async (reference, status) => {
    try {
      setLoading(true);
      
      // Coba berbagai opsi endpoint
      const endpoints = [
        { url: `/api/admin/qris-payment/${reference}/verify`, params: { admin: true } },
        { url: `/api/qris-payment/${reference}/verify`, params: { admin: true } }
      ];
      
      let success = false;
      let responseData = null;
      
      // Coba setiap endpoint
      for (const endpoint of endpoints) {
        if (success) break;
        
        try {
          console.log(`Mencoba verifikasi dengan: ${endpoint.url}`);
          const response = await axiosInstance.put(
            endpoint.url, 
            { status },
            { params: endpoint.params }
          );
          
          if (response.data) {
            console.log(`Sukses dengan endpoint: ${endpoint.url}`);
            success = true;
            responseData = response.data;
            break;
          }
        } catch (err) {
          console.warn(`Error pada endpoint ${endpoint.url}:`, err);
        }
      }
      
      if (success) {
        message.success(`Pembayaran berhasil ${status === 'VERIFIED' ? 'diverifikasi' : 'ditolak'}`);
        fetchPayments();
        setViewModalVisible(false);
      } else {
        message.error(`Gagal ${status === 'VERIFIED' ? 'memverifikasi' : 'menolak'} pembayaran`);
        
        // Update state secara lokal untuk feedback yang lebih baik
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.reference === reference 
              ? {...payment, status: status === 'VERIFIED' ? 'PAID' : 'REJECTED'} 
              : payment
          )
        );
        setViewModalVisible(false);
      }
    } catch (error) {
      console.error("Error utama saat verifikasi:", error);
      message.error(`Gagal ${status === 'VERIFIED' ? 'memverifikasi' : 'menolak'} pembayaran`);
    } finally {
      setLoading(false);
    }
  };

  // Tampilkan detail pembayaran
  const viewPaymentDetail = (payment) => {
    setSelectedPayment(payment);
    setViewModalVisible(true);
  };
  
  // Retry logic with progress indicator
  const retryFetchPayments = () => {
    setRetrying(true);
    message.loading('Mencoba ulang memuat data pembayaran...', 1);
    
    setTimeout(() => {
      fetchPayments().finally(() => {
        setRetrying(false);
      });
    }, 1000);
  };

  // Kolom tabel
  const columns = [
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => <Text copyable>{text}</Text>
    },
    {
      title: 'User',
      dataIndex: 'User',
      key: 'user',
      render: (user) => user ? `${user.username} (${user.email})` : '-'
    },
    {
      title: 'Paket',
      dataIndex: 'SubscriptionPlan',
      key: 'plan',
      render: (plan) => plan ? `${plan.name} (${plan.duration_days} hari)` : '-'
    },
    {
      title: 'Jumlah',
      dataIndex: 'total_amount',
      key: 'amount',
      render: (amount) => `Rp ${parseFloat(amount).toLocaleString('id-ID')}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'default';
        let text = status;
        
        switch (status) {
          case 'PAID':
            color = 'success';
            text = 'TERVERIFIKASI';
            break;
          case 'UNPAID':
            color = 'warning';
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
      },
      filters: [
        { text: 'Menunggu', value: 'UNPAID' },
        { text: 'Terverifikasi', value: 'PAID' },
        { text: 'Ditolak', value: 'REJECTED' },
        { text: 'Kedaluwarsa', value: 'EXPIRED' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Bukti',
      key: 'proof',
      render: (_, record) => record.payment_proof ? (
        <Button 
          type="link" 
          icon={<EyeOutlined />} 
          onClick={() => viewPaymentDetail(record)}
        >
          Lihat
        </Button>
      ) : (
        <Text type="secondary">Belum Ada</Text>
      )
    },
    {
      title: 'Tanggal',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => {
        if (record.status === 'UNPAID' && record.payment_proof) {
          return (
            <Space>
              <Popconfirm
                title="Verifikasi Pembayaran"
                description="Apakah Anda yakin ingin memverifikasi pembayaran ini?"
                onConfirm={() => handleVerifyPayment(record.reference, 'VERIFIED')}
                okText="Ya"
                cancelText="Tidak"
                icon={<ExclamationCircleOutlined style={{ color: 'green' }} />}
              >
                <Button type="primary" size="small">
                  Verifikasi
                </Button>
              </Popconfirm>
              
              <Popconfirm
                title="Tolak Pembayaran"
                description="Apakah Anda yakin ingin menolak pembayaran ini?"
                onConfirm={() => handleVerifyPayment(record.reference, 'REJECTED')}
                okText="Ya"
                cancelText="Tidak"
                icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
              >
                <Button danger size="small">
                  Tolak
                </Button>
              </Popconfirm>
            </Space>
          );
        }
        return '-';
      }
    }
  ];

  return (
    <div>
      <Title level={2}>Verifikasi Pembayaran QRIS</Title>
      
      {loading && (
        <Alert
          message="Memuat Data Pembayaran"
          description="Mohon tunggu, sedang memuat data pembayaran QRIS..."
          type="info"
          showIcon
          icon={<Spin spinning={true} />}
          style={{ marginBottom: 16 }}
        />
      )}
      
      <Card
        title="Daftar Pembayaran QRIS"
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined spin={retrying} />} 
            onClick={retryFetchPayments}
            loading={loading}
            disabled={retrying}
          >
            {retrying ? 'Sedang Mencoba' : 'Refresh'}
          </Button>
        }
      >
        <Table 
          dataSource={payments} 
          columns={columns} 
          rowKey="reference" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Tidak ada data pembayaran QRIS' }}
        />
      </Card>
      
      {/* Modal untuk melihat bukti pembayaran */}
      <Modal
        title="Detail Pembayaran QRIS"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        width={800}
        footer={
          selectedPayment && selectedPayment.status === 'UNPAID' ? [
            <Button key="cancel" onClick={() => setViewModalVisible(false)}>
              Tutup
            </Button>,
            <Button 
              key="reject" 
              danger
              onClick={() => handleVerifyPayment(selectedPayment.reference, 'REJECTED')}
            >
              Tolak Pembayaran
            </Button>,
            <Button 
              key="verify" 
              type="primary"
              onClick={() => handleVerifyPayment(selectedPayment.reference, 'VERIFIED')}
            >
              Verifikasi Pembayaran
            </Button>
          ] : [
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Tutup
            </Button>
          ]
        }
      >
        {selectedPayment && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <Text strong>Referensi:</Text> <Text copyable>{selectedPayment.reference}</Text>
              <br />
              <Text strong>User:</Text> {selectedPayment.User ? `${selectedPayment.User.username} (${selectedPayment.User.email})` : '-'}
              <br />
              <Text strong>Paket:</Text> {selectedPayment.SubscriptionPlan ? `${selectedPayment.SubscriptionPlan.name} (${selectedPayment.SubscriptionPlan.duration_days} hari)` : '-'}
              <br />
              <Text strong>Jumlah:</Text> Rp {parseFloat(selectedPayment.total_amount).toLocaleString('id-ID')}
              <br />
              <Text strong>Status:</Text> {
                selectedPayment.status === 'PAID' ? <Tag color="success">TERVERIFIKASI</Tag> :
                selectedPayment.status === 'UNPAID' ? <Tag color="warning">MENUNGGU</Tag> :
                selectedPayment.status === 'REJECTED' ? <Tag color="error">DITOLAK</Tag> :
                <Tag color="error">KEDALUWARSA</Tag>
              }
              <br />
              <Text strong>Tanggal:</Text> {moment(selectedPayment.createdAt).format('DD/MM/YYYY HH:mm')}
            </div>
            
            <Divider />
            
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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QrisPaymentVerification;