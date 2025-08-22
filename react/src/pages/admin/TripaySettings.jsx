import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, Spin, 
  Divider, Switch, Alert, Descriptions
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;

const TripaySettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Simulasi mendapatkan pengaturan dari backend
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        // Dalam implementasi sebenarnya, Anda akan mengambil dari API
        // const response = await axiosInstance.get('/api/tripay/settings');
        
        // Simulasi data
        setTimeout(() => {
          form.setFieldsValue({
            api_key: '****************************************',
            private_key: '****************************************',
            merchant_code: 'T*****',
            sandbox_mode: true,
            callback_url: 'https://www.db.kinterstore.my.id/api/tripay/callback'
          });
          
          setLoadingSettings(false);
        }, 1000);
      } catch (error) {
        message.error('Gagal memuat pengaturan');
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [form]);

  const handleSaveSettings = async (values) => {
    try {
      setLoading(true);
      
      // Dalam implementasi sebenarnya, Anda akan mengirim ke API
      // await axiosInstance.post('/api/tripay/settings', values);
      
      // Simulasi
      setTimeout(() => {
        message.success('Pengaturan berhasil disimpan');
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Gagal menyimpan pengaturan');
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);
      
      // Dalam implementasi sebenarnya, Anda akan menguji koneksi ke API Tripay
      // const response = await axiosInstance.post('/api/tripay/test-connection');
      
      // Simulasi
      setTimeout(() => {
        setTestResult({
          success: true,
          message: 'Koneksi ke Tripay berhasil!',
          merchantName: 'PT Demo Merchant',
          environment: 'Sandbox'
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

  return (
    <div>
      <Title level={2}>Pengaturan Tripay</Title>
      
      <Paragraph>
        Konfigurasi integrasi dengan gateway pembayaran Tripay. Pastikan Anda telah mendaftar dan 
        memiliki akun merchant di <a href="https://tripay.co.id" target="_blank" rel="noopener noreferrer">Tripay</a>.
      </Paragraph>
      
      {loadingSettings ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Memuat pengaturan...</div>
        </div>
      ) : (
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSaveSettings}
          >
            <Form.Item
              name="api_key"
              label="API Key"
              rules={[{ required: true, message: 'API Key diperlukan' }]}
            >
              <Input.Password placeholder="Masukkan API Key dari Tripay" />
            </Form.Item>
            
            <Form.Item
              name="private_key"
              label="Private Key"
              rules={[{ required: true, message: 'Private Key diperlukan' }]}
            >
              <Input.Password placeholder="Masukkan Private Key dari Tripay" />
            </Form.Item>
            
            <Form.Item
              name="merchant_code"
              label="Kode Merchant"
              rules={[{ required: true, message: 'Kode Merchant diperlukan' }]}
            >
              <Input placeholder="Masukkan Kode Merchant dari Tripay" />
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
              <Switch />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />} 
                loading={loading}
                style={{ marginRight: 8 }}
              >
                Simpan Pengaturan
              </Button>
              
              <Button 
                onClick={handleTestConnection} 
                icon={<ReloadOutlined />}
                loading={testLoading}
              >
                Tes Koneksi
              </Button>
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
        </Card>
      )}
    </div>
  );
};

export default TripaySettings;