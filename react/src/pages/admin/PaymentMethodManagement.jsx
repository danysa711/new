// react/src/pages/admin/PaymentMethodManagement.jsx
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
  Spin,
  Row,
  Col
} from "antd";
import { 
  PayCircleOutlined, 
  BankOutlined, 
  UserOutlined, 
  ReloadOutlined
} from "@ant-design/icons";
import { AdminContext } from "../../context/AdminContext";

const { Title } = Typography;
const { Option } = Select;

const PaymentMethodManagement = () => {
  const { 
    paymentMethods,
    loading, 
    fetchPaymentMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod
  } = useContext(AdminContext);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState("Tambah Metode Pembayaran");
  const [form] = Form.useForm();
  const [editingMethod, setEditingMethod] = useState(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  
  useEffect(() => {
    fetchPaymentMethods();
  }, []);
  
  const showAddModal = () => {
    setModalTitle("Tambah Metode Pembayaran");
    setEditingMethod(null);
    form.resetFields();
    form.setFieldsValue({ 
      type: "manual",
      is_active: true
    });
    setModalVisible(true);
  };
  
  const showEditModal = (method) => {
    setModalTitle("Edit Metode Pembayaran");
    setEditingMethod(method);
    form.setFieldsValue({
      name: method.name,
      code: method.code,
      type: method.type,
      account_number: method.account_number,
      account_name: method.account_name,
      is_active: method.is_active,
      tripay_code: method.tripay_code
    });
    setModalVisible(true);
  };
  
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setConfirmLoading(true);
      
      if (editingMethod) {
        // Update existing method
        const result = await updatePaymentMethod(editingMethod.id, values);
        if (result.success) {
          message.success("Metode pembayaran berhasil diperbarui");
          setModalVisible(false);
        } else {
          message.error(result.error);
        }
      } else {
        // Create new method
        const result = await createPaymentMethod(values);
        if (result.success) {
          message.success("Metode pembayaran berhasil ditambahkan");
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
  
  const handleDelete = async (methodId) => {
    try {
      const result = await deletePaymentMethod(methodId);
      if (result.success) {
        message.success("Metode pembayaran berhasil dihapus");
      } else {
        message.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting payment method:", error);
      message.error("Gagal menghapus metode pembayaran");
    }
  };
  
  const columns = [
    {
      title: "Nama Metode",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: "Kode",
      dataIndex: "code",
      key: "code"
    },
    {
      title: "Tipe",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Tag color={type === "manual" ? "blue" : "purple"}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: "Nomor Rekening",
      dataIndex: "account_number",
      key: "account_number",
      render: (text) => text || "-"
    },
    {
      title: "Nama Rekening",
      dataIndex: "account_name",
      key: "account_name",
      render: (text) => text || "-"
    },
    {
      title: "Kode Tripay",
      dataIndex: "tripay_code",
      key: "tripay_code",
      render: (text) => text || "-"
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
            title="Yakin ingin menghapus metode ini?"
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
        <PayCircleOutlined /> Kelola Metode Pembayaran
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={24} style={{ textAlign: "right" }}>
          <Space>
            <Button type="primary" onClick={showAddModal}>
              Tambah Metode
            </Button>
            <Button icon={<ReloadOutlined />} onClick={fetchPaymentMethods}>
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>
      
      {loading ? (
        <div style={{ textAlign: "center", padding: "50px 0" }}>
          <Spin size="large" />
          <p>Loading data metode pembayaran...</p>
        </div>
      ) : (
        <Table 
          dataSource={paymentMethods} 
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
          initialValues={{ 
            type: "manual",
            is_active: true
          }}
        >
          <Form.Item
            name="name"
            label="Nama Metode"
            rules={[{ required: true, message: "Nama metode wajib diisi" }]}
          >
            <Input placeholder="Contoh: DANA" />
          </Form.Item>
          
          <Form.Item
            name="code"
            label="Kode"
            rules={[{ required: true, message: "Kode wajib diisi" }]}
          >
            <Input placeholder="Contoh: dana" />
          </Form.Item>
          
          <Form.Item
            name="type"
            label="Tipe"
            rules={[{ required: true, message: "Tipe wajib dipilih" }]}
          >
            <Select placeholder="Pilih tipe">
              <Option value="manual">Manual</Option>
              <Option value="tripay">Tripay</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="account_number"
            label="Nomor Rekening"
          >
            <Input placeholder="Contoh: 1234567890" />
          </Form.Item>
          
          <Form.Item
            name="account_name"
            label="Nama Rekening"
          >
            <Input placeholder="Contoh: PT Example" />
          </Form.Item>
          
          <Form.Item
            name="tripay_code"
            label="Kode Tripay"
          >
            <Input placeholder="Contoh: BNIVA" />
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

export default PaymentMethodManagement;