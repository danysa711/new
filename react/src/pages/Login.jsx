import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, Checkbox, Divider, Alert, Row, Col } from 'antd';
import { UserOutlined, LockOutlined, LinkOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const { login } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      const { username, password, remember, backendUrl } = values;
      
      // Validasi URL backend jika disediakan
      if (backendUrl && (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://'))) {
        setError('URL backend harus dimulai dengan http:// atau https://');
        setLoading(false);
        return;
      }
      
      // Panggil fungsi login dari AuthContext
      const result = await login(username, password, !!remember, backendUrl);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError('Login gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const backendUrl = form.getFieldValue('backendUrl');
    if (!backendUrl) {
      setError('Masukkan URL backend terlebih dahulu untuk menguji koneksi');
      return;
    }
    
    // Validasi URL
    if (!backendUrl.startsWith('http://') && !backendUrl.startsWith('https://')) {
      setError('URL backend harus dimulai dengan http:// atau https://');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/api/test`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.message === "API is working") {
          alert('Koneksi ke backend berhasil!');
        } else {
          setError('Respons dari backend tidak valid');
        }
      } else {
        setError(`Koneksi gagal dengan status: ${response.status}`);
      }
    } catch (err) {
      setError(`Koneksi gagal: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', borderRadius: '8px' }}>
          <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>
            Login
          </Title>
          
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: '16px' }} 
              closable
            />
          )}
          
          <Form
            form={form}
            name="login"
            initialValues={{ 
              remember: false,
              backendUrl: localStorage.getItem('backendUrl') || 'https://db.kinterstore.my.id'
            }}
            onFinish={handleSubmit}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Masukkan username atau email' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Username atau Email" 
                size="large" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Masukkan password' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Password" 
                size="large" 
              />
            </Form.Item>

            <Form.Item>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Ingat Saya</Checkbox>
                </Form.Item>
                <Button 
                  type="link" 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{ padding: 0 }}
                >
                  {showAdvanced ? 'Sembunyikan Pengaturan Lanjutan' : 'Pengaturan Lanjutan'}
                </Button>
              </div>
            </Form.Item>
            
            {showAdvanced && (
              <Form.Item
                name="backendUrl"
                label="URL Backend"
              >
                <Input 
                  prefix={<LinkOutlined />} 
                  placeholder="https://db.kinterstore.my.id" 
                  addonAfter={
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={testConnection}
                      style={{ margin: -7 }}
                      disabled={loading}
                    >
                      Test
                    </Button>
                  }
                />
              </Form.Item>
            )}

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading} 
                block 
                size="large"
              >
                Login
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Button 
                type="link" 
                onClick={() => navigate('/register')}
              >
                Belum punya akun? Daftar
              </Button>
              <Divider plain>atau</Divider>
              <Button 
                type="link" 
                onClick={() => navigate('/connection-settings')}
              >
                Pengaturan Koneksi
              </Button>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;