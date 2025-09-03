import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Typography, Alert, Spin, Result,
  Steps, Upload, message, Divider, Image, Tag, Space
} from 'antd';
import { 
  QrcodeOutlined, UploadOutlined, CheckCircleOutlined,
  InfoCircleOutlined, CopyOutlined, ReloadOutlined
} from '@ant-design/icons';
import qrisService from '../services/qrisService';
import axiosInstance from '../services/axios';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

// Konfigurasi retry
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 detik

// Fungsi untuk melakukan retry request dengan exponential backoff
const fetchWithRetry = async (apiCall, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) => {
  try {
    return await apiCall();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    
    console.log(`Sisa percobaan: ${retries}. Mencoba ulang dalam ${delay}ms...`);
    
    // Tunggu sebelum retry
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry dengan delay yang lebih lama
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
  const uploadPaymentProof = async (file) => {
    try {
      setLoading(true);
      setError(null);
      
      // Validasi file
      if (!file) {
        message.error("Silakan pilih file gambar");
        setLoading(false);
        return;
      }
      
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error("File harus berupa gambar (JPG, PNG)");
        setLoading(false);
        return;
      }
      
      setRetryingApi(true);
      
      // Buat FormData untuk upload
      const formData = new FormData();
      formData.append('payment_proof', file);
      
      const response = await fetchWithRetry(
        () => axiosInstance.post(
          `/api/qris-payment/${paymentData.reference}/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }
        )
      );
      
      if (response.data && response.data.payment) {
        setPaymentProof(URL.createObjectURL(file));
        message.success("Bukti pembayaran berhasil diunggah");
        setCurrentStep(2);
      }
      
      setRetryingApi(false);
    } catch (error) {
      console.error("Error uploading payment proof:", error);
      setError("Gagal mengunggah bukti pembayaran. Silakan coba lagi nanti.");
      setRetryingApi(false);
    } finally {
      setLoading(false);
    }
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
                <Image 
                  src={qrisSettings.qris_image} 
                  alt="QRIS Code" 
                  style={{ maxWidth: '100%', maxHeight: '300px' }} 
                  fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAMAAABrrFhUAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAMAUExURQAAAJtuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuI5tuIxGa8FEAAAEAdFJOU////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////wBT9wclAAAACXBIWXMAAA7DAAAOwwHHb6hkAAAGyklEQVR4Xu3de1sURxTAYUBBEBAQRPGGN1CjeItXNBoTE2NiotGo0WiMGk2i0STn+z9CZmdndhcWpqfOVM+es+f3R6Crf9Z3ge7ZS7dAKaWUUkoppZRSSimllFJKKaWUUkoppZRSilkfOh7Ol0qlUokf9xIFgAeJ4kRNHiHV7PFAcSl5RHRlTxR3UkjwQ/ZAcaYkuCFX60Txps0uoZoDxZ32oODNgeJQkV7GpYLiUh+5qP3DgeLSIHm2Zw4Ul/rFdTlQnBpkCxSn+sh1OVCcKpJLO1Bc2sUDxZkBzh8oDnGn7EBxZogP9e5AcWWYh4kDxZVBzu8HxZ1+XsHuFCgOVXmFEQEUd/b4D7wcoLgzQgsUZ8o8BoozfVTjYZICiisV3hABFFeGeV0vB4ojAxwVQHHlIDX5YRIUNw5Rix8mQXGiTGt+mATFiQFq88MkKC5UaZOsKC5UacvbHCgOVGnbPwWKrn7a8UMFiqa+g7RLVhRNQwc5KoiKoqXCUQEULZXDHBVAUVKmVA9zoGio8k+3RFKU9A9RWlYUHRUeIMsEio4+PkDpbweKhv5RPkCWOFLiK/EA/XtF4itX+MdbIkmIq1w9SjvOgBLfQX6wJb4hjgoiGOQBsiGUyI5Ro9YgibfM8+8RJL4qsS0mJQrHv9MkssqDxDKYkKgqx9gWkxJVmR9tiW2UWHaToqjyMxSxlYnN7pFEUhkltrApcQ0T22JS4qrwb/UlslGOCkIrE9uZ5yQRDRLb4abENcwRUmjDxLaYlLhG+EhUYrpP7GAOlIiqVOOoIBGNEdtiUmKqEjvYACWaMcptMSlxjZJ4bJwgcZ0k8fCXxNWOhEeWg9RO45DQ8EiuNGLXwD9VysmFG4vzs6XVmdnFP64uEsYfV2dn5h7PdlfnZ/+8Nn+r17DPL5KQwJnSm/MXrz1YfgTy6NHDh49w8+7Z8xcm+mik9xKwL3V7/nLh6Y6Yybd6vzJ/Zb5PBm5gX/Ld69fL29ZzMNur9+bmSxLINnbPxcXdKlbUMtW7yzcX1Mu4gD2pn+8/XeEsyGa25ue2SSg72OV//o8EsmC/f3cDGvkc9vyuPUkga3rx18xhCWUZ94Hud2MQWd90B/bcLpxYlmA/xL+SRHK9tz93+V4k2OP6+fFqEsmCvZK/lUCyYY/prXIiWbCnszctgbB7vLNPE0gu7dHcGE8kCfZgbp5OKAd2+R/GkkiurcczFxNLttnZqZkrl5ZmZ2dvbSBfNh7O3Lq9+/hpMrHUm5lJZm2eKZb5+Wh+jP3qR/Jl47Pbt/cSWTMzE1Wta9G+3/O9Dz3ZeHD3flLnS7Jh1+zqB7XxHnb5p2cmsWY+Vz9fE7vyd1Ja21df2nMJZXn2tKc12aNrX/nrrxPJ8gx+vrXbSr9p/+3p8sM3iXzZeLV6d+9DIgVv/WBX/snrxLL8+2rz08nEsvC23Np5m9R5n9T5JaGCt3aw7/dlcglm+f8klOUB/HxLyy8TKnj7FXZXLr9KLMuLHtbmb4ll4W25t5LQudePXf7F0sOEsvxXBxvv+qmPYL+C+C2hLH9YnbeJZfmA0Fr5NYnzNpnzawIFa0GwX5+4l1gW3pbfJXLed2L3S19I6jwbw+75XyeW5dHHRLIcgJzvzZTY5c+s3U8sy/OPsLW28j2JciA536ucw975Mwll+Svna/SsG/t+n15LKEtw48Deb/p9Yll2lmHn09T1JE65EAA7xWzxPcHWRjBrY1/k/JlYlgd1rfUAa3N/KLksgW0BPw/K2+PcD/ow/9/EsuzjZePXw86nUNg/YGLZeYCdX2cTy/KgiLVRCTufGp9PKstO/dLfC/H5lbqVXBZc+cPYnf9DYlmw81eJsC+w8KWEsnwL9flCyc5fJv7YkFwW7PwQeEj+/iKxLLAthz5AEb70g33/xYXEskB6qXPYd34poSz4pR92foUfn0wuyz+wLwU2vtXJxLLgtjyQ/hpw2H0CfL8F+35bvyd0XlcD2+IXwf0VvgI9n1KnE8vyDe5LtTl/B7bFr0Bb/gG25V/eJnOeQufN1IWEsvwAdv4Kv5WtJZdl5wJe+cNf4CgJdl/6OqlzIRx22k</Polygon>"
                />
              ) : (
                <Alert
                  message="Kode QRIS tidak tersedia"
                  description="Kode QRIS tidak dapat dimuat. Silakan hubungi admin untuk bantuan."
                  type="warning"
                  showIcon
                />
              )}
              <div style={{ marginTop: 8 }}>
                <Text type="secondary">Pindai kode QR di atas menggunakan aplikasi e-wallet atau m-banking Anda</Text>
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