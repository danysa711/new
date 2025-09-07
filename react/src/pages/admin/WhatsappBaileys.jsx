// File: src/pages/admin/WhatsappBaileys.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Button, Form, Input, Switch, Tabs, 
  Space, Table, Tag, message, Spin, Modal, Image, Upload
} from 'antd';
import { 
  WhatsAppOutlined, QrcodeOutlined, LogoutOutlined, 
  ReloadOutlined, SettingOutlined, GroupOutlined,
  UploadOutlined, CheckCircleOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

const WhatsappBaileys = () => {
  // State variables
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [whatsappSettings, setWhatsappSettings] = useState({
    phoneNumber: '',
    groupName: '',
    notificationEnabled: true,
    templateMessage: 'Permintaan pembayaran baru dari {username} ({email}) dengan nominal Rp {amount} untuk paket {plan_name}. Nomor pesanan: {order_number}. Balas *1* untuk verifikasi atau *2* untuk tolak.'
  });
  const [qrCode, setQrCode] = useState('');
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [form] = Form.useForm();
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Fetch WhatsApp settings
  const fetchWhatsAppSettings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/baileys/settings');
      
      if (response.data) {
        setWhatsappSettings({
          phoneNumber: response.data.phoneNumber || '',
          groupName: response.data.groupName || '',
          notificationEnabled: response.data.notificationEnabled !== false,
          templateMessage: response.data.templateMessage || 'Permintaan pembayaran baru dari {username} ({email}) dengan nominal Rp {amount} untuk paket {plan_name}. Nomor pesanan: {order_number}. Balas *1* untuk verifikasi atau *2* untuk tolak.'
        });
        
        setConnectionStatus(response.data.status || 'disconnected');
      }
    } catch (error) {
      console.error('Error fetching WhatsApp settings:', error);
      message.error('Gagal mengambil pengaturan WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Fetch history logs
  const fetchHistoryLogs = async () => {
    try {
      const response = await axiosInstance.get('/api/baileys/logs');
      if (response.data) {
        setHistoryLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp logs:', error);
    }
  };

  // Connect WhatsApp
  const connectWhatsApp = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await axiosInstance.post('/api/baileys/connect');
    
    if (response.data && response.data.qrCode) {
      setQrCode(response.data.qrCode);
      setQrModalVisible(true);
      
      // Start polling connection status
      startCheckingConnectionStatus();
    } else {
      message.error('Gagal mendapatkan kode QR');
    }
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    message.error('Gagal menghubungkan WhatsApp: ' + (error.response?.data?.error || 'Terjadi kesalahan pada server'));
    setError('Gagal menghubungkan WhatsApp. Silakan coba lagi.');
  } finally {
    setLoading(false);
  }
};

  // Disconnect WhatsApp
  const disconnectWhatsApp = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/baileys/disconnect');
      
      message.success('WhatsApp berhasil diputuskan');
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      message.error('Gagal memutuskan WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  // Check connection status
  const checkConnectionStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await axiosInstance.get('/api/baileys/status');
      
      if (response.data) {
        setConnectionStatus(response.data.status || 'disconnected');
        
        if (response.data.status === 'connected') {
          message.success('WhatsApp terhubung');
          setQrModalVisible(false);
        }
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Start polling connection status
  const startCheckingConnectionStatus = () => {
    const interval = setInterval(async () => {
      try {
        const response = await axiosInstance.get('/api/baileys/status');
        
        if (response.data) {
          setConnectionStatus(response.data.status || 'disconnected');
          
          if (response.data.status === 'connected') {
            clearInterval(interval);
            message.success('WhatsApp terhubung');
            setQrModalVisible(false);
          }
        }
      } catch (error) {
        console.error('Error checking connection status:', error);
        clearInterval(interval);
      }
    }, 3000);
    
    // Clear interval after 2 minutes
    setTimeout(() => {
      clearInterval(interval);
    }, 2 * 60 * 1000);
  };

  // Save WhatsApp settings
  const saveWhatsAppSettings = async (values) => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.post('/api/baileys/settings', {
        phoneNumber: values.phoneNumber,
        groupName: values.groupName,
        notificationEnabled: values.notificationEnabled,
        templateMessage: values.templateMessage
      });
      
      if (response.data && response.data.success) {
        message.success('Pengaturan WhatsApp berhasil disimpan');
        setWhatsappSettings({
          ...whatsappSettings,
          phoneNumber: values.phoneNumber,
          groupName: values.groupName,
          notificationEnabled: values.notificationEnabled,
          templateMessage: values.templateMessage
        });
      } else {
        throw new Error(response.data?.message || 'Gagal menyimpan pengaturan');
      }
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error);
      message.error('Gagal menyimpan pengaturan WhatsApp: ' + (error.message || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  // Initialize
  useEffect(() => {
    fetchWhatsAppSettings();
    fetchHistoryLogs();
    
    // Set interval to refresh logs and status
    const intervalId = setInterval(() => {
      checkConnectionStatus();
      fetchHistoryLogs();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Update form when settings change
  useEffect(() => {
    form.setFieldsValue(whatsappSettings);
  }, [whatsappSettings, form]);

  return (
    <div>
      <Title level={2}>Pengaturan WhatsApp</Title>
      
      {/* Connection Status Card */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center">
            <WhatsAppOutlined style={{ fontSize: 32, color: connectionStatus === 'connected' ? '#25D366' : '#ccc' }} />
            <div>
              <Text strong>Status WhatsApp:</Text>
              <Tag color={connectionStatus === 'connected' ? 'success' : 'error'} style={{ marginLeft: 8 }}>
                {connectionStatus === 'connected' ? 'TERHUBUNG' : 'TERPUTUS'}
              </Tag>
            </div>
          </Space>
          
          <Space>
            {connectionStatus !== 'connected' ? (
              <Button 
                type="primary" 
                icon={<QrcodeOutlined />} 
                onClick={connectWhatsApp}
                loading={loading}
              >
                Hubungkan WhatsApp
              </Button>
            ) : (
              <Button 
                danger 
                icon={<LogoutOutlined />} 
                onClick={disconnectWhatsApp}
                loading={loading}
              >
                Putuskan WhatsApp
              </Button>
            )}
            
            <Button 
              icon={<ReloadOutlined />} 
              onClick={checkConnectionStatus}
              loading={checkingStatus}
            >
              Refresh Status
            </Button>
          </Space>
        </div>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultActiveKey="settings">
        {/* Settings Tab */}
        <TabPane 
          tab={<span><SettingOutlined />Pengaturan</span>} 
          key="settings"
        >
          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={whatsappSettings}
              onFinish={saveWhatsAppSettings}
            >
              <Form.Item
                name="phoneNumber"
                label="Nomor WhatsApp"
                rules={[
                  { 
                    required: true, 
                    message: 'Masukkan nomor WhatsApp' 
                  },
                  {
                    pattern: /^[0-9+]+$/,
                    message: 'Nomor telepon hanya boleh berisi angka dan tanda +'
                  }
                ]}
              >
                <Input prefix={<WhatsAppOutlined />} placeholder="Contoh: 6281234567890" />
              </Form.Item>
              
              <Form.Item
                name="groupName"
                label="Nama Grup WhatsApp"
                rules={[{ required: true, message: 'Masukkan nama grup WhatsApp' }]}
              >
                <Input prefix={<GroupOutlined />} placeholder="Nama grup untuk notifikasi" />
              </Form.Item>
              
              <Form.Item
                name="notificationEnabled"
                label="Aktifkan Notifikasi"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="templateMessage"
                label="Template Pesan Notifikasi"
                rules={[{ required: true, message: 'Masukkan template pesan notifikasi' }]}
                extra="Gunakan placeholder: {username}, {email}, {amount}, {plan_name}, {order_number}"
              >
                <TextArea rows={4} placeholder="Template pesan notifikasi pembayaran" />
              </Form.Item>
              
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Simpan Pengaturan
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </TabPane>
        
        {/* History Tab */}
        <TabPane 
          tab={<span><ReloadOutlined />Riwayat Aktivitas</span>} 
          key="history"
        >
          <Card>
            <Table
              dataSource={historyLogs}
              rowKey="id"
              columns={[
                {
                  title: 'Waktu',
                  dataIndex: 'timestamp',
                  key: 'timestamp',
                  render: timestamp => moment(timestamp).format('DD/MM/YYYY HH:mm:ss'),
                  sorter: (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
                  defaultSortOrder: 'descend',
                },
                {
                  title: 'Tipe',
                  dataIndex: 'type',
                  key: 'type',
                  render: type => {
                    const typeMap = {
                      'connection': { color: 'blue', text: 'KONEKSI' },
                      'notification': { color: 'green', text: 'NOTIFIKASI' },
                      'verification': { color: 'purple', text: 'VERIFIKASI' },
                      'error': { color: 'red', text: 'ERROR' }
                    };
                    
                    const { color, text } = typeMap[type] || { color: 'default', text: type.toUpperCase() };
                    
                    return <Tag color={color}>{text}</Tag>;
                  },
                  filters: [
                    { text: 'KONEKSI', value: 'connection' },
                    { text: 'NOTIFIKASI', value: 'notification' },
                    { text: 'VERIFIKASI', value: 'verification' },
                    { text: 'ERROR', value: 'error' },
                  ],
                  onFilter: (value, record) => record.type === value,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: status => {
                    let color = 'default';
                    let text = status;
                    
                    if (status === 'success') {
                      color = 'success';
                      text = 'BERHASIL';
                    } else if (status === 'failed') {
                      color = 'error';
                      text = 'GAGAL';
                    } else if (status === 'pending') {
                      color = 'warning';
                      text = 'MENUNGGU';
                    }
                    
                    return <Tag color={color}>{text.toUpperCase()}</Tag>;
                  },
                  filters: [
                    { text: 'BERHASIL', value: 'success' },
                    { text: 'GAGAL', value: 'failed' },
                    { text: 'MENUNGGU', value: 'pending' },
                  ],
                  onFilter: (value, record) => record.status === value,
                },
                {
                  title: 'Pesan',
                  dataIndex: 'message',
                  key: 'message',
                  ellipsis: true,
                },
                {
                  title: 'Detail',
                  key: 'action',
                  render: (_, record) => (
                    <Button 
                      type="link" 
                      onClick={() => {
                        Modal.info({
                          title: 'Detail Log',
                          content: (
                            <div style={{ marginTop: 16 }}>
                              <p><strong>Waktu:</strong> {moment(record.timestamp).format('DD/MM/YYYY HH:mm:ss')}</p>
                              <p><strong>Tipe:</strong> {record.type}</p>
                              <p><strong>Status:</strong> {record.status}</p>
                              <p><strong>Pesan:</strong> {record.message}</p>
                              {record.data && (
                                <div>
                                  <p><strong>Data:</strong></p>
                                  <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(record.data, null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ),
                          width: 600,
                        });
                      }}
                    >
                      Lihat Detail
                    </Button>
                  ),
                },
              ]}
              pagination={{ pageSize: 10 }}
              locale={{ emptyText: 'Belum ada riwayat aktivitas' }}
            />
            
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchHistoryLogs}
              >
                Refresh Data
              </Button>
            </div>
          </Card>
        </TabPane>
      </Tabs>
      
      {/* QR Code Modal */}
      <Modal
        title="Scan QR Code WhatsApp"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setQrModalVisible(false)}>
            Tutup
          </Button>
        ]}
      >
        {qrCode ? (
          <div style={{ textAlign: 'center' }}>
            <Image
              src={`data:image/png;base64,${qrCode}`}
              alt="WhatsApp QR Code"
              style={{ maxWidth: '100%' }}
            />
            <Paragraph style={{ marginTop: 16 }}>
              Buka WhatsApp di ponsel Anda dan scan QR code ini untuk menghubungkan
            </Paragraph>
            <div style={{ marginTop: 16 }}>
              <Spin spinning={checkingStatus} />
              <Text type="secondary">
                {connectionStatus === 'connected' ? 
                  'WhatsApp terhubung' : 
                  'Menunggu koneksi...'
                }
              </Text>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Menghasilkan QR code...</div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default WhatsappBaileys;