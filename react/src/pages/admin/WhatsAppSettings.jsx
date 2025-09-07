import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, 
  Space, Divider, Alert, Switch, Spin, Tabs
} from 'antd';
import { SaveOutlined, PhoneOutlined, WhatsAppOutlined, MessageOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

const WhatsAppSettings = () => {
  // State untuk semua pengaturan
  const [whatsappNumber, setWhatsappNumber] = useState('6281284712684');
  const [trialEnabled, setTrialEnabled] = useState(true);
  const [messageTemplate, setMessageTemplate] = useState('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  // Data untuk preview
  const previewData = {
    username: 'john_doe',
    email: 'john@example.com',
    url_slug: 'john-doe-abc123'
  };

  // Load data ketika komponen dimount
  useEffect(() => {
    console.log("WhatsAppSettings component mounted");
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
    };
  }, []);
  
  // Fetch settings dari server
  const fetchSettings = async () => {
    console.log("Starting fetchSettings...");
    try {
      setFetchLoading(true);
      
      try {
        console.log("Fetching WhatsApp settings...");
        const response = await axiosInstance.get('/api/settings/whatsapp');
        console.log('WhatsApp settings received:', response.data);
        
        if (response.data) {
          setWhatsappNumber(response.data.whatsappNumber || '6281284712684');
          setTrialEnabled(response.data.trialEnabled !== false);
          setMessageTemplate(response.data.messageTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
          
          // Save to localStorage as backup
          localStorage.setItem('whatsapp_number', response.data.whatsappNumber);
          localStorage.setItem('whatsapp_trial_enabled', String(response.data.trialEnabled));
          localStorage.setItem('whatsapp_trial_template', response.data.messageTemplate);
        } else {
          // Use default values
          console.log("Using default WhatsApp values");
          setWhatsappNumber('6281284712684');
          setTrialEnabled(true);
          setMessageTemplate('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
        }
      } catch (error) {
        console.error("API request failed:", error);
        
        // Get from localStorage
        const localNumber = localStorage.getItem('whatsapp_number');
        const localTrialEnabled = localStorage.getItem('whatsapp_trial_enabled');
        const localTemplate = localStorage.getItem('whatsapp_trial_template');
        
        if (localNumber) {
          console.log("Using data from localStorage");
          setWhatsappNumber(localNumber);
          setTrialEnabled(localTrialEnabled !== 'false');
          setMessageTemplate(localTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
        } else {
          console.log("Using default hardcoded values");
          // Use hardcoded defaults
          setWhatsappNumber('6281284712684');
          setTrialEnabled(true);
          setMessageTemplate('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
        }
        
        message.warning('Tidak dapat terhubung ke server. Menggunakan pengaturan lokal.');
      }
    } catch (error) {
      console.error("Unexpected error in fetchSettings:", error);
      message.error('Terjadi kesalahan. Menggunakan pengaturan default.');
      
      // Final fallback to hardcoded defaults
      setWhatsappNumber('6281284712684');
      setTrialEnabled(true);
      setMessageTemplate('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
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
        trialEnabled,
        messageTemplate
      };
      
      console.log('Sending data to server:', settingsData);
      
      try {
        const response = await axiosInstance.post('/api/settings/whatsapp', settingsData);
        console.log('Server response:', response.data);
        
        // Save also to localStorage as backup
        localStorage.setItem('whatsapp_number', whatsappNumber);
        localStorage.setItem('whatsapp_trial_enabled', trialEnabled.toString());
        localStorage.setItem('whatsapp_trial_template', messageTemplate);
        
        message.success('Pengaturan WhatsApp berhasil disimpan');
        
        // Re-fetch settings to verify they were saved
        setTimeout(() => {
          fetchSettings();
        }, 1000);
      } catch (apiError) {
        console.error('Error saving to API:', apiError);
        
        // Save to localStorage if API fails
        localStorage.setItem('whatsapp_number', whatsappNumber);
        localStorage.setItem('whatsapp_trial_enabled', trialEnabled.toString());
        localStorage.setItem('whatsapp_trial_template', messageTemplate);
        
        message.warning('Gagal menyimpan ke server. Pengaturan disimpan secara lokal saja.');
      }
    } catch (error) {
      console.error('Error in saveSettings:', error);
      message.error('Terjadi kesalahan saat menyimpan pengaturan');
    } finally {
      setLoading(false);
    }
  };

  // Test WhatsApp Support
  const testWhatsAppSupport = () => {
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
  
  // Test WhatsApp Trial
  const testWhatsAppTrial = () => {
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
      <Title level={2}>Pengaturan WhatsApp</Title>
      
      <Paragraph>
        Konfigurasi nomor WhatsApp yang digunakan untuk dukungan pelanggan dan permintaan trial.
        Nomor ini akan digunakan oleh kedua fitur secara bersamaan.
      </Paragraph>
      
      <Card>
        <Tabs defaultActiveKey="1">
          <TabPane tab="Pengaturan Umum" key="1">
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
                <br />
                <strong>Catatan:</strong> Nomor ini akan digunakan untuk keduanya - dukungan pelanggan dan permintaan trial
              </div>
            </div>
            
            <Alert
              message="Info"
              description="Perubahan nomor WhatsApp akan mempengaruhi kedua fitur: tombol support di halaman login dan permintaan trial."
              type="info"
              showIcon
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
                onClick={testWhatsAppSupport}
                icon={<WhatsAppOutlined />}
                style={{ backgroundColor: '#25D366', borderColor: '#25D366', color: 'white' }}
              >
                Uji WhatsApp
              </Button>
            </Space>
          </TabPane>
          
          <TabPane tab="Pengaturan Trial" key="2">
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>
                Aktifkan Fitur Request Trial
              </label>
              <Switch 
                checked={trialEnabled} 
                onChange={value => setTrialEnabled(value)} 
              />
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
                onClick={testWhatsAppTrial}
                icon={<MessageOutlined />}
              >
                Uji Template Trial
              </Button>
            </Space>
          </TabPane>
          
          <TabPane tab="Informasi" key="3">
            <Card title="Cara Kerja">
              <div style={{ marginBottom: 16 }}>
                <Text strong>Dukungan Pelanggan:</Text>
                <ul>
                  <li>Pengguna melihat tombol WhatsApp di pojok kanan bawah halaman login</li>
                  <li>Saat mengklik tombol tersebut, aplikasi akan membuka WhatsApp dengan nomor yang telah dikonfigurasi</li>
                </ul>
              </div>
              
              <div>
                <Text strong>Request Trial:</Text>
                <ul>
                  <li>Pengguna menekan tombol "Request Trial" di dashboard mereka</li>
                  <li>Aplikasi akan membuka WhatsApp dengan nomor dan pesan yang telah dikonfigurasi</li>
                  <li>Admin akan menerima pesan dan dapat memberikan akses trial secara manual</li>
                </ul>
              </div>
            </Card>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;