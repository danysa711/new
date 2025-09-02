// File: react/src/pages/admin/UserManagement.jsx

import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, 
  Select, Typography, Card, message, Tooltip, Popconfirm 
} from 'antd';
import { 
  UserAddOutlined, EditOutlined, DeleteOutlined, 
  KeyOutlined, UserSwitchOutlined 
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'reset'
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log("Fetching users with admin parameter...");
      // Tambahkan parameter admin=true
      const response = await axiosInstance.get('/api/users?admin=true');
      console.log("Users response:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Gagal memuat data pengguna');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = (type, user = null) => {
    setModalType(type);
    setSelectedUser(user);
    
    form.resetFields();
    
    if (user && type === 'edit') {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        role: user.role,
      });
    }
    
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (modalType === 'add') {
        // Tambahkan parameter admin=true
        await axiosInstance.post('/api/users?admin=true', values);
        message.success('User created successfully');
      } else if (modalType === 'edit') {
        // Tambahkan parameter admin=true
        await axiosInstance.put(`/api/users/${selectedUser.id}/role?admin=true`, { role: values.role });
        message.success('User role updated successfully');
      } else if (modalType === 'reset') {
        // Tambahkan parameter admin=true
        await axiosInstance.put(`/api/users/${selectedUser.id}/reset-password?admin=true`, { 
          newPassword: values.newPassword 
        });
        message.success('Password reset successfully');
      }
      
      setModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    try {
      setLoading(true);
      // Tambahkan parameter admin=true
      await axiosInstance.delete(`/api/users/${userId}?admin=true`);
      message.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role}
        </Tag>
      ),
      filters: [
        { text: 'Admin', value: 'admin' },
        { text: 'User', value: 'user' },
      ],
      onFilter: (value, record) => record.role === value,
    },
    {
      title: 'URL Slug',
      dataIndex: 'url_slug',
      key: 'url_slug',
      render: (slug) => (
        <a href={`/user/page/${slug}`} target="_blank" rel="noopener noreferrer">
          {slug}
        </a>
      ),
    },
    {
      title: 'Subscription',
      key: 'subscription',
      render: (_, record) => (
        <Tag color={record.hasActiveSubscription ? 'success' : 'error'}>
          {record.hasActiveSubscription ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.hasActiveSubscription === value,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Change Role">
            <Button 
              icon={<UserSwitchOutlined />} 
              onClick={() => handleOpenModal('edit', record)}
            />
          </Tooltip>
          <Tooltip title="Reset Password">
            <Button 
              icon={<KeyOutlined />} 
              onClick={() => handleOpenModal('reset', record)}
            />
          </Tooltip>
          <Tooltip title="Delete User">
            <Popconfirm
              title="Are you sure you want to delete this user?"
              onConfirm={() => handleDelete(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>User Management</Title>
          <Button 
            type="primary" 
            icon={<UserAddOutlined />} 
            onClick={() => handleOpenModal('add')}
          >
            Add User
          </Button>
        </div>
        
        <Table 
          dataSource={users} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={
          modalType === 'add' ? 'Add New User' : 
          modalType === 'edit' ? 'Edit User Role' : 
          'Reset User Password'
        }
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          {modalType === 'add' && (
            <>
              <Form.Item
                name="username"
                label="Username"
                rules={[
                  { required: true, message: 'Please input a username' },
                  { min: 3, message: 'Username must be at least 3 characters' },
                  { pattern: /^[a-zA-Z0-9_]+$/, message: 'Username can only contain letters, numbers and underscore' }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input an email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: 'Please input a password' },
                  { min: 8, message: 'Password must be at least 8 characters' },
                  { 
                    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
                    message: 'Password must contain at least one letter and one number' 
                  }
                ]}
              >
                <Input.Password />
              </Form.Item>
            </>
          )}
          
          {modalType === 'edit' && (
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select a role' }]}
            >
              <Select>
                <Option value="user">User</Option>
                <Option value="admin">Admin</Option>
              </Select>
            </Form.Item>
          )}
          
          {modalType === 'reset' && (
            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: 'Please input a new password' },
                { min: 8, message: 'Password must be at least 8 characters' },
                { 
                  pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Password must contain at least one letter and one number' 
                }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;