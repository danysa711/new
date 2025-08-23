// File: react/src/pages/admin/WhatsAppSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, message, Typography, 
  Spin, Alert, Divider, Space, Tooltip
} from 'antd';
import { 
  WhatsAppOutlined, SaveOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WhatsAppSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/settings');
        setSettings(response.data);
        
        // Set form values
        form.setFieldsValue({
          phone: response.data.whatsapp?.phone || '',
          message: response.data.whatsapp?.message || ''
        });
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError('Gagal memuat pengaturan WhatsApp. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const response = await axiosInstance.put('/api/settings/whatsapp', {
        phone: values.phone,
        message: values.message
      });
      
      if (response.data) {
        message.success('Pengaturan WhatsApp berhasil disimpan');
        setSettings({
          ...settings,
          whatsapp: response.data.whatsapp
        });
      }
    } catch (err) {
      console.error('Error saving WhatsApp settings:', err);
      message.error('Gagal menyimpan pengaturan WhatsApp');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      <Title level={2}>Pengaturan WhatsApp</Title>
      <Paragraph>
        Konfigurasi nomor WhatsApp dan template pesan yang digunakan untuk kontak dan langganan.
      </Paragraph>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            phone: settings?.whatsapp?.phone || '',
            message: settings?.whatsapp?.message || ''
          }}
        >
          <Form.Item
            label="Nomor WhatsApp"
            name="phone"
            rules={[
              { required: true, message: 'Nomor WhatsApp diperlukan' },
              { pattern: /^[0-9+]+$/, message: 'Hanya angka dan tanda + diperbolehkan' }
            ]}
            extra="Format: 628xxxxxxxxxx (tanpa tanda + atau spasi)"
          >
            <Input 
              prefix={<WhatsAppOutlined />} 
              placeholder="628xxxxxxxxxx" 
            />
          </Form.Item>

          <Form.Item
            label={
              <Space>
                <span>Template Pesan</span>
                <Tooltip title="Gunakan variabel {username}, {email}, {purpose}, dan {url_slug} yang akan diganti dengan data pengguna.">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            }
            name="message"
            rules={[{ required: true, message: 'Template pesan diperlukan' }]}
          >
            <TextArea
              placeholder="Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}"
              rows={4}
            />
          </Form.Item>

          <Divider />

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
            >
              Simpan Pengaturan
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Contoh Penggunaan" style={{ marginTop: 24 }}>
        <Title level={4}>Variabel yang Tersedia:</Title>
        <ul>
          <li><Text code>{'{username}'}</Text> - Nama pengguna</li>
          <li><Text code>{'{email}'}</Text> - Email pengguna</li>
          <li><Text code>{'{purpose}'}</Text> - Tujuan kontak (misalnya "berlangganan" atau "request trial")</li>
          <li><Text code>{'{url_slug}'}</Text> - URL slug pengguna</li>
        </ul>

        <Divider />

        <Title level={4}>Contoh Hasil:</Title>
        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <Text>
            {(settings?.whatsapp?.message || 'Halo, saya {username} ({email}) ingin {purpose}. URL Slug: {url_slug}')
              .replace('{username}', 'John Doe')
              .replace('{email}', 'john@example.com')
              .replace('{purpose}', 'berlangganan')
              .replace('{url_slug}', 'john-doe-abc123')}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;