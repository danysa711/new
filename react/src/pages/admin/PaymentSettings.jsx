import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, Spin, 
  Divider, Switch, Alert, Descriptions, Tabs, Table,
  Space, Tag, Modal, Row, Col, Upload, Tooltip, Popconfirm, Select
} from 'antd';
import { 
  SaveOutlined, ReloadOutlined, PlusOutlined, EditOutlined, 
  DeleteOutlined, BankOutlined, WalletOutlined, QrcodeOutlined,
  UploadOutlined, CreditCardOutlined, SettingOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const PaymentSettings = () => {
  const [form] = Form.useForm();
  const [manualForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [tripayEnabled, setTripayEnabled] = useState(true);
  const [manualPaymentMethods, setManualPaymentMethods] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMethod, setEditingMethod] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Ambil pengaturan dari backend/localStorage
  useEffect(() => {
    const fetchSettings = async () => {
  try {
    setLoadingSettings(true);
    
    // Ambil pengaturan Tripay
    const tripayResponse = await axiosInstance.get('/api/settings/tripay');
    const tripaySettings = tripayResponse.data;
    
    // Ambil metode pembayaran manual
    const manualResponse = await axiosInstance.get('/api/payment-methods/manual');
    const manualMethods = manualResponse.data;
    
    // Set state
    setTripayEnabled(tripaySettings.tripay_enabled);
    setManualPaymentMethods(manualMethods);
    
    // Set form fields
    form.setFieldsValue({
      tripay_enabled: tripaySettings.tripay_enabled,
      api_key: tripaySettings.api_key,
      private_key: tripaySettings.private_key,
      merchant_code: tripaySettings.merchant_code,
      sandbox_mode: tripaySettings.sandbox_mode,
      callback_url: window.location.origin + '/api/tripay/callback'
    });
    
    setLoadingSettings(false);
  } catch (error) {
    console.error('Error loading payment settings:', error);
    message.error('Gagal memuat pengaturan pembayaran');
    setLoadingSettings(false);
  }
};

// Ganti simpan pengaturan Tripay
const handleSaveTripaySettings = async (values) => {
  try {
    setLoading(true);
    
    // Simpan ke API
    await axiosInstance.post('/api/settings/tripay', values);
    
    setTripayEnabled(values.tripay_enabled);
    message.success('Pengaturan Tripay berhasil disimpan');
    setLoading(false);
  } catch (error) {
    console.error('Error saving Tripay settings:', error);
    message.error('Gagal menyimpan pengaturan Tripay');
    setLoading(false);
  }
};

// Ganti simpan metode pembayaran manual
const handleSavePaymentMethod = async () => {
  try {
    await manualForm.validateFields();
    const values = manualForm.getFieldsValue();
    
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
  } catch (error) {
    console.error('Error saving payment method:', error);
    message.error('Gagal menyimpan metode pembayaran');
  }
};

    fetchSettings();
  }, [form]);

  // Simpan pengaturan Tripay
  const handleSaveTripaySettings = async (values) => {
    try {
      setLoading(true);
      
      // Simpan ke localStorage untuk demo
      localStorage.setItem('tripay_enabled', values.tripay_enabled.toString());
      setTripayEnabled(values.tripay_enabled);
      
      // Simulasi
      setTimeout(() => {
        message.success('Pengaturan Tripay berhasil disimpan');
        setLoading(false);
      }, 1000);
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
      
      // Simulasi tes koneksi
      setTimeout(() => {
        setTestResult({
          success: true,
          message: 'Koneksi ke Tripay berhasil!',
          merchantName: 'PT Demo Merchant',
          environment: form.getFieldValue('sandbox_mode') ? 'Sandbox' : 'Production'
        });
        setTestLoading(false);
      }, 2000);
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
      
      if (editingMethod) {
        // Update metode yang sudah ada
        const updatedMethods = manualPaymentMethods.map(method => 
          method.id === editingMethod.id ? { ...method, ...values } : method
        );
        setManualPaymentMethods(updatedMethods);
        
        // Simpan ke localStorage
        localStorage.setItem('manual_payment_methods', JSON.stringify(updatedMethods));
      } else {
        // Tambah metode baru
        const newMethod = {
          id: Date.now().toString(),
          ...values
        };
        const newMethods = [...manualPaymentMethods, newMethod];
        setManualPaymentMethods(newMethods);
        
        // Simpan ke localStorage
        localStorage.setItem('manual_payment_methods', JSON.stringify(newMethods));
      }
      
      message.success(`Metode pembayaran berhasil ${editingMethod ? 'diperbarui' : 'ditambahkan'}`);
      setModalVisible(false);
    } catch (error) {
      console.error('Error saving payment method:', error);
      message.error('Gagal menyimpan metode pembayaran');
    }
  };

  // Hapus metode pembayaran manual
  const handleDeletePaymentMethod = (id) => {
    const updatedMethods = manualPaymentMethods.filter(method => method.id !== id);
    setManualPaymentMethods(updatedMethods);
    localStorage.setItem('manual_payment_methods', JSON.stringify(updatedMethods));
    message.success('Metode pembayaran berhasil dihapus');
  };

  // Toggle status aktif metode pembayaran
  const togglePaymentMethodStatus = (id) => {
    const updatedMethods = manualPaymentMethods.map(method => 
      method.id === id ? { ...method, isActive: !method.isActive } : method
    );
    setManualPaymentMethods(updatedMethods);
    localStorage.setItem('manual_payment_methods', JSON.stringify(updatedMethods));
    message.success('Status metode pembayaran berhasil diperbarui');
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
        <Tag color={isActive ? 'success' : 'error'}>
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
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => showPaymentMethodModal(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title={record.isActive ? 'Nonaktifkan' : 'Aktifkan'}>
            <Button 
              icon={record.isActive ? <DeleteOutlined /> : <ReloadOutlined />}
              onClick={() => togglePaymentMethodStatus(record.id)}
              type={record.isActive ? 'default' : 'primary'}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Hapus">
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
          </Tooltip>
        </Space>
      )
    }
  ];

  if (loadingSettings) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Memuat pengaturan pembayaran...</div>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Pengaturan Pembayaran</Title>
      
      <Tabs defaultActiveKey="tripay">
        <TabPane tab="Tripay" key="tripay">
          <Card>
            <div style={{ marginBottom: 20 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleSaveTripaySettings}
                initialValues={{
                  tripay_enabled: tripayEnabled,
                  sandbox_mode: true
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
                      icon={<ReloadOutlined />}
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
                      
                      <Descriptions title="Detail Merchant" bordered size="small">
                        <Descriptions.Item label="Nama Merchant" span={3}>
                          {testResult.merchantName}
                        </Descriptions.Item>
                        <Descriptions.Item label="Lingkungan" span={3}>
                          {testResult.environment}
                        </Descriptions.Item>
                      </Descriptions>
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
            />
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Modal Tambah/Edit Metode Pembayaran */}
      <Modal
        title={`${editingMethod ? 'Edit' : 'Tambah'} Metode Pembayaran`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Batal
          </Button>,
          <Button key="save" type="primary" onClick={handleSavePaymentMethod}>
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
              <Select.Option value="bank">Bank Transfer</Select.Option>
              <Select.Option value="qris">QRIS</Select.Option>
              <Select.Option value="ewallet">E-Wallet</Select.Option>
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
                      <Upload listType="picture-card">
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      </Upload>
                      <Text type="secondary">
                        * Upload tidak berfungsi dalam versi demo
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

export default PaymentSettings;