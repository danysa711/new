// react/src/pages/admin/PaymentSettings.jsx (Updated with QRIS upload and group name)
import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Form, Input, InputNumber, Button, Upload, message,
  Switch, Divider, Typography, Row, Col, Tabs, Spin, Alert, Space,
  Select, Modal, Table
} from 'antd';
import {
  SaveOutlined, UploadOutlined, PictureOutlined, DeleteOutlined,
  ClockCircleOutlined, MessageOutlined, UserOutlined, QrcodeOutlined,
  WhatsAppOutlined, ApiOutlined, ReloadOutlined, LinkOutlined,
  CheckCircleOutlined, GroupOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;
const { Option } = Select;

const PaymentSettings = () => {
  const [form] = Form.useForm();
  const [whatsappForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [settings, setSettings] = useState(null);
  const [qrisImageUrl, setQrisImageUrl] = useState('');
  const [qrisPreview, setQrisPreview] = useState('');
  const [fileList, setFileList] = useState([]);
  const [whatsappStatus, setWhatsappStatus] = useState({
    status: 'disconnected',
    qrCode: null,
    isInitialized: false,
    adminGroupName: null
  });
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [statusCheckInterval, setStatusCheckInterval] = useState(null);
  const [whatsappTestMessage, setWhatsappTestMessage] = useState({
    phone: '',
    message: 'Ini adalah pesan uji dari sistem.'
  });
  const [whatsappGroups, setWhatsappGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  // Fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  // Check WhatsApp status regularly if initialized
  useEffect(() => {
    if (whatsappStatus.isInitialized || whatsappStatus.status === 'qr') {
      const interval = setInterval(() => {
        checkWhatsAppStatus();
      }, 5000); // Check every 5 seconds
      
      setStatusCheckInterval(interval);
      return () => clearInterval(interval);
    } else if (statusCheckInterval) {
      clearInterval(statusCheckInterval);
      setStatusCheckInterval(null);
    }
  }, [whatsappStatus]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/payment-settings');
      setSettings(response.data);
      setQrisImageUrl(response.data.qris_image_url);
      setQrisPreview(response.data.qris_image_url);
      
      // Reset file list
      setFileList([]);
      
      form.setFieldsValue({
        payment_expiry_hours: response.data.payment_expiry_hours,
        verification_message_template: response.data.verification_message_template,
        success_message_template: response.data.success_message_template,
        rejected_message_template: response.data.rejected_message_template,
        whatsapp_enabled: response.data.whatsapp_enabled,
        max_pending_orders: response.data.max_pending_orders
      });
      
      // Check WhatsApp status if enabled
      if (response.data.whatsapp_enabled) {
        checkWhatsAppStatus();
      }
    } catch (error) {
      console.error('Error fetching payment settings:', error);
      message.error('Gagal memuat pengaturan pembayaran');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values) => {
    try {
      setSaveLoading(true);
      
      // Create form data for file upload
      const formData = new FormData();
      
      // Add text fields
      formData.append('payment_expiry_hours', values.payment_expiry_hours);
      formData.append('verification_message_template', values.verification_message_template);
      formData.append('success_message_template', values.success_message_template);
      formData.append('rejected_message_template', values.rejected_message_template);
      formData.append('whatsapp_enabled', values.whatsapp_enabled ? 'true' : 'false');
      formData.append('max_pending_orders', values.max_pending_orders);
      
      // Handle file upload
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('qris_image', fileList[0].originFileObj);
      }
      
      // Update with new values
      const response = await axiosInstance.put('/api/payment-settings', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSettings(response.data.settings);
      setQrisImageUrl(response.data.settings.qris_image_url);
      setQrisPreview(response.data.settings.qris_image_url);
      
      // Reset file list after successful upload
      setFileList([]);
      
      message.success('Pengaturan pembayaran berhasil disimpan');
    } catch (error) {
      console.error('Error saving payment settings:', error);
      message.error('Gagal menyimpan pengaturan pembayaran');
    } finally {
      setSaveLoading(false);
    }
  };

  // WhatsApp Functions
  const checkWhatsAppStatus = async () => {
    try {
      const response = await axiosInstance.get('/api/whatsapp/status');
      setWhatsappStatus(response.data);
      
      // If connected, fetch groups
      if (response.data.status === 'ready' && !groupsLoading && whatsappGroups.length === 0) {
        fetchWhatsappGroups();
      }
    } catch (error) {
      console.error('Error checking WhatsApp status:', error);
    }
  };

  const fetchWhatsappGroups = async () => {
    try {
      setGroupsLoading(true);
      const response = await axiosInstance.get('/api/whatsapp/groups');
      setWhatsappGroups(response.data.groups || []);
    } catch (error) {
      console.error('Error fetching WhatsApp groups:', error);
      message.error('Gagal mendapatkan daftar grup WhatsApp');
    } finally {
      setGroupsLoading(false);
    }
  };

  const initWhatsApp = async () => {
    try {
      setWhatsappLoading(true);
      await axiosInstance.post('/api/whatsapp/init');
      message.success('Inisialisasi WhatsApp berhasil dimulai. Periksa QR code di console server.');
      message.info('PENTING: Cek console server untuk melihat QR code, kemudian scan dengan WhatsApp di ponsel Anda.');
      
      // Check status after a short delay
      setTimeout(() => {
        checkWhatsAppStatus();
      }, 2000);
    } catch (error) {
      console.error('Error initializing WhatsApp:', error);
      message.error('Gagal menginisialisasi WhatsApp');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const logoutWhatsApp = async () => {
    try {
      setWhatsappLoading(true);
      await axiosInstance.post('/api/whatsapp/logout');
      message.success('Logout WhatsApp berhasil');
      
      // Update status
      setWhatsappStatus({
        status: 'disconnected',
        qrCode: null,
        isInitialized: false,
        adminGroupName: null
      });
      
      // Reset grup
      setWhatsappGroups([]);
    } catch (error) {
      console.error('Error logging out from WhatsApp:', error);
      message.error('Gagal logout dari WhatsApp');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const openGroupModal = async () => {
    try {
      if (whatsappGroups.length === 0) {
        await fetchWhatsappGroups();
      }
      setGroupModalVisible(true);
    } catch (error) {
      console.error('Error preparing group modal:', error);
      message.error('Gagal memuat daftar grup');
    }
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
  };

  const confirmSetAdminGroup = async () => {
    if (!selectedGroup) {
      message.warning('Silakan pilih grup terlebih dahulu');
      return;
    }
    
    try {
      setWhatsappLoading(true);
      await axiosInstance.post('/api/whatsapp/admin-group', {
        group_id: selectedGroup.id,
        group_name: selectedGroup.name
      });
      
      message.success(`Grup ${selectedGroup.name} berhasil diatur sebagai grup admin`);
      setGroupModalVisible(false);
      
      // Refresh status
      await checkWhatsAppStatus();
      await fetchSettings();
    } catch (error) {
      console.error('Error setting admin group:', error);
      message.error('Gagal mengatur grup admin');
    } finally {
      setWhatsappLoading(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      setWhatsappLoading(true);
      await axiosInstance.post('/api/whatsapp/test-message', {
        phone_number: whatsappTestMessage.phone,
        message: whatsappTestMessage.message
      });
      message.success('Pesan uji berhasil dikirim');
    } catch (error) {
      console.error('Error sending test message:', error);
      message.error('Gagal mengirim pesan uji');
    } finally {
      setWhatsappLoading(false);
    }
  };

  // Handle QRIS image upload
  const handleQrisUpload = ({ fileList }) => {
    setFileList(fileList);
    
    // Preview file if available
    if (fileList.length > 0) {
      const file = fileList[0];
      if (file.originFileObj) {
        // Create a preview URL for the file
        const reader = new FileReader();
        reader.onload = () => {
          setQrisPreview(reader.result);
        };
        reader.readAsDataURL(file.originFileObj);
      }
    } else {
      // Reset preview to server URL if no file selected
      setQrisPreview(qrisImageUrl);
    }
  };

  const handleRemoveQris = () => {
    setFileList([]);
    setQrisPreview(null);
    
    // Update form with remove_qris_image flag
    form.setFieldsValue({
      ...form.getFieldsValue(),
      remove_qris_image: true
    });
  };

  // Reset settings to default
  const resetSettings = async (req, res) => {
  try {
    // Hanya admin yang boleh reset
    if (req.userRole !== "admin") {
      return res.status(403).json({ error: "Tidak memiliki izin" });
    }
    
    // Buat pengaturan default baru
    const newSettings = await PaymentSettings.create({
      payment_expiry_hours: 24,
      qris_image: null,
      qris_image_url: null,
      verification_message_template: `*VERIFIKASI PEMBAYARAN BARU KE GRUP*
    
Nama: {username}
Email: {email}
ID Transaksi: {transaction_id}
Paket: {plan_name}
Durasi: {duration} hari
Nominal: Rp {price}
Waktu: {datetime}

Balas pesan ini dengan angka:
*1* untuk *VERIFIKASI*
*2* untuk *TOLAK*`,
      whatsapp_enabled: false,
      max_pending_orders: 3
    });
    
    return res.status(200).json({
      message: "Pengaturan pembayaran berhasil direset ke default",
      settings: newSettings
    });
  } catch (error) {
    console.error("Error resetting payment settings:", error);
    return res.status(500).json({ error: "Terjadi kesalahan pada server" });
  }
};

  // Render WhatsApp status
  const renderWhatsAppStatus = () => {
    if (whatsappLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Memproses...</div>
        </div>
      );
    }
    
    let statusText = '';
    let statusColor = '';
    let statusAction = null;
    
    switch (whatsappStatus.status) {
      case 'disconnected':
        statusText = 'Terputus';
        statusColor = '#ff4d4f';
        statusAction = (
          <Button 
            type="primary" 
            onClick={initWhatsApp}
          >
            Inisialisasi WhatsApp
          </Button>
        );
        break;
      case 'qr':
        statusText = 'Menunggu Scan QR Code';
        statusColor = '#faad14';
        statusAction = (
          <Button 
            danger
            onClick={logoutWhatsApp}
          >
            Batalkan
          </Button>
        );
        break;
      case 'ready':
        statusText = 'Terhubung';
        statusColor = '#52c41a';
        statusAction = (
          <Button 
            danger
            onClick={logoutWhatsApp}
          >
            Logout
          </Button>
        );
        break;
      case 'authenticated':
        statusText = 'Terotentikasi';
        statusColor = '#1677ff';
        statusAction = (
          <Button 
            danger
            onClick={logoutWhatsApp}
          >
            Logout
          </Button>
        );
        break;
      case 'error':
        statusText = 'Error';
        statusColor = '#ff4d4f';
        statusAction = (
          <Button 
            type="primary" 
            onClick={initWhatsApp}
          >
            Coba Lagi
          </Button>
        );
        break;
      default:
        statusText = 'Tidak diketahui';
        statusColor = '#d9d9d9';
        statusAction = (
          <Button 
            type="primary" 
            onClick={initWhatsApp}
          >
            Inisialisasi WhatsApp
          </Button>
        );
    }
    
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Text strong>Status: </Text>
            <Text style={{ color: statusColor }}>{statusText}</Text>
          </div>
          {statusAction}
        </div>
        
        {whatsappStatus.status === 'ready' && (
          <Alert
            message="WhatsApp Terhubung"
            description={
              <div>
                <p>WhatsApp berhasil terhubung. Anda dapat menggunakan fitur notifikasi WhatsApp sekarang.</p>
                {whatsappStatus.adminGroupName ? (
                  <p><strong>Grup Admin:</strong> {whatsappStatus.adminGroupName}</p>
                ) : (
                  <p><strong>Grup Admin:</strong> Belum diatur</p>
                )}
                <Button 
                  type="primary"
                  icon={<GroupOutlined />}
                  onClick={openGroupModal}
                  style={{ marginTop: 8 }}
                >
                  {whatsappStatus.adminGroupName ? "Ubah Grup Admin" : "Pilih Grup Admin"}
                </Button>
              </div>
            }
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}
      </div>
    );
  };

  // If loading
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat pengaturan pembayaran...</div>
      </div>
    );
  }

  // Group modal columns
  const groupColumns = [
    {
      title: 'Nama Grup',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      render: text => (
        <Text copyable style={{ width: 200, display: 'inline-block' }}>{text}</Text>
      )
    },
    {
      title: 'Jumlah Peserta',
      dataIndex: 'participantsCount',
      key: 'participantsCount',
      sorter: (a, b) => a.participantsCount - b.participantsCount
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="primary" 
          onClick={() => handleSelectGroup(record)}
        >
          Pilih
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Pengaturan Pembayaran</Title>
      
      <Tabs defaultActiveKey="1">
        <TabPane 
          tab={
            <span>
              <QrcodeOutlined />
              Pengaturan QRIS
            </span>
          } 
          key="1"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={settings}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Card title="Pengaturan Umum" bordered={false}>
                  <Form.Item
                    name="payment_expiry_hours"
                    label="Batas Waktu Pembayaran (Jam)"
                    rules={[{ required: true, message: 'Harap masukkan batas waktu pembayaran' }]}
                  >
                    <InputNumber
                      min={1}
                      max={72}
                      style={{ width: '100%' }}
                      addonAfter="Jam"
                      placeholder="Contoh: 24"
                    />
                  </Form.Item>
                  
                  <Form.Item
                    name="max_pending_orders"
                    label="Maksimum Pesanan Tertunda per Pengguna"
                    rules={[{ required: true, message: 'Harap masukkan maksimum pesanan tertunda' }]}
                  >
                    <InputNumber
                      min={1}
                      max={10}
                      style={{ width: '100%' }}
                      addonAfter="Pesanan"
                      placeholder="Contoh: 3"
                    />
                  </Form.Item>
                  
                  {/* Hidden field for remove_qris_image flag */}
                  <Form.Item name="remove_qris_image" hidden>
                    <Input />
                  </Form.Item>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Kode QR Pembayaran (QRIS)" bordered={false}>
                  <Form.Item label="Gambar QRIS">
                    <Upload
                      listType="picture-card"
                      fileList={fileList}
                      onChange={handleQrisUpload}
                      beforeUpload={() => false} // Prevent auto upload
                      maxCount={1}
                      accept="image/*"
                    >
                      {fileList.length === 0 && (
                        <div>
                          <UploadOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>
                  
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    {qrisPreview ? (
                      <div>
                        <img 
                          src={qrisPreview} 
                          alt="QRIS Preview" 
                          style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                        />
                        <Button 
                          type="danger" 
                          icon={<DeleteOutlined />} 
                          onClick={handleRemoveQris} 
                          style={{ marginTop: 8 }}
                        >
                          Hapus QRIS
                        </Button>
                      </div>
                    ) : (
                      <div style={{ 
                        padding: '40px', 
                        background: '#f5f5f5', 
                        borderRadius: 4, 
                        textAlign: 'center'
                      }}>
                        <QrcodeOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />
                        <div>Gambar QRIS belum diupload</div>
                      </div>
                    )}
                  </div>
                </Card>
              </Col>
            </Row>
            
            <Card title="Template Pesan Verifikasi" bordered={false} style={{ marginTop: 16 }}>
  <Alert
    message="Informasi Variabel Template"
    description={
      <ul>
        <li><code>{"{username}"}</code> - Nama pengguna</li>
        <li><code>{"{email}"}</code> - Alamat email pengguna</li>
        <li><code>{"{transaction_id}"}</code> - ID transaksi</li>
        <li><code>{"{plan_name}"}</code> - Nama paket langganan</li>
        <li><code>{"{duration}"}</code> - Durasi paket langganan (hari)</li>
        <li><code>{"{price}"}</code> - Harga paket langganan</li>
        <li><code>{"{datetime}"}</code> - Tanggal dan waktu saat ini</li>
      </ul>
    }
    type="info"
    showIcon
  />
  
  <Form.Item
    name="verification_message_template"
    label="Template Pesan Verifikasi (ke Grup Admin)"
    rules={[{ required: true, message: 'Harap masukkan template pesan verifikasi' }]}
  >
    <TextArea rows={8} placeholder="Template pesan verifikasi" />
  </Form.Item>
</Card>
            
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <Space>
                <Button 
                  onClick={resetSettings}
                  icon={<ReloadOutlined />}
                >
                  Reset ke Default
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saveLoading}
                >
                  Simpan Pengaturan
                </Button>
              </Space>
            </div>
          </Form>
        </TabPane>
        
        <TabPane
          tab={
            <span>
              <WhatsAppOutlined />
              Konfigurasi WhatsApp
            </span>
          }
          key="2"
        >
          <Card title="Status WhatsApp" bordered={false}>
            {renderWhatsAppStatus()}
          </Card>
          
          <Card title="Kirim Pesan Uji" bordered={false} style={{ marginTop: 16 }}>
            {whatsappStatus.status === 'ready' ? (
              <div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Nomor Telepon:</Text>
                      <Input
                        placeholder="Contoh: 081234567890"
                        addonBefore="+62"
                        value={whatsappTestMessage.phone}
                        onChange={(e) => setWhatsappTestMessage({ ...whatsappTestMessage, phone: e.target.value })}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  </Col>
                  <Col span={12}>
                    <div style={{ marginBottom: 16 }}>
                      <Text strong>Pesan:</Text>
                      <TextArea
                        placeholder="Masukkan pesan uji"
                        rows={4}
                        value={whatsappTestMessage.message}
                        onChange={(e) => setWhatsappTestMessage({ ...whatsappTestMessage, message: e.target.value })}
                        style={{ marginTop: 8 }}
                      />
                    </div>
                  </Col>
                </Row>
                
                <Button
                  type="primary"
                  onClick={sendTestMessage}
                  disabled={!whatsappTestMessage.phone || !whatsappTestMessage.message}
                  loading={whatsappLoading}
                >
                  Kirim Pesan Uji
                </Button>
              </div>
            ) : (
              <Alert
                message="WhatsApp Belum Terhubung"
                description="Silakan hubungkan WhatsApp terlebih dahulu sebelum mengirim pesan uji."
                type="warning"
                showIcon
              />
            )}
          </Card>
          
          <Card title="Status Fitur WhatsApp" bordered={false} style={{ marginTop: 16 }}>
            <Form
              initialValues={{
                whatsapp_enabled: settings?.whatsapp_enabled || false
              }}
              onFinish={(values) => handleSave({ ...form.getFieldsValue(), whatsapp_enabled: values.whatsapp_enabled })}
            >
              <Form.Item
                name="whatsapp_enabled"
                label="Aktifkan Fitur WhatsApp"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Aktif" 
                  unCheckedChildren="Nonaktif"
                  disabled={whatsappStatus.status !== 'ready' || !whatsappStatus.adminGroupName}
                />
              </Form.Item>
              
              {whatsappStatus.status === 'ready' && !whatsappStatus.adminGroupName && (
                <Alert
                  message="Grup Admin Belum Diatur"
                  description="Silakan atur grup admin terlebih dahulu sebelum mengaktifkan fitur WhatsApp."
                  type="warning"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={saveLoading}
                  disabled={whatsappStatus.status !== 'ready' || !whatsappStatus.adminGroupName}
                >
                  Simpan Status
                </Button>
              </Form.Item>
            </Form>
            
            {whatsappStatus.status !== 'ready' && (
              <Alert
                message="WhatsApp Belum Terhubung"
                description="Silakan hubungkan WhatsApp terlebih dahulu sebelum mengaktifkan fitur WhatsApp."
                type="warning"
                showIcon
              />
            )}
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Modal untuk memilih grup WhatsApp */}
      <Modal
        title="Pilih Grup Admin"
        open={groupModalVisible}
        onCancel={() => setGroupModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setGroupModalVisible(false)}>
            Batal
          </Button>,
          <Button
            key="submit"
            type="primary"
            onClick={confirmSetAdminGroup}
            disabled={!selectedGroup}
            loading={whatsappLoading}
          >
            Konfirmasi
          </Button>
        ]}
        width={800}
      >
        {groupsLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin />
            <div style={{ marginTop: 16 }}>Memuat daftar grup...</div>
          </div>
        ) : (
          <>
            <Alert
              message="Pilih Grup"
              description="Pilih grup WhatsApp yang akan dijadikan sebagai grup admin untuk menerima notifikasi pembayaran."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            {whatsappGroups.length === 0 ? (
              <Empty description="Tidak ada grup WhatsApp yang tersedia" />
            ) : (
              <>
                {selectedGroup && (
                  <Alert
                    message="Grup Terpilih"
                    description={`${selectedGroup.name} (${selectedGroup.id})`}
                    type="success"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}
                
                <Table
                  dataSource={whatsappGroups}
                  columns={groupColumns}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                  rowClassName={(record) => record.id === selectedGroup?.id ? 'ant-table-row-selected' : ''}
                  onRow={(record) => ({
                    onClick: () => handleSelectGroup(record),
                    style: { cursor: 'pointer' }
                  })}
                />
              </>
            )}
            
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchWhatsappGroups}
                loading={groupsLoading}
              >
                Refresh Daftar Grup
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default PaymentSettings;