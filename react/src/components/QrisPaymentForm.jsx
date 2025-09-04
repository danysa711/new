// src/components/QrisPaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Alert, Spin, Result,
  Steps, Upload, message, Divider, Image, Tag
} from 'antd';
import { 
  QrcodeOutlined, UploadOutlined,
  InfoCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import axiosInstance from "../services/axios";
import qrisService from "../services/qris-service";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const QrisPaymentForm = ({ plan, onFinish }) => {
  const [loading, setLoading] = useState(false);
  const [qrisSettings, setQrisSettings] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // ✅ Fungsi helper untuk ambil QRIS settings
  const fetchQrisSettings = async () => {
    try {
      const response = await axiosInstance.get("/api/qris-settings");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("Gagal memuat pengaturan QRIS:", error);
      return { success: false, data: null, message: "Gagal memuat pengaturan QRIS" };
    }
  };

  // ✅ Ambil QRIS settings saat komponen mount
  useEffect(() => {
    const loadQrisSettings = async () => {
      try {
        setLoading(true);
        setError(null);

        const { success, data, message } = await fetchQrisSettings();

        if (success && data) {
          setQrisSettings(data);
        } else {
          // fallback default jika gagal
          setQrisSettings({
            merchant_name: "Kinterstore",
            qris_image:
              "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
            is_active: true,
            expiry_hours: 24,
            instructions:
              "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.",
          });

          if (message) {
            setError(message);
          }
        }
      } catch (error) {
        console.error("Error saat memuat pengaturan QRIS:", error);
        setError("Gagal memuat pengaturan QRIS. Menggunakan data default.");
      } finally {
        setLoading(false);
      }
    };

    loadQrisSettings();
  }, [retryCount]);

  // Membuat transaksi QRIS
  const createQrisPayment = async () => {
  try {
    setLoading(true);
    setError(null);

    const result = await qrisService.createQrisPayment(plan.id);

    if (result.success && result.payment) {
      setPaymentData(result.payment);
      setCurrentStep(1);
    } else {
      setError(result.message || "Gagal membuat pembayaran QRIS.");
    }
  } catch (error) {
    console.error("Error creating QRIS payment:", error);
    
    // Tambahkan pesan error yang lebih detail
    const errorMsg = error.response?.data?.error || 
                     error.response?.data?.details || 
                     error.message || 
                     "Gagal membuat pembayaran QRIS. Silakan coba lagi.";
                     
    setError(errorMsg);
  } finally {
    setLoading(false);
  }
};

  // Upload bukti pembayaran
  const handleUpload = async (file) => {
    if (!file) {
      message.error("File bukti pembayaran harus dipilih");
      return false;
    }
    if (!file.type.startsWith("image/")) {
      message.error("File harus berupa gambar (JPG, PNG, dll)");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error("Ukuran file terlalu besar (maks 5MB)");
      return false;
    }

    setLoading(true);
    try {
      const result = await qrisService.uploadPaymentProof(paymentData.reference, file);
      if (result.success) {
        setPaymentProof(URL.createObjectURL(file));
        message.success("Bukti pembayaran berhasil diunggah");
        setCurrentStep(2);
      } else {
        message.error(result.message || "Gagal mengunggah bukti pembayaran");
      }
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      message.error(error.message || "Gagal mengunggah bukti pembayaran");
    } finally {
      setLoading(false);
    }

    return false;
  };

  // Copy ke clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard
      .writeText(text)
      .then(() => message.success("Berhasil disalin"))
      .catch(() => message.error("Gagal menyalin"));
  };

  // Retry API
  const retryApiCall = () => {
    setRetryCount((prev) => prev + 1);
    setError(null);
    message.info("Mencoba kembali...");
  };

  // Render UI
  const renderPaymentSteps = () => {
    if (loading && !paymentData && !qrisSettings) {
      return (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Memuat...</div>
        </div>
      );
    }

    if (error) {
      return (
        <Result
          status="error"
          title="Terjadi Kesalahan"
          subTitle={error}
          extra={[
            <Button
              key="retry"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={retryApiCall}
            >
              Coba Lagi
            </Button>,
            <Button key="back" onClick={() => onFinish && onFinish()}>
              Kembali
            </Button>,
          ]}
        />
      );
    }

    return (
      <div>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Mulai Pembayaran" />
          <Step title="Bayar QRIS" />
          <Step title="Upload Bukti" />
          <Step title="Menunggu Verifikasi" />
        </Steps>

        {/* Step 0: mulai pembayaran */}
        {currentStep === 0 && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Title level={4}>Pembayaran QRIS</Title>
            <Paragraph>
              Anda akan melakukan pembayaran untuk paket:
              <br />
              <Text strong>{plan.name}</Text> - Rp{" "}
              {parseFloat(plan.price).toLocaleString("id-ID")}
            </Paragraph>
            <Button
              type="primary"
              onClick={createQrisPayment}
              loading={loading}
              icon={<QrcodeOutlined />}
              size="large"
            >
              Lanjutkan Pembayaran
            </Button>
          </div>
        )}

        {/* Step 1: QRIS tampil */}
        {currentStep === 1 && paymentData && qrisSettings && (
          <div>
            <Alert
              message="Instruksi Pembayaran QRIS"
              description={
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <Text strong>Merchant:</Text> {qrisSettings.merchant_name}
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <Text strong>Nominal Pembayaran:</Text>
                    <Tag color="green" style={{ marginLeft: 8 }}>
                      <Text
                        strong
                        copyable
                        onClick={() =>
                          copyToClipboard(paymentData.total_amount.toString())
                        }
                      >
                        Rp{" "}
                        {parseFloat(paymentData.total_amount).toLocaleString(
                          "id-ID"
                        )}
                      </Text>
                    </Tag>
                    <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                      <InfoCircleOutlined /> Mohon transfer dengan nominal
                      TEPAT termasuk 3 digit unik
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <Text strong>Batas Waktu:</Text>{" "}
                    {new Date(paymentData.expired_at).toLocaleString()}
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />

            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <Image
                src={qrisSettings.qris_image}
                alt="QRIS Code"
                style={{ maxWidth: "100%", maxHeight: "300px" }}
              />
            </div>

            {qrisSettings.instructions && (
              <Alert
                message="Cara Pembayaran"
                description={qrisSettings.instructions}
                type="info"
                style={{ marginBottom: 20 }}
              />
            )}

            <Divider />

            <div style={{ textAlign: "center" }}>
              <Text strong>Setelah melakukan pembayaran, unggah bukti:</Text>
              <div style={{ marginTop: 16 }}>
                <Upload
                  name="payment_proof"
                  beforeUpload={handleUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button icon={<UploadOutlined />} loading={loading}>
                    Upload Bukti Pembayaran
                  </Button>
                </Upload>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Bukti upload */}
        {currentStep === 2 && paymentProof && (
          <div>
            <Result
              status="success"
              title="Bukti Pembayaran Terkirim"
              subTitle="Pembayaran Anda sedang diverifikasi oleh admin."
              extra={[
                <Button key="back" onClick={() => onFinish && onFinish()}>
                  Kembali ke Halaman Langganan
                </Button>,
              ]}
            />
            <div style={{ textAlign: "center", marginTop: 20 }}>
              <Text strong>Bukti Pembayaran:</Text>
              <div style={{ marginTop: 10 }}>
                <Image src={paymentProof} alt="Bukti Pembayaran" style={{ maxHeight: "200px" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return <Card>{renderPaymentSteps()}</Card>;
};

export default QrisPaymentForm;
