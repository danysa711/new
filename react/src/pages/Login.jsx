// Perbaikan untuk React login (asumsi nama file: src/pages/Login.jsx)

import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // URL backend dari env atau default
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://db.kinterstore.my.id';
  
  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Login request with values:', values);
      console.log('Using backend URL:', backendUrl);
      
      // Langsung menggunakan axios tanpa service
      const response = await axios.post(
        `${backendUrl}/api/login`, 
        values,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 detik timeout
        }
      );
      
      console.log('Login response:', response.data);
      
      if (response.data && response.data.token) {
        // Simpan token dan data user
        login(response.data.token, response.data.user);
        
        // Redirect berdasarkan role
        if (response.data.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(`/user/page/${response.data.user.url_slug}`);
        }
      } else {
        setError('Respons login tidak valid');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle berbagai jenis error
      if (err.response) {
        // Error dari server
        setError(err.response.data.error || `Error ${err.response.status}: ${err.response.statusText}`);
        console.error('Server error details:', err.response.data);
      } else if (err.request) {
        // Tidak ada respons
        console.error('No response received:', err.request);
        setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
      } else {
        // Error lainnya
        setError(err.message || 'Terjadi kesalahan saat login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Login</Title>
          <Text type="secondary">Masuk ke akun Anda</Text>
        </div>
        
        {error && (
          <Alert
            message="Login Gagal"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}
        
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label="Username atau Email"
            rules={[{ required: true, message: 'Masukkan username atau email' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Username atau Email" 
              size="large" 
              disabled={loading}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Masukkan password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Password" 
              size="large"
              disabled={loading}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Spin />
            <div style={{ marginTop: 8 }}>Logging in...</div>
          </div>
        )}
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            Belum punya akun? <a href="/register">Daftar sekarang</a>
          </Text>
        </div>
        
        {/* Debug info */}
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '10px' }}>
            Backend URL: {backendUrl}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;