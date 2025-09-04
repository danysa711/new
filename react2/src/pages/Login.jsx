import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Spin, Tooltip } from 'antd';
import { UserOutlined, LockOutlined, CommentOutlined, SendOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Tambahkan import axios

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // PERBAIKAN: Gunakan nilai default langsung, tidak perlu fetch dari API
  const supportNumber = '6281284712684';

  const onFinish = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      // Log untuk debugging
      console.log("Attempting login with:", values.username);
      
      // Get backend URL
      const backendUrl = localStorage.getItem('backendUrl') || 'https://db.kinterstore.my.id';
      console.log("Using backend URL:", backendUrl);
      
      try {
        // Regular login attempt
        console.log("Attempting regular login through AuthContext");
        const response = await login(values.username, values.password, true);
        
        if (response.success) {
          console.log("Login successful through AuthContext");
          if (response.user.role === 'admin') {
            navigate('/admin/dashboard');
          } else {
            navigate(`/user/page/${response.user.url_slug}`);
          }
          return;
        } else {
          console.log("Regular login failed, error:", response.error);
          setError(response.error || 'Login gagal');
        }
      } catch (loginError) {
        console.error("Error during AuthContext login:", loginError);
        
        // Try direct API login
        console.log("Regular login failed, trying direct endpoint...");
        
        try {
          const directResponse = await axios.post(
            `${backendUrl}/api/login`, 
            { username: values.username, password: values.password },
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              }
            }
          );
          
          if (directResponse.data && directResponse.data.token) {
            console.log("Direct login successful");
            
            // Save auth data
            if (directResponse.data.token) {
              localStorage.setItem('token', directResponse.data.token);
              console.log("Token saved to localStorage");
            }
            
            if (directResponse.data.refreshToken) {
              localStorage.setItem('refreshToken', directResponse.data.refreshToken);
              console.log("RefreshToken saved to localStorage");
            }
            
            if (directResponse.data.user) {
              localStorage.setItem('user', JSON.stringify(directResponse.data.user));
              console.log("User data saved to localStorage");
              
              // Navigate based on role
              if (directResponse.data.user.role === 'admin') {
                navigate('/admin/dashboard');
              } else {
                navigate(`/user/page/${directResponse.data.user.url_slug}`);
              }
            } else {
              setError("Login berhasil tapi data user tidak ada");
            }
          } else {
            setError("Login gagal: token tidak diterima dari server");
          }
        } catch (directError) {
          console.error("Direct login failed:", directError);
          setError(directError.response?.data?.error || "Gagal melakukan login langsung");
        }
      }
    } catch (err) {
      console.error('Login error (global):', err);
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  // Handle WhatsApp support click
  const handleSupportClick = () => {
    const whatsappUrl = `https://wa.me/${supportNumber}?text=Halo Admin, saya butuh bantuan untuk login.`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', position: 'relative' }}>
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
            <div style={{ marginTop: 8 }}>Sedang login...</div>
          </div>
        )}
        
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            Belum punya akun? <a href="/register">Daftar sekarang</a>
          </Text>
        </div>
      </Card>
      
      {/* Tombol Chat Support */}
      <Tooltip 
        title="Butuh bantuan? Hubungi support chat"
        placement="left"
        color="#333"
        overlayInnerStyle={{ fontWeight: 500 }}
      >
        <div onClick={handleSupportClick} style={{
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
            {/* Icon chat bubble utama */}
            <CommentOutlined 
              style={{ 
                fontSize: '32px',
                color: 'white',
                filter: 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.2))',
                position: 'absolute',
                zIndex: 2
              }} 
            />
            
            {/* Icon send dekoratif */}
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
            
            {/* Animasi pulse */}
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              animation: 'pulse 2s infinite',
              zIndex: 0
            }} />
            
            {/* Style untuk animasi pulse */}
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