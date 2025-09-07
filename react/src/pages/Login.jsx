// Updated src/pages/Login.jsx without backend URL notification

import React, { useState, useContext, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, Tooltip } from 'antd';
import { UserOutlined, LockOutlined, CommentOutlined, SendOutlined } from '@ant-design/icons';
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
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', position: 'relative' }}>
      <Card style={{ width: 400, boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>Login</Title>
          <Text type="secondary">Masuk ke akun Anda</Text>
        </div>
        
        {/* Notifikasi backend URL telah dihilangkan */}
        
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
      </Card>
      
      {/* Elegant Chat Support Button */}
      <Tooltip 
        title="Butuh bantuan? Hubungi support chat"
        placement="left"
        color="#333"
        overlayInnerStyle={{ fontWeight: 500 }}
      >
        <div
          onClick={handleSupportClick}
          style={{
            position: 'absolute',
            bottom: 32,
            right: 32,
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'linear-gradient(145deg, #2b5876, #4e4376)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            border: '2px solid rgba(255, 255, 255, 0.18)',
            backdropFilter: 'blur(8px)',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(31, 38, 135, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(31, 38, 135, 0.37)';
          }}
        >
          <div style={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {/* Main chat bubble icon */}
            <CommentOutlined 
              style={{ 
                fontSize: '32px',
                color: 'white',
                filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2))',
                position: 'absolute',
                zIndex: 2
              }} 
            />
            
            {/* Decorative send icon */}
            <SendOutlined 
              style={{
                position: 'absolute',
                right: '18px',
                bottom: '18px',
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.85)',
                transform: 'rotate(-45deg)',
                opacity: 0.9,
                zIndex: 1
              }}
            />
            
            {/* Subtle pulse animation */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              animation: 'pulse 2s infinite',
              zIndex: 0
            }} />
            
            {/* Adding style for pulse animation */}
            <style>{`
              @keyframes pulse {
                0% {
                  transform: scale(0.95);
                  opacity: 0.7;
                }
                70% {
                  transform: scale(1.05);
                  opacity: 0.2;
                }
                100% {
                  transform: scale(0.95);
                  opacity: 0.7;
                }
              }
            `}</style>
          </div>
        </div>
      </Tooltip>
      
    </div>
  );
};

export default Login;