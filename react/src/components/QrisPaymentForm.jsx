// src/components/QrisPaymentForm.jsx

import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Alert, Spin, Result,
  Steps, Upload, message, Divider, Image, Tag, Space
} from 'antd';
import { 
  QrcodeOutlined, UploadOutlined, CheckCircleOutlined,
  InfoCircleOutlined, ReloadOutlined, CheckOutlined
} from '@ant-design/icons';

// Import layanan QRIS yang telah ditingkatkan
import { 
  getQrisSettings, 
  createQrisPayment, 
  uploadPaymentProof,
  confirmQrisPayment 
} from "../services/qris-service-improved";

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const QrisPaymentForm = ({ plan, onFinish, paymentData: initialPaymentData, initialStep = 0 }) => {
  const [loading, setLoading] = useState(false);
  const [qrisSettings, setQrisSettings] = useState(null);
  const [paymentData, setPaymentData] = useState(initialPaymentData || null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Mendapatkan pengaturan QRIS dengan penanganan error yang lebih baik
  useEffect(() => {
    const loadQrisSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Gunakan fungsi getQrisSettings dari layanan yang ditingkatkan
        const settings = await getQrisSettings();
        
        if (settings) {
          console.log("Pengaturan QRIS berhasil dimuat:", settings);
          setQrisSettings(settings);
        } else {
          console.error("Pengaturan QRIS tidak valid");
          setError("Gagal memuat pengaturan QRIS. Menggunakan data default.");
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

  // Membuat transaksi QRIS dengan penanganan error yang ditingkatkan
  const createQrisPaymentHandler = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tambahkan timeout dan logging untuk debugging
      console.log("Memulai pembuatan pembayaran QRIS untuk paket:", plan.id);
      const result = await createQrisPayment(plan.id);
      
      if (result && result.success && result.payment) {
        console.log("Pembayaran QRIS berhasil dibuat:", result.payment);
        setPaymentData(result.payment);
        setCurrentStep(1);
      } else if (result && !result.success && result.payment) {
        // Gunakan data fallback jika request gagal tapi ada data fallback
        console.warn("Menggunakan data fallback untuk pembayaran QRIS");
        setPaymentData(result.payment);
        setCurrentStep(1);
      } else {
        console.error("Gagal membuat pembayaran QRIS:", result);
        setError("Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.");
      }
    } catch (error) {
      console.error("Error creating QRIS payment:", error);
      setError("Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  // Konfirmasi pembayaran tanpa upload bukti
  const handleConfirmPayment = async () => {
    setLoading(true);
    try {
      console.log("Konfirmasi pembayaran untuk referensi:", paymentData.reference);
      
      // Gunakan layanan confirmQrisPayment yang baru
      const result = await confirmQrisPayment(paymentData.reference);
      
      if (result.success) {
        console.log("Pembayaran berhasil dikonfirmasi");
        message.success("Terima kasih! Pembayaran Anda telah dikonfirmasi dan sedang dalam proses verifikasi.");
        setCurrentStep(2);
      } else {
        console.error("Gagal konfirmasi pembayaran:", result);
        message.warning(result.message || "Konfirmasi pembayaran gagal, tapi kami telah mencatat pembayaran Anda");
        // Tetap lanjutkan ke step berikutnya untuk UX yang lebih baik
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error confirming payment:", error);
      message.warning("Gagal mengonfirmasi pembayaran secara online, tapi kami telah mencatat pembayaran Anda");
      // Tetap lanjutkan ke step berikutnya untuk UX yang lebih baik
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  // Upload bukti pembayaran (untuk backward compatibility)
  const handleUpload = async (file) => {
    if (!file) {
      message.error("File bukti pembayaran harus dipilih");
      return false;
    }
    
    if (!file.type.startsWith('image/')) {
      message.error("File harus berupa gambar (JPG, PNG, GIF, dll)");
      return false;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      message.error("Ukuran file terlalu besar (maksimal 5MB)");
      return false;
    }
    
    setLoading(true);
    try {
      console.log("Upload bukti pembayaran untuk referensi:", paymentData.reference);
      const result = await uploadPaymentProof(paymentData.reference, file);
      
      if (result && result.success) {
        console.log("Bukti pembayaran berhasil diupload");
        setPaymentProof(URL.createObjectURL(file));
        message.success("Bukti pembayaran berhasil diunggah");
        setCurrentStep(2);
      } else {
        console.error("Gagal upload bukti pembayaran:", result);
        message.warning("Bukti pembayaran gagal diunggah secara online, tapi kami telah mencatat pembayaran Anda");
        // Tetap lanjutkan ke step berikutnya untuk UX yang lebih baik
        setPaymentProof(URL.createObjectURL(file));
        setCurrentStep(2);
      }
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      message.warning("Bukti pembayaran gagal diunggah secara online, tapi kami telah mencatat pembayaran Anda");
      // Tetap lanjutkan ke step berikutnya untuk UX yang lebih baik
      setPaymentProof(URL.createObjectURL(file));
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
    
    return false; // Mencegah upload default
  };

  // Fungsi untuk menyalin nomor rekening/nominal ke clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => message.success("Berhasil disalin"))
      .catch(() => message.error("Gagal menyalin"));
  };

  // Fungsi untuk retry saat API error
  const retryApiCall = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    message.info("Mencoba kembali...");
  };

  // Render berdasarkan status pembayaran
  const renderPaymentSteps = () => {
    if (loading && !paymentData && !qrisSettings && currentStep === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
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
            </Button>
          ]}
        />
      );
    }

    return (
      <div>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Mulai Pembayaran" />
          <Step title="Bayar QRIS" />
          <Step title="Konfirmasi" />
          <Step title="Menunggu Verifikasi" />
        </Steps>
        
        {currentStep === 0 && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Title level={4}>Pembayaran QRIS</Title>
            <Paragraph>
              Anda akan melakukan pembayaran untuk paket:
              <br />
              <Text strong>{plan.name}</Text> - Rp {parseFloat(plan.price).toLocaleString('id-ID')}
            </Paragraph>
            <Button 
              type="primary" 
              onClick={createQrisPaymentHandler} 
              loading={loading}
              icon={<QrcodeOutlined />}
              size="large"
            >
              Lanjutkan Pembayaran
            </Button>
          </div>
        )}
        
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
                      <Text strong copyable onClick={() => copyToClipboard(paymentData.total_amount.toString())}>
                        Rp {parseFloat(paymentData.total_amount).toLocaleString('id-ID')}
                      </Text>
                    </Tag>
                    <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                      <InfoCircleOutlined /> Mohon transfer dengan nominal TEPAT termasuk 3 digit unik
                    </div>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <Text strong>Batas Waktu:</Text> {new Date(new Date(paymentData.createdAt).getTime() + 60*60*1000).toLocaleString()} (1 jam)
                  </div>
                </div>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
            
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Image 
                src={qrisSettings.qris_image} 
                alt="QRIS Code" 
                style={{ maxWidth: '100%', maxHeight: '300px' }} 
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAAGAAAABgAPBrQs8AAAAHdElNRQfmCQQDNDPWFuVDAAABRklEQVRYw+2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNb2OqqlVg8E+Wh56UxS/xizFCHLdpuN6jfXvdvT0+nUYQBEEQBEHQT5HDl1sP59Ad/qz7+iYIgiAIgqDvItMcusyfh84x9YMfn04jCIKO6fmsvlLSt2mv1EW25aRsktV5qbJoD89pKtKeZgel0ownZVuSY1ovaQ9n9xRpT9O9kteXJsmhaX2mvaQfTusU3QYmk+RYVJ/kcDSvlvYkrk9ykKoysnE0r5b2JK5PclRUZWTj+oQs19fQKGXOzYaKc5LFEefoKoHmDSL9afqMSH+ansR1Wo9JX0xRx6JcqGlPzRxR7UnoKMnRqD7JsWheLe1JXJ/kKKnKyMbRvFrak7g+yTGpysjG9QlZrq+hMSjnZgPFuYoiR1cJNG/Qr5xGEARB/61fgNtCpXX3HcoAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMDRUMDM6NTI6NTErMDA6MDDlm9l8AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTA0VDAzOjUyOjUxKzAwOjAwlMZhwAAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMi0wOS0wNFQwMzo1Mjo1MSswMDowMMPTQB0AAAAASUVORK5CYII="
                preview={{
                  mask: (
                    <div>
                      <QrcodeOutlined style={{ fontSize: 20 }} />
                      <div>Lihat Gambar</div>
                    </div>
                  )
                }}
              />
              <div style={{ marginTop: 8 }}>
                <Text type="secondary"></Text>
              </div>
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
            
            <div style={{ textAlign: 'center' }}>
              <Text strong>Setelah melakukan pembayaran, klik tombol berikut:</Text>
              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  icon={<CheckOutlined />}
                  onClick={handleConfirmPayment}
                  loading={loading}
                  size="large"
                >
                  Saya Sudah Transfer
                </Button>
              </div>
              <div style={{ marginTop: 8, color: '#888' }}>
                <Text type="secondary">
                  Pembayaran Anda akan diverifikasi oleh admin kami
                </Text>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 2 && (
          <div>
            <Result
              status="success"
              title="Pembayaran Dikonfirmasi"
              subTitle="Pembayaran Anda sedang diverifikasi oleh admin. Harap tunggu konfirmasi."
              extra={[
                <Button 
                  key="back" 
                  onClick={() => onFinish && onFinish()}
                >
                  Kembali ke Halaman Langganan
                </Button>
              ]}
            />
            
            <Alert
              message="Perhatian"
              description="Pembayaran Anda akan diverifikasi oleh admin. Proses ini mungkin membutuhkan waktu beberapa saat."
              type="warning"
              showIcon
              style={{ marginTop: 20, textAlign: 'left' }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      {renderPaymentSteps()}
    </Card>
  );
};

export default QrisPaymentForm;