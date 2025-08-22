// react/src/pages/admin/SubscriptionPlanManagement.jsx
import React, { useState, useEffect, useContext } from "react";
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  InputNumber,
  Switch, 
  Typography,
  Popconfirm,
  message,
  Tag,
  Spin,
  Row,
  Col
} from "antd";
import { 
  CrownOutlined, 
  CalendarOutlined, 
  DollarOutlined, 
  ReloadOutlined
} from "@ant-design/icons";
import { AdminContext } from "../../context/AdminContext";

const { Title, Text } = Typography;
const { TextArea } = Input;

const SubscriptionPlanManagement = () => {
  const { 
    subscriptionPlans,
    loading, 
    fetchSubscriptionPlans,
    createSubscriptionPlan,
    updateSubscriptionPlan,
    deleteSubscriptionPlan
  } = useContext(AdminContext);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah Paket Langganan");
  const [form] = Form.useForm();
  const [editingPlan, setEditingPlan] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);
  
  const showAddModal = () => {
    setModalTitle("Tambah Paket Langganan");
    setEditingPlan(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true });
    setModalVisible(true);
  };
  
  const showEditModal = (plan) => {
    setModalTitle("Edit Paket Langganan");
    setEditingPlan(plan);
    form.setFieldsValue({
      name: plan.name,
      duration_days: plan.duration_days,
      price: plan.price,
      description: plan.description,
      is_active: plan.is_active
    });
    setModalVisible(true);
  };
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      if (editingPlan) {
        // Update existing plan
        const result = await updateSubscriptionPlan(editingPlan.id, values);
        if (result.success) {
          message.success("Paket langganan berhasil diperbarui");
          setModalVisible(false);
        } else {
          message.error(result.error);
        }
      } else {
        // Create new plan
        const result = await createSubscriptionPlan(values);
        if (result.success) {
          message.success("Paket langganan berhasil ditambahkan");
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
  
  const handleDelete = async (planId) => {
    try {
      const result = await deleteSubscriptionPlan(planId);
      if (result.success) {
        message.success("Paket langganan berhasil dihapus");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      message.error("Gagal menghapus paket langganan");
    }
  };
  
  const columns = [
    {
      title: "Nama Paket",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: "Durasi (Hari)",
      dataIndex: "duration_days",
      key: "duration_days",
      sorter: (a, b) => a.duration_days - b.duration_days
    },
    {
      title: "Harga",
      dataIndex: "price",
      key: "price",
      render: (price) => `Rp ${parseFloat(price).toLocaleString("id-ID")}`,
      sorter: (a, b) => a.price - b.price
    },
    {
      title: "Deskripsi",
      dataIndex: "description",
      key: "description",
      ellipsis: true
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (active) => (
        <Tag color={active ? "green" : "red"}>
          {active ? "AKTIF" : "TIDAK AKTIF"}
        </Tag>
      )
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
            title="Yakin ingin menghapus paket ini?"
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
        <CrownOutlined /> Kelola Paket Langganan
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24} style={{ textAlign: "right" }}>
          <Space>
            <Button type="primary" onClick={showAddModal}>
              Tambah Paket
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchSubscriptionPlans}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
          <p>Loading data paket langganan...</p>
        </div>
      ) : (
        <Table 
          dataSource={subscriptionPlans} 
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
      >
        <Form 
          form={form} 
          layout="vertical"
          initialValues={{ is_active: true }}
        >
          <Form.Item
            name="name"
            label="Nama Paket"
            rules={[{ required: true, message: "Nama paket wajib diisi" }]}
          >
            <Input placeholder="Contoh: Paket Bulanan" />
          </Form.Item>
          
          <Form.Item
            name="duration_days"
            label="Durasi (Hari)"
            rules={[{ required: true, message: "Durasi wajib diisi" }]}
          >
            <InputNumber 
              min={1} 
              placeholder="Contoh: 30" 
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="price"
            label="Harga (Rp)"
            rules={[{ required: true, message: "Harga wajib diisi" }]}
          >
            <InputNumber
              min={0}
              formatter={value => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\Rp\s?|(,*)/g, '')}
              style={{ width: '100%' }}
            />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Deskripsi"
          >
            <TextArea 
              rows={4} 
              placeholder="Deskripsi paket langganan" 
            />
          </Form.Item>
          
          <Form.Item
            name="is_active"
            label="Status"
            valuePropName="checked"
          >
            <Switch checkedChildren="Aktif" unCheckedChildren="Tidak Aktif" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubscriptionPlanManagement;