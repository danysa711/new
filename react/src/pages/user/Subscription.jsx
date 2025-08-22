// react/src/pages/user/Subscription.jsx
import React, { useContext, useEffect, useState } from "react";
import { SubscriptionContext } from "../../context/SubscriptionContext";
import { AuthContext } from "../../context/AuthContext";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Select,
  Empty,
  Alert,
  Spin
} from "antd";
import { CrownOutlined, CalendarOutlined, CheckCircleOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

const Subscription = () => {
  const { subscriptionStatus, plans, paymentMethods, checkSubscriptionStatus, extendSubscription, cancelSubscription } = useContext(SubscriptionContext);
  const { user } = useContext(AuthContext);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [userSubscriptions, setUserSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user subscriptions when component mounts
    const fetchUserSubscriptions = async () => {
      try {
        setLoading(true);
        await checkSubscriptionStatus();
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/subscriptions`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
          }
        });
        const data = await response.json();
        setUserSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSubscriptions();
  }, []);

  const handleExtendSubscription = async () => {
    if (!selectedPlan) {
      Modal.error({
        title: "Error",
        content: "Silakan pilih paket langganan terlebih dahulu"
      });
      return;
    }

    if (!selectedPayment) {
      Modal.error({
        title: "Error",
        content: "Silakan pilih metode pembayaran terlebih dahulu"
      });
      return;
    }

    setConfirmLoading(true);
    const result = await extendSubscription(selectedPlan, selectedPayment);
    setConfirmLoading(false);

    if (result.success) {
      setModalVisible(false);
      Modal.success({
        title: "Berhasil",
        content: "Perpanjangan langganan berhasil dibuat. Silakan lakukan pembayaran sesuai instruksi."
      });
      // Refresh user subscriptions
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/subscriptions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      setUserSubscriptions(data);
    } else {
      Modal.error({
        title: "Gagal",
        content: result.error || "Terjadi kesalahan saat memperpanjang langganan"
      });
    }
  };

  const handleCancelSubscription = async () => {
    if (!selectedSubscription) {
      Modal.error({
        title: "Error",
        content: "Silakan pilih langganan yang akan dibatalkan"
      });
      return;
    }

    setCancelLoading(true);
    const result = await cancelSubscription(selectedSubscription.id);
    setCancelLoading(false);

    if (result.success) {
      setCancelModalVisible(false);
      Modal.success({
        title: "Berhasil",
        content: "Langganan berhasil dibatalkan"
      });
      // Refresh user subscriptions
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/user/subscriptions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || sessionStorage.getItem("token")}`
        }
      });
      const data = await response.json();
      setUserSubscriptions(data);
    } else {
      Modal.error({
        title: "Gagal",
        content: result.error || "Terjadi kesalahan saat membatalkan langganan"
      });
    }
  };

  const columns = [
    {
      title: "Tanggal Mulai",
      dataIndex: "start_date",
      key: "start_date",
      render: (text) => new Date(text).toLocaleDateString("id-ID")
    },
    {
      title: "Tanggal Berakhir",
      dataIndex: "end_date",
      key: "end_date",
      render: (text) => new Date(text).toLocaleDateString("id-ID")
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (text) => {
        let color;
        switch (text) {
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
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Status Pembayaran",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (text) => {
        let color;
        switch (text) {
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
        return <Tag color={color}>{text.toUpperCase()}</Tag>;
      }
    },
    {
      title: "Metode Pembayaran",
      dataIndex: "payment_method",
      key: "payment_method",
      render: (text) => text || "-"
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          {record.status === "active" && (
            <Button 
              type="danger" 
              onClick={() => {
                setSelectedSubscription(record);
                setCancelModalVisible(true);
              }}
            >
              Batalkan
            </Button>
          )}
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
        <p>Loading data langganan...</p>
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>
        <CrownOutlined /> Langganan
      </Title>
      
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Status Langganan">
            {subscriptionStatus.hasActiveSubscription ? (
              <div>
                <Alert
                  message="Langganan Aktif"
                  description={
                    <div>
                      <p>
                        <strong>Tanggal Mulai:</strong>{" "}
                        {new Date(subscriptionStatus.subscription.start_date).toLocaleDateString("id-ID")}
                      </p>
                      <p>
                        <strong>Tanggal Berakhir:</strong>{" "}
                        {new Date(subscriptionStatus.subscription.end_date).toLocaleDateString("id-ID")}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        <Tag color="green">{subscriptionStatus.subscription.status.toUpperCase()}</Tag>
                      </p>
                      <p>
                        <strong>Status Pembayaran:</strong>{" "}
                        <Tag 
                          color={
                            subscriptionStatus.subscription.payment_status === "paid" 
                              ? "green" 
                              : subscriptionStatus.subscription.payment_status === "pending"
                              ? "orange"
                              : "red"
                          }
                        >
                          {subscriptionStatus.subscription.payment_status.toUpperCase()}
                        </Tag>
                      </p>
                    </div>
                  }
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                />
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    onClick={() => setModalVisible(true)}
                  >
                    Perpanjang Langganan
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <Alert
                  message="Tidak Ada Langganan Aktif"
                  description="Anda belum memiliki langganan aktif. Silakan berlangganan untuk mengaktifkan URL Anda."
                  type="warning"
                  showIcon
                />
                <div style={{ marginTop: 16 }}>
                  <Button 
                    type="primary" 
                    onClick={() => setModalVisible(true)}
                  >
                    Berlangganan Sekarang
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="Riwayat Langganan">
            {userSubscriptions.length > 0 ? (
              <Table 
                dataSource={userSubscriptions} 
                columns={columns} 
                rowKey="id" 
                pagination={{ pageSize: 5 }}
              />
            ) : (
              <Empty description="Belum ada riwayat langganan" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Modal Perpanjang Langganan */}
      <Modal
        title="Perpanjang Langganan"
        open={modalVisible}
        onOk={handleExtendSubscription}
        onCancel={() => setModalVisible(false)}
        confirmLoading={confirmLoading}
      >
        <div style={{ marginBottom: 16 }}>
          <Text strong>Pilih Paket Langganan:</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Pilih paket langganan"
            onChange={(value) => setSelectedPlan(value)}
          >
            {plans.map((plan) => (
              <Option key={plan.id} value={plan.id}>
                {plan.name} - Rp {plan.price.toLocaleString("id-ID")} ({plan.duration_days} hari)
              </Option>
            ))}
          </Select>
        </div>
        
        <div style={{ marginBottom: 16 }}>
          <Text strong>Pilih Metode Pembayaran:</Text>
          <Select
            style={{ width: "100%", marginTop: 8 }}
            placeholder="Pilih metode pembayaran"
            onChange={(value) => setSelectedPayment(value)}
          >
            {paymentMethods.map((method) => (
              <Option key={method.id} value={method.code}>
                {method.name}
              </Option>
            ))}
          </Select>
        </div>
      </Modal>

      {/* Modal Batalkan Langganan */}
      <Modal
        title="Batalkan Langganan"
        open={cancelModalVisible}
        onOk={handleCancelSubscription}
        onCancel={() => setCancelModalVisible(false)}
        confirmLoading={cancelLoading}
      >
        <p>Apakah Anda yakin ingin membatalkan langganan ini?</p>
        <p>
          <strong>Tanggal Mulai:</strong>{" "}
          {selectedSubscription && new Date(selectedSubscription.start_date).toLocaleDateString("id-ID")}
        </p>
        <p>
          <strong>Tanggal Berakhir:</strong>{" "}
          {selectedSubscription && new Date(selectedSubscription.end_date).toLocaleDateString("id-ID")}
        </p>
        <Alert
          message="Perhatian!"
          description="Membatalkan langganan akan menonaktifkan URL Anda. Anda dapat berlangganan kembali kapan saja."
          type="warning"
          showIcon
        />
      </Modal>
    </div>
  );
};

export default Subscription;