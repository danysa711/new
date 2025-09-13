// Updated src/pages/Login.jsx dengan tema elegan dan warna yang tidak mencolok

import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, Tooltip } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { detectDomainAndGenerateBackendUrl } from '../utils/domainUtils';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [supportNumber, setSupportNumber] = useState('');

  // Deteksi URL backend berdasarkan domain tanpa menampilkannya
  const [backendUrl, setBackendUrl] = useState(() => detectDomainAndGenerateBackendUrl());
  
  // Effect untuk memperbarui backend URL jika domain berubah
  useEffect(() => {
    const domainBasedUrl = detectDomainAndGenerateBackendUrl();
    setBackendUrl(domainBasedUrl);
    
    // Periksa jika domain telah berubah
    const savedBackendUrl = localStorage.getItem('backendUrl');
    if (savedBackendUrl && savedBackendUrl !== domainBasedUrl) {
      // Jika domain berubah, perbarui URL backend
      console.log('Domain berubah, memperbarui URL backend:', domainBasedUrl);
      localStorage.setItem('backendUrl', domainBasedUrl);
      
      // Periksa jika user telah login sebelumnya dan domain berubah
      if (localStorage.getItem('domain_changed') === 'true' || sessionStorage.getItem('domain_changed') === 'true') {
        // Hapus flag domain_changed
        localStorage.removeItem('domain_changed');
        sessionStorage.removeItem('domain_changed');
        
        // Tampilkan pesan kepada pengguna
        setError('Domain website berubah. URL backend telah disesuaikan otomatis. Silakan login kembali.');
      }
    }
  }, []);
  
  // Fetch support number from backend
  useEffect(() => {
    const fetchSupportNumber = async () => {
      try {
        // Pastikan menggunakan endpoint publik
        const response = await axios.get(`${backendUrl}/api/settings/whatsapp-public`);
        if (response.data && response.data.whatsappNumber) {
          setSupportNumber(response.data.whatsappNumber);
        } else {
          setSupportNumber('6281284712684');
        }
      } catch (error) {
        console.error('Error fetching support number:', error);
        setSupportNumber('6281284712684');
      }
    };

    fetchSupportNumber();
  }, [backendUrl]);

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Login request with values:', values);
      console.log('Using backend URL:', backendUrl);
      
      // Simpan URL backend sebelum login
      localStorage.setItem('backendUrl', backendUrl);
      
      // SOLUSI: Gunakan AuthContext login function dengan parameter yang benar
      const response = await login(values.username, values.password, true);
      
      console.log('Login response:', response);
      
      // PERBAIKAN: Gunakan response, bukan result yang tidak didefinisikan
      if (response.success) {
        console.log('Login berhasil, user:', response.user);
        
        // Redirect berdasarkan role
        if (response.user.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate(`/user/page/${response.user.url_slug}`);
        }
      } else {
        setError(response.error || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  // Handle WhatsApp support click
  const handleSupportClick = () => {
    if (supportNumber) {
      const whatsappUrl = `https://wa.me/${supportNumber}?text=Halo Admin, saya dengan username: ... butuh bantuan ...`;
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh', 
      position: 'relative',
      background: 'linear-gradient(135deg, #2c3e50, #1a1a2e)',
      fontFamily: '"Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)', 
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.95)'
        }}
        bordered={false}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Title level={2} style={{ color: '#2c3e50', marginBottom: '8px', fontWeight: 600 }}>Login</Title>
          <Text type="secondary" style={{ fontSize: '15px' }}>Masuk ke akun Anda</Text>
        </div>
        
        {error && (
          <Alert
            message="Login Gagal"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: 24, borderRadius: '6px' }}
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
            label={<span style={{ color: '#2c3e50', fontWeight: 500 }}>Username atau Email</span>}
            rules={[{ required: true, message: 'Masukkan username atau email' }]}
          >
            <Input 
              prefix={<UserOutlined style={{ color: '#7f8c8d' }} />} 
              placeholder="Username atau Email" 
              size="large" 
              disabled={loading}
              style={{ 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid #e0e0e0',
              }}
            />
          </Form.Item>
          
          <Form.Item
            name="password"
            label={<span style={{ color: '#2c3e50', fontWeight: 500 }}>Password</span>}
            rules={[{ required: true, message: 'Masukkan password' }]}
          >
            <Input.Password 
              prefix={<LockOutlined style={{ color: '#7f8c8d' }} />} 
              placeholder="Password" 
              size="large"
              disabled={loading}
              style={{ 
                borderRadius: '8px', 
                padding: '12px',
                border: '1px solid #e0e0e0',
              }}
            />
          </Form.Item>
          
          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
              style={{
                height: '50px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                background: 'linear-gradient(135deg, #34495e, #2c3e50)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(44, 62, 80, 0.3)',
              }}
            >
              Login
            </Button>
          </Form.Item>
        </Form>
        
        {loading && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Spin />
            <div style={{ marginTop: 8, color: '#7f8c8d' }}>Logging in...</div>
          </div>
        )}
        
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Belum punya akun? <a href="/register" style={{ color: '#34495e', fontWeight: 500 }}>Daftar sekarang</a>
          </Text>
        </div>
      </Card>
      
      {/* WhatsApp Support Button tanpa logo dengan warna yang cocok dengan tema */}
      <Tooltip 
        title="Klik untuk menghubungi via WhatsApp"
        placement="left"
        color="#2c3e50"
        overlayInnerStyle={{ fontWeight: 500 }}
      >
        <div
          onClick={handleSupportClick}
          style={{
            position: 'absolute',
            bottom: 32,
            right: 32,
            width: 'auto',
            height: '60px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #34495e, #2c3e50)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
            padding: '0 25px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 15px 30px rgba(0, 0, 0, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.25)';
          }}
        >
          {/* "Butuh bantuan? hubungi kami." text */}
          <span style={{
            color: 'white',
            fontWeight: '500',
            fontSize: '15px',
            letterSpacing: '0.5px',
            textAlign: 'center',
            position: 'relative',
            zIndex: 2
          }}>
            Butuh bantuan? hubungi kami.
          </span>
          
          {/* Subtle pulse animation */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            borderRadius: '30px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            animation: 'pulse 3s infinite',
            zIndex: 1
          }} />
          
          {/* Adding style for pulse animation */}
          <style>{`
            @keyframes pulse {
              0% {
                transform: scale(0.98);
                opacity: 0.5;
              }
              70% {
                transform: scale(1.01);
                opacity: 0.1;
              }
              100% {
                transform: scale(0.98);
                opacity: 0.5;
              }
            }
            
            /* Style tambahan untuk form input focus */
            .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused {
              border-color: #34495e !important;
              box-shadow: 0 0 0 2px rgba(52, 73, 94, 0.2) !important;
            }
            
            /* Style tambahan untuk hover tombol */
            .ant-btn-primary:hover, .ant-btn-primary:focus {
              background: linear-gradient(135deg, #3d5a73, #34495e) !important;
            }
          `}</style>
        </div>
      </Tooltip>
      
    </div>
  );
};

export default Login;