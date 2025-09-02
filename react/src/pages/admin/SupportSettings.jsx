import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, 
  Space, Divider, Alert, Switch, Spin
} from 'antd';
import { SaveOutlined, PhoneOutlined, WhatsAppOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;

const SupportSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('6281284712684');
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  // Load data when component mounts
  useEffect(() => {
    console.log("SupportSettings component mounted");
    fetchSettings();
    
    // Force end loading after timeout
    const timeoutId = setTimeout(() => {
      if (fetchLoading) {
        console.log("Force ending loading state after timeout");
        setFetchLoading(false);
        message.info('Pengaturan dimuat dengan nilai default karena koneksi lambat.');
      }
    }, 5000); // 5 second timeout
    
    return () => {
      clearTimeout(timeoutId);
      console.log("SupportSettings component unmounted");
    };
  }, []);
  
  const fetchSettings = async () => {
    console.log("Starting fetchSettings...");
    try {
      setFetchLoading(true);
      
      try {
        console.log("Fetching support settings...");
        const response = await axiosInstance.get('/api/settings/support-number');
        console.log('Support settings received:', response.data);
        
        if (response.data && response.data.whatsappNumber) {
          setWhatsappNumber(response.data.whatsappNumber);
          setIsEnabled(response.data.isEnabled !== false);
          
          // Save to localStorage as backup
          localStorage.setItem('support_whatsapp_number', response.data.whatsappNumber);
          localStorage.setItem('support_whatsapp_enabled', String(response.data.isEnabled));
        } else {
          // Use default values
          console.log("Using default support number values");
          setWhatsappNumber('6281284712684');
          setIsEnabled(true);
        }
      } catch (error) {
        console.error("API request failed:", error);
        
        // Get from localStorage
        const localNumber = localStorage.getItem('support_whatsapp_number');
        const localEnabled = localStorage.getItem('support_whatsapp_enabled');
        
        if (localNumber) {
          console.log("Using data from localStorage");
          setWhatsappNumber(localNumber);
          setIsEnabled(localEnabled !== 'false');
        } else {
          console.log("Using default hardcoded values");
          // Use hardcoded defaults
          setWhatsappNumber('6281284712684');
          setIsEnabled(true);
        }
        
        message.warning('Tidak dapat terhubung ke server. Menggunakan pengaturan lokal.');
      }
    } catch (error) {
      console.error("Unexpected error in fetchSettings:", error);
      message.error('Terjadi kesalahan. Menggunakan pengaturan default.');
      
      // Final fallback to hardcoded defaults
      setWhatsappNumber('6281284712684');
      setIsEnabled(true);
    } finally {
      console.log("Ending fetchSettings, setting loading state to false");
      setFetchLoading(false);
    }
  };

  // Save settings to database
  const saveSettings = async () => {
    try {
      setLoading(true);
      
      // Basic validation
      if (!whatsappNumber) {
        message.error('Nomor WhatsApp harus diisi');
        setLoading(false);
        return;
      }
      
      // Format nomor WhatsApp
      const whatsappRegex = /^[0-9+]{8,15}$/;
      if (!whatsappRegex.test(whatsappNumber)) {
        message.error('Format nomor WhatsApp tidak valid');
        setLoading(false);
        return;
      }
      
      // Save to database
      const settingsData = {
        whatsappNumber,
        isEnabled
      };
      
      console.log('Sending data to server:', settingsData);
      
      try {
        // Send to API with admin=true parameter
        const response = await axiosInstance.post('/api/admin/settings/support-number?admin=true', settingsData);
        console.log('Server response:', response.data);
        
        // Save also to localStorage as backup
        localStorage.setItem('support_whatsapp_number', whatsappNumber);
        localStorage.setItem('support_whatsapp_enabled', isEnabled.toString());
        
        message.success('Pengaturan nomor support berhasil disimpan');
        
        // Re-fetch settings to verify they were saved
        setTimeout(() => {
          fetchSettings();
        }, 1000);
      } catch (apiError) {
        console.error('Error saving to API:', apiError);
        
        // Save to localStorage if API fails
        localStorage.setItem('support_whatsapp_number', whatsappNumber);
        localStorage.setItem('support_whatsapp_enabled', isEnabled.toString());
        
        message.warning('Gagal menyimpan ke server. Pengaturan disimpan secara lokal saja.');
      }
    } catch (error) {
      console.error('Error in saveSettings:', error);
      message.error('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  // Test WhatsApp settings
  const testWhatsAppSettings = () => {
    try {
      if (!whatsappNumber) {
        message.error('Isi nomor WhatsApp terlebih dahulu');
        return;
      }
      
      // Open WhatsApp with test message
      const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Test pesan dari admin panel')}`;
      window.open(waLink, '_blank');
      
      message.success('Membuka WhatsApp dengan pengaturan saat ini');
    } catch (error) {
      console.error('Error testing WhatsApp settings:', error);
      message.error('Gagal menguji pengaturan WhatsApp');
    }
  };

  if (fetchLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Memuat pengaturan...</div>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Pengaturan Support</Title>
      
      <Paragraph>
        Konfigurasi nomor WhatsApp support yang tersedia untuk pengguna pada halaman login.
        Nomor ini akan digunakan ketika pengguna mengklik tombol support di halaman login.
      </Paragraph>
      
      <Card>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Aktifkan Fitur Support WhatsApp
          </label>
          <Switch 
            checked={isEnabled} 
            onChange={value => setIsEnabled(value)} 
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Nomor WhatsApp Support
          </label>
          <Input 
            value={whatsappNumber}
            onChange={e => setWhatsappNumber(e.target.value)}
            prefix={<PhoneOutlined />} 
            placeholder="628123456789"
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
            Gunakan format internasional, contoh: 628123456789
          </div>
        </div>
        
        <Alert
          message="Preview"
          description={
            <div>
              <p>Tombol support WhatsApp akan ditampilkan di pojok kanan bawah halaman login.</p>
              <p>Ketika di-klik, pengguna akan diarahkan ke: <br />
                <code>https://wa.me/{whatsappNumber}?text=Halo, saya butuh bantuan untuk login.</code>
              </p>
            </div>
          }
          type="info"
          style={{ marginBottom: 16 }}
        />
        
        <Divider />
        
        <Space>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            loading={loading}
            onClick={saveSettings}
          >
            Simpan Pengaturan
          </Button>
          
          <Button 
            onClick={testWhatsAppSettings}
            icon={<WhatsAppOutlined />}
            style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}
          >
            Uji Pengaturan
          </Button>
        </Space>
      </Card>
      
      <Divider />
      
      <Card title="Informasi Tambahan">
        <Paragraph>
          <Text strong>Cara Kerja Fitur Support:</Text>
        </Paragraph>
        <ul>
          <li>Pengguna melihat tombol WhatsApp di pojok kanan bawah halaman login</li>
          <li>Saat mengklik tombol tersebut, aplikasi akan membuka WhatsApp dengan nomor dan pesan yang telah dikonfigurasi</li>
          <li>Admin akan menerima pesan dan dapat memberikan bantuan kepada pengguna</li>
        </ul>
      </Card>
    </div>
  );
};

export default SupportSettings;