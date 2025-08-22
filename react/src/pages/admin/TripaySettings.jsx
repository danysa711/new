// react/src/pages/admin/TripaySettings.jsx
import React, { useState, useEffect, useContext } from "react";
import { 
  Card, 
  Button, 
  Space, 
  Form, 
  Input, 
  Switch, 
  Typography,
  message,
  Alert,
  Spin,
  Row,
  Col,
  Divider
} from "antd";
import { 
  PayCircleOutlined, 
  SaveOutlined,
  ApiOutlined,
  ReloadOutlined,
  KeyOutlined,
  ShopOutlined
} from "@ant-design/icons";
import { AdminContext } from "../../context/AdminContext";

const { Title, Text } = Typography;
const { Password } = Input;

const TripaySettings = () => {
  const { 
    tripaySettings,
    loading, 
    fetchTripaySettings,
    updateTripaySettings
  } = useContext(AdminContext);
  
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  
  useEffect(() => {
    fetchTripaySettings();
  }, []);
  
  useEffect(() => {
    if (tripaySettings) {
      form.setFieldsValue({
        api_key: tripaySettings.api_key,
        merchant_code: tripaySettings.merchant_code,
        is_sandbox: tripaySettings.is_sandbox,
        is_active: tripaySettings.is_active
      });
    }
  }, [tripaySettings, form]);
  
  const handleSubmit = async (values) => {
    try {
      setSaving(true);
      const result = await updateTripaySettings(values);
      
      if (result.success) {
        message.success("Pengaturan Tripay berhasil disimpan");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error saving Tripay settings:", error);
      message.error("Gagal menyimpan pengaturan Tripay");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
        <p>Loading pengaturan Tripay...</p>
      </div>
    );
  }
  
  return (
    <div>
      <Title level={2}>
        <PayCircleOutlined /> Pengaturan Tripay
      </Title>
      
      <Alert
        message="Tripay Payment Gateway"
        description={
          <div>
            <p>
              Tripay adalah gateway pembayaran yang mendukung berbagai metode pembayaran seperti
              transfer bank, e-wallet, dan toko retail. Anda perlu mendaftar di Tripay untuk
              mendapatkan API key dan informasi merchant.
            </p>
            <p>
              <a href="https://tripay.co.id" target="_blank" rel="noopener noreferrer">
                Kunjungi Tripay
              </a>
            </p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />
      
      <Card title="Konfigurasi Tripay">
        <Form 
          form={form} 
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ 
            is_sandbox: true,
            is_active: false
          }}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="api_key"
                label="API Key"
                rules={[{ required: true, message: "API Key wajib diisi" }]}
              >
                <Password 
                  prefix={<ApiOutlined />}
                  placeholder="API Key dari Tripay" 
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="private_key"
                label="Private Key"
                rules={[{ required: true, message: "Private Key wajib diisi" }]}
              >
                <Password 
                  prefix={<KeyOutlined />}
                  placeholder="Private Key dari Tripay" 
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="merchant_code"
            label="Merchant Code"
            rules={[{ required: true, message: "Merchant Code wajib diisi" }]}
          >
            <Input 
              prefix={<ShopOutlined />}
              placeholder="Merchant Code dari Tripay" 
            />
          </Form.Item>
          
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="is_sandbox"
                label="Mode Sandbox"
                valuePropName="checked"
              >
                <Switch checkedChildren="Ya" unCheckedChildren="Tidak" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="is_active"
                label="Aktifkan Tripay"
                valuePropName="checked"
              >
                <Switch checkedChildren="Aktif" unCheckedChildren="Nonaktif" />
              </Form.Item>
            </Col>
          </Row>
          
          <Divider />
          
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={saving}
              >
                Simpan Pengaturan
              </Button>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchTripaySettings}
              >
                Refresh
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default TripaySettings;