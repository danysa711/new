// File: src/pages/admin/WhatsappBaileys.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  const [qrModalClosed, setQrModalClosed] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [form] = Form.useForm();
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [pollingCount, setPollingCount] = useState(0);
  const [qrPollingAttempts, setQrPollingAttempts] = useState(0);

  // Fetch WhatsApp settings
  const fetchWhatsAppSettings = useCallback(async () => {
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
  }, []);

  // Fetch history logs
  const fetchHistoryLogs = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/baileys/logs');
      if (response.data) {
        setHistoryLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp logs:', error);
    }
  }, []);

  // Connect WhatsApp dengan perbaikan dan handling QR Code
  const connectWhatsApp = async () => {
    try {
      setLoading(true);
      setQrCode('');
      setQrPollingAttempts(0);
      setQrModalClosed(false);
      
      message.loading('Menginisialisasi koneksi WhatsApp...', 2);
      
      // Coba dapatkan QR code untuk koneksi
      const response = await axiosInstance.post('/api/baileys/connect');
      
      console.log('Connect response:', response.data);
      
      if (response.data && response.data.qrCode) {
        // Jika QR code tersedia, tampilkan
        setQrCode(response.data.qrCode);
        setQrModalVisible(true);
        
        // Mulai polling status koneksi
        startPollingConnectionStatus();
      } else {
        // Jika tidak ada QR code tapi status mungkin sudah terhubung
        await checkConnectionStatus();
      }
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      message.error('Gagal menghubungkan WhatsApp: ' + (error.response?.data?.error || 'Terjadi kesalahan pada server'));
      
      // Tetap cek status, mungkin sudah terhubung
      await checkConnectionStatus();
    } finally {
      setLoading(false);
    }
  };

  // Disconnect WhatsApp
  const disconnectWhatsApp = async () => {
    try {
      setLoading(true);
      
      // Hentikan polling
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      
      const response = await axiosInstance.post('/api/baileys/disconnect');
      
      if (response.data && response.data.success) {
        message.success('WhatsApp berhasil diputuskan');
        setConnectionStatus('disconnected');
        setQrModalVisible(false);
      } else {
        throw new Error(response.data?.error || 'Gagal memutuskan WhatsApp');
      }
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      message.error('Gagal memutuskan WhatsApp: ' + (error.response?.data?.error || 'Terjadi kesalahan'));
    } finally {
      setLoading(false);
    }
  };

  // Check connection status
  const checkConnectionStatus = async () => {
    try {
      setCheckingStatus(true);
      const response = await axiosInstance.get('/api/baileys/status');
      
      console.log('Connection status response:', response.data);
      
      if (response.data) {
        const newStatus = response.data.status || 'disconnected';
        setConnectionStatus(newStatus);
        
        // Tutup modal QR jika sudah terhubung
        if (newStatus === 'connected' && qrModalVisible) {
          message.success('WhatsApp berhasil terhubung!');
          setQrModalVisible(false);
          
          // Hentikan polling jika sudah terhubung
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
          }
        }
      }
      
      return response.data?.status || 'disconnected';
    } catch (error) {
      console.error('Error checking connection status:', error);
      return 'error';
    } finally {
      setCheckingStatus(false);
    }
  };

  // Start polling connection status
  const startPollingConnectionStatus = () => {
    // Hentikan polling yang sudah ada jika ada
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    // Reset counter
    setPollingCount(0);
    
    // Buat interval baru untuk polling
    const interval = setInterval(async () => {
      setPollingCount(prev => {
        const newCount = prev + 1;
        
        // Cek status koneksi
        checkConnectionStatus().then(status => {
          console.log(`Polling #${newCount}, status: ${status}`);
          
          // Jika terhubung, hentikan polling
          if (status === 'connected') {
            clearInterval(interval);
            setPollingInterval(null);
            setQrPollingAttempts(0);
            return;
          }
          
          // Jika modal ditutup dan tidak terhubung, coba dapatkan QR code baru
          if (qrModalClosed && status !== 'connected' && newCount % 5 === 0) {
            // Coba maksimal 3 kali untuk mendapatkan QR code baru
            if (qrPollingAttempts < 3) {
              refreshQrCode();
              setQrPollingAttempts(prev => prev + 1);
            } else {
              // Jika sudah 3 kali, hentikan polling
              clearInterval(interval);
              setPollingInterval(null);
              message.warning('Batas percobaan mendapatkan QR code tercapai. Silakan coba lagi nanti.');
            }
          }
        });
        
        // Batasi polling maksimal 60 kali (sekitar 5 menit)
        if (newCount >= 60) {
          clearInterval(interval);
          setPollingInterval(null);
          
          // Periksa status terakhir
          checkConnectionStatus().then(status => {
            if (status !== 'connected') {
              message.info('Tidak ada respons dari WhatsApp. Silakan coba lagi nanti.');
            }
          });
          
          return newCount;
        }
        
        return newCount;
      });
    }, 5000); // Polling setiap 5 detik
    
    setPollingInterval(interval);
  };

  // Refresh QR code
  const refreshQrCode = async () => {
    try {
      setLoading(true);
      
      // Coba dapatkan QR code baru
      const response = await axiosInstance.post('/api/baileys/connect');
      
      if (response.data && response.data.qrCode) {
        setQrCode(response.data.qrCode);
        setQrModalVisible(true);
        setQrModalClosed(false);
        message.info('QR code baru berhasil didapatkan');
      } else {
        message.warning('Tidak bisa mendapatkan QR code baru');
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      message.error('Gagal mendapatkan QR code baru');
    } finally {
      setLoading(false);
    }
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
    
    return () => {
      clearInterval(intervalId);
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [fetchWhatsAppSettings, fetchHistoryLogs, pollingInterval]);

  // Update form when settings change
  useEffect(() => {
    form.setFieldsValue(whatsappSettings);
  }, [whatsappSettings, form]);

  // Renderkan waktu relatif dengan moment
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    return moment(timestamp).fromNow();
  };

  return (
    <div>
      <Title level={2}>Pengaturan WhatsApp</Title>
      
      {/* Connection Status Card */}
      <Card style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space align="center">
            <WhatsAppOutlined style={{ 
              fontSize: 32, 
              color: connectionStatus === 'connected' ? '#25D366' : '#ccc',
              animation: connectionStatus === 'connected' ? 'pulse 2s infinite' : 'none'
            }} />
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
                onClick={() => {
                  Modal.confirm({
                    title: 'Putuskan Koneksi WhatsApp',
                    content: 'Apakah Anda yakin ingin memutuskan koneksi WhatsApp?',
                    onOk: disconnectWhatsApp,
                    okText: 'Ya, Putuskan',
                    cancelText: 'Batal'
                  });
                }}
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
                tooltip="Pastikan grup dengan nama ini sudah ada di WhatsApp Anda dan nomor WhatsApp yang digunakan sudah ditambahkan ke grup"
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
                tooltip="Gunakan placeholder: {username}, {email}, {amount}, {plan_name}, {order_number} untuk menggantikan data yang sesuai"
              >
                <TextArea 
                  rows={4} 
                  placeholder="Template pesan notifikasi pembayaran" 
                />
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
                  dataIndex: 'created_at',
                  key: 'created_at',
                  render: timestamp => (
                    <Tooltip title={moment(timestamp).format('DD/MM/YYYY HH:mm:ss')}>
                      {formatRelativeTime(timestamp)}
                    </Tooltip>
                  ),
                  sorter: (a, b) => moment(b.created_at).unix() - moment(a.created_at).unix(),
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
                              <p><strong>Waktu:</strong> {moment(record.created_at).format('DD/MM/YYYY HH:mm:ss')}</p>
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
        onCancel={() => {
          setQrModalVisible(false);
          setQrModalClosed(true);
        }}
        footer={[
          <Button 
            key="refresh" 
            icon={<ReloadOutlined />} 
            onClick={refreshQrCode}
            disabled={loading}
          >
            Refresh QR Code
          </Button>,
          <Button key="close" onClick={() => {
            setQrModalVisible(false);
            setQrModalClosed(true);
          }}>
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
              preview={false}
            />
            <Paragraph style={{ marginTop: 16 }}>
              Buka WhatsApp di ponsel Anda, lalu:
            </Paragraph>
            <ol style={{ textAlign: 'left' }}>
              <li>Ketuk Menu (•••) atau Settings dan pilih WhatsApp Web/Desktop</li>
              <li>Ketuk pada "Link a Device"</li>
              <li>Arahkan kamera Anda ke QR code di layar</li>
            </ol>
            <div style={{ marginTop: 16 }}>
              <Spin spinning={checkingStatus} />
              <Text type="secondary">
                {connectionStatus === 'connected' ? 
                  'WhatsApp terhubung' : 
                  'Menunggu koneksi...'
                }
              </Text>
            </div>
            <div style={{ marginTop: 10, fontSize: '12px', color: '#999' }}>
              <Text type="secondary">
                Jika QR code kedaluwarsa, klik tombol Refresh QR Code untuk memuat QR code baru
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

      {/* Styling untuk animasi pulse */}
      <style jsx>{`
        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default WhatsappBaileys;