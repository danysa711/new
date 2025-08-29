import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, Checkbox, Alert, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const { login } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setError(null);
      
      const { username, password, remember } = values;
      
      // Panggil fungsi login dari AuthContext
      const result = await login(username, password, !!remember);
      
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
    // Fungsi ini dihapus karena tidak diperlukan lagi
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
              remember: false
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
              </div>
            </Form.Item>

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
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;