// react/src/pages/admin/QrisPaymentVerification.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Button, Tag, Image, Typography, Modal,
  Alert, Space, Divider, message, Badge, Popconfirm 
} from 'antd';
import { 
  CheckCircleOutlined, CloseCircleOutlined, 
  EyeOutlined, ReloadOutlined, ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text } = Typography;

const QrisPaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [autoRejectInterval, setAutoRejectInterval] = useState(null);

  // Memuat data pembayaran QRIS
  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      try {
        // Tambahkan parameter admin=true untuk autentikasi yang benar
        const response = await axiosInstance.get('/api/admin/qris-payments?admin=true');
        
        // Filter hanya pembayaran dengan status UNPAID
        const unpaidPayments = response.data.filter(payment => payment.status === 'UNPAID');
        
        // Periksa pembayaran yang melebihi batas waktu (1 jam)
        const paymentsToCheck = [...unpaidPayments];
        let autoRejected = false;
        
        for (const payment of paymentsToCheck) {
          const createdAt = new Date(payment.createdAt);
          const now = new Date();
          const diffMs = now - createdAt;
          const diffHours = diffMs / (1000 * 60 * 60);
          
          // Jika lebih dari 1 jam, otomatis tolak
          if (diffHours > 1) {
            try {
              await handleVerifyPayment(payment.reference, 'REJECTED', true);
              autoRejected = true;
            } catch (err) {
              console.error(`Failed to auto reject payment ${payment.reference}:`, err);
            }
          }
        }
        
        if (autoRejected) {
          // Muat ulang data setelah auto-reject
          const refreshResponse = await axiosInstance.get('/api/admin/qris-payments?admin=true');
          setPayments(refreshResponse.data);
          message.info('Beberapa pembayaran yang melewati batas waktu telah ditolak otomatis');
        } else {
          setPayments(response.data);
        }
      } catch (apiError) {
        console.error("Error pada API utama:", apiError);
        
        // Coba endpoint fallback
        try {
          const fallbackResponse = await axiosInstance.get('/api/admin/qris-payments-list?admin=true');
          setPayments(fallbackResponse.data);
        } catch (fallbackError) {
          console.error("Error pada API fallback:", fallbackError);
          
          // Jika semua gagal, gunakan data kosong
          setPayments([]);
          message.warning("Data QRIS tidak tersedia. Server mungkin sedang maintenance.");
        }
      }
    } catch (error) {
      console.error("Error fetching QRIS payments:", error);
      message.error("Gagal memuat data pembayaran QRIS");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up interval untuk memeriksa pembayaran yang kedaluwarsa secara berkala
  useEffect(() => {
    fetchPayments();
    
    // Jalankan auto-reject setiap 5 menit
    const intervalId = setInterval(() => {
      fetchPayments();
    }, 5 * 60 * 1000);
    
    setAutoRejectInterval(intervalId);
    
    return () => {
      if (autoRejectInterval) {
        clearInterval(autoRejectInterval);
      }
    };
  }, []);

  // Perbarui fungsi handleVerifyPayment
  const handleVerifyPayment = async (reference, status, isAutoReject = false) => {
    try {
      setLoading(true);
      
      // Tambahkan parameter admin=true dan error handling
      const response = await axiosInstance.put(
        `/api/admin/qris-payment/${reference}/verify?admin=true`, 
        { status }
      );
      
      if (response.data) {
        if (!isAutoReject) {
          message.success(`Pembayaran berhasil ${status === 'VERIFIED' ? 'diverifikasi' : 'ditolak'}`);
        }
        await fetchPayments();
        setViewModalVisible(false);
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      
      // Berikan pesan spesifik berdasarkan error
      if (error.response?.status === 404) {
        message.error("Referensi pembayaran tidak ditemukan");
      } else if (error.response?.status === 401) {
        message.error("Anda tidak memiliki akses untuk melakukan verifikasi");
      } else {
        message.error(`Gagal ${status === 'VERIFIED' ? 'memverifikasi' : 'menolak'} pembayaran`);
      }
      
      // Jika server error tapi tetap ingin update UI (opsional)
      if (error.response?.status === 500) {
        message.warning("Server error, tapi data akan diperbarui secara local");
        
        // Update state secara lokal
        setPayments(prevPayments => 
          prevPayments.map(payment => 
            payment.reference === reference 
              ? {...payment, status: status === 'VERIFIED' ? 'PAID' : 'REJECTED'} 
              : payment
          )
        );
        
        setViewModalVisible(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cek status pembayaran berdasarkan waktu
  const getPaymentTimeStatus = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMinutes = diffMs / (1000 * 60);
    
    // Jika kurang dari 30 menit, tampilkan OK
    if (diffMinutes < 30) {
      return { color: "green", text: "Masih Baru", icon: <CheckCircleOutlined /> };
    }
    
    // Jika 30-50 menit, tampilkan warning
    if (diffMinutes < 50) {
      return { color: "orange", text: "Hampir Kedaluwarsa", icon: <ClockCircleOutlined /> };
    }
    
    // Jika lebih dari 50 menit, tampilkan danger
    return { color: "red", text: "Segera Kedaluwarsa", icon: <ClockCircleOutlined /> };
  };

  // Tampilkan detail pembayaran
  const viewPaymentDetail = (payment) => {
    setSelectedPayment(payment);
    setViewModalVisible(true);
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
      title: 'Batas Waktu',
      key: 'expiry',
      render: (_, record) => {
        const createdAt = new Date(record.createdAt);
        const expiryTime = new Date(createdAt.getTime() + 60 * 60 * 1000); // 1 jam
        
        const timeStatus = getPaymentTimeStatus(record.createdAt);
        
        return (
          <div>
            <div>{moment(expiryTime).format('DD/MM/YYYY HH:mm')}</div>
            <div>
              <Badge 
                status={timeStatus.color === "green" ? "success" : 
                        timeStatus.color === "orange" ? "warning" : "error"} 
                text={timeStatus.text} 
              />
            </div>
          </div>
        );
      }
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
        if (record.status === 'UNPAID') {
          return (
            <Space>
              {record.payment_proof && (
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
              )}
              
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
      
      <Alert
        message="Pembayaran yang Melebihi Batas Waktu"
        description="Pembayaran yang melebihi batas waktu 1 jam akan ditolak secara otomatis. Sistem melakukan pemeriksaan setiap 5 menit."
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      
      <Card
        title="Daftar Pembayaran QRIS"
        extra={
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={fetchPayments}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Table 
          dataSource={payments} 
          columns={columns} 
          rowKey="reference" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record) => {
            // Highlight baris berdasarkan status waktu
            if (record.status === 'UNPAID') {
              const { color } = getPaymentTimeStatus(record.createdAt);
              if (color === "orange") return 'bg-warning-light';
              if (color === "red") return 'bg-error-light';
            }
            return '';
          }}
        />
      </Card>
      
      {/* Style untuk row highlighting */}
      <style jsx="true">{`
        .bg-warning-light {
          background-color: #fff7e6;
        }
        .bg-error-light {
          background-color: #fff1f0;
        }
      `}</style>
      
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
              disabled={!selectedPayment.payment_proof}
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
              <br />
              <Text strong>Batas Waktu:</Text> {
                moment(new Date(new Date(selectedPayment.createdAt).getTime() + 60 * 60 * 1000)).format('DD/MM/YYYY HH:mm')
              }
              <br />
              {selectedPayment.status === 'UNPAID' && (
                <div style={{ marginTop: 10 }}>
                  {(() => {
                    const { color, text, icon } = getPaymentTimeStatus(selectedPayment.createdAt);
                    return (
                      <Tag color={color} icon={icon}>{text}</Tag>
                    );
                  })()}
                </div>
              )}
            </div>
            
            <Divider />
            
            <div style={{ textAlign: 'center' }}>
              <Text strong>Bukti Pembayaran</Text>
              <div style={{ marginTop: 10 }}>
                {selectedPayment.payment_proof ? (
                  <Image
                    src={selectedPayment.payment_proof}
                    alt="Bukti Pembayaran"
                    style={{ maxHeight: '400px' }}
                  />
                ) : (
                  <Alert
                    message="Belum Ada Bukti Pembayaran"
                    description="Pengguna belum mengupload bukti pembayaran."
                    type="warning"
                    showIcon
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default QrisPaymentVerification;