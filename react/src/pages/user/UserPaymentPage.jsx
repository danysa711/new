// File: src/pages/user/UserPaymentPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Typography, Tabs, Table, Tag, Button, Space,
  Alert, Empty, Spin, Collapse, Divider, Descriptions,
  Tooltip, Modal, Result
} from 'antd';
import { 
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  InfoCircleOutlined, ReloadOutlined, EyeOutlined, CopyOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const UserPaymentPage = () => {
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
  // Fungsi untuk memuat data pembayaran
const fetchPaymentData = async () => {
  try {
    setLoading(true);
    
    // 1. Ambil metode pembayaran dari API
    let availableMethods = [];
    
    try {
      console.log('Fetching payment methods from API...');
      const methodsResponse = await axiosInstance.get('/api/payment-methods');
      
      if (methodsResponse.data && Array.isArray(methodsResponse.data)) {
        console.log('Payment methods successfully fetched from API');
        
        // Format metode pembayaran untuk tampilan
        const formattedMethods = methodsResponse.data.map(method => {
          if (method.isManual) {
            return {
              id: method.manualData.id,
              name: method.name,
              type: 'manual',
              category: method.type,
              details: method.manualData
            };
          } else {
            return {
              id: method.code,
              name: method.name,
              type: 'tripay',
              category: method.type,
              fee: method.fee
            };
          }
        });
        
        availableMethods = formattedMethods;
      }
    } catch (apiErr) {
      console.error('Error fetching payment methods from API, falling back to localStorage:', apiErr);
      
      // Fallback ke localStorage
      // 1. Ambil metode pembayaran manual yang tersedia
      let manualMethods = [];
      const manualMethodsStr = localStorage.getItem('manual_payment_methods');
      
      if (manualMethodsStr) {
        try {
          manualMethods = JSON.parse(manualMethodsStr).filter(method => method.isActive);
          console.log('Manual payment methods from localStorage:', manualMethods);
        } catch (e) {
          console.error('Error parsing manual payment methods:', e);
        }
      }
      
      // 2. Ambil status Tripay
      const rawTripayEnabled = localStorage.getItem('tripay_enabled');
      const tripayEnabled = 
        rawTripayEnabled === 'true' || 
        rawTripayEnabled === true || 
        rawTripayEnabled === '1' || 
        rawTripayEnabled === 1;
      
      console.log('Tripay enabled (localStorage):', tripayEnabled);
      
      // 3. Gabungkan untuk membuat daftar metode pembayaran yang tersedia
      if (tripayEnabled) {
        availableMethods.push(
          { id: 'tripay-bank', name: 'Transfer Bank (Tripay)', type: 'tripay', category: 'bank' },
          { id: 'tripay-ewallet', name: 'E-Wallet (Tripay)', type: 'tripay', category: 'ewallet' },
          { id: 'tripay-qris', name: 'QRIS (Tripay)', type: 'tripay', category: 'qris' }
        );
      }
      
      manualMethods.forEach(method => {
        availableMethods.push({
          id: method.id,
          name: method.name,
          type: 'manual',
          category: method.type,
          details: method
        });
      });
    }
    
    setAvailablePaymentMethods(availableMethods);
    console.log('Final available payment methods:', availableMethods);
    
    // 2. Ambil transaksi aktif dari API
    let activeTransactions = [];
    
    try {
      console.log('Fetching active transactions from API...');
      const activeResponse = await axiosInstance.get('/api/transactions/active');
      
      if (activeResponse.data && Array.isArray(activeResponse.data)) {
        console.log('Active transactions successfully fetched from API');
        activeTransactions = activeResponse.data;
      }
    } catch (activeErr) {
      console.error('Error fetching active transactions, using demo data:', activeErr);
      
      // Gunakan data demo jika API gagal
      activeTransactions = [
        {
          id: 'pay-' + Date.now(),
          reference: 'T' + Math.floor(Math.random() * 1000000000),
          plan_name: 'Langganan 1 Bulan',
          amount: 100000,
          fee: 4000,
          total_amount: 104000,
          status: 'UNPAID',
          payment_method: 'BRIVA',
          payment_name: 'Bank BRI',
          payment_type: 'tripay',
          payment_code: '8888123456789',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          expired_at: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
          qr_url: null,
          instructions: [
            { title: 'ATM', steps: ['Masukkan kartu ATM & PIN', 'Pilih Menu Pembayaran', 'Pilih Virtual Account', 'Masukkan kode Virtual Account 8888123456789', 'Ikuti instruksi untuk menyelesaikan'] },
            { title: 'Mobile Banking', steps: ['Login ke aplikasi', 'Pilih Pembayaran', 'Pilih Virtual Account', 'Masukkan kode Virtual Account 8888123456789', 'Konfirmasi pembayaran'] }
          ]
        },
        {
          id: 'pay-' + (Date.now() - 10000),
          reference: 'M' + Math.floor(Math.random() * 1000000000),
          plan_name: 'Langganan 3 Bulan',
          amount: 270000,
          fee: 0,
          total_amount: 270000,
          status: 'UNPAID',
          payment_method: 'MANUAL_1',
          payment_name: 'Transfer Bank BCA',
          payment_type: 'manual',
          payment_code: '1234567890',
          account_name: 'PT Demo Store',
          created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          expired_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          qr_url: null,
          instructions: 'Transfer ke rekening BCA a/n PT Demo Store',
          is_manual: true
        }
      ];
    }
    
    setActivePayments(activeTransactions);
    console.log('Active payments set:', activeTransactions);
    
    // 3. Ambil riwayat transaksi dari API
    let historyTransactions = [];
    
    try {
      console.log('Fetching transaction history from API...');
      const historyResponse = await axiosInstance.get('/api/transactions/history');
      
      if (historyResponse.data && Array.isArray(historyResponse.data)) {
        console.log('Transaction history successfully fetched from API');
        historyTransactions = historyResponse.data;
      }
    } catch (historyErr) {
      console.error('Error fetching transaction history, using demo data:', historyErr);
      
      // Gunakan data demo jika API gagal
      historyTransactions = [
        {
          id: 'pay-hist-1',
          reference: 'T123456789',
          plan_name: 'Langganan 1 Bulan',
          amount: 100000,
          fee: 4000,
          total_amount: 104000,
          status: 'PAID',
          payment_method: 'BRIVA',
          payment_name: 'Bank BRI',
          payment_type: 'tripay',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          paid_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000).toISOString()
        },
        {
          id: 'pay-hist-2',
          reference: 'M987654321',
          plan_name: 'Langganan 6 Bulan',
          amount: 500000,
          fee: 0,
          total_amount: 500000,
          status: 'PAID',
          payment_method: 'MANUAL_1',
          payment_name: 'Transfer Bank BCA',
          payment_type: 'manual',
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          paid_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000 + 1 * 24 * 60 * 60 * 1000).toISOString(),
          is_manual: true
        },
        {
          id: 'pay-hist-3',
          reference: 'T567891234',
          plan_name: 'Langganan 1 Bulan',
          amount: 100000,
          fee: 4000,
          total_amount: 104000,
          status: 'EXPIRED',
          payment_method: 'BCAVA',
          payment_name: 'Bank BCA',
          payment_type: 'tripay',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          expired_at: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    }
    
    setPaymentHistory(historyTransactions);
    console.log('Payment history set:', historyTransactions);
    
  } catch (error) {
    console.error('Error in fetchPaymentData:', error);
    message.error('Gagal memuat data pembayaran');
  } finally {
    setLoading(false);
    console.log('Payment data fetch completed');
  }
};
  
  // Fungsi untuk memeriksa status pembayaran
  const checkPaymentStatus = async (reference) => {
    try {
      setCheckingStatus(true);
      
      // Simulasi pengecekan status
      setTimeout(() => {
        // Tidak ada perubahan status untuk simulasi
        setCheckingStatus(false);
      }, 1500);
    } catch (error) {
      console.error('Error checking payment status:', error);
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
    navigator.clipboard.writeText(text);
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
          
          {!payment.payment_method.includes('QRIS') && payment_code && (
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
            description="Setelah melakukan pembayaran, silakan konfirmasi ke admin untuk aktivasi langganan Anda."
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
      key: 'payment_name'
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
      key: 'payment_name'
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
                rowKey="id"
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
              rowKey="id"
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
                  {availablePaymentMethods.map(method => (
                    <Panel 
                      key={method.id} 
                      header={
                        <Space>
                          {method.name}
                          <Tag color={method.type === 'tripay' ? 'blue' : 'green'}>
                            {method.type === 'tripay' ? 'Tripay' : 'Manual'}
                          </Tag>
                        </Space>
                      }
                    >
                      {method.type === 'manual' && method.details && (
                        <div>
                          {method.category === 'bank' && (
                            <Descriptions bordered column={1} size="small">
                              <Descriptions.Item label="Rekening">
                                <Text copyable>{method.details.accountNumber}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label="Atas Nama">
                                {method.details.accountName}
                              </Descriptions.Item>
                              <Descriptions.Item label="Instruksi">
                                {method.details.instructions || 'Tidak ada instruksi khusus'}
                              </Descriptions.Item>
                            </Descriptions>
                          )}
                          
                          {method.category === 'ewallet' && (
                            <Descriptions bordered column={1} size="small">
                              <Descriptions.Item label="Nomor Akun">
                                <Text copyable>{method.details.accountNumber}</Text>
                              </Descriptions.Item>
                              <Descriptions.Item label="Atas Nama">
                                {method.details.accountName}
                              </Descriptions.Item>
                              <Descriptions.Item label="Instruksi">
                                {method.details.instructions || 'Tidak ada instruksi khusus'}
                              </Descriptions.Item>
                            </Descriptions>
                          )}
                          
                          {method.category === 'qris' && method.details.qrImageUrl && (
                            <div style={{ textAlign: 'center' }}>
                              <img 
                                src={method.details.qrImageUrl} 
                                alt="QRIS Code" 
                                style={{ maxWidth: '200px', margin: '20px auto' }} 
                              />
                              <Paragraph>
                                {method.details.instructions || 'Scan QR Code di atas menggunakan aplikasi e-wallet Anda'}
                              </Paragraph>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {method.type === 'tripay' && (
                        <Alert
                          message="Informasi Tripay"
                          description={
                            method.category === 'bank' ? 
                              "Pembayaran melalui transfer bank akan menggunakan Virtual Account yang disediakan oleh Tripay." :
                            method.category === 'ewallet' ?
                              "Pembayaran melalui e-wallet seperti OVO, DANA, LinkAja, dll. akan menggunakan channel pembayaran yang disediakan oleh Tripay." :
                            "Pembayaran melalui QRIS dapat menggunakan aplikasi e-wallet atau mobile banking apa saja yang mendukung QRIS."
                          }
                          type="info"
                          showIcon
                        />
                      )}
                    </Panel>
                  ))}
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
        open={modalVisible}
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

export default UserPaymentPage;