// react/src/pages/admin/UserManagement.jsx
import React, { useState, useEffect, useContext } from "react";
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Typography,
  Popconfirm,
  message,
  Tag,
  Tooltip,
  Spin,
  Row,
  Col
} from "antd";
import { 
  UserOutlined, 
  MailOutlined, 
  LockOutlined, 
  GlobalOutlined,
  LinkOutlined,
  ReloadOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { AdminContext } from "../../context/AdminContext";
import axiosInstance from "../../services/axios";

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const { 
    users, 
    loading, 
    fetchUsers, 
    createUser, 
    updateUser, 
    deleteUser 
  } = useContext(AdminContext);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah User");
  const [form] = Form.useForm();
  const [editingUser, setEditingUser] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    if (users) {
      setFilteredUsers(
        users.filter(
          (user) =>
            user.username.toLowerCase().includes(searchText.toLowerCase()) ||
            (user.email && user.email.toLowerCase().includes(searchText.toLowerCase()))
        )
      );
    }
  }, [users, searchText]);
  
  const showAddModal = () => {
    setModalTitle("Tambah User");
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const showEditModal = (user) => {
    setModalTitle("Edit User");
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      email: user.email,
      role: user.role,
      url_active: user.url_active
    });
    setModalVisible(true);
  };
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      if (editingUser) {
        // Update existing user
        const result = await updateUser(editingUser.id, values);
        if (result.success) {
          message.success("User berhasil diperbarui");
          setModalVisible(false);
        } else {
          message.error(result.error);
        }
      } else {
        // Create new user
        const result = await createUser(values);
        if (result.success) {
          message.success("User berhasil ditambahkan");
          setModalVisible(false);
        } else {
          message.error(result.error);
        }
      }
    } catch (error) {
      console.error("Form validation error:", error);
    } finally {
      setConfirmLoading(false);
    }
  };
  
  const handleDelete = async (userId) => {
    try {
      const result = await deleteUser(userId);
      if (result.success) {
        message.success("User berhasil dihapus");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error("Gagal menghapus user");
    }
  };
  
  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = 10;
    let password = "";
    
    // Ensure there's at least one letter and one number
    password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
    password += "0123456789"[Math.floor(Math.random() * 10)];
    
    // Fill up the rest
    for (let i = 2; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => 0.5 - Math.random()).join('');
    
    form.setFieldsValue({ password });
  };
  
  const columns = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => email || "-"
    },
    {
      title: "URL Slug",
      dataIndex: "url_slug",
      key: "url_slug",
      render: (slug) => (
        <Tooltip title={`https://kinterstore.my.id/${slug}`}>
          <Tag icon={<LinkOutlined />} color="blue">
            {slug || "-"}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role) => (
        <Tag color={role === "admin" ? "red" : "blue"}>
          {role.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "URL Aktif",
      dataIndex: "url_active",
      key: "url_active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "AKTIF" : "TIDAK AKTIF"}
        </Tag>
      )
    },
    {
      title: "Tgl Dibuat",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString("id-ID")
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space size="small">
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Yakin ingin menghapus user ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="danger" size="small">
              Hapus
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  return (
    <div>
      <Title level={2}>
        <UserOutlined /> Kelola User
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Input
            placeholder="Cari berdasarkan username atau email"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col span={12} style={{ textAlign: "right" }}>
          <Space>
            <Button type="primary" onClick={showAddModal}>
              Tambah User
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
          <p>Loading data user...</p>
        </div>
      ) : (
        <Table 
          dataSource={filteredUsers} 
          columns={columns} 
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}
      
      {/* Modal Form */}
      <Modal
        title={modalTitle}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={confirmLoading}
        width={600}
      >
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{ role: "user", url_active: false }}
        >
          <Form.Item
            name="username"
            label="Username"
            rules={[{ required: true, message: "Username wajib diisi" }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Username" />
          </Form.Item>
          
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { type: "email", message: "Format email tidak valid" }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: "Password wajib diisi" },
                { min: 8, message: "Password minimal 8 karakter" },
                {
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
                  message: "Password harus mengandung huruf dan angka"
                }
              ]}
              extra={
                <Button type="link" onClick={generatePassword}>
                  Generate Password
                </Button>
              }
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>
          )}
          
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role wajib diisi" }]}
          >
            <Select placeholder="Pilih role">
              <Option value="user">User</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="url_active"
            label="URL Aktif"
            valuePropName="checked"
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Tidak Aktif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;