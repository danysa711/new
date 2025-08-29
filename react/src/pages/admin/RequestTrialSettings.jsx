// File: react/src/pages/admin/RequestTrialSettings.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Form, Input, Button, message, 
  Switch, Space, Divider 
} from 'antd';
import { SaveOutlined, WhatsAppOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const RequestTrialSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  
  // Mengambil pengaturan dari localStorage saat komponen dimuat
  useEffect(() => {
    const storedPhone = localStorage.getItem('requestTrialPhone') || '6281284712684';
    const storedMessage = localStorage.getItem('requestTrialMessage') || 'Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}';
    
    form.setFieldsValue({
      phone: storedPhone,
      message: storedMessage
    });
  }, [form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // Simpan pengaturan ke localStorage
      localStorage.setItem('requestTrialPhone', values.phone);
      localStorage.setItem('requestTrialMessage', values.message);
      
      // Simulasi penundaan untuk menunjukkan loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
      message.success('Pengaturan Request Trial berhasil disimpan');
      setLoading(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Gagal menyimpan pengaturan');
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Pengaturan Request Trial</Title>
      
      <Paragraph>
        Konfigurasi nomor WhatsApp dan template pesan untuk fitur Request Trial. Pengguna dapat mengakses fitur ini melalui dropdown menu Akun.
      </Paragraph>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="phone"
            label="Nomor WhatsApp"
            rules={[
              { required: true, message: 'Nomor WhatsApp harus diisi' },
              { pattern: /^[0-9+]+$/, message: 'Masukkan nomor WhatsApp yang valid' }
            ]}
            extra="Masukkan nomor WhatsApp dengan format awalan 62 (tanpa tanda +)"
          >
            <Input
              prefix={<WhatsAppOutlined />}
              placeholder="Contoh: 6281234567890"
            />
          </Form.Item>
          
          <Form.Item
            name="message"
            label="Template Pesan"
            rules={[{ required: true, message: 'Template pesan harus diisi' }]}
            extra="Gunakan {username}, {email}, dan {url_slug} sebagai placeholder yang akan diganti dengan data pengguna"
          >
            <TextArea
              rows={4}
              placeholder="Contoh: Halo, saya {username} ({email}) ingin request trial dengan URL: {url_slug}"
            />
          </Form.Item>
          
          <Divider />
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Simpan Pengaturan
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      <Card style={{ marginTop: 16 }}>
        <Title level={4}>Cara Kerja</Title>
        <Paragraph>
          Ketika pengguna mengklik opsi "Request Trial" di dropdown menu, mereka akan diarahkan ke WhatsApp dengan nomor dan pesan yang telah dikonfigurasi.
        </Paragraph>
        <Paragraph>
          <Text strong>Placeholder yang tersedia:</Text>
        </Paragraph>
        <ul>
          <li><Text code>{"{username}"}</Text> - Nama pengguna</li>
          <li><Text code>{"{email}"}</Text> - Alamat email pengguna</li>
          <li><Text code>{"{url_slug}"}</Text> - URL slug pengguna</li>
        </ul>
      </Card>
    </div>
  );
};

export default RequestTrialSettings;