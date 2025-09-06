import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Modal, Form, Input, 
  Select, Typography, Card, message, DatePicker, InputNumber,
  Tooltip, Popconfirm, Row, Col, Statistic 
} from 'antd';
import { 
  PlusOutlined, CalendarOutlined, UserOutlined,
  ClockCircleOutlined, EditOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    canceled: 0
  });
  
  const [modalVisible, setModalVisible] = useState(false);
  const [extendModalVisible, setExtendModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [form] = Form.useForm();
  const [extendForm] = Form.useForm();

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subscriptions
      const subsResponse = await axiosInstance.get('/api/subscriptions');
      console.log('Subscriptions response:', subsResponse.data);
      setSubscriptions(subsResponse.data);
      
      // Calculate stats
      const total = subsResponse.data.length;
      const active = subsResponse.data.filter(sub => 
        sub.status === 'active' && new Date(sub.end_date) > new Date()
      ).length;
      const expired = subsResponse.data.filter(sub => 
        sub.status === 'active' && new Date(sub.end_date) <= new Date()
      ).length;
      const canceled = subsResponse.data.filter(sub => 
        sub.status === 'canceled'
      ).length;
      
      setStats({ total, active, expired, canceled });
      
      // Fetch users dengan parameter admin=true
      const usersResponse = await axiosInstance.get('/api/users?admin=true');
      console.log('Users response:', usersResponse.data);
      setUsers(usersResponse.data);
      
      // Fetch subscription plans dengan parameter admin=true
      const plansResponse = await axiosInstance.get('/api/subscription-plans?admin=true');
      console.log('Plans response:', plansResponse.data);
      setPlans(plansResponse.data);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Gagal memuat data langganan. Periksa koneksi backend atau login kembali.');
      
      // Jika ada error khusus, tampilkan pesannya
      if (error.response?.data?.error) {
        message.error(`Error: ${error.response.data.error}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenExtendModal = (subscription) => {
    setSelectedSubscription(subscription);
    extendForm.resetFields();
    setExtendModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const payload = {
        user_id: values.user_id,
        payment_method: values.payment_method
      };
      
      // Either use plan_id or custom_days
     if (values.use_plan) {
       payload.plan_id = values.plan_id;
     } else {
       payload.custom_days = values.custom_days;
     }
     
     // Tambahkan parameter admin=true
     const response = await axiosInstance.post('/api/subscriptions?admin=true', payload);
     console.log('Create subscription response:', response.data);
     message.success('Langganan berhasil dibuat');
     
     setModalVisible(false);
     fetchData();
   } catch (error) {
     console.error('Error creating subscription:', error);
     message.error(error.response?.data?.error || 'Gagal membuat langganan');
   } finally {
     setLoading(false);
   }
 };

 const handleExtendSubmit = async () => {
   try {
     const values = await extendForm.validateFields();
     setLoading(true);
     
     // Tambahkan parameter admin=true
     const response = await axiosInstance.put(
       `/api/subscriptions/${selectedSubscription.id}/extend?admin=true`, 
       { days: values.days }
     );
     console.log('Extend subscription response:', response.data);
     
     message.success('Langganan berhasil diperpanjang');
     setExtendModalVisible(false);
     fetchData();
   } catch (error) {
     console.error('Error extending subscription:', error);
     message.error(error.response?.data?.error || 'Gagal memperpanjang langganan');
   } finally {
     setLoading(false);
   }
 };

 const handleUpdateStatus = async (id, status, payment_status = null) => {
   try {
     setLoading(true);
     const payload = { status };
     if (payment_status) {
       payload.payment_status = payment_status;
     }
     
     // Tambahkan parameter admin=true
     const response = await axiosInstance.put(`/api/subscriptions/${id}/status?admin=true`, payload);
     console.log('Update status response:', response.data);
     message.success('Status langganan berhasil diperbarui');
     fetchData();
   } catch (error) {
     console.error('Error updating subscription status:', error);
     message.error('Gagal memperbarui status langganan');
   } finally {
     setLoading(false);
   }
 };

 // Format date
 const formatDate = (dateString) => {
   return new Date(dateString).toLocaleDateString('id-ID', {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
   });
 };

 const columns = [
   {
     title: 'User',
     dataIndex: 'User',
     key: 'user',
     render: (user) => (
       <>
         <div><strong>{user.username}</strong></div>
         <div>{user.email}</div>
         <div>
           <a href={`/user/page/${user.url_slug}`} target="_blank" rel="noopener noreferrer">
             {user.url_slug}
           </a>
         </div>
       </>
     ),
     sorter: (a, b) => a.User.username.localeCompare(b.User.username),
   },
   {
     title: 'Start Date',
     dataIndex: 'start_date',
     key: 'start_date',
     render: (date) => formatDate(date),
     sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date),
   },
   {
     title: 'End Date',
     dataIndex: 'end_date',
     key: 'end_date',
     render: (date) => formatDate(date),
     sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date),
   },
   {
     title: 'Status',
     dataIndex: 'status',
     key: 'status',
     render: (status, record) => {
       let color = 'default';
       let displayText = status.toUpperCase();
       
       if (status === 'active') {
         const now = new Date();
         const endDate = new Date(record.end_date);
         
         if (endDate > now) {
           color = 'success';
           displayText = 'ACTIVE';
         } else {
           color = 'error';
           displayText = 'EXPIRED';
         }
       } else if (status === 'canceled') {
         color = 'warning';
       }
       
       return <Tag color={color}>{displayText}</Tag>;
     },
     filters: [
       { text: 'Active', value: 'active' },
       { text: 'Canceled', value: 'canceled' },
     ],
     onFilter: (value, record) => record.status === value,
   },
   {
     title: 'Payment Status',
     dataIndex: 'payment_status',
     key: 'payment_status',
     render: (status) => {
       let color = 'default';
       if (status === 'paid') color = 'success';
       if (status === 'pending') color = 'warning';
       if (status === 'failed') color = 'error';
       
       return <Tag color={color}>{status.toUpperCase()}</Tag>;
     },
     filters: [
       { text: 'Paid', value: 'paid' },
       { text: 'Pending', value: 'pending' },
       { text: 'Failed', value: 'failed' },
     ],
     onFilter: (value, record) => record.payment_status === value,
   },
   {
     title: 'Payment Method',
     dataIndex: 'payment_method',
     key: 'payment_method',
     render: (method) => method || '-',
   },
   {
     title: 'Actions',
     key: 'actions',
     render: (_, record) => {
       const isExpired = new Date(record.end_date) <= new Date() && record.status === 'active';
       
       return (
         <Space size="small">
           <Tooltip title="Extend Subscription">
             <Button 
               icon={<CalendarOutlined />} 
               onClick={() => handleOpenExtendModal(record)}
             />
           </Tooltip>
           
           {record.status === 'active' && !isExpired && (
             <Tooltip title="Mark as Canceled">
               <Button 
                 danger
                 onClick={() => handleUpdateStatus(record.id, 'canceled')}
               >
                 Cancel
               </Button>
             </Tooltip>
           )}
           
           {(record.status === 'canceled' || isExpired) && (
             <Tooltip title="Reactivate">
               <Button 
                 type="primary" 
                 onClick={() => handleUpdateStatus(record.id, 'active')}
               >
                 Activate
               </Button>
             </Tooltip>
           )}
           
           {record.payment_status === 'pending' && (
             <Tooltip title="Mark as Paid">
               <Button 
                 type="primary" 
                 onClick={() => handleUpdateStatus(record.id, null, 'paid')}
               >
                 Paid
               </Button>
             </Tooltip>
           )}
         </Space>
       );
     },
   },
 ];

 return (
   <div>
     <Title level={3}>Subscription Management</Title>
     
     {/* Stats Cards */}
     <Row gutter={16} style={{ marginBottom: 24 }}>
       <Col span={6}>
         <Card>
           <Statistic title="Total Subscriptions" value={stats.total} />
         </Card>
       </Col>
       <Col span={6}>
         <Card>
           <Statistic 
             title="Active Subscriptions" 
             value={stats.active} 
             valueStyle={{ color: '#3f8600' }} 
           />
         </Card>
       </Col>
       <Col span={6}>
         <Card>
           <Statistic 
             title="Expired Subscriptions" 
             value={stats.expired} 
             valueStyle={{ color: '#cf1322' }} 
           />
         </Card>
       </Col>
       <Col span={6}>
         <Card>
           <Statistic 
             title="Canceled Subscriptions" 
             value={stats.canceled} 
             valueStyle={{ color: '#faad14' }} 
           />
         </Card>
       </Col>
     </Row>
     
     <Card
       title="All Subscriptions"
       extra={
         <Button 
           type="primary" 
           icon={<PlusOutlined />} 
           onClick={handleOpenModal}
         >
           Add Subscription
         </Button>
       }
     >
       <Table 
         dataSource={subscriptions} 
         columns={columns} 
         rowKey="id" 
         loading={loading}
         pagination={{ pageSize: 10 }}
       />
     </Card>

     {/* Add Subscription Modal */}
     <Modal
       title="Add New Subscription"
       open={modalVisible}
       onOk={handleSubmit}
       onCancel={() => setModalVisible(false)}
       confirmLoading={loading}
       width={600}
     >
       <Form form={form} layout="vertical" initialValues={{ use_plan: true }}>
         <Form.Item
           name="user_id"
           label="User"
           rules={[{ required: true, message: 'Please select a user' }]}
         >
           <Select
             showSearch
             placeholder="Select a user"
             optionFilterProp="children"
             filterOption={(input, option) =>
               option.children.toLowerCase().includes(input.toLowerCase())
             }
           >
             {users.map(user => (
               <Option key={user.id} value={user.id}>{user.username} ({user.email})</Option>
             ))}
           </Select>
         </Form.Item>
         
         <Form.Item name="use_plan" label="Subscription Duration">
           <Select>
             <Option value={true}>Use Predefined Plan</Option>
             <Option value={false}>Custom Duration</Option>
           </Select>
         </Form.Item>
         
         <Form.Item
           noStyle
           shouldUpdate={(prevValues, currentValues) => prevValues.use_plan !== currentValues.use_plan}
         >
           {({ getFieldValue }) => 
             getFieldValue('use_plan') ? (
               <Form.Item
                 name="plan_id"
                 label="Subscription Plan"
                 rules={[{ required: true, message: 'Please select a plan' }]}
               >
                 <Select placeholder="Select a plan">
                   {plans.map(plan => (
                     <Option key={plan.id} value={plan.id}>
                       {plan.name} - {plan.duration_days} days (Rp {plan.price.toLocaleString('id-ID')})
                     </Option>
                   ))}
                 </Select>
               </Form.Item>
             ) : (
               <Form.Item
                 name="custom_days"
                 label="Custom Duration (days)"
                 rules={[
                   { required: true, message: 'Please enter duration' },
                   { type: 'number', min: 1, message: 'Duration must be at least 1 day' }
                 ]}
               >
                 <InputNumber min={1} style={{ width: '100%' }} />
               </Form.Item>
             )
           }
         </Form.Item>
         
         <Form.Item
           name="payment_method"
           label="Payment Method"
           initialValue="manual"
         >
           <Select>
             <Option value="manual">Manual</Option>
             <Option value="transfer">Bank Transfer</Option>
             <Option value="cash">Cash</Option>
           </Select>
         </Form.Item>
       </Form>
     </Modal>

     {/* Extend Subscription Modal */}
     <Modal
       title="Extend Subscription"
       open={extendModalVisible}
       onOk={handleExtendSubmit}
       onCancel={() => setExtendModalVisible(false)}
       confirmLoading={loading}
     >
       {selectedSubscription && (
         <div style={{ marginBottom: 16 }}>
           <p><strong>User:</strong> {selectedSubscription.User.username}</p>
           <p><strong>Current End Date:</strong> {formatDate(selectedSubscription.end_date)}</p>
         </div>
       )}
       
       <Form form={extendForm} layout="vertical">
         <Form.Item
           name="days"
           label="Extend Duration (days)"
           rules={[
             { required: true, message: 'Please enter extension days' },
             { type: 'number', min: 1, message: 'Duration must be at least 1 day' }
           ]}
         >
           <InputNumber min={1} style={{ width: '100%' }} />
         </Form.Item>
       </Form>
     </Modal>
   </div>
 );
};

export default SubscriptionManagement;