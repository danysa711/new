// src/components/QrisPaymentForm.jsx - Perbaiki typo seEffect -> useEffect

import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Alert, Spin, Result,
  Steps, Upload, message, Divider, Image, Tag, Space
} from 'antd';
import { 
  QrcodeOutlined, UploadOutlined, CheckCircleOutlined,
  InfoCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import axiosInstance from "../services/axios";
import { getQrisSettings, createQrisPayment, uploadPaymentProof } from "../services/axios"; // Ubah ini

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
  
  // Mendapatkan pengaturan QRIS dengan fallback ke data lokal
  useEffect(() => {
    const loadQrisSettings = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Gunakan fungsi getQrisSettings dari services/qris-service
        const settings = await getQrisSettings();
        
        if (settings) {
          setQrisSettings(settings);
        } else {
          setError("Gagal memuat pengaturan QRIS. Menggunakan data default.");
          
          // Tetap gunakan data default
          setQrisSettings({
            merchant_name: "Kinterstore",
            qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
            is_active: true,
            expiry_hours: 24,
            instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
          });
        }
      } catch (error) {
        console.error("Error saat memuat pengaturan QRIS:", error);
        setError("Gagal memuat pengaturan QRIS. Menggunakan data default.");
        
        // Tetap gunakan data default
        setQrisSettings({
          merchant_name: "Kinterstore",
          qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
          is_active: true,
          expiry_hours: 24,
          instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadQrisSettings();
  }, [retryCount]);

  // Membuat transaksi QRIS
  const createQrisPaymentHandler = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await createQrisPayment(plan.id);
      
      if (result && result.payment) {
        setPaymentData(result.payment);
        setCurrentStep(1);
      } else {
        setError("Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.");
      }
    } catch (error) {
      console.error("Error creating QRIS payment:", error);
      setError("Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.");
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
      const result = await uploadPaymentProof(paymentData.reference, file);
      
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
    if (loading && !paymentData && !qrisSettings) {
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
          <Step title="Upload Bukti" />
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
                    <Text strong>Batas Waktu:</Text> {new Date(paymentData.expired_at).toLocaleString()}
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
              <Text strong>Setelah melakukan pembayaran, unggah bukti pembayaran:</Text>
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
        
        {currentStep === 2 && paymentProof && (
          <div>
            <Result
              status="success"
              title="Bukti Pembayaran Terkirim"
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
            
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Text strong>Bukti Pembayaran:</Text>
              <div style={{ marginTop: 10 }}>
                <Image 
                  src={paymentProof} 
                  alt="Bukti Pembayaran" 
                  style={{ maxHeight: '200px' }} 
                />
              </div>
              
              <Alert
                message="Perhatian"
                description="Bukti pembayaran Anda akan diverifikasi oleh admin. Proses ini mungkin membutuhkan waktu beberapa saat."
                type="warning"
                showIcon
                style={{ marginTop: 20, textAlign: 'left' }}
              />
            </div>
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