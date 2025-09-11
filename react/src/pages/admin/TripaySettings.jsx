import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Switch, Divider, Typography, message, Spin, Alert, Space, Table, Tag } from 'antd';
import { SaveOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;

const TripaySettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tripayEnabled, setTripayEnabled] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [paymentChannels, setPaymentChannels] = useState([]);
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        // Ambil status Tripay
        const statusResponse = await axiosInstance.get('/api/settings/tripay-status');
        setTripayEnabled(statusResponse.data.enabled);
        
        // Set default values for form
        form.setFieldsValue({
          tripay_enabled: statusResponse.data.enabled,
          tripay_api_key: '********',
          tripay_private_key: '********',
          tripay_merchant_code: '********',
        });
        
        // Get available payment channels if Tripay is enabled
        if (statusResponse.data.enabled) {
          try {
            const channelsResponse = await axiosInstance.get('/api/tripay/payment-channels');
            setPaymentChannels(channelsResponse.data);
          } catch (err) {
            console.error('Error fetching payment channels:', err);
            message.warning('Gagal memuat daftar metode pembayaran dari Tripay');
          }
        }
      } catch (err) {
        console.error('Error fetching Tripay settings:', err);
        message.error('Gagal memuat pengaturan Tripay');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [form]);
  
  const handleSave = async (values) => {
    try {
      setSaving(true);
      
      // Update Tripay status
      await axiosInstance.post('/api/settings/tripay', {
        tripay_enabled: values.tripay_enabled,
        tripay_api_key: values.tripay_api_key !== '********' ? values.tripay_api_key : undefined,
        tripay_private_key: values.tripay_private_key !== '********' ? values.tripay_private_key : undefined,
        tripay_merchant_code: values.tripay_merchant_code !== '********' ? values.tripay_merchant_code : undefined,
      });
      
      setTripayEnabled(values.tripay_enabled);
      message.success('Pengaturan Tripay berhasil disimpan');
      
      // If Tripay was enabled, fetch payment channels
      if (values.tripay_enabled) {
        try {
          const channelsResponse = await axiosInstance.get('/api/tripay/payment-channels');
          setPaymentChannels(channelsResponse.data);
        } catch (err) {
          console.error('Error fetching payment channels:', err);
        }
      }
    } catch (err) {
      console.error('Error saving Tripay settings:', err);
      message.error('Gagal menyimpan pengaturan Tripay');
    } finally {
      setSaving(false);
    }
  };
  
  const testConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      
      // Test connection to Tripay
      const response = await axiosInstance.get('/api/tripay/payment-channels');
      
      setPaymentChannels(response.data);
      setTestResult({
        success: true,
        message: 'Koneksi ke Tripay berhasil',
        data: response.data
      });
      
      message.success('Koneksi ke Tripay berhasil');
    } catch (err) {
      console.error('Error testing Tripay connection:', err);
      
      setTestResult({
        success: false,
        message: 'Koneksi ke Tripay gagal',
        error: err.response?.data?.message || err.message
      });
      
      message.error('Koneksi ke Tripay gagal: ' + (err.response?.data?.message || err.message));
    } finally {
      setTesting(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat pengaturan Tripay...</div>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={2}>Pengaturan Tripay</Title>
      
      <Card title="Konfigurasi API Tripay" style={{ marginBottom: 20 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            tripay_enabled: true,
            tripay_api_key: '',
            tripay_private_key: '',
            tripay_merchant_code: '',
          }}
        >
          <Form.Item
            name="tripay_enabled"
            label="Aktifkan Tripay"
            valuePropName="checked"
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
          </Form.Item>
          
          <Form.Item
            name="tripay_api_key"
            label="API Key"
            rules={[{ required: true, message: 'API Key diperlukan' }]}
          >
            <Input.Password placeholder="Masukkan API Key dari dashboard Tripay" />
          </Form.Item>
          
          <Form.Item
            name="tripay_private_key"
            label="Private Key"
            rules={[{ required: true, message: 'Private Key diperlukan' }]}
          >
            <Input.Password placeholder="Masukkan Private Key dari dashboard Tripay" />
          </Form.Item>
          
          <Form.Item
            name="tripay_merchant_code"
            label="Kode Merchant"
            rules={[{ required: true, message: 'Kode Merchant diperlukan' }]}
          >
            <Input placeholder="Masukkan Kode Merchant dari dashboard Tripay" />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Simpan Pengaturan
              </Button>
              
              <Button 
                onClick={testConnection} 
                icon={<ReloadOutlined />}
                loading={testing}
                disabled={!tripayEnabled}
              >
                Tes Koneksi
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        {testResult && (
          <Alert
            message={testResult.success ? "Koneksi Berhasil" : "Koneksi Gagal"}
            description={testResult.message}
            type={testResult.success ? "success" : "error"}
            showIcon
          />
        )}
      </Card>
      
      <Card title="Metode Pembayaran Tersedia">
        {!tripayEnabled ? (
          <Alert message="Tripay sedang dinonaktifkan. Aktifkan Tripay untuk melihat metode pembayaran yang tersedia." type="warning" showIcon />
        ) : paymentChannels.length === 0 ? (
          <Alert message="Tidak ada metode pembayaran yang tersedia. Periksa konfigurasi Tripay Anda." type="info" showIcon />
        ) : (
          <Table
            dataSource={paymentChannels}
            rowKey="code"
            columns={[
              {
                title: 'Kode',
                dataIndex: 'code',
                key: 'code',
              },
              {
                title: 'Nama',
                dataIndex: 'name',
                key: 'name',
              },
              {
                title: 'Tipe',
                dataIndex: 'group',
                key: 'group',
                render: (group) => {
                  let color;
                  switch (group) {
                    case 'Virtual Account':
                      color = 'blue';
                      break;
                    case 'Convenience Store':
                      color = 'green';
                      break;
                    case 'E-Wallet':
                      color = 'purple';
                      break;
                    case 'QRIS':
                      color = 'gold';
                      break;
                    default:
                      color = 'default';
                  }
                  return <Tag color={color}>{group}</Tag>;
                }
              },
              {
                title: 'Fee Customer',
                dataIndex: 'fee_customer',
                key: 'fee_customer',
                render: (fee) => `Rp ${fee.toLocaleString('id-ID')}`,
              },
              {
                title: 'Status',
                dataIndex: 'active',
                key: 'active',
                render: (active) => (
                  active ? 
                    <Tag icon={<CheckCircleOutlined />} color="success">Aktif</Tag> : 
                    <Tag icon={<CloseCircleOutlined />} color="error">Nonaktif</Tag>
                ),
                filters: [
                  { text: 'Aktif', value: true },
                  { text: 'Nonaktif', value: false },
                ],
                onFilter: (value, record) => record.active === value,
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
    </div>
  );
};

export default TripaySettings;