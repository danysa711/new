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
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  
  // Data untuk preview
  const previewData = {
    username: 'john_doe',
    email: 'john@example.com',
    url_slug: 'john-doe-abc123'
  };

  // Load initial values from database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setFetchLoading(true);
        const response = await axiosInstance.get('/api/admin/settings/whatsapp-trial');
        
        const { whatsappNumber, messageTemplate, isEnabled } = response.data;
        
        setWhatsappNumber(whatsappNumber || '6281284712684');
        setMessageTemplate(messageTemplate || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
        setIsEnabled(isEnabled !== false);
        
        console.log("Loaded values from database:", {
          number: whatsappNumber,
          template: messageTemplate,
          enabled: isEnabled
        });
      } catch (error) {
        console.error('Error fetching settings:', error);
        message.error('Gagal mengambil pengaturan: ' + (error.response?.data?.message || error.message));
        
        // Set default values if fetch fails
        setWhatsappNumber('6281284712684');
        setMessageTemplate('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
        setIsEnabled(true);
      } finally {
        setFetchLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

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
      const response = await axiosInstance.post('/api/admin/settings/whatsapp-trial', {
        whatsappNumber,
        messageTemplate,
        isEnabled
      });
      
      console.log("Saved settings to database:", {
        number: whatsappNumber,
        template: messageTemplate,
        enabled: isEnabled
      });
      
      message.success('Pengaturan request trial berhasil disimpan');
      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Gagal menyimpan pengaturan: ' + (error.response?.data?.message || error.message));
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
        testMessage = testMessage.replace(new RegExp(`{${key}}`, 'g'), previewData[key]);
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" tip="Memuat pengaturan..." />
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