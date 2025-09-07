import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Tag, Divider, message, Tooltip } from 'antd';
import { LinkOutlined, CopyOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { getActiveBackendUrl } from '../api/utils';
import { detectDomainAndGenerateBackendUrl } from '../utils/domainUtils';

const { Title, Text, Paragraph } = Typography;

const UserApiInfo = ({ user }) => {
  const [backendUrl, setBackendUrl] = useState('');
  
  // Effect untuk memperbarui backendUrl ketika domain berubah atau user berubah
  useEffect(() => {
    const currentBackendUrl = user?.backend_url || getActiveBackendUrl();
    setBackendUrl(currentBackendUrl);
    
    // Perbarui backendUrl setiap kali URL halaman berubah
    const handleUrlChange = () => {
      const newBackendUrl = user?.backend_url || getActiveBackendUrl();
      setBackendUrl(newBackendUrl);
    };
    
    // Tambahkan listener untuk perubahan URL
    window.addEventListener('popstate', handleUrlChange);
    
    // Cleanup listener saat komponen unmount
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [user]);
  
  if (!user) return null;
  
  // URL yang akan ditampilkan
  const userBackendUrl = backendUrl || detectDomainAndGenerateBackendUrl();
  const publicApiUrl = `${userBackendUrl}/api/public/user/${user.url_slug}`;
  const ordersApiUrl = `${userBackendUrl}/api/orders/find`;
  
  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('Teks berhasil disalin!');
      })
      .catch(err => {
        console.error('Gagal menyalin teks:', err);
        message.error('Gagal menyalin teks ke clipboard');
      });
  };
  
  return (
    <Card title={<Title level={4}>Informasi API</Title>}>
      <div style={{ marginBottom: 20 }}>
        <Paragraph>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          <Text strong>Backend URL adalah alamat server untuk koneksi API Anda</Text>
        </Paragraph>
        <Paragraph>
          URL ini akan digunakan oleh aplikasi saat berkomunikasi dengan server. 
          Anda dapat mengubahnya jika Anda menggunakan server backend pribadi.
        </Paragraph>
      </div>
      
      <div style={{ marginBottom: 16 }}>
        <Text strong>Backend URL:</Text>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginTop: '5px'
        }}>
          <Text copyable={{ tooltips: ['Salin', 'Tersalin!'] }}>{userBackendUrl}</Text>
          <Tag color="success">Terhubung</Tag>
        </div>
      </div>
      
      <Divider />
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text strong>API URL Publik:</Text>
          <Tooltip title="URL ini dapat digunakan oleh aplikasi lain untuk mengakses informasi publik tentang akun Anda">
            <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
          </Tooltip>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginTop: '5px'
        }}>
          <Text>{publicApiUrl}</Text>
          <Button 
            type="link" 
            icon={<CopyOutlined />} 
            onClick={() => copyToClipboard(publicApiUrl)}
            style={{ padding: 0 }}
          >
            Salin
          </Button>
        </div>
      </div>
      
      <Divider />
      
      <div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Text strong>Endpoint Orders:</Text>
          <Tooltip title="Gunakan endpoint ini untuk integrasi dengan aplikasi lain yang membutuhkan data pesanan">
            <InfoCircleOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
          </Tooltip>
        </div>
        <Paragraph style={{ marginTop: 5 }}>
          Gunakan endpoint berikut untuk mencari dan memproses pesanan:
        </Paragraph>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          padding: '8px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          marginTop: '5px'
        }}>
          <Text>{ordersApiUrl}</Text>
          <Button 
            type="link" 
            icon={<CopyOutlined />} 
            onClick={() => copyToClipboard(ordersApiUrl)}
            style={{ padding: 0 }}
          >
            Salin
          </Button>
        </div>
      </div>
      
      <Divider />
      
      <Button 
        type="link" 
        icon={<LinkOutlined />}
        onClick={() => window.location.href = `/user/page/${user.url_slug}/backend-settings`}
        style={{ padding: 0 }}
      >
        Pengaturan Backend
      </Button>
    </Card>
  );
};

export default UserApiInfo;