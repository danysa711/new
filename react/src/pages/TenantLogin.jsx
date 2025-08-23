import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { ConnectionContext } from "../context/ConnectionContext";
import { Form, Input, Button, Card, Typography, Row, Col, Checkbox, Alert, Spin } from "antd";
import { LockOutlined, UserOutlined, LoginOutlined } from "@ant-design/icons";
import { Navigate, Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const { Title, Text, Paragraph } = Typography;

const TenantLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [tenantError, setTenantError] = useState(null);
  
  const { token, user, tenantLogin } = useContext(AuthContext);
  const { getTenantTestUrl } = useContext(ConnectionContext);
  const { slug } = useParams();
  const navigate = useNavigate();

  // Periksa apakah tenant ada dan aktif
  useEffect(() => {
    const checkTenant = async () => {
      try {
        setTenantLoading(true);
        setTenantError(null);
        
        const testUrl = getTenantTestUrl(slug);
        const response = await axios.get(testUrl);
        
        setTenantInfo(response.data.tenant);
      } catch (err) {
        console.error("Error checking tenant:", err);
        if (err.response?.data?.code === "TENANT_NOT_FOUND") {
          setTenantError("Tenant tidak ditemukan");
        } else if (err.response?.data?.code === "INACTIVE_TENANT") {
          setTenantError("Tenant tidak aktif. Silakan hubungi pemilik tenant.");
        } else {
          setTenantError("Terjadi kesalahan saat memeriksa tenant");
        }
      } finally {
        setTenantLoading(false);
      }
    };
    
    checkTenant();
  }, [slug, getTenantTestUrl]);

  // Jika sudah login dan tenant sesuai, redirect
  if (token && user?.tenant_slug === slug) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await tenantLogin(slug, values.username, values.password, values.remember);
      
      if (!result.success) {
        setError(result.error);
      } else {
        // Redirect ke halaman utama setelah login berhasil
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  if (tenantLoading) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Col>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Memeriksa tenant...</div>
        </Col>
      </Row>
    );
  }

  if (tenantError) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
        <Col xs={24} sm={20} md={12} lg={8}>
          <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}>
            <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
              Error
            </Title>
            
            <Alert 
              message="Tenant Error" 
              description={tenantError} 
              type="error" 
              showIcon 
              style={{ marginBottom: 16 }} 
            />
            
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <Button type="primary" onClick={() => navigate("/")}>
                Kembali ke Home
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Col xs={24} sm={20} md={12} lg={8}>
        <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
            Login ke {tenantInfo?.username || slug}
          </Title>
          
          <Paragraph style={{ textAlign: "center", marginBottom: 24 }}>
            Anda login melalui tenant: <Text strong>{tenantInfo?.username}</Text>
          </Paragraph>
          
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
          
          <Form name="tenant-login" onFinish={handleSubmit} layout="vertical" initialValues={{ remember: false }}>
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Username atau email tidak boleh kosong!" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username atau Email" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password tidak boleh kosong!" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Ingat Saya</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block size="large" loading={loading} icon={<LoginOutlined />}>
                Login
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: "center" }}>
              <Link to="/login">Kembali ke login reguler</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default TenantLogin;