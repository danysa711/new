import React, { useState, useEffect, useContext } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Upload, message, Space
} from 'antd';
import { 
  ShoppingCartOutlined, UploadOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../context/AuthContext';
import QrisPaymentForm from '../../components/QrisPaymentForm';
import moment from 'moment';
import axiosInstance from '../../services/axios';

const { Title, Text } = Typography;

const SubscriptionPage = () => {
  const { user, updateUserData, fetchUserProfile } = useContext(AuthContext);

  const [pendingPayments, setPendingPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // state baru untuk upload bukti
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Ambil daftar paket
        try {
          const plansResponse = await axiosInstance.get('/api/subscription-plans');
          setPlans(plansResponse.data);
        } catch (err) {
          console.error('Error fetching subscription plans:', err);
          setPlans([]);
        }

        // Ambil langganan user
        try {
          const subsResponse = await axiosInstance.get('/api/subscriptions/user');
          const sortedSubs = subsResponse.data.sort((a, b) => 
            new Date(b.start_date) - new Date(a.start_date)
          );
          setSubscriptions(sortedSubs);

          const active = subsResponse.data.find(
            (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
          );
          setActiveSubscription(active);

          if (updateUserData) {
            if (active && !user.hasActiveSubscription) {
              const updatedUser = { ...user, hasActiveSubscription: true };
              updateUserData(updatedUser);
            } else if (!active && user.hasActiveSubscription) {
              const updatedUser = { ...user, hasActiveSubscription: false };
              updateUserData(updatedUser);
            }
          }
        } catch (err) {
          console.error('Error fetching user subscriptions:', err);
          setSubscriptions([]);
        }

        // Ambil pembayaran QRIS
        try {
          const userId = user?.id || JSON.parse(localStorage.getItem("user"))?.id;
          const qrisResponse = await axiosInstance.get('/api/qris-payments', {
            params: { user_id: userId }
          });

          const qrisData = qrisResponse.data?.data || qrisResponse.data || [];
          let pending = Array.isArray(qrisData)
            ? qrisData.filter((p) => p.status === 'UNPAID')
            : [];

          // filter expired > 24 jam
          const now = new Date();
          pending = pending.filter(p => {
            const created = new Date(p.createdAt);
            const diffHours = (now - created) / (1000 * 60 * 60);
            return diffHours <= 24;
          });

          // sort terbaru dulu
          pending = pending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

          // ambil max 3
          pending = pending.slice(0, 3);

          setPendingPayments(pending);
        } catch (err) {
          console.error('Error fetching QRIS payments:', err);
          setPendingPayments([]);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching subscription data:', err);
        setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
        setLoading(false);
      }
    };

    fetchData();
  }, [user, updateUserData]);

  const handlePurchase = (plan) => {
    setSelectedPlan(plan);
    setPaymentModalVisible(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalVisible(false);
    setSelectedPlan(null);
    if (fetchUserProfile) {
      fetchUserProfile();
    }
  };

  // ubah handleUploadProof jadi buka modal state
  const handleUploadProof = (record) => {
    setSelectedPayment(record);
    setUploadModalVisible(true);
  };

  const handleCancelOrder = async (record) => {
    try {
      await axiosInstance.delete(`/api/qris-payment/${record.reference}/cancel`, {
        params: { user_id: user?.id }
      });
      message.success("Pesanan berhasil dibatalkan");
      setPendingPayments((prev) => prev.filter(p => p.reference !== record.reference));
    } catch (err) {
      console.error("Cancel error:", err);
      message.error("Gagal membatalkan pesanan");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat data langganan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Title level={2}>Langganan</Title>
        <Alert
          message="Terjadi Kesalahan"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
          action={
            <Button type="primary" onClick={() => window.location.reload()}>
              Coba Lagi
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Title level={2}>Langganan</Title>

      {/* 1. Status Langganan Saat Ini */}
      <Card style={{ marginBottom: 24 }}>
        <Title level={4}>Status Langganan</Title>
        {activeSubscription ? (
          <Alert
            message={`Langganan Anda aktif: ${activeSubscription.SubscriptionPlan?.name || '-'}`}
            description={`Berlaku hingga ${moment(activeSubscription.end_date).format('DD/MM/YYYY HH:mm')}`}
            type="success"
            showIcon
          />
        ) : (
          <Alert
            message="Anda belum memiliki langganan aktif"
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* 2. Paket Langganan Tersedia */}
      <div id="subscription-plans">
        <Title level={4}>Paket Langganan Tersedia</Title>
        <Row gutter={[16, 16]}>
          {plans.length > 0 ? plans.map((plan) => (
            <Col xs={24} sm={12} md={8} lg={6} key={plan.id}>
              <Card
                hoverable
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{plan.name}</span>
                    <Tag color="green">Rp {parseInt(plan.price).toLocaleString('id-ID')}</Tag>
                  </div>
                }
                actions={[
                  <Button 
                    type="primary" 
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handlePurchase(plan)}
                    block
                  >
                    Beli Sekarang
                  </Button>
                ]}
              >
                <div style={{ marginBottom: 12 }}>
                  <Text strong>{plan.duration_days} hari</Text>
                </div>
                <div>{plan.description || `Langganan standar selama ${plan.name}`}</div>
              </Card>
            </Col>
          )) : (
            <Col span={24}>
              <Empty description="Belum ada paket langganan tersedia" />
            </Col>
          )}
        </Row>
      </div>

      {/* 3. Pembayaran Menunggu Verifikasi */}
      {pendingPayments.length > 0 && (
        <Card 
          title={<Title level={4}>Pembayaran Menunggu Verifikasi</Title>} 
          style={{ marginTop: 24, marginBottom: 24 }}
        >
          <Alert
            message="Pembayaran Anda Sedang Ditinjau"
            description="Anda memiliki pembayaran yang sedang menunggu verifikasi admin. Langganan akan aktif segera setelah pembayaran diverifikasi."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <Table
            dataSource={pendingPayments}
            rowKey="reference"
            columns={[
              {
                title: 'Referensi',
                dataIndex: 'reference',
                key: 'reference',
                render: text => <Text copyable>{text}</Text>
              },
              {
                title: 'Paket',
                key: 'plan',
                render: (_, record) => (
                  record.SubscriptionPlan ? record.SubscriptionPlan.name : '-'
                )
              },
              {
                title: 'Jumlah',
                dataIndex: 'total_amount',
                key: 'amount',
                render: amount => `Rp ${parseFloat(amount).toLocaleString('id-ID')}`
              },
              {
                title: 'Tanggal',
                dataIndex: 'createdAt',
                key: 'date',
                render: date => moment(date).format('DD/MM/YYYY HH:mm')
              },
              {
                title: 'Status',
                key: 'status',
                render: () => <Tag color="processing">MENUNGGU VERIFIKASI</Tag>
              },
              {
                title: 'Aksi',
                key: 'action',
                render: (record) => (
                  <Space>
                    {!record.has_payment_proof && (
                      <Button
                        type="primary"
                        onClick={() => handleUploadProof(record)}
                      >
                        Upload Bukti
                      </Button>
                    )}
                    <Button
                      danger
                      onClick={() => handleCancelOrder(record)}
                    >
                      Batalkan
                    </Button>
                  </Space>
                )
              }
            ]}
            pagination={false}
          />
        </Card>
      )}

      {/* 4. Riwayat Transaksi */}
      <Divider />
      <Card title="Riwayat Transaksi">
        <Table
          dataSource={subscriptions}
          rowKey="id"
          columns={[
            {
              title: 'Referensi',
              dataIndex: 'reference',
              key: 'reference',
              render: (text) => <Text copyable>{text || '-'} </Text>
            },
            {
              title: 'Paket',
              key: 'plan',
              render: (_, record) => record.SubscriptionPlan?.name || '-'
            },
            {
              title: 'Harga',
              dataIndex: 'price',
              key: 'price',
              render: (price) => `Rp ${parseFloat(price || 0).toLocaleString('id-ID')}`
            },
            {
              title: 'Status Pembayaran',
              key: 'payment_status',
              render: (record) => {
                if (record.payment_status === 'paid') {
                  return (
                    <Tag color="green">
                      TERBAYAR menggunakan {record.payment_method || 'QRIS'}
                    </Tag>
                  );
                }
                if (record.payment_status === 'pending') {
                  return <Tag color="orange">MENUNGGU</Tag>;
                }
                return <Tag color="red">GAGAL</Tag>;
              }
            },
            {
              title: 'Tanggal Pembelian',
              dataIndex: 'createdAt',
              key: 'createdAt',
              render: (date) => moment(date).format('DD/MM/YYYY HH:mm')
            }
          ]}
          pagination={{ pageSize: 5 }}
          locale={{ emptyText: 'Belum ada riwayat transaksi' }}
        />
      </Card>

      {/* Payment Modal */}
      <Modal
        title="Pembayaran QRIS"
        open={paymentModalVisible}
        onCancel={handleClosePaymentModal}
        footer={null}
        width={700}
      >
        {selectedPlan && (
          <QrisPaymentForm 
            plan={selectedPlan} 
            onFinish={handleClosePaymentModal} 
          />
        )}
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload Bukti Pembayaran"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        {selectedPayment && (
          <Upload
            name="payment_proof"
            showUploadList={false}
            accept="image/*"
            customRequest={async ({ file, onSuccess, onError }) => {
              try {
                const formData = new FormData();
                formData.append("payment_proof", file);

                await axiosInstance.post(
                  `/api/qris-payment/${selectedPayment.reference}/upload`,
                  formData,
                  {
                    headers: { "Content-Type": "multipart/form-data" },
                    params: { user_id: user?.id }
                  }
                );

                message.success("Bukti pembayaran berhasil diupload");
                onSuccess();
                fetchUserProfile();
                setUploadModalVisible(false);
              } catch (err) {
                console.error("Upload error:", err);
                message.error("Gagal upload bukti pembayaran");
                onError(err);
              }
            }}
          >
            <Button icon={<UploadOutlined />}>Pilih File</Button>
          </Upload>
        )}
      </Modal>
    </div>
  );
};

export default SubscriptionPage;
