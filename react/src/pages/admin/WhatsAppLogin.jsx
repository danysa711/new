// react/src/pages/admin/WhatsAppLogin.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Alert, Input, Form,
  Result, Steps, Divider, Badge, message, Space
} from 'antd';
import { 
  WhatsAppOutlined, QrcodeOutlined, CheckCircleOutlined,
  PoweroffOutlined, SyncOutlined, PhoneOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const WhatsAppLogin = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('idle'); // idle, loading, connected, disconnected
  const [qrCode, setQrCode] = useState('');
  const [currentStep, setCurrentStep] = useState(0);

  // Memeriksa status koneksi WhatsApp
  useEffect(() => {
    checkWhatsAppStatus();
  }, []);

  const checkWhatsAppStatus = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/api/whatsapp/status');
      
      if (response.data.whatsapp_connected) {
        setStatus('connected');
        setCurrentStep(2);
      } else {
        setStatus('disconnected');
        setCurrentStep(0);
      }
    } catch (error) {
      console.error("Error checking WhatsApp status:", error);
      setStatus('disconnected');
    } finally {
      setLoading(false);
    }
  };

  // Generate QR code untuk login WhatsApp
  const generateQRCode = async () => {
    try {
      setLoading(true);
      setStatus('loading');
      setCurrentStep(1);
      
      const response = await axiosInstance.get('/api/whatsapp/qr');
      
      if (response.data.qr_code) {
        setQrCode(response.data.qr_code);
      }
    } catch (error) {
      console.error("Error generating WhatsApp QR code:", error);
      setStatus('disconnected');
      message.error("Gagal membuat QR code WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  // Connect WhatsApp manually
  const connectWhatsApp = async (values) => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.post('/api/whatsapp/connect', {
        whatsapp_number: values.whatsapp_number
      });
      
      if (response.data) {
        message.success("WhatsApp berhasil terhubung");
        setStatus('connected');
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error connecting WhatsApp:", error);
      message.error("Gagal menghubungkan WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  // Logout dari WhatsApp
  const logoutWhatsApp = async () => {
    try {
      setLoading(true);
      await axiosInstance.post('/api/whatsapp/logout');
      
      setStatus('disconnected');
      setQrCode('');
      setCurrentStep(0);
      message.success("Berhasil logout dari WhatsApp");
    } catch (error) {
      console.error("Error logging out WhatsApp:", error);
      message.error("Gagal logout dari WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>WhatsApp Login</Title>
      
      <Alert
        message="Informasi Penting"
        description="Koneksi WhatsApp diperlukan untuk menerima notifikasi pembayaran dan verifikasi. Anda dapat menghubungkan WhatsApp secara manual."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <Steps current={currentStep} direction="vertical">
          <Step 
            title="Mulai Koneksi" 
            description="Mulai proses koneksi WhatsApp dengan mengklik tombol di bawah"
            icon={status === 'loading' ? <SyncOutlined spin /> : <WhatsAppOutlined />}
          />
          <Step 
            title="Sambungkan WhatsApp" 
            description="Masukkan nomor WhatsApp Anda untuk terhubung ke sistem"
            icon={status === 'loading' ? <SyncOutlined spin /> : <PhoneOutlined />}
          />
          <Step 
            title="Terhubung" 
            description="WhatsApp berhasil terhubung dan siap digunakan"
            icon={<CheckCircleOutlined />}
          />
        </Steps>
        
        <Divider />
        
        <div style={{ textAlign: 'center' }}>
          {status === 'disconnected' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<WhatsAppOutlined />}
                size="large"
                onClick={generateQRCode}
                loading={loading}
              >
                Mulai Koneksi WhatsApp
              </Button>
            </Space>
          )}
          
          {status === 'loading' && qrCode && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <img 
                  src={qrCode} 
                  alt="WhatsApp QR Code" 
                  style={{ maxWidth: '250px' }} 
                />
              </div>
              
              <Form
                form={form}
                layout="vertical"
                onFinish={connectWhatsApp}
                style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                <Form.Item
                  name="whatsapp_number"
                  label="Nomor WhatsApp"
                  rules={[
                    { required: true, message: 'Harap masukkan nomor WhatsApp' },
                    { pattern: /^[0-9+]+$/, message: 'Hanya masukkan angka dan karakter +' }
                  ]}
                >
                  <Input placeholder="contoh: +6281234567890" />
                </Form.Item>
                
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                  >
                    Hubungkan WhatsApp
                  </Button>
                </Form.Item>
              </Form>
              
              <Paragraph style={{ marginTop: 20 }}>
                <Text type="secondary">
                  Catatan: Koneksi WhatsApp secara manual hanya untuk demo. 
                  Untuk produksi sebenarnya, gunakan integrasi API WhatsApp resmi.
                </Text>
              </Paragraph>
            </div>
          )}
          
          {status === 'connected' && (
            <Result
              status="success"
              title="WhatsApp Terhubung"
              subTitle="WhatsApp berhasil terhubung dan siap digunakan untuk notifikasi"
              extra={[
                <Button
                  key="logout"
                  type="primary"
                  danger
                  icon={<PoweroffOutlined />}
                  onClick={logoutWhatsApp}
                  loading={loading}
                >
                  Putuskan Koneksi
                </Button>
              ]}
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default WhatsAppLogin;