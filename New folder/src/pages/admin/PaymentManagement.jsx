import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Tabs, Form, Input, Button, 
  Space, Switch, Table, Tag, Modal, Popconfirm, 
  Upload, message, Select, Divider, Alert
} from 'antd';
import { 
  BankOutlined, WalletOutlined, QrcodeOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined,
  UploadOutlined, SaveOutlined, CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

const PaymentManagement = () => {
  const [form] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [tripayEnabled, setTripayEnabled] = useState(false);
  const [manualPaymentMethods, setManualPaymentMethods] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [tripayApiKey, setTripayApiKey] = useState('');
  const [tripayPrivateKey, setTripayPrivateKey] = useState('');
  const [tripayMerchantCode, setTripayMerchantCode] = useState('');
  const [tripayCallbackUrl, setTripayCallbackUrl] = useState('');
  const [tripaySandboxMode, setTripaySandboxMode] = useState(true);

  // Ambil pengaturan dari backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        
        // Ambil pengaturan Tripay
        const tripayResponse = await axiosInstance.get('/api/settings/tripay-status');
        setTripayEnabled(tripayResponse.data.enabled);
        
        // Ambil data API Tripay jika tersedia
        try {
          const tripayConfigResponse = await axiosInstance.get('/api/tripay/config');
          if (tripayConfigResponse.data) {
            setTripayApiKey(tripayConfigResponse.data.api_key || '');
            setTripayPrivateKey(tripayConfigResponse.data.private_key || '');
            setTripayMerchantCode(tripayConfigResponse.data.merchant_code || '');
            setTripaySandboxMode(tripayConfigResponse.data.sandbox_mode || true);
            
            // Set callback URL
            const hostname = window.location.origin;
            setTripayCallbackUrl(`${hostname}/api/tripay/callback`);
          }
        } catch (configError) {
          console.error('Error fetching Tripay config:', configError);
          // Set callback URL meskipun config gagal diambil
          const hostname = window.location.origin;
          setTripayCallbackUrl(`${hostname}/api/tripay/callback`);
        }
        
        // Ambil metode pembayaran manual
        const manualResponse = await axiosInstance.get('/api/payment-methods/manual');
        setManualPaymentMethods(manualResponse.data);
        
        // Isi form dengan data yang ada
        form.setFieldsValue({
          tripay_enabled: tripayResponse.data.enabled,
          api_key: tripayApiKey,
          private_key: tripayPrivateKey,
          merchant_code: tripayMerchantCode,
          sandbox_mode: tripaySandboxMode,
          callback_url: tripayCallbackUrl
        });
        
        setLoadingSettings(false);
      } catch (error) {
        console.error('Error loading payment settings:', error);
        message.error('Gagal memuat pengaturan pembayaran');
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [form]);

  // Simpan pengaturan Tripay
  const handleSaveTripaySettings = async (values) => {
    try {
      setLoading(true);
      
      // Simpan ke API
      await axiosInstance.post('/api/settings/tripay', {
        tripay_enabled: values.tripay_enabled,
        api_key: values.api_key,
        private_key: values.private_key,
        merchant_code: values.merchant_code,
        sandbox_mode: values.sandbox_mode || false
      });
      
      setTripayEnabled(values.tripay_enabled);
      setTripayApiKey(values.api_key);
      setTripayPrivateKey(values.private_key);
      setTripayMerchantCode(values.merchant_code);
      setTripaySandboxMode(values.sandbox_mode);
      
      message.success('Pengaturan Tripay berhasil disimpan');
      setLoading(false);
    } catch (error) {
      console.error('Error saving Tripay settings:', error);
      message.error('Gagal menyimpan pengaturan Tripay');
      setLoading(false);
    }
  };

  // Tes koneksi Tripay
  const handleTestTripayConnection = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);
      
      const values = form.getFieldsValue();
      
      // Kirim request ke API untuk tes koneksi
      const response = await axiosInstance.post('/api/tripay/test-connection', {
        api_key: values.api_key,
        private_key: values.private_key,
        merchant_code: values.merchant_code,
        sandbox_mode: values.sandbox_mode
      });
      
      if (response.data.success) {
        setTestResult({
          success: true,
          message: response.data.message || 'Koneksi ke Tripay berhasil!',
          merchantName: response.data.merchantName || 'Merchant Anda',
          environment: values.sandbox_mode ? 'Sandbox' : 'Production'
        });
      } else {
        setTestResult({
          success: false,
          message: response.data.message || 'Koneksi ke Tripay gagal.',
          error: response.data.error || 'Silakan periksa pengaturan Anda.'
        });
      }
      
      setTestLoading(false);
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Koneksi ke Tripay gagal. Periksa pengaturan Anda.',
        error: error.response?.data?.message || error.message
      });
      setTestLoading(false);
    }
  };

  // Tampilkan modal tambah/edit metode pembayaran manual
  const showPaymentMethodModal = (method = null) => {
    setEditingMethod(method);
    
    if (method) {
      manualForm.setFieldsValue({
        name: method.name,
        type: method.type,
        accountNumber: method.accountNumber,
        accountName: method.accountName,
        instructions: method.instructions,
        qrImageUrl: method.qrImageUrl,
        isActive: method.isActive
      });
    } else {
      manualForm.resetFields();
      manualForm.setFieldsValue({
        isActive: true
      });
    }
    
    setModalVisible(true);
  };

  // Simpan metode pembayaran manual
  const handleSavePaymentMethod = async () => {
    try {
      await manualForm.validateFields();
      const values = manualForm.getFieldsValue();
      
      setLoading(true);
      
      if (editingMethod) {
        // Update metode yang sudah ada
        await axiosInstance.put(`/api/payment-methods/${editingMethod.id}`, values);
        message.success('Metode pembayaran berhasil diperbarui');
      } else {
        // Tambah metode baru
        await axiosInstance.post('/api/payment-methods', values);
        message.success('Metode pembayaran berhasil ditambahkan');
      }
      
      // Refresh daftar metode pembayaran
      const response = await axiosInstance.get('/api/payment-methods/manual');
      setManualPaymentMethods(response.data);
      
      setModalVisible(false);
      setLoading(false);
    } catch (error) {
      console.error('Error saving payment method:', error);
      message.error('Gagal menyimpan metode pembayaran');
      setLoading(false);
    }
  };

  // Hapus metode pembayaran manual
  const handleDeletePaymentMethod = async (id) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/payment-methods/${id}`);
      
      message.success('Metode pembayaran berhasil dihapus');
      
      // Refresh daftar metode pembayaran
      const response = await axiosInstance.get('/api/payment-methods/manual');
      setManualPaymentMethods(response.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error deleting payment method:', error);
      message.error('Gagal menghapus metode pembayaran');
      setLoading(false);
    }
  };

  // Toggle status aktif metode pembayaran
  const togglePaymentMethodStatus = async (id, currentStatus) => {
    try {
      setLoading(true);
      
      await axiosInstance.put(`/api/payment-methods/${id}`, {
        isActive: !currentStatus
      });
      
      message.success(`Metode pembayaran berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      
      // Refresh daftar metode pembayaran
      const response = await axiosInstance.get('/api/payment-methods/manual');
      setManualPaymentMethods(response.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      message.error('Gagal mengubah status metode pembayaran');
      setLoading(false);
    }
  };

  // Kolom tabel metode pembayaran manual
  const manualPaymentColumns = [
    {
      title: 'Nama Metode',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Tipe',
      dataIndex: 'type',
      key: 'type',
      render: (type) => {
        let color = 'default';
        let icon = null;
        let text = type;
        
        if (type === 'bank') {
          color = 'blue';
          icon = <BankOutlined />;
          text = 'Bank Transfer';
        } else if (type === 'qris') {
          color = 'green';
          icon = <QrcodeOutlined />;
          text = 'QRIS';
        } else if (type === 'ewallet') {
          color = 'purple';
          icon = <WalletOutlined />;
          text = 'E-Wallet';
        }
        
        return (
          <Tag color={color} icon={icon}>
            {text}
          </Tag>
        );
      },
      filters: [
        { text: 'Bank Transfer', value: 'bank' },
        { text: 'QRIS', value: 'qris' },
        { text: 'E-Wallet', value: 'ewallet' }
      ],
      onFilter: (value, record) => record.type === value
    },
    {
      title: 'Nomor Rekening/Akun',
      dataIndex: 'accountNumber',
      key: 'accountNumber',
      render: (text, record) => {
        if (record.type === 'qris') {
          return '-';
        }
        return text || '-';
      }
    },
    {
      title: 'Nama Pemilik',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (text, record) => {
        if (record.type === 'qris') {
          return '-';
        }
        return text || '-';
      }
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'AKTIF' : 'NONAKTIF'}
        </Tag>
      ),
      filters: [
        { text: 'Aktif', value: true },
        { text: 'Nonaktif', value: false }
      ],
      onFilter: (value, record) => record.isActive === value
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showPaymentMethodModal(record)}
            size="small"
          />
          <Button 
            icon={record.isActive ? <CloseCircleOutlined /> : <CheckCircleOutlined />}
            onClick={() => togglePaymentMethodStatus(record.id, record.isActive)}
            type={record.isActive ? 'default' : 'primary'}
            size="small"
          />
          <Popconfirm 
            title="Yakin ingin menghapus metode pembayaran ini?"
            onConfirm={() => handleDeletePaymentMethod(record.id)}
            okText="Ya"
            cancelText="Batal"
          >
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loadingSettings) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <div className="ant-spin ant-spin-lg ant-spin-spinning">
          <span className="ant-spin-dot">
            <i className="ant-spin-dot-item"></i>
            <i className="ant-spin-dot-item"></i>
            <i className="ant-spin-dot-item"></i>
            <i className="ant-spin-dot-item"></i>
          </span>
        </div>
        <div style={{ marginTop: 16 }}>Memuat pengaturan pembayaran...</div>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Pengaturan Pembayaran</Title>
      
      <Tabs defaultActiveKey="tripay">
        <TabPane tab="Tripay" key="tripay" forceRender>
          <Card>
            <div style={{ marginBottom: 20 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveTripaySettings}
                initialValues={{
                  tripay_enabled: tripayEnabled,
                  api_key: tripayApiKey,
                  private_key: tripayPrivateKey,
                  merchant_code: tripayMerchantCode,
                  sandbox_mode: tripaySandboxMode,
                  callback_url: tripayCallbackUrl
                }}
              >
                <Form.Item
                  name="tripay_enabled"
                  label="Status Tripay"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="Aktif" 
                    unCheckedChildren="Nonaktif"
                  />
                </Form.Item>
                
                <Alert
                  message={tripayEnabled ? "Tripay Aktif" : "Tripay Nonaktif"}
                  description={tripayEnabled 
                    ? "Pembayaran melalui Tripay tersedia untuk pelanggan" 
                    : "Pembayaran melalui Tripay tidak tersedia untuk pelanggan"}
                  type={tripayEnabled ? "success" : "warning"}
                  showIcon
                  style={{ marginBottom: 20 }}
                />
                
                <Divider />
                
                <Form.Item
                  name="api_key"
                  label="API Key"
                  rules={[{ required: true, message: 'API Key diperlukan' }]}
                >
                  <Input.Password placeholder="Masukkan API Key dari Tripay" disabled={!tripayEnabled} />
                </Form.Item>
                
                <Form.Item
                  name="private_key"
                  label="Private Key"
                  rules={[{ required: true, message: 'Private Key diperlukan' }]}
                >
                  <Input.Password placeholder="Masukkan Private Key dari Tripay" disabled={!tripayEnabled} />
                </Form.Item>
                
                <Form.Item
                  name="merchant_code"
                  label="Kode Merchant"
                  rules={[{ required: true, message: 'Kode Merchant diperlukan' }]}
                >
                  <Input placeholder="Masukkan Kode Merchant dari Tripay" disabled={!tripayEnabled} />
                </Form.Item>
                
                <Form.Item
                  name="callback_url"
                  label="URL Callback"
                >
                  <Input disabled />
                </Form.Item>
                
                <Form.Item
                  name="sandbox_mode"
                  label="Mode Sandbox"
                  valuePropName="checked"
                >
                  <Switch disabled={!tripayEnabled} />
                </Form.Item>
                
                <Form.Item>
                  <Space>
                    <Button 
                      type="primary" 
                      htmlType="submit" 
                      icon={<SaveOutlined />} 
                      loading={loading}
                    >
                      Simpan Pengaturan
                    </Button>
                    
                    <Button 
                      onClick={handleTestTripayConnection} 
                      icon={<CheckCircleOutlined />}
                      loading={testLoading}
                      disabled={!tripayEnabled}
                    >
                      Tes Koneksi
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
              
              {testResult && (
                <>
                  <Divider />
                  {testResult.success ? (
                    <>
                      <Alert
                        message="Koneksi Berhasil"
                        description={testResult.message}
                        type="success"
                        showIcon
                        style={{ marginBottom: 16 }}
                      />
                      
                      <Card title="Detail Merchant" size="small">
                        <p><strong>Nama Merchant:</strong> {testResult.merchantName}</p>
                        <p><strong>Lingkungan:</strong> {testResult.environment}</p>
                      </Card>
                    </>
                  ) : (
                    <Alert
                      message="Koneksi Gagal"
                      description={testResult.message}
                      type="error"
                      showIcon
                    />
                  )}
                </>
              )}
            </div>
          </Card>
        </TabPane>
        
        <TabPane tab="Pembayaran Manual" key="manual">
          <Card
            title="Metode Pembayaran Manual"
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />} 
                onClick={() => showPaymentMethodModal()}
              >
                Tambah Metode
              </Button>
            }
          >
            <Table
              dataSource={manualPaymentMethods}
              columns={manualPaymentColumns}
              rowKey="id"
              pagination={false}
              loading={loading}
            />
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Modal Tambah/Edit Metode Pembayaran */}
      <Modal
        title={`${editingMethod ? 'Edit' : 'Tambah'} Metode Pembayaran`}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Batal
          </Button>,
          <Button key="save" type="primary" onClick={handleSavePaymentMethod} loading={loading}>
            Simpan
          </Button>
        ]}
      >
        <Form
          form={manualForm}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="Nama Metode Pembayaran"
            rules={[{ required: true, message: 'Nama metode pembayaran diperlukan' }]}
          >
            <Input placeholder="Contoh: Transfer Bank BCA, DANA, dll." />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Tipe Pembayaran"
            rules={[{ required: true, message: 'Tipe pembayaran diperlukan' }]}
          >
            <Select placeholder="Pilih tipe pembayaran">
              <Option value="bank">Bank Transfer</Option>
              <Option value="qris">QRIS</Option>
              <Option value="ewallet">E-Wallet</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              
              if (type === 'qris') {
                return (
                  <>
                    <Form.Item
                      name="qrImageUrl"
                      label="URL Gambar QR"
                      rules={[{ required: true, message: 'URL gambar QR diperlukan' }]}
                    >
                      <Input placeholder="Masukkan URL gambar kode QR" />
                    </Form.Item>
                    
                    <Form.Item label="Upload QR Code">
                      <Upload 
                        listType="picture-card"
                        beforeUpload={(file) => {
                          // Hanya tampilkan preview, tidak ada upload
                          const reader = new FileReader();
                          reader.onload = () => {
                            // Untuk demo, kita bisa membaca file sebagai URL
                            // Dalam implementasi sebenarnya, upload file ke server dan dapatkan URL
                            // manualForm.setFieldsValue({ qrImageUrl: reader.result });
                          };
                          reader.readAsDataURL(file);
                          return false; // Mencegah upload
                        }}
                      >
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      </Upload>
                      <Text type="secondary">
                        * Upload tidak berfungsi dalam versi demo. Silakan masukkan URL gambar QR secara manual.
                      </Text>
                    </Form.Item>
                  </>
                );
              }
              
              if (type === 'bank' || type === 'ewallet') {
                return (
                  <>
                    <Form.Item
                      name="accountNumber"
                      label={type === 'bank' ? 'Nomor Rekening' : 'Nomor Akun'}
                      rules={[{ required: true, message: 'Nomor rekening/akun diperlukan' }]}
                    >
                      <Input placeholder={type === 'bank' ? 'Contoh: 1234567890' : 'Contoh: 081234567890'} />
                    </Form.Item>
                    
                    <Form.Item
                      name="accountName"
                      label="Nama Pemilik"
                      rules={[{ required: true, message: 'Nama pemilik rekening/akun diperlukan' }]}
                    >
                      <Input placeholder="Contoh: PT Demo Store" />
                    </Form.Item>
                  </>
                );
              }
              
              return null;
            }}
          </Form.Item>
          
          <Form.Item
            name="instructions"
            label="Instruksi Pembayaran"
          >
            <TextArea 
              rows={4} 
              placeholder="Masukkan instruksi pembayaran untuk pelanggan" 
            />
          </Form.Item>
          
          <Form.Item
            name="isActive"
            label="Status"
            valuePropName="checked"
          >
            <Switch 
              checkedChildren="Aktif" 
              unCheckedChildren="Nonaktif" 
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentManagement;