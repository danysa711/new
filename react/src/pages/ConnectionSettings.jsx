import React, { useContext, useState } from 'react';
import { 
  Form, Input, Button, Card, Typography, Alert, Space, 
  Row, Col, Divider, Spin, Result
} from 'antd';
import { ConnectionContext } from '../context/ConnectionContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LinkOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const ConnectionSettings = () => {
  const { backendUrl, updateBackendUrl, apiBaseUrl, updateApiBaseUrl, isConnected, connectionStatus } = useContext(ConnectionContext);
  const { user, token } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (values) => {
    const backendUrlValue = values.backendUrl.trim();
    const apiBaseUrlValue = values.apiBaseUrl.trim();
    
    // Validasi URL format untuk backend URL
    if (!backendUrlValue.startsWith('http://') && !backendUrlValue.startsWith('https://')) {
      form.setFields([
        {
          name: 'backendUrl',
          errors: ['URL harus dimulai dengan http:// atau https://']
        }
      ]);
      return;
    }
    
    // Validasi URL format untuk API Base URL
    if (!apiBaseUrlValue.startsWith('http://') && !apiBaseUrlValue.startsWith('https://')) {
      form.setFields([
        {
          name: 'apiBaseUrl',
          errors: ['URL harus dimulai dengan http:// atau https://']
        }
      ]);
      return;
    }
    
    // Update URL backend
    updateBackendUrl(backendUrlValue);
    
    // Update API Base URL
    updateApiBaseUrl(apiBaseUrlValue);
    
    // Redirect ke login jika belum login, atau ke halaman utama jika sudah login
    if (!token) {
      navigate('/login');
    } else {
      navigate('/');
    }
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
      } else {
        form.setFields([
          {
            name: 'backendUrl',
            errors: ['Koneksi gagal: Respons tidak valid']
          }
        ]);
      }
    } catch (err) {
      form.setFields([
        {
          name: 'backendUrl',
          errors: [`Koneksi gagal: ${err.message}`]
        }
      ]);
    } finally {
      setTesting(false);
    }
  };
  
  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Col xs={24} sm={20} md={16} lg={12}>
        <Card style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
            Pengaturan Koneksi
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
            initialValues={{ 
              backendUrl,
              apiBaseUrl
            }}
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
            
            <Form.Item
              name="apiBaseUrl"
              label="URL API Publik"
              rules={[{ required: true, message: 'URL API publik tidak boleh kosong' }]}
              extra="Contoh: https://www.kinterstore.my.id"
            >
              <Input 
                prefix={<LinkOutlined />} 
                placeholder="https://www.kinterstore.my.id" 
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