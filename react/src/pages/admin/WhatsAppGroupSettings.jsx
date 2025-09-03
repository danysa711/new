// react/src/pages/admin/WhatsAppGroupSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Switch, Typography,
  Alert, Space, Divider, message
} from 'antd';
import { 
  SaveOutlined, WhatsAppOutlined, InfoCircleOutlined 
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const WhatsAppGroupSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialValues, setInitialValues] = useState({
    group_name: 'Verifikasi Pembayaran',
    group_id: '',
    is_active: true,
    notification_template: 'Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}'
  });

  // Memuat pengaturan grup WhatsApp
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get('/api/admin/whatsapp-group-settings?admin=true');
        const settings = response.data;
        
        if (settings) {
          setInitialValues({
            group_name: settings.group_name || 'Verifikasi Pembayaran',
            group_id: settings.group_id || '',
            is_active: settings.is_active !== false,
            notification_template: settings.notification_template || 'Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}'
          });
          
          form.setFieldsValue({
            group_name: settings.group_name || 'Verifikasi Pembayaran',
            group_id: settings.group_id || '',
            is_active: settings.is_active !== false,
            notification_template: settings.notification_template || 'Cek status pembayaran username: {username} untuk paket {plan_name} dengan nominal Rp {amount}'
          });
        }
      } catch (error) {
        console.error("Error fetching WhatsApp group settings:", error);
        message.error("Gagal memuat pengaturan grup WhatsApp. Menggunakan nilai default.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, [form]);

  // Handle submit form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.post('/api/admin/whatsapp-group-settings?admin=true', values);
      
      if (response.data) {
        message.success("Pengaturan grup WhatsApp berhasil disimpan");
        setInitialValues(values);
      }
    } catch (error) {
      console.error("Error saving WhatsApp group settings:", error);
      message.error("Gagal menyimpan pengaturan grup WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Pengaturan Grup WhatsApp</Title>
      
      <Alert 
        message="Informasi Penting"
        description="Grup WhatsApp digunakan untuk mengirim notifikasi verifikasi pembayaran. Pastikan akun WhatsApp admin telah ditambahkan ke grup."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="group_name"
            label="Nama Grup"
            rules={[{ required: true, message: "Nama grup harus diisi" }]}
          >
            <Input placeholder="contoh: Verifikasi Pembayaran Kinterstore" />
          </Form.Item>
          
          <Form.Item
            name="group_id"
            label="ID Grup (opsional)"
            tooltip="ID grup WhatsApp, bisa dikosongkan jika menggunakan nomor WhatsApp untuk grup"
          >
            <Input placeholder="ID grup WhatsApp" />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Aktifkan Notifikasi Grup"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="notification_template"
            label="Template Pesan"
            rules={[{ required: true, message: "Template pesan harus diisi" }]}
            tooltip="Gunakan {username}, {plan_name}, {amount}, dan {reference} sebagai placeholder"
          >
            <TextArea 
              rows={4} 
              placeholder="Masukkan template pesan notifikasi"
            />
          </Form.Item>
          
          <Divider />
          
          <Paragraph>
            <Text strong>Placeholder yang Tersedia:</Text>
          </Paragraph>
          <ul>
            <li><Text code>{"{username}"}</Text> - Username pelanggan</li>
            <li><Text code>{"{plan_name}"}</Text> - Nama paket langganan</li>
            <li><Text code>{"{amount}"}</Text> - Jumlah pembayaran</li>
            <li><Text code>{"{reference}"}</Text> - Nomor referensi pembayaran</li>
          </ul>
          
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
    </div>
  );
};

export default WhatsAppGroupSettings;