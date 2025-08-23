import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Typography, Button, Row, Col, List, Tag, 
  Divider, Alert, Spin, Result, Modal, Form, Input, Space
} from 'antd';
import { 
  ApiOutlined, LoginOutlined, LogoutOutlined, 
  CopyOutlined, LinkOutlined, UserOutlined, CodeOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ConnectionContext } from '../context/ConnectionContext';
import { AuthContext } from '../context/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TenantDemo = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { getTenantTestUrl, getTenantLoginUrl, getUserApiUrl } = useContext(ConnectionContext);
  const { token, user, logout, tenantLogin } = useContext(AuthContext);
  
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [loginModalVisible, setLoginModalVisible] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  const [form] = Form.useForm();
  
  useEffect(() => {
    const checkTenant = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const testUrl = getTenantTestUrl(slug);
        const response = await axios.get(testUrl);
        
        setTenantInfo(response.data.tenant);
      } catch (err) {
        console.error("Error checking tenant:", err);
        if (err.response?.data?.code === "TENANT_NOT_FOUND") {
          setError("Tenant tidak ditemukan");
        } else if (err.response?.data?.code === "INACTIVE_TENANT") {
          setError("Tenant tidak aktif. Silakan hubungi pemilik tenant.");
        } else {
          setError("Terjadi kesalahan saat memeriksa tenant");
        }
      } finally {
        setLoading(false);
      }
    };
    
    checkTenant();
  }, [slug, getTenantTestUrl]);
  
  const handleLogin = async (values) => {
    try {
      setLoginLoading(true);
      setLoginError(null);
      
      const result = await tenantLogin(slug, values.username, values.password, true);
      
      if (!result.success) {
        setLoginError(result.error);
      } else {
        setLoginModalVisible(false);
        message.success("Login berhasil");
        // Reload halaman untuk memperbarui state
        window.location.reload();
      }
    } catch (err) {
      console.error("Login error:", err);
      setLoginError(err.response?.data?.error || "Login gagal. Silakan coba lagi.");
    } finally {
      setLoginLoading(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    window.location.reload();
  };
  
  const testApiEndpoint = async () => {
    try {
      setTestLoading(true);
      
      // Gunakan token tenant untuk mengakses API
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.get(getUserApiUrl(slug), config);
      
      setTestResult({
        success: true,
        data: response.data,
        status: response.status,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("API test error:", err);
      setTestResult({
        success: false,
        error: err.response?.data?.error || "API test failed",
        status: err.response?.status,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Memeriksa tenant...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Result
        status="error"
        title="Error"
        subTitle={error}
        extra={[
          <Button type="primary" key="home" onClick={() => navigate('/')}>
            Kembali ke Home
          </Button>
        ]}
      />
    );
  }
  
  const isLoggedInToThisTenant = token && user?.tenant_slug === slug;
  
  // Contoh kode integrasi untuk menampilkan
  const jsIntegrationCode = `// Menggunakan JavaScript/Node.js
const axios = require('axios');

// Login ke tenant
async function loginToTenant() {
  try {
    const response = await axios.post('${getTenantLoginUrl(slug)}', {
      username: 'YOUR_USERNAME',
      password: 'YOUR_PASSWORD'
    });
    
    return response.data.token; // Simpan token untuk digunakan
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Menggunakan API dengan token
async function useApi(token) {
  try {
    const response = await axios.get('${getUserApiUrl(slug)}', {
      headers: {
        Authorization: \`Bearer \${token}\`
      }
    });
    
    console.log('API response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

// Penggunaan
async function main() {
  const token = await loginToTenant();
  const data = await useApi(token);
  console.log('Data:', data);
}

main();`;

  const pythonIntegrationCode = `# Menggunakan Python dengan requests
import requests

# URL tenant
TENANT_LOGIN_URL = "${getTenantLoginUrl(slug)}"
API_URL = "${getUserApiUrl(slug)}"

# Login ke tenant
def login_to_tenant(username, password):
    try:
        response = requests.post(TENANT_LOGIN_URL, json={
            "username": username,
            "password": password
        })
        response.raise_for_status()
        return response.json()["token"]
    except Exception as e:
        print(f"Login error: {e}")
        raise

# Menggunakan API dengan token
def use_api(token):
    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(API_URL, headers=headers)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"API error: {e}")
        raise

# Penggunaan
def main():
    token = login_to_tenant("YOUR_USERNAME", "YOUR_PASSWORD")
    data = use_api(token)
    print(f"Data: {data}")

if __name__ == "__main__":
    main()`;
  
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <ApiOutlined style={{ marginRight: '8px' }} />
          Tenant API Demo: {tenantInfo?.username || slug}
        </Title>
        
        <Divider />
        
        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Card title="Informasi Tenant" bordered={false}>
              <List>
                <List.Item>
                  <Text strong>Username:</Text> {tenantInfo?.username}
                </List.Item>
                <List.Item>
                  <Text strong>URL Slug:</Text> {tenantInfo?.url_slug}
                </List.Item>
                <List.Item>
                  <Text strong>Status:</Text> <Tag color="success">Aktif</Tag>
                </List.Item>
                <List.Item>
                  <Text strong>Statistik:</Text>
                  <ul>
                    <li>Produk: {tenantInfo?.stats?.software || 0}</li>
                    <li>Versi: {tenantInfo?.stats?.versions || 0}</li>
                    <li>Lisensi: {tenantInfo?.stats?.licenses || 0}</li>
                    <li>Pesanan: {tenantInfo?.stats?.orders || 0}</li>
                  </ul>
                </List.Item>
              </List>
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card title="API Endpoints" bordered={false}>
              <List>
                <List.Item actions={[
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => {
                      navigator.clipboard.writeText(getTenantLoginUrl(slug));
                      message.success("URL disalin ke clipboard");
                    }}
                  >
                    Copy
                  </Button>
                ]}>
                  <Text strong>Login URL:</Text> 
                  <div style={{ wordBreak: "break-all" }}>
                    <code>{getTenantLoginUrl(slug)}</code>
                  </div>
                </List.Item>
                <List.Item actions={[
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => {
                      navigator.clipboard.writeText(getUserApiUrl(slug));
                      message.success("URL disalin ke clipboard");
                    }}
                  >
                    Copy
                  </Button>
                ]}>
                  <Text strong>API URL:</Text> 
                  <div style={{ wordBreak: "break-all" }}>
                    <code>{getUserApiUrl(slug)}</code>
                  </div>
                </List.Item>
                <List.Item actions={[
                  <Button 
                    icon={<CopyOutlined />} 
                    onClick={() => {
                      navigator.clipboard.writeText(getTenantTestUrl(slug));
                      message.success("URL disalin ke clipboard");
                    }}
                  >
                    Copy
                  </Button>
                ]}>
                  <Text strong>Test URL:</Text> 
                  <div style={{ wordBreak: "break-all" }}>
                    <code>{getTenantTestUrl(slug)}</code>
                  </div>
                </List.Item>
              </List>
            </Card>
          </Col>
        </Row>
        
        <Divider />
        
        <Row justify="center" style={{ marginTop: '24px' }}>
          {isLoggedInToThisTenant ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                message="Login Berhasil"
                description={`Anda telah login sebagai ${user?.username} di tenant ${tenantInfo?.username || slug}`}
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Space>
                <Button 
                  type="primary" 
                  icon={<CodeOutlined />} 
                  onClick={testApiEndpoint}
                  loading={testLoading}
                >
                  Test API Endpoint
                </Button>
                
                <Button 
                  type="primary" 
                  danger 
                  icon={<LogoutOutlined />} 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </Space>
              
              {testResult && (
                <Card title="Hasil Test API" style={{ marginTop: '16px' }}>
                  <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
                    <pre style={{ margin: 0, overflow: 'auto' }}>
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                </Card>
              )}
            </Space>
          ) : (
            <Button 
              type="primary" 
              icon={<LoginOutlined />} 
              size="large"
              onClick={() => setLoginModalVisible(true)}
            >
              Login ke Tenant
            </Button>
          )}
        </Row>
        
        <Divider />
        
        <Title level={3}>Contoh Integrasi</Title>
        
        <Tabs defaultActiveKey="js">
          <TabPane tab="JavaScript" key="js">
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              <Button 
                style={{ marginBottom: '8px', float: 'right' }}
                icon={<CopyOutlined />} 
                onClick={() => {
                  navigator.clipboard.writeText(jsIntegrationCode);
                  message.success("Kode disalin ke clipboard");
                }}
              >
                Copy
              </Button>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {jsIntegrationCode}
              </pre>
            </div>
          </TabPane>
          <TabPane tab="Python" key="python">
            <div style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
              <Button 
                style={{ marginBottom: '8px', float: 'right' }}
                icon={<CopyOutlined />} 
                onClick={() => {
                  navigator.clipboard.writeText(pythonIntegrationCode);
                  message.success("Kode disalin ke clipboard");
                }}
              >
                Copy
              </Button>
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {pythonIntegrationCode}
              </pre>
            </div>
          </TabPane>
        </Tabs>
        
        <Divider />
        
        <Paragraph style={{ textAlign: 'center' }}>
          <LinkOutlined /> <a href={`/tenant/${slug}/login`} target="_blank" rel="noopener noreferrer">
            Buka halaman login tenant di tab baru
          </a>
        </Paragraph>
      </Card>
      
      <Modal
        title={`Login ke ${tenantInfo?.username || slug}`}
        visible={loginModalVisible}
        onCancel={() => setLoginModalVisible(false)}
        footer={null}
      >
        {loginError && (
          <Alert 
            message="Login Error" 
            description={loginError} 
            type="error" 
            showIcon 
            style={{ marginBottom: '16px' }} 
          />
        )}
        
        <Form form={form} onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="username"
            label="Username atau Email"
            rules={[{ required: true, message: 'Silakan masukkan username atau email' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username atau Email" />
          </Form.Item>
          
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Silakan masukkan password' }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loginLoading} block>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TenantDemo;