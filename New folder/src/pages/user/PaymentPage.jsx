import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Typography, Tabs, Table, Tag, Button, Space,
  Alert, Empty, Spin, Collapse, Divider, Descriptions,
  Tooltip, Modal, Result, Input, message
} from 'antd';
import { 
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  InfoCircleOutlined, ReloadOutlined, EyeOutlined, CopyOutlined,
  BankOutlined, QrcodeOutlined, WalletOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const PaymentPage = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [activePayments, setActivePayments] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  // Efek untuk memuat data pembayaran saat komponen dimuat
  useEffect(() => {
    fetchPaymentData();
  }, []);
  
  // Fungsi untuk memuat data pembayaran
  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      
      // 1. Ambil metode pembayaran yang tersedia
      const methodsResponse = await axiosInstance.get('/api/payment-methods');
      setAvailablePaymentMethods(methodsResponse.data);
      
      // 2. Ambil transaksi aktif (belum lunas)
      const activeResponse = await axiosInstance.get('/api/transactions/active');
      setActivePayments(activeResponse.data);
      
      // 3. Ambil riwayat transaksi
      const historyResponse = await axiosInstance.get('/api/transactions/history');
      setPaymentHistory(historyResponse.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      message.error('Gagal memuat data pembayaran');
      setLoading(false);
    }
  };
  
  // Fungsi untuk memeriksa status pembayaran
  const checkPaymentStatus = async (reference) => {
    try {
      setCheckingStatus(true);
      message.loading('Memeriksa status pembayaran...', 1);
      
      const response = await axiosInstance.get(`/api/transactions/${reference}/check`);
      
      if (response.data.status === 'PAID') {
        message.success('Pembayaran telah berhasil diverifikasi!');
        fetchPaymentData(); // Refresh data
        setModalVisible(false);
      } else {
        message.info('Status pembayaran belum berubah, silakan coba beberapa saat lagi');
      }
      
      setCheckingStatus(false);
    } catch (error) {
      console.error('Error checking payment status:', error);
      message.error('Gagal memeriksa status pembayaran');
      setCheckingStatus(false);
    }
  };
  
  // Fungsi untuk menampilkan detail pembayaran
  const showPaymentDetail = (payment) => {
    setSelectedPayment(payment);
    setModalVisible(true);
  };
  
  // Fungsi untuk menyalin teks ke clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => message.success('Teks berhasil disalin!'))
      .catch(() => message.error('Gagal menyalin teks'));
  };
  
  // Render status pembayaran dengan warna
  const renderPaymentStatus = (status) => {
    let color = 'default';
    let icon = null;
    let text = status;
    
    switch (status) {
      case 'PAID':
        color = 'success';
        icon = <CheckCircleOutlined />;
        text = 'LUNAS';
        break;
      case 'UNPAID':
        color = 'warning';
        icon = <ClockCircleOutlined />;
        text = 'MENUNGGU';
        break;
      case 'EXPIRED':
        color = 'error';
        icon = <CloseCircleOutlined />;
        text = 'KEDALUWARSA';
        break;
      case 'FAILED':
        color = 'error';
        icon = <CloseCircleOutlined />;
        text = 'GAGAL';
        break;
      default:
        break;
    }
    
    return (
      <Tag color={color} icon={icon}>
        {text}
      </Tag>
    );
  };
  
  // Render icon untuk tipe pembayaran
  const renderPaymentTypeIcon = (type, method) => {
    if (type === 'manual') {
      if (method.includes('QRIS')) return <QrcodeOutlined />;
      if (method.includes('BANK')) return <BankOutlined />;
      return <WalletOutlined />;
    }
    return <InfoCircleOutlined />;
  };
  
  // Render instruksi pembayaran
  const renderPaymentInstructions = (payment) => {
    if (!payment) return null;
    
    const { payment_type, qr_url, payment_code, instructions, account_name } = payment;
    
    // Jika pembayaran manual
    if (payment_type === 'manual') {
      return (
        <div style={{ marginTop: 20 }}>
          <Divider />
          <Title level={4}>Instruksi Pembayaran</Title>
          
          {payment.payment_method.includes('QRIS') && qr_url && (
            <div style={{ textAlign: 'center' }}>
              <img 
                src={qr_url} 
                alt="QRIS Code" 
                style={{ maxWidth: '200px', margin: '20px auto' }} 
              />
              <Text>Scan QR Code di atas menggunakan aplikasi e-wallet Anda</Text>
            </div>
          )}
          
          {payment_code && !payment.payment_method.includes('QRIS') && (
            <div>
              <Alert
                message={payment.payment_method.includes('BANK') ? "Rekening Tujuan" : "Akun Tujuan"}
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
        
        {payment.payment_method === 'QRIS' && qr_url && (
          <div style={{ textAlign: 'center' }}>
            <img 
              src={qr_url} 
              alt="QRIS Code" 
              style={{ maxWidth: '200px', margin: '20px auto' }} 
            />
            <Text>Scan QR Code di atas menggunakan aplikasi e-wallet Anda</Text>
          </div>
        )}
        
        {payment.payment_method !== 'QRIS' && payment_code && (
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
        
        {!Array.isArray(instructions) && instructions && (
          <Alert
            message="Petunjuk Pembayaran"
            description={instructions}
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
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
  
  // Kolom untuk tabel pembayaran aktif
  const activePaymentColumns = [
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference',
      render: (text) => (
        <Space>
          <Text>{text}</Text>
          <Tooltip title="Salin">
            <Button 
              type="text" 
              icon={<CopyOutlined />} 
              onClick={() => copyToClipboard(text)}
              size="small"
            />
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Paket',
      dataIndex: 'plan_name',
      key: 'plan_name'
    },
    {
      title: 'Metode',
      dataIndex: 'payment_name',
      key: 'payment_name',
      render: (text, record) => (
        <Tag icon={renderPaymentTypeIcon(record.payment_type, record.payment_method)}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Jumlah',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderPaymentStatus(status)
    },
    {
      title: 'Tanggal',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
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
            onClick={() => showPaymentDetail(record)}
          >
            Detail
          </Button>
          {record.status === 'UNPAID' && (
            <Button 
              size="small"
              icon={<ReloadOutlined />}
              loading={checkingStatus}
              onClick={() => checkPaymentStatus(record.reference)}
            >
              Cek Status
            </Button>
          )}
        </Space>
      )
    }
  ];
  
  // Kolom untuk tabel riwayat pembayaran
  const paymentHistoryColumns = [
    {
      title: 'Referensi',
      dataIndex: 'reference',
      key: 'reference'
    },
    {
      title: 'Paket',
      dataIndex: 'plan_name',
      key: 'plan_name'
    },
    {
      title: 'Metode',
      dataIndex: 'payment_name',
      key: 'payment_name',
      render: (text, record) => (
        <Tag icon={renderPaymentTypeIcon(record.payment_type, record.payment_method)}>
          {text}
        </Tag>
      )
    },
    {
      title: 'Jumlah',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (amount) => `Rp ${amount.toLocaleString('id-ID')}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => renderPaymentStatus(status)
    },
    {
      title: 'Tanggal',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => moment(date).format('DD MMM YYYY HH:mm')
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          size="small" 
          icon={<EyeOutlined />}
          onClick={() => showPaymentDetail(record)}
        >
          Detail
        </Button>
      )
    }
  ];
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Memuat data pembayaran...</div>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={2}>Pembayaran</Title>
      
      <Tabs defaultActiveKey="active">
        <TabPane tab="Pembayaran Aktif" key="active">
          {activePayments.length > 0 ? (
            <Card>
              <Table 
                dataSource={activePayments}
                columns={activePaymentColumns}
                rowKey="reference"
                pagination={false}
              />
            </Card>
          ) : (
            <Empty 
              description="Tidak ada pembayaran aktif" 
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </TabPane>
        
        <TabPane tab="Riwayat Pembayaran" key="history">
          <Card>
            <Table 
              dataSource={paymentHistory}
              columns={paymentHistoryColumns}
              rowKey="reference"
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Tidak ada riwayat pembayaran' }}
            />
          </Card>
        </TabPane>
        
        <TabPane tab="Metode Pembayaran" key="methods">
          <Card>
            {availablePaymentMethods.length > 0 ? (
              <div>
                <Paragraph>
                  Berikut adalah metode pembayaran yang tersedia untuk pembayaran langganan Anda:
                </Paragraph>
                
                <Collapse>
                  {/* Metode Pembayaran Bank */}
                  <Panel 
                    header={
                      <Space>
                        <BankOutlined />
                        <Text strong>Transfer Bank</Text>
                      </Space>
                    }
                    key="bank"
                  >
                    {availablePaymentMethods
                      .filter(method => method.type === 'bank')
                      .map(method => (
                        <Card 
                          key={method.code} 
                          size="small" 
                          title={method.name}
                          style={{ marginBottom: 8 }}
                          extra={
                            <Tag color={method.isManual ? 'green' : 'blue'}>
                              {method.isManual ? 'Manual' : 'Tripay'}
                            </Tag>
                          }
                        >
                          {method.isManual && method.manualData && (
                            <Descriptions size="small" column={1}>
                              <Descriptions.Item label="Nomor Rekening">
                                <Text copyable>{method.manualData.accountNumber}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label="Atas Nama">
                                {method.manualData.accountName}
                              </Descriptions.Item>
                              {method.manualData.instructions && (
                                <Descriptions.Item label="Instruksi">
                                  {method.manualData.instructions}
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          )}
                          
                          {!method.isManual && (
                            <Text>Transfer bank melalui virtual account {method.name}</Text>
                          )}
                        </Card>
                      ))}
                  </Panel>
                  
                  {/* Metode Pembayaran E-Wallet */}
                  <Panel 
                    header={
                      <Space>
                        <WalletOutlined />
                        <Text strong>E-Wallet</Text>
                      </Space>
                    }
                    key="ewallet"
                  >
                    {availablePaymentMethods
                      .filter(method => method.type === 'ewallet')
                      .map(method => (
                        <Card 
                          key={method.code} 
                          size="small" 
                          title={method.name}
                          style={{ marginBottom: 8 }}
                          extra={
                            <Tag color={method.isManual ? 'green' : 'blue'}>
                              {method.isManual ? 'Manual' : 'Tripay'}
                            </Tag>
                          }
                        >
                          {method.isManual && method.manualData && (
                            <Descriptions size="small" column={1}>
                              <Descriptions.Item label="Nomor Akun">
                                <Text copyable>{method.manualData.accountNumber}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label="Atas Nama">
                                {method.manualData.accountName}
                              </Descriptions.Item>
                              {method.manualData.instructions && (
                                <Descriptions.Item label="Instruksi">
                                  {method.manualData.instructions}
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          )}
                          
                          {!method.isManual && (
                            <Text>Pembayaran melalui aplikasi {method.name}</Text>
                          )}
                        </Card>
                      ))}
                  </Panel>
                  
                  {/* Metode Pembayaran QRIS */}
                  <Panel 
                    header={
                      <Space>
                        <QrcodeOutlined />
                        <Text strong>QRIS</Text>
                      </Space>
                    }
                    key="qris"
                  >
                    {availablePaymentMethods
                      .filter(method => method.type === 'qris')
                      .map(method => (
                        <Card 
                          key={method.code} 
                          size="small" 
                          title={method.name}
                          style={{ marginBottom: 8 }}
                          extra={
                            <Tag color={method.isManual ? 'green' : 'blue'}>
                              {method.isManual ? 'Manual' : 'Tripay'}
                            </Tag>
                          }
                        >
                          {method.isManual && method.manualData && method.manualData.qrImageUrl && (
                            <div style={{ textAlign: 'center' }}>
                              <img 
                                src={method.manualData.qrImageUrl} 
                                alt="QRIS Code" 
                                style={{ maxWidth: '200px', margin: '10px auto' }} 
                              />
                              <div>
                                <Text>
                                  {method.manualData.instructions || 'Scan QR Code di atas menggunakan aplikasi e-wallet Anda'}
                                </Text>
                              </div>
                            </div>
                          )}
                          
                          {!method.isManual && (
                            <Text>Pembayaran melalui QRIS (kode QR akan diberikan saat checkout)</Text>
                          )}
                        </Card>
                      ))}
                  </Panel>
                </Collapse>
              </div>
            ) : (
              <Empty 
                description="Tidak ada metode pembayaran yang tersedia" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Modal Detail Pembayaran */}
      <Modal
        title="Detail Pembayaran"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Tutup
          </Button>
        ]}
        width={700}
      >
        {selectedPayment && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              {selectedPayment.status === 'PAID' ? (
                <Result
                  status="success"
                  title="Pembayaran Berhasil"
                  subTitle={`Referensi: ${selectedPayment.reference}`}
                />
              ) : selectedPayment.status === 'UNPAID' ? (
                <Result
                  status="info"
                  title="Menunggu Pembayaran"
                  subTitle={`Referensi: ${selectedPayment.reference}`}
                />
              ) : (
                <Result
                  status="error"
                  title={selectedPayment.status === 'EXPIRED' ? "Pembayaran Kedaluwarsa" : "Pembayaran Gagal"}
                  subTitle={`Referensi: ${selectedPayment.reference}`}
                />
              )}
            </div>
            
            <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
              <Descriptions.Item label="Kode Transaksi">
                <Text copyable>{selectedPayment.reference}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Paket">
                {selectedPayment.plan_name}
              </Descriptions.Item>
              <Descriptions.Item label="Metode Pembayaran">
                {selectedPayment.payment_name}
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah">
                <Text strong>
                  Rp {(selectedPayment.amount || 0).toLocaleString('id-ID')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Biaya Admin">
                Rp {(selectedPayment.fee || 0).toLocaleString('id-ID')}
              </Descriptions.Item>
              <Descriptions.Item label="Total Pembayaran">
                <Text strong>
                  Rp {(selectedPayment.total_amount || 0).toLocaleString('id-ID')}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {moment(selectedPayment.created_at).format('DD MMMM YYYY HH:mm')}
              </Descriptions.Item>
              {selectedPayment.paid_at && (
                <Descriptions.Item label="Tanggal Pembayaran">
                  {moment(selectedPayment.paid_at).format('DD MMMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {selectedPayment.expired_at && selectedPayment.status === 'UNPAID' && (
                <Descriptions.Item label="Batas Waktu Pembayaran">
                  <Text type="danger">
                    {moment(selectedPayment.expired_at).format('DD MMMM YYYY HH:mm')}
                  </Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Status">
                {renderPaymentStatus(selectedPayment.status)}
              </Descriptions.Item>
            </Descriptions>
            
            {selectedPayment.status === 'UNPAID' && renderPaymentInstructions(selectedPayment)}
            
            {selectedPayment.status === 'UNPAID' && (
              <div style={{ marginTop: 20, textAlign: 'center' }}>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  loading={checkingStatus}
                  onClick={() => checkPaymentStatus(selectedPayment.reference)}
                >
                  Periksa Status Pembayaran
                </Button>
              </div>
            )}
          </>
        )}
      </Modal>
    </div>
  );
};

export default PaymentPage;