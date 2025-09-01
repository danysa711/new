// src/pages/admin/TripaySettings.jsx
// Perbaikan impor pada file TripaySettings.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, Spin, 
  Divider, Switch, Alert, Descriptions
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';

// PERBAIKAN: Hapus impor AdminLayout yang salah
// import { AdminLayout } from "../../components/layouts/AdminLayout"; 

const { Title, Text, Paragraph } = Typography;

const TripaySettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  const [tripayEnabled, setTripayEnabled] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoadingSettings(true);
        
        // Coba ambil pengaturan dari API terlebih dahulu
        try {
          const response = await axiosInstance.get('/api/settings/tripay');
          console.log('Pengaturan Tripay berhasil diambil:', response.data);
          
          const { api_key, private_key, merchant_code, sandbox_mode, tripay_enabled } = response.data;
          
          form.setFieldsValue({
            api_key,
            private_key,
            merchant_code,
            sandbox_mode: sandbox_mode === true || sandbox_mode === 'true',
            tripay_enabled: tripay_enabled === true || tripay_enabled === 'true',
          });
          
          setTripayEnabled(tripay_enabled === true || tripay_enabled === 'true');
          
          // Simpan juga ke localStorage sebagai cadangan
          localStorage.setItem('tripay_enabled', String(tripay_enabled === true || tripay_enabled === 'true'));
          
        } catch (apiError) {
          console.error('Gagal mengambil dari API, beralih ke localStorage:', apiError);
          
          // Fallback ke localStorage
          const localEnabled = localStorage.getItem('tripay_enabled');
          const isEnabled = localEnabled === 'true' || localEnabled === true;
          
          setTripayEnabled(isEnabled);
          
          form.setFieldsValue({
            api_key: localStorage.getItem('tripay_api_key') || '',
            private_key: localStorage.getItem('tripay_private_key') || '',
            merchant_code: localStorage.getItem('tripay_merchant_code') || '',
            sandbox_mode: localStorage.getItem('tripay_sandbox_mode') === 'true',
            tripay_enabled: isEnabled
          });
          
          message.warning('Tidak dapat terhubung ke server. Menggunakan pengaturan lokal.');
        }
      } catch (error) {
        console.error('Gagal memuat pengaturan Tripay:', error);
        message.error('Gagal memuat pengaturan Tripay');
      } finally {
        setLoadingSettings(false);
      }
    };

    fetchSettings();
  }, [form]);

  const handleSaveSettings = async (values) => {
    try {
      setLoading(true);
      
      // Coba simpan ke API terlebih dahulu
      try {
        const response = await axiosInstance.post('/api/settings/tripay', values);
        console.log('Pengaturan Tripay berhasil disimpan ke API:', response.data);
      } catch (apiError) {
        console.error('Gagal menyimpan ke API, beralih ke localStorage:', apiError);
      }
      
      // Selalu simpan ke localStorage sebagai cadangan
      localStorage.setItem('tripay_api_key', values.api_key || '');
      localStorage.setItem('tripay_private_key', values.private_key || '');
      localStorage.setItem('tripay_merchant_code', values.merchant_code || '');
      localStorage.setItem('tripay_sandbox_mode', String(values.sandbox_mode));
      localStorage.setItem('tripay_enabled', String(values.tripay_enabled));
      
      setTripayEnabled(values.tripay_enabled);
      
      message.success('Pengaturan Tripay berhasil disimpan');
    } catch (error) {
      console.error('Gagal menyimpan pengaturan Tripay:', error);
      message.error('Gagal menyimpan pengaturan Tripay');
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTestLoading(true);
      setTestResult(null);
      
      const values = form.getFieldsValue();
      
      // Coba uji koneksi dengan API
      try {
        const response = await axiosInstance.post('/api/tripay/test-connection', {
          api_key: values.api_key,
          private_key: values.private_key,
          merchant_code: values.merchant_code,
          sandbox_mode: values.sandbox_mode
        });
        
        setTestResult({
          success: true,
          message: 'Koneksi ke Tripay berhasil!',
          merchantName: response.data.merchant_name || 'Merchant Anda',
          environment: values.sandbox_mode ? 'Sandbox' : 'Production'
        });
      } catch (apiError) {
        console.error('Gagal terhubung ke Tripay:', apiError);
        
        setTestResult({
          success: false,
          message: apiError.response?.data?.message || 'Koneksi ke Tripay gagal. Periksa pengaturan Anda.',
          error: apiError.message
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Koneksi ke Tripay gagal. Periksa pengaturan Anda.',
        error: error.message
      });
    } finally {
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
              <Input value={window.location.origin + '/api/tripay/callback'} disabled />
            </Form.Item>
            
            <Form.Item
              name="sandbox_mode"
              label="Mode Sandbox"
              valuePropName="checked"
            >
              <Switch disabled={!tripayEnabled} />
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
                disabled={!tripayEnabled}
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

// Ekspor komponen sebagai default
export default TripaySettings;