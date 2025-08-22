// react/src/pages/admin/SubscriptionManagement.jsx
import React, { useState, useEffect, useContext } from "react";
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Typography,
  Popconfirm,
  message,
  Tag,
  Spin,
  Row,
  Col,
  Card,
  Tooltip
} from "antd";
import { 
  CrownOutlined, 
  UserOutlined, 
  CalendarOutlined, 
  ReloadOutlined,
  CheckCircleOutlined,
  SearchOutlined
} from "@ant-design/icons";
import { AdminContext } from "../../context/AdminContext";
import moment from "moment";
import axiosInstance from "../../services/axios";

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const SubscriptionManagement = () => {
  const { 
    subscriptions,
    loading, 
    fetchUsers, 
    fetchSubscriptions,
    fetchPaymentMethods,
    createSubscription,
    updateSubscription,
    deleteSubscription,
    approvePayment
  } = useContext(AdminContext);
  
  const [users, setUsers] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah Langganan");
  const [form] = Form.useForm();
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([]);
  
  useEffect(() => {
    fetchSubscriptions();
    loadUsers();
    loadPaymentMethods();
  }, []);
  
  useEffect(() => {
    if (subscriptions) {
      setFilteredSubscriptions(
        subscriptions.filter(
          (subscription) =>
            subscription.User?.username?.toLowerCase().includes(searchText.toLowerCase()) ||
            subscription.User?.email?.toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
  }, [subscriptions, searchText]);
  
  const loadUsers = async () => {
    try {
      const response = await axiosInstance.get("/api/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };
  
  const loadPaymentMethods = async () => {
    try {
      const response = await axiosInstance.get("/api/payment-methods");
      setPaymentMethods(response.data);
    } catch (error) {
      console.error("Error loading payment methods:", error);
    }
  };
  
  const showAddModal = () => {
    setModalTitle("Tambah Langganan");
    setEditingSubscription(null);
    form.resetFields();
    setModalVisible(true);
  };
  
  const showEditModal = (subscription) => {
    setModalTitle("Edit Langganan");
    setEditingSubscription(subscription);
    form.setFieldsValue({
      user_id: subscription.user_id,
      date_range: [
        moment(subscription.start_date),
        moment(subscription.end_date)
      ],
      status: subscription.status,
      payment_status: subscription.payment_status,
      payment_method: subscription.payment_method
    });
    setModalVisible(true);
  };
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      // Process date range
      const [startDate, endDate] = values.date_range;
      
      const subscriptionData = {
        user_id: values.user_id,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: values.status,
        payment_status: values.payment_status,
        payment_method: values.payment_method
      };
      
      if (editingSubscription) {
        // Update existing subscription
        const result = await updateSubscription(editingSubscription.id, subscriptionData);
        if (result.success) {
          message.success("Langganan berhasil diperbarui");
          setModalVisible(false);
        } else {
          message.error(result.error);
        }
      } else {
        // Create new subscription
        const result = await createSubscription(subscriptionData);
        if (result.success) {
          message.success("Langganan berhasil ditambahkan");
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
  
  const handleDelete = async (subscriptionId) => {
    try {
      const result = await deleteSubscription(subscriptionId);
      if (result.success) {
        message.success("Langganan berhasil dihapus");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting subscription:", error);
      message.error("Gagal menghapus langganan");
    }
  };
  
  const handleApprovePayment = async (subscriptionId) => {
    try {
      const result = await approvePayment(subscriptionId);
      if (result.success) {
        message.success("Pembayaran berhasil dikonfirmasi");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error approving payment:", error);
      message.error("Gagal mengonfirmasi pembayaran");
    }
  };
  
  const handleAddDuration = async (subscriptionId, durationDays) => {
    try {
      const subscription = subscriptions.find(s => s.id === subscriptionId);
      if (!subscription) {
        message.error("Langganan tidak ditemukan");
        return;
      }
      
      const endDate = new Date(subscription.end_date);
      endDate.setDate(endDate.getDate() + durationDays);
      
      const result = await updateSubscription(subscriptionId, {
        end_date: endDate.toISOString()
      });
      
      if (result.success) {
        message.success(`Durasi berhasil ditambahkan ${durationDays} hari`);
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error adding duration:", error);
      message.error("Gagal menambahkan durasi");
    }
  };
  
  const columns = [
    {
      title: "User",
      dataIndex: "User",
      key: "user",
      render: (user) => user ? (
        <Tooltip title={user.email || ""}>
          <Tag icon={<UserOutlined />} color="blue">
            {user.username}
          </Tag>
        </Tooltip>
      ) : "-"
    },
    {
      title: "Tanggal Mulai",
      dataIndex: "start_date",
      key: "start_date",
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString("id-ID")}>
          {new Date(date).toLocaleDateString("id-ID")}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.start_date) - new Date(b.start_date)
    },
    {
      title: "Tanggal Berakhir",
      dataIndex: "end_date",
      key: "end_date",
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString("id-ID")}>
          {new Date(date).toLocaleDateString("id-ID")}
        </Tooltip>
      ),
      sorter: (a, b) => new Date(a.end_date) - new Date(b.end_date)
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color;
        switch (status) {
          case "active":
            color = "green";
            break;
          case "expired":
            color = "red";
            break;
          case "canceled":
            color = "orange";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Status Pembayaran",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status) => {
        let color;
        switch (status) {
          case "paid":
            color = "green";
            break;
          case "pending":
            color = "orange";
            break;
          case "failed":
            color = "red";
            break;
          default:
            color = "default";
        }
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Metode Pembayaran",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (method) => method || "-"
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="primary" size="small" onClick={() => showEditModal(record)}>
            Edit
          </Button>
          
          {record.payment_status === "pending" && (
            <Button 
              type="primary" 
              size="small" 
              icon={<CheckCircleOutlined />} 
              onClick={() => handleApprovePayment(record.id)}
            >
              Konfirmasi
            </Button>
          )}
          
          <Popconfirm
            title="Yakin ingin menghapus langganan ini?"
            onConfirm={() => handleDelete(record.id)}
            okText="Ya"
            cancelText="Tidak"
          >
            <Button type="danger" size="small">
              Hapus
            </Button>
          </Popconfirm>
          
          <Button 
            size="small" 
            onClick={() => handleAddDuration(record.id, 1)}
          >
            +1 Hari
          </Button>
          
          <Button 
            size="small" 
            onClick={() => handleAddDuration(record.id, 7)}
          >
            +7 Hari
          </Button>
          
          <Button 
            size="small" 
            onClick={() => handleAddDuration(record.id, 30)}
          >
            +30 Hari
          </Button>
        </Space>
      )
    }
  ];
  
  return (
    <div>
      <Title level={2}>
        <CrownOutlined /> Kelola Langganan
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
              Tambah Langganan
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchSubscriptions}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
          <p>Loading data langganan...</p>
        </div>
      ) : (
        <Table 
          dataSource={filteredSubscriptions} 
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
          initialValues={{ 
            status: "active", 
            payment_status: "pending" 
          }}
        >
          <Form.Item
            name="user_id"
            label="User"
            rules={[{ required: true, message: "User wajib dipilih" }]}
          >
            <Select 
              placeholder="Pilih user" 
              showSearch
              optionFilterProp="children"
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.username} {user.email ? `(${user.email})` : ''}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="date_range"
            label="Periode Langganan"
            rules={[{ required: true, message: "Periode langganan wajib diisi" }]}
          >
            <RangePicker 
              style={{ width: '100%' }} 
              showTime={{ format: 'HH:mm' }}
              format="YYYY-MM-DD HH:mm"
            />
          </Form.Item>
          
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status wajib dipilih" }]}
          >
            <Select placeholder="Pilih status">
              <Option value="active">Active</Option>
              <Option value="expired">Expired</Option>
              <Option value="canceled">Canceled</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="payment_status"
            label="Status Pembayaran"
            rules={[{ required: true, message: "Status pembayaran wajib dipilih" }]}
          >
            <Select placeholder="Pilih status pembayaran">
              <Option value="pending">Pending</Option>
              <Option value="paid">Paid</Option>
              <Option value="failed">Failed</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="payment_method"
            label="Metode Pembayaran"
          >
            <Select placeholder="Pilih metode pembayaran" allowClear>
              <Option value="manual">Manual</Option>
              {paymentMethods.map(method => (
                <Option key={method.id} value={method.code}>
                  {method.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionManagement;