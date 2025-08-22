// File: src/pages/ConnectionSettings.jsx

import React, { useContext, useState } from 'react';
import { 
  Form, Input, Button, Card, Typography, Alert, Space, 
  Row, Col, Divider, Spin, message
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { LinkOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { ConnectionContext } from '../context/ConnectionContext';
import { AuthContext } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const ConnectionSettings = () => {
  const { backendUrl, updateBackendUrl, isConnected, connectionStatus } = useContext(ConnectionContext);
  const { fetchUserProfile } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (values) => {
    const url = values.backendUrl.trim();
    
    // Validasi URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      form.setFields([
        {
          name: 'backendUrl',
          errors: ['URL harus dimulai dengan http:// atau https://']
        }
      ]);
      return;
    }
    
    // Update URL backend
    updateBackendUrl(url);
    
    // Refresh profil pengguna jika fungsi tersedia
    if (fetchUserProfile) {
      try {
        await fetchUserProfile();
      } catch (err) {
        console.error('Error refreshing user profile:', err);
      }
    }
    
    message.success('URL backend berhasil diperbarui');
    
    // Kembali ke halaman sebelumnya
    setTimeout(() => {
      navigate(-1);
    }, 1500);
  };
  
  const testConnection = async () => {
    setTesting(true);
    const url = form.getFieldValue('backendUrl');
    
    try {
      const response = await fetch(`${url}/api/test`);
      const data = await response.json();
      
      if (data && data.message === "API is working") {
        form.setFields([
          {
            name: 'backendUrl',
            errors: [],
            value: url
          }
        ]);
        message.success('Koneksi berhasil');
      } else {
        form.setFields([
          {
            name: 'backendUrl',
            errors: ['Koneksi gagal: Respons tidak valid']
          }
        ]);
        message.error('Koneksi gagal: Respons tidak valid');
      }
    } catch (err) {
      form.setFields([
        {
          name: 'backendUrl',
          errors: [`Koneksi gagal: ${err.message}`]
        }
      ]);
      message.error(`Koneksi gagal: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Col xs={24} sm={20} md={16} lg={12}>
        <Card style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
            Pengaturan Koneksi Backend
          </Title>
          
          <div style={{ marginBottom: 20 }}>
            {connectionStatus === 'checking' && (
              <Alert
                message="Memeriksa Koneksi"
                description="Sedang memeriksa koneksi ke backend..."
                type="info"
                showIcon
                icon={<Spin size="small" />}
              />
            )}
            
            {connectionStatus === 'connected' && (
              <Alert
                message="Terhubung"
                description="Koneksi ke backend berhasil"
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            )}
            
            {connectionStatus === 'subscription_expired' && (
              <Alert
                message="Langganan Kedaluwarsa"
                description="URL dinonaktifkan karena langganan Anda telah berakhir. Silakan perbarui langganan Anda."
                type="warning"
                showIcon
              />
            )}
            
            {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
              <Alert
                message="Tidak Terhubung"
                description="Koneksi ke backend gagal atau belum dikonfigurasi"
                type="error"
                showIcon
                icon={<CloseCircleOutlined />}
              />
            )}
          </div>
          
          <Form
            form={form}
            layout="vertical"
            initialValues={{ backendUrl }}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="backendUrl"
              label="URL Backend"
              rules={[{ required: true, message: 'URL backend tidak boleh kosong' }]}
              extra="Contoh: https://db.kinterstore.my.id"
            >
              <Input 
                prefix={<LinkOutlined />} 
                placeholder="https://db.kinterstore.my.id" 
                addonAfter={
                  <Button 
                    type="link" 
                    size="small" 
                    onClick={testConnection} 
                    loading={testing}
                    style={{ margin: -7 }}
                  >
                    Test
                  </Button>
                }
              />
            </Form.Item>
            
            <Divider />
            
            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Button onClick={() => navigate(-1)}>Kembali</Button>
                <Button type="primary" htmlType="submit">
                  Simpan & Hubungkan
                </Button>
              </Space>
            </Form.Item>
          </Form>
          
          <Paragraph type="secondary" style={{ marginTop: 16, textAlign: 'center' }}>
            Hubungkan aplikasi ini dengan backend API Anda
          </Paragraph>
        </Card>
      </Col>
    </Row>
  );
};

export default ConnectionSettings;