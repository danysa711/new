import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Form, Input, Button, Card, Typography, Row, Col, Alert } from "antd";
import { LockOutlined, UserOutlined, MailOutlined } from "@ant-design/icons";
import { Navigate, Link } from "react-router-dom";

const { Title } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register, token } = useContext(AuthContext);

  if (token) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    setError(null);
    
    const { username, email, password } = values;
    
    const result = await register(username, email, password);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      <Col xs={24} sm={20} md={12} lg={8}>
        <Card style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }}>
          <Title level={2} style={{ textAlign: "center", marginBottom: "24px" }}>
            Daftar Akun Baru
          </Title>
          
          {error && <Alert message={error} type="error" showIcon style={{ marginBottom: 16 }} />}
          
          <Form name="register" onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="username"
              rules={[
                { required: true, message: "Username tidak boleh kosong!" },
                { min: 3, message: "Username minimal 3 karakter!" },
                { pattern: /^[a-zA-Z0-9_]+$/, message: "Username hanya boleh berisi huruf, angka, dan underscore!" }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="Username" size="large" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: "Email tidak boleh kosong!" },
                { type: "email", message: "Format email tidak valid!" }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: "Password tidak boleh kosong!" },
                { min: 8, message: "Password minimal 8 karakter!" },
                { 
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
                 message: "Password harus mengandung huruf dan angka!" 
               }
             ]}
           >
             <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
           </Form.Item>

           <Form.Item
             name="confirmPassword"
             dependencies={["password"]}
             rules={[
               { required: true, message: "Konfirmasi password tidak boleh kosong!" },
               ({ getFieldValue }) => ({
                 validator(_, value) {
                   if (!value || getFieldValue("password") === value) {
                     return Promise.resolve();
                   }
                   return Promise.reject(new Error("Password tidak sama!"));
                 },
               }),
             ]}
           >
             <Input.Password prefix={<LockOutlined />} placeholder="Konfirmasi Password" size="large" />
           </Form.Item>

           <Form.Item>
             <Button type="primary" htmlType="submit" block size="large" loading={loading}>
               Daftar
             </Button>
           </Form.Item>
           
           <div style={{ textAlign: "center" }}>
             Sudah punya akun? <Link to="/login">Login</Link>
           </div>
         </Form>
       </Card>
     </Col>
   </Row>
 );
};

export default Register;