import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, 
  Space, Divider, Alert, Switch
} from 'antd';
import { SaveOutlined, PhoneOutlined, MessageOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const RequestTrialSettings = () => {
  const [whatsappNumber, setWhatsappNumber] = useState('6281284712684');
  const [messageTemplate, setMessageTemplate] = useState('Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}');
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Data untuk preview
  const previewData = {
    username: 'john_doe',
    email: 'john@example.com',
    url_slug: 'john-doe-abc123'
  };

  // Load initial values from localStorage
  useEffect(() => {
    const storedNumber = localStorage.getItem('whatsapp_trial_number');
    const storedTemplate = localStorage.getItem('whatsapp_trial_template');
    const storedEnabled = localStorage.getItem('whatsapp_trial_enabled');
    
    if (storedNumber) setWhatsappNumber(storedNumber);
    if (storedTemplate) setMessageTemplate(storedTemplate);
    if (storedEnabled !== null) setIsEnabled(storedEnabled !== 'false');
    
    console.log("Loaded values from localStorage:", {
      number: storedNumber,
      template: storedTemplate,
      enabled: storedEnabled
    });
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

  // Save settings directly to localStorage
  const saveSettings = () => {
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
      
      // Save to localStorage
      localStorage.setItem('whatsapp_trial_number', whatsappNumber);
      localStorage.setItem('whatsapp_trial_template', messageTemplate);
      localStorage.setItem('whatsapp_trial_enabled', isEnabled.toString());
      
      console.log("Saved settings to localStorage:", {
        number: whatsappNumber,
        template: messageTemplate,
        enabled: isEnabled
      });
      
      message.success('Pengaturan request trial berhasil disimpan');
      
      // Verify the saved values
      const savedNumber = localStorage.getItem('whatsapp_trial_number');
      const savedTemplate = localStorage.getItem('whatsapp_trial_template');
      const savedEnabled = localStorage.getItem('whatsapp_trial_enabled');
      
      console.log("Verification - Values after save:", {
        number: savedNumber,
        template: savedTemplate,
        enabled: savedEnabled
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Gagal menyimpan pengaturan: ' + error.message);
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
      
      <Card title="Debug Info">
        <div>
          <Text strong>Current localStorage values:</Text>
          <pre>
            {JSON.stringify({
              whatsapp_trial_number: localStorage.getItem('whatsapp_trial_number'),
              whatsapp_trial_template: localStorage.getItem('whatsapp_trial_template'),
              whatsapp_trial_enabled: localStorage.getItem('whatsapp_trial_enabled')
            }, null, 2)}
          </pre>
        </div>
        
        <div>
          <Text strong>Current state values:</Text>
          <pre>
            {JSON.stringify({
              whatsappNumber,
              messageTemplate,
              isEnabled
            }, null, 2)}
          </pre>
        </div>
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