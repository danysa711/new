import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, Row, Col, Checkbox, Alert } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Navigate, Link } from "react-router-dom";

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, token, user } = useContext(AuthContext);

  if (token) {
    // Redirect admin to admin dashboard
    if (user?.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    
    // Redirect regular users to their user page
    if (user?.url_slug) {
      return <Navigate to={`/user/page/${user.url_slug}`} replace />;
    }
    
    // Fallback
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await login(values.username, values.password, values.remember);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.error || "Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Col xs={24} sm={20} md={12} lg={8}>
        <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
            Login
          </Title>
          
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
          
          <Form name="login" onFinish={handleSubmit} layout="vertical" initialValues={{ remember: false }}>
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
              <Button type="primary" htmlType="submit" block size="large" loading={loading}>
                Login
              </Button>
            </Form.Item>
            
            <div style={{ textAlign: "center" }}>
              Belum punya akun? <Link to="/register">Daftar</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default Login;