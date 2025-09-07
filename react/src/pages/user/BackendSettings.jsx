// File: src/pages/user/BackendSettings.jsx

import React, { useState, useContext, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Typography, message, 
  Alert, Space, Divider, Radio
} from 'antd';
import { SaveOutlined, LinkOutlined, SyncOutlined, GlobalOutlined } from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import { detectDomainAndGenerateBackendUrl } from '../../utils/domainUtils';

const { Title, Text, Paragraph } = Typography;

const BackendSettings = () => {
  const { user, updateBackendUrl } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState('');

  // Effect untuk mendeteksi backend URL berdasarkan domain saat ini
  useEffect(() => {
    const domainBasedUrl = detectDomainAndGenerateBackendUrl();
    setDetectedUrl(domainBasedUrl);
    
    // Tentukan apakah menggunakan URL kustom atau tidak
    if (user?.backend_url && user.backend_url !== domainBasedUrl) {
      setUseCustomUrl(true);
      form.setFieldsValue({ 
        urlType: 'custom',
        backend_url: user.backend_url 
      });
    } else {
      setUseCustomUrl(false);
      form.setFieldsValue({ 
        urlType: 'auto',
        backend_url: domainBasedUrl 
      });
    }
  }, [form, user]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let urlToUpdate;
      
      if (values.urlType === 'auto') {
        // Gunakan URL berdasarkan domain
        urlToUpdate = detectedUrl;
      } else {
        // Gunakan URL kustom
        urlToUpdate = values.backend_url;
      }
      
      const result = await updateBackendUrl(urlToUpdate);
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

  const handleUrlTypeChange = (e) => {
    const value = e.target.value;
    setUseCustomUrl(value === 'custom');
    
    if (value === 'auto') {
      form.setFieldsValue({ backend_url: detectedUrl });
    }
  };

  return (
    <div>
      <Title level={2}>Pengaturan Backend</Title>
      
      <Alert
        message="Informasi Penting"
        description="URL backend digunakan untuk koneksi ke API. URL ini akan otomatis disesuaikan berdasarkan domain yang Anda gunakan, atau Anda dapat mengatur URL kustom."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ 
            urlType: 'auto',
            backend_url: detectedUrl
          }}
          onFinish={handleSubmit}
        >
          <Form.Item
            name="urlType"
            label="Tipe URL Backend"
          >
            <Radio.Group onChange={handleUrlTypeChange}>
              <Radio value="auto">
                <Space>
                  <GlobalOutlined />
                  Otomatis (Berdasarkan Domain)
                </Space>
              </Radio>
              <Radio value="custom">
                <Space>
                  <LinkOutlined />
                  Kustom
                </Space>
              </Radio>
            </Radio.Group>
          </Form.Item>
          
          {!useCustomUrl && (
            <Alert
              message="URL Backend Terdeteksi"
              description={
                <div>
                  <div>Berdasarkan domain yang Anda gunakan: <Text strong>{window.location.hostname}</Text></div>
                  <div>URL backend terdeteksi: <Text strong>{detectedUrl}</Text></div>
                </div>
              }
              type="success"
              showIcon
              style={{ marginBottom: 16 }}
              icon={<SyncOutlined spin={false} />}
            />
          )}
          
          {useCustomUrl && (
            <Form.Item
              name="backend_url"
              label="URL Backend Kustom"
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
          )}
          
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
            
            {useCustomUrl && (
              <Button 
                onClick={() => {
                  setUseCustomUrl(false);
                  form.setFieldsValue({
                    urlType: 'auto',
                    backend_url: detectedUrl
                  });
                }}
              >
                Kembalikan ke Default
              </Button>
            )}
          </Space>
        </Form>
      </Card>
      
      <Card style={{ marginTop: 24 }}>
        <Title level={4}>Informasi API</Title>
        <Paragraph>
          <Text strong>API URL untuk publik: </Text>
          <Text copyable>
            {`${useCustomUrl ? form.getFieldValue('backend_url') : detectedUrl}/api/public/user/${user?.url_slug}`}
         </Text>
       </Paragraph>
       <Paragraph>
         <Text strong>URL Backend Saat Ini: </Text>
         <Text copyable>{user?.backend_url || detectedUrl}</Text>
       </Paragraph>
     </Card>
   </div>
 );
};

export default BackendSettings;