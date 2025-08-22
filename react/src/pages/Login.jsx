// react/src/pages/Login.jsx
import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, Row, Col, Checkbox, Alert } from "antd";
import { LockOutlined, UserOutlined } from "@ant-design/icons";
import { Link, Navigate } from "react-router-dom";

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login, token } = useContext(AuthContext);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    const result = await login(values.username, values.password, values.remember);
    setLoading(false);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Col xs={24} sm={20} md={12} lg={8}>
        <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
            Login
          </Title>
          
          {error && (
            <Alert 
              message={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: "16px" }} 
            />
          )}
          
          <Form name="login" onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="username"
              rules={[{ required: true, message: "Username tidak boleh kosong!" }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: "Password tidak boleh kosong!" }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
            </Form.Item>

            {/* Remember Me Checkbox */}
            <Form.Item name="remember" valuePropName="checked">
              <Checkbox>Remember Me</Checkbox>
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