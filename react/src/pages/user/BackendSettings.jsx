// File: src/pages/user/BackendSettings.jsx

import React, { useState, useContext } from 'react';
import { 
  Card, Form, Input, Button, Typography, message, 
  Alert, Space, Divider 
} from 'antd';
import { SaveOutlined, LinkOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';

const { Title, Text, Paragraph } = Typography;

const BackendSettings = () => {
  const { user, updateBackendUrl } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const result = await updateBackendUrl(values.backend_url);
      if (result.success) {
        message.success('URL backend berhasil diperbarui');
        // Reload halaman agar perubahan diterapkan
        setTimeout(() => window.location.reload(), 1500);
      } else {
        message.error(result.error || 'Gagal memperbarui URL backend');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Terjadi kesalahan saat memperbarui URL backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Pengaturan Backend</Title>
      
      <Alert
        message="Informasi Penting"
        description="URL backend digunakan untuk koneksi ke API. Pastikan URL yang Anda masukkan valid dan dapat diakses."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ backend_url: user?.backend_url || 'https://db.kinterstore.my.id' }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="backend_url"
            label="URL Backend"
            rules={[
              { required: true, message: 'URL backend tidak boleh kosong' },
              { 
                pattern: /^https?:\/\/.+/, 
                message: 'URL harus dimulai dengan http:// atau https://' 
              }
            ]}
          >
            <Input 
              prefix={<LinkOutlined />} 
              placeholder="https://db.kinterstore.my.id" 
            />
          </Form.Item>
          
          <Divider />
          
          <Space>
            <Button 
              type="primary"
              icon={<SaveOutlined />}
              htmlType="submit"
              loading={loading}
            >
              Simpan Perubahan
            </Button>
          </Space>
        </Form>
      </Card>
      
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Informasi API</Title>
        <Paragraph>
          <Text strong>API URL untuk publik: </Text>
          <Text copyable>
            {`${user?.backend_url || 'https://db.kinterstore.my.id'}/api/public/user/${user?.url_slug}`}
         </Text>
       </Paragraph>
       <Paragraph>
         <Text strong>URL Backend Saat Ini: </Text>
         <Text copyable>{user?.backend_url || 'https://db.kinterstore.my.id'}</Text>
       </Paragraph>
     </Card>
   </div>
 );
};

export default BackendSettings;