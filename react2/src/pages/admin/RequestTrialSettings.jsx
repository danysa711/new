import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, 
  Space, Divider, Alert, Switch, Spin
} from 'antd';
import { SaveOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const RequestTrialSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('6281284712684');
  const [messageTemplate, setMessageTemplate] = useState('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  // Data untuk preview
  const previewData = {
    username: 'john_doe',
    email: 'john@example.com',
    url_slug: 'john-doe-abc123'
  };

  // Force end loading jika terlalu lama
  useEffect(() => {
  console.log("RequestTrialSettings component mounted");
  fetchSettings();
  
  // Force end loading after timeout
  const timeoutId = setTimeout(() => {
    if (fetchLoading) {
      console.log("Force ending loading state after timeout");
      setFetchLoading(false);
      
      message.info('Pengaturan dimuat dengan nilai default karena koneksi lambat.');
    }
  }, 5000); // 5 detik timeout
  
  return () => {
    clearTimeout(timeoutId);
    console.log("RequestTrialSettings component unmounted");
  };
}, []);

  // Load data ketika komponen dimount
  useEffect(() => {
    console.log("Initiating data fetching...");
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
  console.log("Starting fetchSettings...");
  try {
    setFetchLoading(true);
    
    let settingsData = null;
    
    // Try admin endpoint
    try {
      console.log("Trying admin endpoint...");
      const response = await axiosInstance.get('/api/admin/settings/whatsapp-trial');
      console.log('Admin response received:', response.data);
      settingsData = response.data;
    } catch (adminError) {
      console.error("Admin endpoint failed:", adminError);
      
      // Try public endpoint
      try {
        console.log("Trying public endpoint...");
        const publicResponse = await axiosInstance.get('/api/settings/whatsapp-trial');
        console.log('Public response received:', publicResponse.data);
        settingsData = publicResponse.data;
      } catch (publicError) {
        console.error("Public endpoint failed:", publicError);
        
        // Try fallback endpoint
        try {
          console.log("Trying fallback endpoint...");
          const fallbackResponse = await axiosInstance.get('/api/settings/whatsapp-trial-default');
          console.log('Fallback response received:', fallbackResponse.data);
          settingsData = fallbackResponse.data;
        } catch (fallbackError) {
          console.error("Even fallback endpoint failed:", fallbackError);
          console.log("Falling back to localStorage...");
          
          // Get from localStorage
          const localNumber = localStorage.getItem('whatsapp_trial_number');
          const localTemplate = localStorage.getItem('whatsapp_trial_template');
          const localEnabled = localStorage.getItem('whatsapp_trial_enabled');
          
          if (localNumber && localTemplate) {
            console.log("Using data from localStorage");
            settingsData = {
              whatsappNumber: localNumber,
              messageTemplate: localTemplate,
              isEnabled: localEnabled !== 'false'
            };
          } else {
            console.log("Using default hardcoded values");
            // Use hardcoded defaults
            settingsData = {
              whatsappNumber: '6281284712684',
              messageTemplate: 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}',
              isEnabled: true
            };
          }
          
          message.warning('Tidak dapat terhubung ke server. Menggunakan pengaturan lokal.');
        }
      }
    }
    
    // Set state with the settings
    if (settingsData) {
      setWhatsappNumber(settingsData.whatsappNumber || '6281284712684');
      setMessageTemplate(settingsData.messageTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
      setIsEnabled(settingsData.isEnabled !== false);
      
      // Save to localStorage as backup
      localStorage.setItem('whatsapp_trial_number', settingsData.whatsappNumber);
      localStorage.setItem('whatsapp_trial_template', settingsData.messageTemplate);
      localStorage.setItem('whatsapp_trial_enabled', String(settingsData.isEnabled));
      
      console.log("State updated with settings data");
    }
  } catch (error) {
    console.error("Unexpected error in fetchSettings:", error);
    message.error('Terjadi kesalahan. Menggunakan pengaturan default.');
    
    // Final fallback to hardcoded defaults
    setWhatsappNumber('6281284712684');
    setMessageTemplate('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
    setIsEnabled(true);
  } finally {
    console.log("Ending fetchSettings, setting loading state to false");
    setFetchLoading(false);
  }
};

  // Generate preview message
  const getPreviewMessage = () => {
    try {
      let preview = messageTemplate;
      Object.keys(previewData).forEach(key => {
        preview = preview.replace(new RegExp(`{${key}}`, 'g'), previewData[key]);
      });
      return preview;
    } catch (error) {
      console.error('Error generating preview:', error);
      return 'Error generating preview';
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
    
    if (!messageTemplate) {
      message.error('Template pesan harus diisi');
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
      messageTemplate,
      isEnabled
    };
    
    console.log('Sending data to server:', settingsData);
    
    try {
      // Kirim dengan parameter admin=true untuk memastikan request diautentikasi dengan benar
      const response = await axiosInstance.post('/api/admin/settings/whatsapp-trial?admin=true', settingsData);
      console.log('Server response:', response.data);
      
      // Save also to localStorage as backup
      localStorage.setItem('whatsapp_trial_number', whatsappNumber);
      localStorage.setItem('whatsapp_trial_template', messageTemplate);
      localStorage.setItem('whatsapp_trial_enabled', isEnabled.toString());
      
      message.success('Pengaturan request trial berhasil disimpan');
      
      // Re-fetch settings to verify they were saved
      setTimeout(() => {
        fetchSettings();
      }, 1000);
    } catch (apiError) {
      console.error('Error saving to API:', apiError);
      
      // Save to localStorage if API fails
      localStorage.setItem('whatsapp_trial_number', whatsappNumber);
      localStorage.setItem('whatsapp_trial_template', messageTemplate);
      localStorage.setItem('whatsapp_trial_enabled', isEnabled.toString());
      
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
      if (!whatsappNumber || !messageTemplate) {
        message.error('Isi nomor WhatsApp dan template pesan terlebih dahulu');
        return;
      }
      
      // Generate test message
      let testMessage = messageTemplate;
      Object.keys(previewData).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        testMessage = testMessage.replace(regex, previewData[key]);
      });
      
      // Open WhatsApp with test message
      const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(testMessage)}`;
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
      <Title level={2}>Pengaturan Trial</Title>
      
      <Paragraph>
        Konfigurasi fitur request trial yang tersedia untuk pengguna. Pengguna dapat meminta trial 
        langganan dengan mengirim pesan WhatsApp ke nomor yang ditentukan.
      </Paragraph>
      
      <Card>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Aktifkan Fitur Request Trial
          </label>
          <Switch 
            checked={isEnabled} 
            onChange={value => setIsEnabled(value)} 
          />
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Nomor WhatsApp
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
        
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
            Template Pesan Request
          </label>
          <TextArea 
            value={messageTemplate}
            onChange={e => setMessageTemplate(e.target.value)}
            rows={4} 
            placeholder="Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}" 
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>
            Gunakan {'{username}'}, {'{email}'}, dan {'{url_slug}'} sebagai placeholder yang akan otomatis diganti dengan data pengguna
          </div>
        </div>
        
        <Alert
          message="Preview Pesan"
          description={getPreviewMessage()}
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
            icon={<PhoneOutlined />}
          >
            Uji Pengaturan
          </Button>
        </Space>
      </Card>
      
      <Divider />
      
      <Card title="Informasi Tambahan">
        <Paragraph>
          <Text strong>Cara Kerja Fitur Request Trial:</Text>
        </Paragraph>
        <ul>
          <li>Pengguna menekan tombol "Request Trial" di dashboard mereka</li>
          <li>Aplikasi akan membuka WhatsApp dengan nomor dan pesan yang telah dikonfigurasi</li>
          <li>Admin akan menerima pesan dan dapat memberikan akses trial secara manual</li>
        </ul>
      </Card>
    </div>
  );
};

export default RequestTrialSettings;