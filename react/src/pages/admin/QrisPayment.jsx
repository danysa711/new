// File: src/pages/admin/QrisPayment.jsx
import axios from 'axios';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Typography, Table, Tag, Button, Space, 
  Modal, Form, Input, Upload, Spin, message, Descriptions, 
  Divider, Image, Statistic, Row, Col, DatePicker, Select, Tabs, Tooltip
} from 'antd';
import { 
  ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, 
  UploadOutlined, ClockCircleOutlined, SearchOutlined,
  SettingOutlined, QrcodeOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const QrisPayment = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [pendingPayments, setPendingPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [qrisSettings, setQrisSettings] = useState({
    expiryHours: 1,
    qrisImage: '',
  });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [settingsForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [rejectionLoading, setRejectionLoading] = useState(false);
  
  // Fetch pending payments
  const fetchPendingPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/qris/pending-admin');
      console.log('Response data:', response.data);
      setPendingPayments(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      message.error('Gagal mengambil data pembayaran tertunda');
      setPendingPayments([]); // Set empty array untuk menghindari error
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch QRIS settings
  const fetchQrisSettings = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/qris/settings');
      
      if (response.data) {
        setQrisSettings({
          expiryHours: response.data.expiryHours || 1,
          qrisImage: response.data.qrisImage || '',
        });
        
        // Update form values
        settingsForm.setFieldsValue({
          expiryHours: response.data.expiryHours || 1,
        });
      }
    } catch (error) {
      console.error('Error fetching QRIS settings:', error);
    }
  }, [settingsForm]);
  
  // Verify payment function dengan pendekatan yang lebih andal
  const verifyPayment = async (id) => {
    try {
      setVerificationLoading(true);
      console.log('Verifying payment ID:', id);
      
      // Gunakan token dari localStorage atau sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }
      
      // Gunakan API URL dari state global atau environment
      const baseUrl = axiosInstance.defaults.baseURL || 'https://db.kinterstore.my.id';
      const url = `${baseUrl}/api/qris/verify/${id}`;
      
      // Buat request langsung dengan axios
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Verify response:', response.data);
      
      if (response.data && response.data.success) {
        message.success('Pembayaran berhasil diverifikasi');
        
        // Perbarui data
        await fetchPendingPayments();
        
        // Tutup modal detail jika terbuka
        if (detailModalVisible && selectedPayment && selectedPayment.id === id) {
          setDetailModalVisible(false);
        }
      } else {
        throw new Error(response.data?.error || 'Verifikasi gagal');
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      message.error('Gagal memverifikasi pembayaran: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setVerificationLoading(false);
    }
  };

  // Reject payment function dengan pendekatan yang lebih andal
  const rejectPayment = async (id) => {
    try {
      setRejectionLoading(true);
      console.log('Rejecting payment ID:', id);
      
      // Gunakan token dari localStorage atau sessionStorage
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }
      
      // Gunakan API URL dari state global atau environment
      const baseUrl = axiosInstance.defaults.baseURL || 'https://db.kinterstore.my.id';
      const url = `${baseUrl}/api/qris/reject/${id}`;
      
      // Buat request langsung dengan axios
      const response = await axios({
        method: 'POST',
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Reject response:', response.data);
      
      if (response.data && response.data.success) {
        message.success('Pembayaran berhasil ditolak');
        
        // Perbarui data
        await fetchPendingPayments();
        
        // Tutup modal detail jika terbuka
        if (detailModalVisible && selectedPayment && selectedPayment.id === id) {
          setDetailModalVisible(false);
        }
      } else {
        throw new Error(response.data?.error || 'Penolakan gagal');
      }
    } catch (error) {
      console.error('Error rejecting payment:', error);
      message.error('Gagal menolak pembayaran: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setRejectionLoading(false);
    }
  };

  // Save QRIS settings
  const saveQrisSettings = async (values) => {
    try {
      setLoading(true);
      console.log('Saving QRIS settings:', values);
      
      const response = await axiosInstance.post('/api/qris/settings', {
        expiryHours: parseInt(values.expiryHours)
      });
      
      if (response.data && response.data.success) {
        message.success('Pengaturan QRIS berhasil disimpan');
        setQrisSettings({
          ...qrisSettings,
          expiryHours: parseInt(values.expiryHours),
        });
        setSettingsModalVisible(false);
      } else {
        throw new Error(response.data?.message || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving QRIS settings:', error);
      message.error('Gagal menyimpan pengaturan QRIS: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  // Upload QRIS image
  const uploadQrisImage = async (file) => {
    try {
      setUploadLoading(true);
      
      // Create form data
      const formData = new FormData();
      formData.append('qrisImage', file);
      
      const response = await axiosInstance.post('/api/qris/upload-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data && response.data.success) {
        message.success('Gambar QRIS berhasil diunggah');
        setQrisSettings({
          ...qrisSettings,
          qrisImage: response.data.imageUrl,
        });
      } else {
        throw new Error(response.data?.message || 'Gagal mengunggah gambar');
      }
    } catch (error) {
      console.error('Error uploading QRIS image:', error);
      message.error('Gagal mengunggah gambar QRIS: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setUploadLoading(false);
    }
  };

  // Filter pending payments
  const handleSearch = (value) => {
    setSearchKeyword(value);
  };

  // Show payment details
  const showPaymentDetails = (payment) => {
    setSelectedPayment(payment);
    setDetailModalVisible(true);
  };

  // Initialize
  useEffect(() => {
    fetchPendingPayments();
    fetchQrisSettings();
    
    // Set interval to refresh pending payments
    const intervalId = setInterval(() => {
      fetchPendingPayments();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchPendingPayments, fetchQrisSettings]);

  // Filter pending payments based on search keyword
  const filteredPendingPayments = searchKeyword
    ? pendingPayments.filter(payment => 
        payment.order_number?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        payment.username?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        payment.email?.toLowerCase().includes(searchKeyword.toLowerCase())
      )
    : pendingPayments;

  return (
    <div>
      <Title level={2}>Verifikasi Pembayaran QRIS</Title>
      
      {/* Quick Stats */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Pembayaran Tertunda"
              value={pendingPayments.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Menunggu Verifikasi"
              value={pendingPayments.filter(payment => payment.status === 'waiting_verification').length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      {/* Settings and Refresh Buttons */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          icon={<SettingOutlined />}
          onClick={() => setSettingsModalVisible(true)}
          style={{ marginRight: 8 }}
        >
          Pengaturan QRIS
        </Button>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => fetchPendingPayments()}
          loading={loading}
        >
          Refresh Data
        </Button>
      </div>
      
      {/* Pending Payments Section */}
      <Card 
        title="Pembayaran Tertunda" 
        style={{ marginBottom: 24 }}
        extra={
          <Input.Search
            placeholder="Cari no. pesanan/username/email"
            allowClear
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
        }
      >
        <Table
          dataSource={filteredPendingPayments}
          rowKey="id"
          loading={loading}
          columns={[
            {
              title: 'No. Pesanan',
              dataIndex: 'order_number',
              key: 'order_number',
              render: text => <Text copyable>{text}</Text>
            },
            {
              title: 'Username',
              dataIndex: 'username',
              key: 'username',
            },
            {
              title: 'Email',
              dataIndex: 'email',
              key: 'email',
              responsive: ['md'],
            },
            {
              title: 'Paket',
              dataIndex: 'plan_name',
              key: 'plan_name',
              responsive: ['md'],
            },
            {
              title: 'Jumlah',
              dataIndex: 'amount',
              key: 'amount',
              render: amount => `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`,
            },
            {
              title: 'Status',
              dataIndex: 'status',
              key: 'status',
              render: status => {
                let color = 'default';
                let text = status;
                
                if (status === 'waiting_verification') {
                  color = 'blue';
                  text = 'MENUNGGU VERIFIKASI';
                } else if (status === 'pending') {
                  color = 'orange';
                  text = 'MENUNGGU PEMBAYARAN';
                }
                
                return <Tag color={color}>{text.toUpperCase()}</Tag>;
              },
              filters: [
                { text: 'MENUNGGU VERIFIKASI', value: 'waiting_verification' },
                { text: 'MENUNGGU PEMBAYARAN', value: 'pending' },
              ],
              onFilter: (value, record) => record.status === value,
            },
            {
              title: 'Tanggal',
              dataIndex: 'created_at',
              key: 'created_at',
              render: date => moment(date).format('DD/MM/YYYY HH:mm'),
              responsive: ['md'],
            },
            {
              title: 'Aksi',
              key: 'action',
              render: (_, record) => (
                <Space size="small">
                  <Button
                    type="primary" 
                    size="small"
                    style={{ 
                      backgroundColor: '#52c41a', 
                      borderColor: '#52c41a'
                    }}
                    onClick={() => {
                      Modal.confirm({
                        title: 'Verifikasi Pembayaran',
                        content: `Apakah Anda yakin ingin memverifikasi pembayaran #${record.order_number}?`,
                        onOk: () => verifyPayment(record.id),
                        okText: 'Ya, Verifikasi',
                        cancelText: 'Batal'
                      });
                    }}
                    icon={<CheckCircleOutlined />}
                    loading={verificationLoading}
                  >
                    Verifikasi
                  </Button>
                  
                  <Button
                    danger
                    size="small"
                    onClick={() => {
                      Modal.confirm({
                        title: 'Tolak Pembayaran',
                        content: `Apakah Anda yakin ingin menolak pembayaran #${record.order_number}?`,
                        onOk: () => rejectPayment(record.id),
                        okText: 'Ya, Tolak',
                        cancelText: 'Batal'
                      });
                    }}
                    icon={<CloseCircleOutlined />}
                    loading={rejectionLoading}
                  >
                    Tolak
                  </Button>
                  
                  <Button
                    type="link"
                    size="small"
                    onClick={() => showPaymentDetails(record)}
                  >
                    Detail
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'Tidak ada pembayaran tertunda' }}
        />
      </Card>
      
      {/* Payment Detail Modal */}
      <Modal
        title="Detail Pembayaran"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Tutup
          </Button>
        ]}
        width={700}
      >
        {selectedPayment && (
          <div>
            <Descriptions
              title="Informasi Pembayaran"
              bordered
              column={1}
              style={{ marginBottom: 20 }}
            >
              <Descriptions.Item label="No. Pesanan">
                <Text copyable>{selectedPayment.order_number}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Username">
                {selectedPayment.username}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {selectedPayment.email}
              </Descriptions.Item>
              <Descriptions.Item label="Paket">
                {selectedPayment.plan_name || 'Paket Langganan'}
              </Descriptions.Item>
              <Descriptions.Item label="Jumlah">
                <Text strong>Rp {new Intl.NumberFormat('id-ID').format(selectedPayment.amount || 0)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={
                  selectedPayment.status === 'verified' ? 'success' :
                  selectedPayment.status === 'rejected' ? 'error' :
                  selectedPayment.status === 'expired' ? 'warning' :
                  selectedPayment.status === 'waiting_verification' ? 'blue' :
                  'orange'
                }>
                  {
                    selectedPayment.status === 'verified' ? 'TERVERIFIKASI' :
                    selectedPayment.status === 'rejected' ? 'DITOLAK' :
                    selectedPayment.status === 'expired' ? 'KEDALUWARSA' :
                    selectedPayment.status === 'waiting_verification' ? 'MENUNGGU VERIFIKASI' :
                    'MENUNGGU PEMBAYARAN'
                  }
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Tanggal Dibuat">
                {moment(selectedPayment.created_at).format('DD MMMM YYYY HH:mm')}
              </Descriptions.Item>
              {selectedPayment.verified_at && (
                <Descriptions.Item label="Tanggal Verifikasi">
                  {moment(selectedPayment.verified_at).format('DD MMMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {selectedPayment.rejected_at && (
                <Descriptions.Item label="Tanggal Penolakan">
                  {moment(selectedPayment.rejected_at).format('DD MMMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {selectedPayment.expired_at && (
                <Descriptions.Item label="Batas Waktu">
                  {moment(selectedPayment.expired_at).format('DD MMMM YYYY HH:mm')}
                </Descriptions.Item>
              )}
            </Descriptions>
            
            {/* Action buttons for pending payments */}
            {(selectedPayment.status === 'pending' || selectedPayment.status === 'waiting_verification') && (
              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 16 }}>
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  style={{ 
                    backgroundColor: '#52c41a', 
                    borderColor: '#52c41a'
                  }}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Verifikasi Pembayaran',
                      content: `Apakah Anda yakin ingin memverifikasi pembayaran ini?`,
                      onOk: () => {
                        verifyPayment(selectedPayment.id);
                      },
                      okText: 'Ya, Verifikasi',
                      cancelText: 'Batal'
                    });
                  }}
                  loading={verificationLoading}
                >
                  Verifikasi Pembayaran
                </Button>
                
                <Button
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => {
                    Modal.confirm({
                      title: 'Tolak Pembayaran',
                      content: `Apakah Anda yakin ingin menolak pembayaran ini?`,
                      onOk: () => {
                        rejectPayment(selectedPayment.id);
                      },
                      okText: 'Ya, Tolak',
                      cancelText: 'Batal'
                    });
                  }}
                  loading={rejectionLoading}
                >
                  Tolak Pembayaran
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
      
      {/* QRIS Settings Modal */}
      <Modal
        title="Pengaturan QRIS"
        open={settingsModalVisible}
        onCancel={() => setSettingsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Tabs defaultActiveKey="expiry">
          <TabPane 
            key="expiry" 
            tab={<span><ClockCircleOutlined />Waktu Kedaluwarsa</span>}
          >
            <Form
              form={settingsForm}
              layout="vertical"
              initialValues={qrisSettings}
              onFinish={saveQrisSettings}
            >
              <Form.Item
                name="expiryHours"
                label="Waktu Kedaluwarsa Pembayaran (Jam)"
                tooltip={{
                  title: 'Setelah waktu ini, pembayaran yang belum diverifikasi akan otomatis kedaluwarsa',
                  icon: <InfoCircleOutlined />
                }}
                rules={[
                  { required: true, message: 'Masukkan waktu kedaluwarsa' },
                  { 
                    validator: (_, value) => {
                      const numValue = parseInt(value);
                      if (isNaN(numValue) || numValue < 1 || numValue > 48) {
                        return Promise.reject('Waktu harus antara 1-48 jam');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <Input type="number" min={1} max={48} />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Simpan Pengaturan
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
          
          <TabPane 
            key="qris" 
            tab={<span><QrcodeOutlined />Gambar QRIS</span>}
          >
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              {qrisSettings.qrisImage ? (
                <Image
                  src={qrisSettings.qrisImage}
                  alt="QRIS Image"
                  style={{ maxWidth: '100%', maxHeight: 300 }}
                />
              ) : (
                <div style={{ background: '#f5f5f5', padding: 40, borderRadius: 4 }}>
                  <Text type="secondary">Belum ada gambar QRIS</Text>
                </div>
              )}
            </div>
            
            <Upload
              name="qrisImage"
              listType="picture"
              maxCount={1}
              beforeUpload={(file) => {
                // Check file type
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('File harus berupa gambar!');
                  return Upload.LIST_IGNORE;
                }
                
                // Check file size (max 2MB)
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('Ukuran gambar harus kurang dari 2MB!');
                  return Upload.LIST_IGNORE;
                }
                
                // Custom upload
                uploadQrisImage(file);
                return false;
              }}
              showUploadList={false}
            >
              <Button 
                icon={<UploadOutlined />} 
                loading={uploadLoading}
                style={{ display: 'block', margin: '0 auto' }}
              >
                Unggah Gambar QRIS
              </Button>
            </Upload>
            
            <Paragraph style={{ marginTop: 16, textAlign: 'center' }}>
              <Text type="secondary">
                Format gambar: JPG, PNG. Ukuran maksimal: 2MB
              </Text>
            </Paragraph>
          </TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default QrisPayment;