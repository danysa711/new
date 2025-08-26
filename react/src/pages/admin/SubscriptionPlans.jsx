import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, 
  Typography, Card, message, InputNumber, Switch,
  Tooltip, Popconfirm 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title } = Typography;
const { TextArea } = Input;

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [form] = Form.useForm();

  const fetchPlans = async () => {
  try {
    setLoading(true);
    // Tambahkan parameter admin=true untuk menandai request dari admin
    const response = await axiosInstance.get('/api/subscription-plans?admin=true');
    setPlans(response.data);
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    message.error('Gagal memuat paket langganan. Silakan coba lagi.');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleOpenModal = (type, plan = null) => {
    setModalType(type);
    setSelectedPlan(plan);
    
    form.resetFields();
    
    if (plan && type === 'edit') {
      form.setFieldsValue({
        name: plan.name,
        duration_days: plan.duration_days,
        price: plan.price,
        description: plan.description,
        is_active: plan.is_active
      });
    }
    
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (modalType === 'add') {
        await axiosInstance.post('/api/subscription-plans', values);
        message.success('Subscription plan created successfully');
      } else if (modalType === 'edit') {
        await axiosInstance.put(`/api/subscription-plans/${selectedPlan.id}`, values);
        message.success('Subscription plan updated successfully');
      }
      
      setModalVisible(false);
      fetchPlans();
    } catch (error) {
      console.error('Error submitting form:', error);
      message.error(error.response?.data?.error || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId) => {
    try {
      setLoading(true);
      await axiosInstance.delete(`/api/subscription-plans/${planId}`);
      message.success('Subscription plan deleted successfully');
      fetchPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      message.error(error.response?.data?.error || 'Failed to delete plan');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Duration (days)',
      dataIndex: 'duration_days',
      key: 'duration_days',
      sorter: (a, b) => a.duration_days - b.duration_days,
    },
    {
      title: 'Price (Rp)',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `Rp ${price.toLocaleString('id-ID')}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value, record) => record.is_active === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Edit Plan">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleOpenModal('edit', record)}
            />
          </Tooltip>
          <Tooltip title="Delete Plan">
            <Popconfirm
              title="Are you sure you want to delete this plan?"
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
          <Title level={3}>Subscription Plans</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => handleOpenModal('add')}
          >
            Add Plan
          </Button>
        </div>
        
        <Table 
          dataSource={plans} 
          columns={columns} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={modalType === 'add' ? 'Add New Plan' : 'Edit Plan'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" initialValues={{ is_active: true }}>
          <Form.Item
            name="name"
            label="Plan Name"
            rules={[{ required: true, message: 'Please input plan name' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="duration_days"
            label="Duration (days)"
            rules={[
              { required: true, message: 'Please input duration' },
              { type: 'number', min: 1, message: 'Duration must be at least 1 day' }
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Price (Rp)"
            rules={[
              { required: true, message: 'Please input price' },
              { type: 'number', min: 0, message: 'Price cannot be negative' }
            ]}
          >
            <InputNumber 
              min={0} 
              step={10000}
              style={{ width: '100%' }} 
              formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\Rp\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionPlans;