import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Alert, Spin, Result,
  Steps, Upload, message, Divider, Image, Tag, Space
} from 'antd';
import { 
  QrcodeOutlined, UploadOutlined, CheckCircleOutlined,
  InfoCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import axiosInstance from '../services/axios';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Konfigurasi retry
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 detik

// Fungsi untuk melakukan retry request dengan exponential backoff
const fetchWithRetry = async (apiCall, retries = 3, delay = 1000) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(apiCall, retries - 1, delay * 2);
  }
};

const QrisPaymentForm = ({ plan, onFinish }) => {
  const [loading, setLoading] = useState(false);
  const [qrisSettings, setQrisSettings] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);
  const [retryingApi, setRetryingApi] = useState(false);

  // Mendapatkan pengaturan QRIS dengan fallback ke data lokal
  useEffect(() => {
    const fetchQrisSettings = async () => {
  try {
    setLoading(true);
    setError(null);
    
    try {
      // Coba dapatkan dari API utama
      const settings = await qrisService.getQrisSettings();
      setQrisSettings(settings);
    } catch (error) {
      console.error("Error saat memuat pengaturan QRIS:", error);
      
      // Buat data default jika gagal
      const defaultSettings = {
        merchant_name: "Kinterstore",
        qris_image: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAUAAAAFAAQMAAAD3XjfpAAAABlBMVEX///8AAABVwtN+AAABA0lEQVRo3u2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNH8fUVSvBwJs88Gfwl2MwEHweHEIoiqIoiqIoitqkL+p5tgAC+Cx4GGNc/kdc5QcRgA/CgwhAACCAAAIIIIB/CwaRAJ8QLwq+QwgggADuBS8KAQQQQDAF9ABmtbqzn6DUa3Yy8ipdV6t76aYN26xFR76yKTbecw5xg7XT0PTLna5YeVGrZqDT/mllTfG6Wdr9KE+5c5p+0xt0w7afMOvQPFQHbqiPmJqTjnGnJmK4epEQ74KDOPNeCnXngJ2KAu4XAL5fWGIbk8jm1+sA4D+CeywAAAQQQAABBBBAAKdlDkO5qQMRbkZBAAAAAElFTkSuQmCC",
        is_active: true,
        expiry_hours: 24,
        instructions: "Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda."
      };
      
      setQrisSettings(defaultSettings);
      setError("Gagal memuat pengaturan QRIS. Menggunakan data default.");
    }
  } catch (error) {
    console.error("Error tak terduga:", error);
    setError("Terjadi kesalahan tak terduga");
    
    // Tetap set default settings
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

// Perbaikan fungsi createQrisPayment
const createQrisPayment = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Gunakan try-catch bersarang untuk menangani berbagai kemungkinan error
    try {
      // Coba panggil API terlebih dahulu
      const response = await axiosInstance.post('/api/qris-payment', {
        plan_id: plan.id
      });
      
      if (response.data && response.data.payment) {
        setPaymentData(response.data.payment);
        setCurrentStep(1);
        return;
      }
    } catch (apiError) {
      console.warn("API error, falling back to mock data:", apiError);
      // Jangan throw error di sini, lanjutkan ke fallback
    }
    
    // Fallback jika API gagal: Buat data pembayaran dummy
    const mockPayment = {
      reference: `QRIS${Date.now().toString().slice(-8)}`,
      total_amount: plan.price,
      status: 'UNPAID',
      createdAt: new Date().toISOString(),
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    setPaymentData(mockPayment);
    setCurrentStep(1);
    message.warning('Menggunakan data simulasi karena server tidak merespons');
    
  } catch (error) {
    console.error("Error creating QRIS payment:", error);
    setError("Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.");
  } finally {
    setLoading(false);
  }
};
    
    fetchQrisSettings();
  }, []);

  // Membuat transaksi QRIS
  const createQrisPayment = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Gunakan try-catch bersarang untuk menangani berbagai kemungkinan error
    try {
      // Coba panggil API terlebih dahulu
      const response = await axiosInstance.post('/api/qris-payment', {
        plan_id: plan.id
      });
      
      if (response.data && response.data.payment) {
        setPaymentData(response.data.payment);
        setCurrentStep(1);
        return;
      }
    } catch (apiError) {
      console.warn("API error, falling back to mock data:", apiError);
      // Jangan throw error di sini, lanjutkan ke fallback
    }
    
    // Fallback jika API gagal: Buat data pembayaran dummy
    const mockPayment = {
      reference: `QRIS${Date.now().toString().slice(-8)}`,
      total_amount: plan.price,
      status: 'UNPAID',
      createdAt: new Date().toISOString(),
      expired_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    setPaymentData(mockPayment);
    setCurrentStep(1);
    message.warning('Menggunakan data simulasi karena server tidak merespons');
    
  } catch (error) {
    console.error("Error creating QRIS payment:", error);
    setError("Gagal membuat pembayaran QRIS. Silakan coba lagi nanti.");
  } finally {
    setLoading(false);
  }
};

  // Upload bukti pembayaran
  const uploadPaymentProof = async (reference, file, onSuccess, onError) => {
  try {
    // Validasi file
    if (!file) {
      throw new Error("File bukti pembayaran harus dipilih");
    }
    
    // Validasi tipe file
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      throw new Error("File harus berupa gambar (JPG, PNG)");
    }
    
    // Buat FormData
    const formData = new FormData();
    formData.append('payment_proof', file);
    
    // Coba upload dengan retry
    const response = await fetchWithRetry(
      () => axiosInstance.post(
        `/api/qris-payment/${reference}/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000 // 30 detik timeout
        }
      )
    );
    
    if (response.data && response.data.payment) {
      onSuccess && onSuccess(response.data);
      return response.data;
    } else {
      throw new Error("Respons server tidak valid");
    }
  } catch (error) {
    console.error("Error upload bukti pembayaran:", error);
    onError && onError(error);
    throw error;
  }
};

// Gunakan fungsi uploadPaymentProof dalam komponen
const handleUpload = async (file) => {
  setLoading(true);
  try {
    await uploadPaymentProof(
      paymentData.reference, 
      file,
      (data) => {
        setPaymentProof(URL.createObjectURL(file));
        message.success("Bukti pembayaran berhasil diunggah");
        setCurrentStep(2);
      },
      (error) => {
        message.error(`Gagal mengunggah: ${error.message || 'Server error'}`);
      }
    );
  } catch (e) {
    console.error("Error in handleUpload:", e);
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
  const retryApiCall = async () => {
    if (currentStep === 0) {
      message.info("Mencoba memuat pengaturan QRIS kembali...");
      try {
        setLoading(true);
        setError(null);
        setRetryingApi(true);
        
        const response = await axiosInstance.get('/api/qris-settings');
        
        setQrisSettings(response.data);
        setRetryingApi(false);
        message.success("Berhasil memuat pengaturan QRIS");
      } catch (error) {
        console.error("Error fetching QRIS settings:", error);
        setError("Masih gagal memuat pengaturan QRIS. Mohon coba lagi nanti.");
        setRetryingApi(false);
        message.error("Gagal memuat pengaturan QRIS");
      } finally {
        setLoading(false);
      }
    } else if (currentStep === 1) {
      createQrisPayment();
    } else if (currentStep === 2 && paymentData) {
      message.info("Silakan unggah bukti pembayaran kembali");
    }
  };

  // Render berdasarkan status pembayaran
  const renderPaymentSteps = () => {
    if (loading && !paymentData && !qrisSettings) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Memuat{retryingApi ? ", mencoba ulang API..." : "..."}</div>
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
              <Text strong>{plan.name}</Text> - Rp {parseInt(plan.price).toLocaleString('id-ID')}
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
              {qrisSettings.qris_image ? (
  <div style={{ textAlign: 'center', marginBottom: 20 }}>
    <Image 
      src={qrisSettings.qris_image} 
      alt="QRIS Code" 
      style={{ maxWidth: '100%', maxHeight: '300px' }} 
      fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADIAQAAAACFI5MzAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAAAGAAAABgAPBrQs8AAAAHdElNRQfmCQQDNDPWFuVDAAABRklEQVRYw+2YMQ7DIAxFDRk5Qo7AUTgaR+loOQJHYKSImVTNb2OqqlVg8E+Wh56UxS/xizFCHLdpuN6jfXvdvT0+nUYQBEEQBEHQT5HDl1sP59Ad/qz7+iYIgiAIgqDvItMcusyfh84x9YMfn04jCIKO6fmsvlLSt2mv1EW25aRsktV5qbJoD89pKtKeZgel0ownZVuSY1ovaQ9n9xRpT9O9kteXJsmhaX2mvaQfTusU3QYmk+RYVJ/kcDSvlvYkrk9ykKoysnE0r5b2JK5PclRUZWTj+oQs19fQKGXOzYaKc5LFEefoKoHmDSL9afqMSH+ansR1Wo9JX0xRx6JcqGlPzRxR7UnoKMnRqD7JsWheLe1JXJ/kKKnKyMbRvFrak7g+yTGpysjG9QlZrq+hMSjnZgPFuYoiR1cJNG/Qr5xGEARB/61fgNtCpXX3HcoAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMDktMDRUMDM6NTI6NTErMDA6MDDlm9l8AAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTA5LTA0VDAzOjUyOjUxKzAwOjAwlMZhwAAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMi0wOS0wNFQwMzo1Mjo1MSswMDowMMPTQB0AAAAASUVORK5CYII="
      onError={(e) => {
        console.error("Error loading QRIS image:", e);
        message.error("Gambar QRIS tidak dapat dimuat. Menggunakan placeholder.");
      }}
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
) : (
  <Alert
    message="Kode QRIS tidak tersedia"
    description="Kode QRIS tidak dapat dimuat. Silakan hubungi admin untuk bantuan."
    type="warning"
    showIcon
  />
)}
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
                  beforeUpload={(file) => {
                    uploadPaymentProof(file);
                    return false;
                  }}
                  showUploadList={false}
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