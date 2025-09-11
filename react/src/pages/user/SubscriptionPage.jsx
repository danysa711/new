import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { 
  Card, Row, Col, Typography, Button, Table, Tag, 
  Divider, Spin, Empty, Alert, Modal, Statistic, 
  Descriptions, Result, Steps, Select, Radio, Input, Form, message, Tabs, Timeline, Space
} from 'antd';
import { 
  ShoppingCartOutlined, CheckCircleOutlined, 
  CalendarOutlined, BankOutlined, WalletOutlined,
  InfoCircleOutlined, CreditCardOutlined, ClockCircleOutlined,
  CheckOutlined, CloseOutlined, DollarOutlined, ReloadOutlined
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import moment from 'moment';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/const';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

// Helper Functions untuk localStorage
const getLocalStorage = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
    return null;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const setLocalStorage = (key, value) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error setting localStorage:', error);
    return false;
  }
};

const removeLocalStorage = (key) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error removing from localStorage:', error);
    return false;
  }
};

const SubscriptionPage = () => {
  // Ambil user, updateUserData, dan fetchUserProfile dari AuthContext
  const { user, updateUserData, fetchUserProfile } = useContext(AuthContext);
  
  // State variables
  const [useDetailedPaymentView, setUseDetailedPaymentView] = useState(false);
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [activeSubscription, setActiveSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [transactionHistories, setTransactionHistories] = useState([]);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState('subscriptions');
  const [form] = Form.useForm();
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [paymentPollingInterval, setPaymentPollingInterval] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Helper Functions
  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Calculate remaining days
  const calculateRemainingDays = (endDate) => {
    try {
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    } catch (error) {
      console.error('Error calculating remaining days:', error);
      return 0;
    }
  };

  // Fetch payment methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      console.log('Fetching payment methods from API...');
      
      // Coba ambil dari API Tripay dengan penanganan error yang lebih baik
      try {
        const response = await axiosInstance.get('/api/tripay/payment-channels', {
          timeout: 10000 // 10 detik timeout
        });
        
        if (response.data && Array.isArray(response.data)) {
          console.log('Available payment methods from API:', response.data);
          // Filter hanya metode pembayaran yang aktif dan urutkan berdasarkan grup
          const activeMethods = response.data
            .filter(method => method.active)
            .sort((a, b) => {
              if (a.group === b.group) {
                return a.name.localeCompare(b.name);
              }
              return a.group.localeCompare(b.group);
            });
            
          setPaymentMethods(activeMethods);
          
          // Jika ada metode pembayaran, set default ke metode pertama
          if (activeMethods.length > 0) {
            form.setFieldsValue({ payment_method: activeMethods[0].code });
          }
          
          return activeMethods;
        }
      } catch (apiErr) {
        console.error('Error fetching from API:', apiErr);
        // Tampilkan pesan error yang lebih deskriptif
        message.error(`Gagal memuat metode pembayaran: ${apiErr.response?.data?.message || apiErr.message}`);
      }
      
      // Fallback data jika API gagal
      console.log('Using fallback payment methods');
      const fallbackMethods = [
        { code: 'QRIS', name: 'QRIS', type: 'qris', group: 'QRIS', fee: 800, active: true },
        { code: 'BRIVA', name: 'Bank BRI', type: 'bank', group: 'Virtual Account', fee: 4000, active: true },
        { code: 'MANDIRIVA', name: 'Bank Mandiri', type: 'bank', group: 'Virtual Account', fee: 4000, active: true },
        { code: 'BCAVA', name: 'Bank BCA', type: 'bank', group: 'Virtual Account', fee: 4000, active: true }
      ];
      
      setPaymentMethods(fallbackMethods);
      form.setFieldsValue({ payment_method: fallbackMethods[0].code });
      return fallbackMethods;
    } catch (err) {
      console.error('Error in fetchPaymentMethods:', err);
      message.error('Terjadi kesalahan saat memuat metode pembayaran');
      return [];
    }
  }, [form]);

  // Event Handlers
  const handlePurchase = (plan) => {
    try {
      setSelectedPlan(plan);
      form.resetFields();
      form.setFieldsValue({
        name: user?.username || '',
        email: user?.email || '',
        phone: ''
      });
      setPaymentResult(null);
      setPaymentModalVisible(true);
      setIsPaymentProcessing(true); // Tandai bahwa sedang dalam proses pembayaran
      
      // Load payment methods and set default
      fetchPaymentMethods().then(methods => {
        if (methods && methods.length > 0) {
          form.setFieldsValue({ payment_method: methods[0].code });
        }
      });
    } catch (error) {
      console.error('Error in handlePurchase:', error);
      message.error('Terjadi kesalahan. Silakan coba lagi.');
    }
  };
  
  const handleCheckStatus = async (reference) => {
  try {
    setCheckingStatus(true);
    
    try {
      // Coba cek status transaksi di API
      const response = await axiosInstance.get(`/api/tripay/transaction-status/${reference}`);
      
      if (response.data && response.data.success) {
        const transaction = response.data.transaction;
        
        // Update transaction in state
        setPendingTransactions(prev => 
          prev.map(trans => 
            trans.reference === reference ? { ...trans, status: transaction.status } : trans
          ).filter(trans => trans.status === 'UNPAID')
        );
        
        // If status changed to PAID, update UI accordingly
        if (transaction.status === 'PAID') {
          setTransactionHistories(prev => [transaction, ...prev]);
          message.success('Pembayaran telah berhasil dikonfirmasi! Langganan Anda telah diaktifkan.');
          
          // Refresh user profile data to update subscription status
          if (fetchUserProfile) {
            fetchUserProfile();
          }
          
          // Reload subscription data
          fetchData();
          
          return transaction.status;
        }
        
        message.info('Status pembayaran belum berubah. Silakan coba lagi nanti.');
        
        // TAMBAHKAN KODE INI
        // Jika status masih UNPAID, mulai polling otomatis
        if (transaction.status === 'UNPAID') {
          startPaymentPolling(reference);
        }
        
        return transaction.status;
      } else {
        message.warning('Tidak dapat memverifikasi status pembayaran dari server.');
      }
    } catch (apiError) {
      console.error("Error memeriksa status via API:", apiError);
      message.warning("Tidak dapat memeriksa status transaksi melalui server. Mohon coba lagi nanti.");
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    message.error('Gagal memeriksa status pembayaran');
  } finally {
    setCheckingStatus(false);
  }
  
  return null;
};

  const startPaymentPolling = (reference) => {
  // Hentikan polling sebelumnya jika ada
  stopPaymentPolling();
  
  console.log(`Memulai polling pembayaran untuk referensi: ${reference}`);
  
  // Mulai interval baru
  const intervalId = setInterval(async () => {
    try {
      console.log(`Memeriksa status pembayaran untuk: ${reference}`);
      const status = await handleCheckStatus(reference);
      
      // Jika sudah dibayar, hentikan polling
      if (status === 'PAID') {
        console.log('Pembayaran selesai, menghentikan polling');
        stopPaymentPolling();
      }
    } catch (error) {
      console.error('Error saat polling status pembayaran:', error);
    }
  }, 30000); // Periksa setiap 30 detik
  
  // Simpan ID interval ke state
  setPaymentPollingInterval(intervalId);
};

  const stopPaymentPolling = () => {
  if (paymentPollingInterval) {
    console.log('Menghentikan polling pembayaran');
    clearInterval(paymentPollingInterval);
    setPaymentPollingInterval(null);
  }
};

  const handleManualRefresh = async () => {
  try {
    setRefreshing(true);
    message.loading({
      content: 'Memperbarui status transaksi...',
      key: 'refreshing',
      duration: 0
    });
    
    // Panggil endpoint untuk memperbarui status transaksi
    const response = await axiosInstance.post('/api/tripay/update-pending-transactions');
    
    if (response.data && response.data.updated > 0) {
      message.success({
        content: `${response.data.updated} transaksi berhasil diperbarui!`,
        key: 'refreshing',
        duration: 2
      });
      
      // Refresh data
      await fetchData();
    } else {
      message.info({
        content: 'Tidak ada perubahan status transaksi',
        key: 'refreshing',
        duration: 2
      });
    }
  } catch (error) {
    console.error('Error refreshing transactions:', error);
    message.error({
      content: 'Gagal memperbarui status transaksi',
      key: 'refreshing'
    });
  } finally {
    setRefreshing(false);
  }
};

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      
      // 1. Validasi form
      const values = await form.validateFields();
      
      if (!values.payment_method) {
        message.warning('Silakan pilih metode pembayaran');
        setPaymentLoading(false);
        return;
      }
      
      // 2. Validasi data
      console.log('Data form:', values);
      console.log('Paket langganan yang dipilih:', selectedPlan);
      
      if (!selectedPlan || !selectedPlan.id || !selectedPlan.price) {
        message.error('Data paket langganan tidak valid');
        setPaymentLoading(false);
        return;
      }
      
      // 3. Cari metode pembayaran yang dipilih
      const selectedMethod = paymentMethods.find(m => m.code === values.payment_method);
      console.log('Metode pembayaran yang dipilih:', selectedMethod);
      
      if (!selectedMethod) {
        message.error('Metode pembayaran tidak valid');
        setPaymentLoading(false);
        return;
      }
      
      // 4. Persiapkan data payload
      const payload = {
        plan_id: selectedPlan.id,
        payment_method: values.payment_method,
        customer_name: values.name || user?.username || '',
        customer_email: values.email || user?.email || '',
        customer_phone: values.phone || ''
      };
      
      console.log('Payload untuk transaksi Tripay:', payload);
      
      // Tampilkan teks loading yang lebih deskriptif
      message.loading({
        content: 'Memproses pembayaran...',
        key: 'paymentLoading',
        duration: 0
      });
      
      // 5. PERBAIKAN: LANGSUNG GUNAKAN ENDPOINT TRIPAY TANPA MELALUI ENDPOINT LAIN
      
      try {
        console.log("Langsung menggunakan endpoint Tripay...");
        const response = await axiosInstance.post('/api/tripay/create-transaction', payload, {
          timeout: 45000 // 45 detik timeout
        });
        
        if (response.data && response.data.success) {
          const transaction = response.data.transaction;
          
          // Periksa apakah transaksi adalah demo
          if (transaction.reference && transaction.reference.includes('DEMO-TRX')) {
            console.error("Masih mendapatkan transaksi demo, mencoba lagi...");
            message.error({
              content: 'Mendapatkan transaksi demo. Mencoba ulang untuk transaksi real.',
              key: 'paymentLoading'
            });
            setPaymentLoading(false);
            return;
          }
          
          // Update UI
          setPendingTransactions(prev => {
            const exists = prev.find(t => t.reference === transaction.reference);
            if (exists) return prev;
            return [transaction, ...prev];
          });
          setPaymentResult(transaction);
          
          // Simpan ke localStorage
          try {
            const existingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
            const transactionExists = existingTransactions.find(t => t.reference === transaction.reference);
            if (!transactionExists) {
              existingTransactions.push(transaction);
              localStorage.setItem('pendingTransactions', JSON.stringify(existingTransactions));
            }
          } catch (storageError) {
            console.error("Error menyimpan ke localStorage:", storageError);
          }
          
          message.success({
            content: 'Transaksi berhasil dibuat',
            key: 'paymentLoading',
            duration: 2
          });
          
          return;
        } else {
          throw new Error(response.data?.message || "Gagal membuat transaksi");
        }
      } catch (tripayError) {
        console.error("Endpoint Tripay gagal:", tripayError);
        
        // Jika endpoint Tripay gagal dan kita benar-benar membutuhkan fallback,
        // gunakan endpoint alternatif yang tersedia (tapi hindari endpoint demo)
        try {
          console.log("Mencoba endpoint alternatif...");
          // Gunakan header khusus untuk memberi tahu backend untuk tidak mengarahkan ke demo
          const alternativeResponse = await axiosInstance.post('/api/subscriptions/purchase', 
            payload, 
            {
              timeout: 30000, // 30 detik timeout
              headers: {
                'X-Skip-Demo': 'true' // Header khusus untuk memberi tahu backend agar tidak menggunakan demo
              }
            }
          );
          
          if (alternativeResponse.data && alternativeResponse.data.success) {
            const transaction = alternativeResponse.data.transaction;
            
            // Periksa lagi untuk memastikan bukan transaksi demo
            if (transaction.reference && transaction.reference.includes('DEMO-TRX')) {
              console.error("Masih mendapatkan transaksi demo dari alternatif");
              throw new Error("Sistem masih mengembalikan transaksi demo");
            }
            
            // Update UI
            setPendingTransactions(prev => {
              const exists = prev.find(t => t.reference === transaction.reference);
              if (exists) return prev;
              return [transaction, ...prev];
            });
            setPaymentResult(transaction);
            
            // Simpan ke localStorage
            try {
              const existingTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
              const transactionExists = existingTransactions.find(t => t.reference === transaction.reference);
              if (!transactionExists) {
                existingTransactions.push(transaction);
                localStorage.setItem('pendingTransactions', JSON.stringify(existingTransactions));
              }
            } catch (storageError) {
              console.error("Error menyimpan ke localStorage:", storageError);
            }
            
            message.success({
              content: 'Transaksi berhasil dibuat',
              key: 'paymentLoading',
              duration: 2
            });
            
            return;
          }
        } catch (alternativeError) {
          console.error("Endpoint alternatif juga gagal:", alternativeError);
          throw new Error("Gagal membuat transaksi. Silakan coba lagi nanti.");
        }
      }
    } catch (err) {
      console.error('Error memproses pembayaran:', err);
      message.error({
        content: 'Gagal memproses pembayaran: ' + (err.message || 'Terjadi kesalahan'),
        key: 'paymentLoading'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      console.log('Starting data fetch...');
      setLoading(true);
      setError(null);

      // Fetch subscription plans dengan error handling yang lebih baik
      try {
        console.log('Fetching subscription plans...');
        const plansResponse = await axiosInstance.get('/api/subscription-plans');
        console.log('Plans data received:', plansResponse.data);
        setPlans(plansResponse.data);
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
        // Gunakan pesan error
        message.error('Gagal memuat data paket langganan');
        setPlans([]);
      }

      // Fetch user subscriptions dengan error handling yang lebih baik
      try {
        console.log('Fetching user subscriptions...');
        const subsResponse = await axiosInstance.get('/api/subscriptions/user');
        
        // Sort subscriptions by start date (newest first)
        const sortedSubs = subsResponse.data.sort((a, b) => 
          new Date(b.start_date) - new Date(a.start_date)
        );
        
        console.log('Subscriptions data received:', sortedSubs);
        setSubscriptions(sortedSubs);

        // Find active subscription
        const active = subsResponse.data.find(
          (sub) => sub.status === 'active' && new Date(sub.end_date) > new Date()
        );
        
        setActiveSubscription(active);
        
        // Jika status berlangganan berubah, perbarui user context
        if (updateUserData) {
          if (active && !user.hasActiveSubscription) {
            // Update user data in context
            const updatedUser = { ...user, hasActiveSubscription: true };
            updateUserData(updatedUser);
          } else if (!active && user.hasActiveSubscription) {
            // Update user data in context
            const updatedUser = { ...user, hasActiveSubscription: false };
            updateUserData(updatedUser);
          }
        } else {
          console.error('updateUserData function is undefined!');
        }
      } catch (err) {
        console.error('Error fetching user subscriptions:', err);
        console.error('Error details:', err.response || err);
        // Tampilkan pesan error yang lebih informatif
        if (err.response && err.response.status === 403) {
          setError('Anda tidak memiliki akses ke fitur langganan. Silakan hubungi admin.');
        } else {
          setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
        }
        setSubscriptions([]);
      }

      // Fetch payment methods
      console.log('Fetching payment methods...');
      await fetchPaymentMethods();
      
      // Fetch pending transactions
      try {
        console.log('Fetching pending transactions...');
        const pendingResponse = await axiosInstance.get('/api/tripay/pending-transactions');
        setPendingTransactions(pendingResponse.data || []);
      } catch (err) {
        console.error('Error fetching pending transactions:', err);
        message.error('Gagal memuat transaksi tertunda');
        // Fallback to empty array
        setPendingTransactions([]);
      }

      try {
        console.log('Fetching transaction histories...');
        const historyResponse = await axiosInstance.get('/api/tripay/transaction-history');
        setTransactionHistories(historyResponse.data || []);
      } catch (err) {
        console.error('Error fetching transaction histories:', err);
        message.error('Gagal memuat riwayat transaksi');
        // Fallback to empty array
        setTransactionHistories([]);
      }

    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Gagal memuat data langganan. Silakan coba lagi nanti.');
    } finally {
      setLoading(false);
      console.log('Data fetch completed, loading set to false');
    }
  }, [fetchPaymentMethods, updateUserData, user]);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTabKey(key);
  };

  // Render functions
  const renderPaymentInstructions = (transaction) => {
    try {
      if (!transaction) return null;
      
      // Handling untuk instruksi
      let instructions = [];
      if (transaction.instructions) {
        if (typeof transaction.instructions === 'string') {
          try {
            instructions = JSON.parse(transaction.instructions);
          } catch (e) {
            console.error("Failed to parse instructions:", e);
            instructions = [];
          }
        } else if (Array.isArray(transaction.instructions)) {
          instructions = transaction.instructions;
        }
      }

      const QRCodeWithFallback = ({ qrUrl, reference, payment_code }) => {
        const [qrError, setQrError] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        
        // Gunakan useRef untuk melacak apakah komponen masih terpasang
        const isMounted = useRef(true);
        
        useEffect(() => {
          // Gunakan ini untuk mencegah operasi yang tidak perlu
          // atau menggunakan useRef untuk melacak apakah komponen masih terpasang
          isMounted.current = true;
          
          // Reset state saat URL berubah, hanya jika komponen masih terpasang
          if (isMounted.current) {
            setQrError(false);
            setIsLoading(true);
          }
          
          return () => {
            isMounted.current = false;
          };
        }, [qrUrl]);
        
        // Coba reload QR code
        const reloadQR = () => {
          if (!isMounted.current) return;
          
          setQrError(false);
          setIsLoading(true);
          
          // Tambahkan timestamp untuk menghindari cache
          const timestamp = Date.now();
          const newQrUrl = qrUrl.includes('?') 
            ? `${qrUrl.split('?')[0]}?t=${timestamp}` 
            : `${qrUrl}?t=${timestamp}`;
          
          // Buat elemen gambar baru untuk memuat QR code
          const img = new Image();
          img.onload = () => {
            if (!isMounted.current) return;
            setIsLoading(false);
            // Perbarui referensi DOM langsung setelah berhasil memuat
            const qrImageElement = document.getElementById('qr-image');
            if (qrImageElement) {
              qrImageElement.src = newQrUrl;
              qrImageElement.style.display = 'block';
            }
          };
          img.onerror = () => {
            if (!isMounted.current) return;
            setQrError(true);
            setIsLoading(false);
          };
          img.src = newQrUrl;
        };
        
        return (
          <div style={{ position: 'relative', width: '200px', height: '200px', margin: '20px auto', border: '1px solid #f0f0f0', padding: '10px' }}>
            {/* Overlay loading */}
            {isLoading && (
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)' }}>
                <Spin />
              </div>
            )}
            
            {/* QR Image */}
            {!qrError && (
              <img 
                id="qr-image"
                src={qrUrl} 
                alt="QRIS Code" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: qrError ? 'none' : 'block' }}
                onLoad={() => isMounted.current && setIsLoading(false)}
                onError={() => isMounted.current && setQrError(true)}
              />
            )}
            
            {/* Fallback untuk error */}
            {qrError && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>QR Code tidak dapat dimuat</div>
                <div style={{ fontSize: '12px' }}>Silakan gunakan kode pembayaran berikut:</div>
                <div style={{ fontWeight: 'bold', marginTop: '10px', fontSize: '14px', wordBreak: 'break-all' }}>
                  {reference || payment_code || 'Tidak tersedia'}
                </div>
              </div>
            )}
            
            {/* Tombol Reload */}
            <Button 
              type="link" 
              icon={<ReloadOutlined />} 
              style={{ position: 'absolute', top: '5px', right: '5px', background: 'rgba(255,255,255,0.7)' }}
              onClick={reloadQR}
              loading={isLoading}
            />
          </div>
        );
      };
      
      // QRIS dengan perbaikan handling QR Code
      if (transaction.payment_method === 'QRIS' && transaction.qr_url) {
        // Logging untuk debug
        console.log("QRIS URL ditemukan:", transaction.qr_url);
        
        return (
          <div style={{ marginTop: 20 }}>
            <Divider />
            <Title level={4}>Instruksi Pembayaran</Title>
            <div style={{ textAlign: 'center' }}>
              {/* Gunakan komponen QR Code yang ditingkatkan */}
              <QRCodeWithFallback 
                qrUrl={transaction.qr_url} 
                reference={transaction.reference} 
                payment_code={transaction.payment_code} 
              />
              
              <Text>Setelah melakukan pembayaran, Tutup dan refresh halaman langganan akan otomatis di tambahkan</Text>
              
              {/* Tampilkan referensi transaksi yang bisa disalin */}
              <div style={{ marginTop: 10 }}>
                <Text strong>Referensi: </Text>
                <Text copyable>{transaction.reference}</Text>
              </div>
            </div>

            {Array.isArray(instructions) && instructions.length > 0 && (
              <div style={{ marginTop: 20 }}>
                {instructions.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: 15 }}>
                    <Text strong>{section.title || 'Cara Pembayaran QRIS'}</Text>
                    {Array.isArray(section.steps) && (
                      <ul style={{ paddingLeft: 20 }}>
                        {section.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {transaction.expired_at && (
              <Alert 
                message="Penting!" 
                description={`Bayar sebelum ${new Date(transaction.expired_at).toLocaleString('id-ID')} atau transaksi akan dibatalkan otomatis.`}
                type="warning" 
                showIcon 
                style={{ marginTop: 20 }}
              />
            )}
          </div>
        );
      }

      // Virtual Account atau metode lain
      if (transaction.payment_code) {
        return (
          <div style={{ marginTop: 20 }}>
            <Divider />
            <Title level={4}>Instruksi Pembayaran</Title>
            
            <Alert
              message="Kode Pembayaran"
              description={
                <Text copyable strong style={{ fontSize: '16px' }}>
                  {transaction.payment_code}
                </Text>
              }
              type="info"
              showIcon
              style={{ marginBottom: 20 }}
            />
            
            {Array.isArray(instructions) && instructions.length > 0 && (
              <div>
                {instructions.map((section, idx) => (
                  <div key={idx} style={{ marginBottom: 15 }}>
                    <Text strong>{section.title || 'Langkah-langkah'}</Text>
                    {Array.isArray(section.steps) && (
                      <ul style={{ paddingLeft: 20 }}>
                        {section.steps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {transaction.expired_at && (
              <Alert 
                message="Penting!" 
                description={`Bayar sebelum ${new Date(transaction.expired_at).toLocaleString('id-ID')} atau transaksi akan dibatalkan otomatis.`}
                type="warning" 
                showIcon 
                style={{ marginTop: 20 }}
              />
            )}
          </div>
        );
      }
      
      // Default fallback
      return (
        <div style={{ marginTop: 20 }}>
          <Divider />
          <Title level={4}>Instruksi Pembayaran</Title>
          <Alert
            message="Petunjuk Pembayaran"
            description="Silakan selesaikan pembayaran Anda sesuai dengan metode yang dipilih"
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />
        </div>
      );
    } catch (error) {
      console.error('Error rendering payment instructions:', error);
      return (
        <Alert
          message="Terjadi Kesalahan"
          description="Gagal menampilkan instruksi pembayaran"
          type="error"
          showIcon
        />
      );
    }
  };

  // Render hasil pembayaran
  const renderPaymentResult = (transaction) => {
    try {
      if (!transaction) {
        return (
          <Alert
            message="Terjadi Kesalahan"
            description="Data transaksi tidak tersedia"
            type="error"
            showIcon
          />
        );
      }
      
      console.log('Transaction data:', transaction);
      
      // Cek apakah transaksi adalah demo atau bukan
      const isDemo = transaction?.reference?.includes('DEMO-TRX');
      
      // Pastikan semua nilai ada dan dalam format yang benar
      const amount = typeof transaction.amount === 'number' ? transaction.amount : 
                    (typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : 0);
      
      const fee = typeof transaction.fee === 'number' ? transaction.fee : 
                 (typeof transaction.fee === 'string' ? parseFloat(transaction.fee) : 0);
                 
      const total_amount = typeof transaction.total_amount === 'number' ? transaction.total_amount : 
                           (typeof transaction.total_amount === 'string' ? parseFloat(transaction.total_amount) : 0);
      
      return (
        <div>
          {isDemo && (
            <Alert
              message="Mode Demo"
              description="Ini adalah mode demo, silakan gunakan transaksi sebenarnya untuk melakukan pembayaran."
              type="warning"
              showIcon
              style={{ marginBottom: 20 }}
            />
          )}
          
          <Result
            status="success"
            title="Pembayaran Berhasil Dibuat"
            subTitle={
              <div>
                <div>Referensi: {transaction.reference || 'N/A'}</div>
                <div>Status: <Tag color="warning">MENUNGGU PEMBAYARAN</Tag></div>
              </div>
            }
          />
          
          <Descriptions
            title="Detail Transaksi"
            bordered
            column={1}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Referensi">
              <Text copyable>{transaction.reference || 'N/A'}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Metode Pembayaran">
              {transaction.payment_name || transaction.payment_method || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Paket">
              {transaction.plan_name || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Jumlah">
              Rp {isNaN(amount) ? '0' : amount.toLocaleString('id-ID')}
            </Descriptions.Item>
            {fee > 0 && (
              <Descriptions.Item label="Biaya Admin">
                Rp {isNaN(fee) ? '0' : fee.toLocaleString('id-ID')}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Total">
              <Text strong>Rp {isNaN(total_amount) ? '0' : total_amount.toLocaleString('id-ID')}</Text>
            </Descriptions.Item>
            {transaction.expired_at && (
              <Descriptions.Item label="Batas Waktu">
                {new Date(transaction.expired_at).toLocaleString('id-ID')}
              </Descriptions.Item>
            )}
          </Descriptions>
          
          {!isDemo && renderPaymentInstructions(transaction)}
        </div>
      );
    } catch (error) {
      console.error('Error rendering payment result:', error);
      return (
        <Alert
          message="Terjadi Kesalahan"
          description={`Gagal menampilkan detail transaksi: ${error.message}`}
          type="error"
          showIcon
        />
      );
    }
  };

  const transactionErrors = {};

  const recoverLostTransactions = useCallback(async () => {
    try {
      // Jangan recover saat modal terbuka atau sedang dalam proses pembayaran
      if (paymentModalVisible || isPaymentProcessing) {
        return;
      }
      
      console.log('Mencoba memulihkan transaksi yang hilang...');
      
      // Coba ambil transaksi dari localStorage
      const localTransactions = JSON.parse(localStorage.getItem('pendingTransactions') || '[]');
      
      if (localTransactions.length === 0) {
        console.log('Tidak ada transaksi di localStorage');
        return;
      }
      
      console.log('Menemukan transaksi di localStorage:', localTransactions.length);
      
      // Bandingkan dengan transaksi yang ada di state
      const existingRefs = pendingTransactions.map(t => t.reference);
      
      // Filter hanya transaksi yang belum ada di state dan belum error sebelumnya
      const missingTransactions = localTransactions.filter(t => 
        !existingRefs.includes(t.reference) && !transactionErrors[t.reference]
      );
      
      if (missingTransactions.length === 0) {
        console.log('Semua transaksi localStorage sudah ada di state');
        return;
      }
      
      console.log(`Menemukan ${missingTransactions.length} transaksi yang hilang, mencoba memulihkan...`);
      
      // Tambahkan langsung ke state
      missingTransactions.forEach(transaction => {
        console.log(`Memulihkan transaksi ${transaction.reference}`);
        // Tandai transaksi ini sebagai sudah dicoba
        transactionErrors[transaction.reference] = true;
      });
      
      // Update state sekaligus
      setPendingTransactions(prev => {
        const newTransactions = [...missingTransactions, ...prev];
        console.log('Updated pending transactions:', newTransactions.length);
        return newTransactions;
      });
      
      // Tidak perlu menghapus dari localStorage, biarkan sampai berhasil diproses
    } catch (error) {
      console.error("Error memulihkan transaksi:", error);
    }
  }, [pendingTransactions, paymentModalVisible, isPaymentProcessing]);

  // Modified useEffect dengan integrasi semua perbaikan
  useEffect(() => {
  try {
    // PERBAIKAN: Jangan fetch data sama sekali jika modal pembayaran terbuka ATAU ada hasil pembayaran
    if (paymentModalVisible || paymentResult || isPaymentProcessing) {
      console.log('Menghentikan fetch data karena sedang dalam proses pembayaran atau modal terbuka');
      return;
    }
    
    console.log('useEffect: Kondisi memungkinkan untuk fetch data');
    fetchData();
    
    // Tambahkan pemanggilan fungsi pemulihan transaksi hanya jika tidak sedang dalam proses pembayaran
    if (!paymentModalVisible && !paymentResult) {
      recoverLostTransactions();
    }
    
    // Set interval untuk memeriksa status langganan setiap 5 menit
    const checkSubscriptionInterval = setInterval(() => {
      // Jangan refresh jika modal pembayaran sedang terbuka atau ada hasil pembayaran atau sedang dalam proses pembayaran
      if (!paymentModalVisible && !paymentResult && !isPaymentProcessing) {
        console.log('Interval: Melakukan refresh data');
        if (fetchUserProfile) {
          fetchUserProfile();
        }
        fetchData();
      } else {
        console.log('Interval: Menghentikan refresh karena modal terbuka atau dalam proses pembayaran');
      }
    }, 5 * 60 * 1000);
    
    // Cleanup interval pada unmount
    return () => {
      clearInterval(checkSubscriptionInterval);
      stopPaymentPolling(); // TAMBAHKAN BARIS INI untuk membersihkan polling saat unmount
    };
  } catch (error) {
    console.error('Error in useEffect:', error);
    setError('Terjadi kesalahan saat memuat data. Silakan muat ulang halaman.');
  }
}, [user, updateUserData, fetchUserProfile, fetchData, paymentModalVisible, paymentResult, isPaymentProcessing]);

  // Render loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 20 }}>Memuat data langganan...</div>
      </div>
    );
  }

  // Render error state
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

  // Main component render
  return (
    <div>
      <Title level={2}>Langganan</Title>

      {/* Active Subscription Section */}
      <Card 
        title={<Title level={4}>Status Langganan</Title>} 
        style={{ marginBottom: 24 }}
        extra={
          activeSubscription ? (
            <Tag color="success" style={{ fontSize: '14px', padding: '4px 8px' }}>AKTIF</Tag>
          ) : (
            <Tag color="error" style={{ fontSize: '14px', padding: '4px 8px' }}>TIDAK AKTIF</Tag>
          )
        }
      >
        {activeSubscription ? (
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Sisa Waktu Langganan"
                value={calculateRemainingDays(activeSubscription.end_date)}
                suffix="hari"
                valueStyle={{ color: '#3f8600' }}
              />
            </Col>
            <Col xs={24} sm={12} md={16}>
              <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="Mulai Langganan">
                  {formatDate(activeSubscription.start_date)}
                </Descriptions.Item>
                <Descriptions.Item label="Berakhir Pada">
                  {formatDate(activeSubscription.end_date)}
                </Descriptions.Item>
                <Descriptions.Item label="Status Pembayaran">
                  <Tag color={activeSubscription.payment_status === 'paid' ? 'green' : 'orange'}>
                    {activeSubscription.payment_status === 'paid' ? 'LUNAS' : 'MENUNGGU'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Metode Pembayaran">
                  {activeSubscription.payment_method || '-'}
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>
        ) : (
          <Result
            status="warning"
            title="Anda belum memiliki langganan aktif"
            subTitle="Silakan pilih paket langganan di bawah untuk mengaktifkan fitur penuh"
            extra={
              <Button type="primary" onClick={() => {
                try {
                  window.scrollTo({
                    top: document.getElementById('subscription-plans').offsetTop - 20,
                    behavior: 'smooth'
                  });
                } catch (error) {
                  console.error('Error scrolling to plans:', error);
                  // Fallback jika terjadi error
                  const plansElement = document.getElementById('subscription-plans');
                  if (plansElement) plansElement.scrollIntoView();
                }
              }}>
                Lihat Paket Langganan
              </Button>
            }
          />
        )}
      </Card>  
      
      {/* Pending Transactions Alert */}
      {pendingTransactions.length > 0 && (
        <Alert
          message={`Anda memiliki ${pendingTransactions.length} transaksi pembayaran tertunda`}
          description="Silakan selesaikan pembayaran untuk mengaktifkan langganan Anda."
          type="warning"
          showIcon
          action={
            <Button 
              type="primary" 
              onClick={() => {
                try {
                  document.getElementById('transactions-tab').scrollIntoView({ behavior: 'smooth' });
                  setActiveTabKey('pending');
                } catch (error) {
                  console.error('Error scrolling to transactions tab:', error);
                  // Fallback jika terjadi error
                  const tabElement = document.getElementById('transactions-tab');
                  if (tabElement) tabElement.scrollIntoView();
                  setActiveTabKey('pending');
                }
              }}
            >
              Lihat Detail
            </Button>
          }
          style={{ marginBottom: 24 }}
        />
      )}
      
      {/* Available Plans Section */}
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
                    <Tag color="green">Rp {plan.price.toLocaleString('id-ID')}</Tag>
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

      <Divider />
      
      {/* Transaction History Tabs */}
      <div id="transactions-tab">
        <Tabs 
          activeKey={activeTabKey}
          onChange={handleTabChange}
          items={[
            {
              key: "subscriptions",
              label: "Riwayat Langganan",
              children: (
                <Table
                  dataSource={subscriptions}
                  rowKey="id"
                  columns={[
                    {
                      title: 'Tanggal Mulai',
                      dataIndex: 'start_date',
                      key: 'start_date',
                      render: (date) => formatDate(date),
                      sorter: (a, b) => new Date(b.start_date) - new Date(a.start_date),
                      defaultSortOrder: 'descend',
                    },
                    {
                      title: 'Tanggal Berakhir',
                      dataIndex: 'end_date',
                      key: 'end_date',
                      render: (date) => formatDate(date),
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status, record) => {
                        let color = 'default';
                        let displayText = status.toUpperCase();
                        
                        if (status === 'active') {
                          const now = new Date();
                          const endDate = new Date(record.end_date);
                          
                          if (endDate > now) {
                            color = 'success';
                            displayText = 'AKTIF';
                          } else {
                            color = 'error';
                            displayText = 'KADALUARSA';
                          }
                        } else if (status === 'canceled') {
                          color = 'warning';
                          displayText = 'DIBATALKAN';
                        }
                        
                        return <Tag color={color}>{displayText}</Tag>;
                      },
                      filters: [
                        { text: 'Aktif', value: 'active' },
                        { text: 'Dibatalkan', value: 'canceled' },
                      ],
                      onFilter: (value, record) => record.status === value,
                    },
                    {
                      title: 'Status Pembayaran',
                      dataIndex: 'payment_status',
                      key: 'payment_status',
                      render: (status) => {
                        const statusMap = {
                          'paid': { color: 'green', text: 'LUNAS' },
                          'pending': { color: 'orange', text: 'MENUNGGU' },
                          'failed': { color: 'red', text: 'GAGAL' }
                        };
                        
                        const { color, text } = statusMap[status] || { color: 'default', text: status.toUpperCase() };
                        
                        return <Tag color={color}>{text}</Tag>;
                      },
                      filters: [
                        { text: 'Lunas', value: 'paid' },
                        { text: 'Menunggu', value: 'pending' },
                        { text: 'Gagal', value: 'failed' },
                      ],
                      onFilter: (value, record) => record.payment_status === value,
                    },
                    {
                      title: 'Metode Pembayaran',
                      dataIndex: 'payment_method',
                      key: 'payment_method',
                      render: (method) => method || '-',
                    },
                  ]}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'Belum ada riwayat langganan' }}
                />
              )
            },
            {
              key: "transactions",
              label: "Riwayat Transaksi",
              children: (
                <Table
                  dataSource={transactionHistories}
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
                      dataIndex: 'plan_name',
                      key: 'plan_name',
                    },
                    {
                      title: 'Metode',
                      dataIndex: 'payment_name',
                      key: 'payment_name',
                    },
                    {
                      title: 'Jumlah',
                      dataIndex: 'total_amount',
                      key: 'total_amount',
                      render: (amount) => `Rp ${parseInt(amount).toLocaleString('id-ID')}`,
                      sorter: (a, b) => a.total_amount - b.total_amount,
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: (status) => {
                        let color = 'default';
                        let text = status;
                        
                        if (status === 'PAID') {
                          color = 'success';
                          text = 'LUNAS';
                        } else if (status === 'UNPAID') {
                          color = 'warning';
                          text = 'MENUNGGU';
                        } else if (status === 'EXPIRED') {
                          color = 'error';
                          text = 'KEDALUWARSA';
                        } else if (status === 'FAILED') {
                          color = 'error';
                          text = 'GAGAL';
                        }

                        return <Tag color={color}>{text}</Tag>;
                      },
                      filters: [
                        { text: 'LUNAS', value: 'PAID' },
                        { text: 'MENUNGGU', value: 'UNPAID' },
                        { text: 'KEDALUWARSA', value: 'EXPIRED' },
                        { text: 'GAGAL', value: 'FAILED' },
                      ],
                      onFilter: (value, record) => record.status === value,
                    },
                    {
                      title: 'Tanggal',
                      dataIndex: 'created_at',
                      key: 'created_at',
                      render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
                      sorter: (a, b) => moment(a.created_at).unix() - moment(b.created_at).unix(),
                      defaultSortOrder: 'descend',
                    },
                    {
                      title: 'Aksi',
                      key: 'action',
                      render: (_, record) => (
                        <Button 
                          type="link"
                          onClick={() => {
                            try {
                              setPaymentResult(record);
                              setPaymentModalVisible(true);
                            } catch (error) {
                              console.error('Error setting payment result:', error);
                              message.error('Terjadi kesalahan. Silakan coba lagi.');
                            }
                          }}
                        >
                          Detail
                        </Button>
                      ),
                    },
                  ]}
                  pagination={{ pageSize: 5 }}
                  locale={{ emptyText: 'Belum ada riwayat transaksi' }}
                />
              )
            },
            {
              key: "pending",
              label: (
                <span>
                  Menunggu Pembayaran
                  {pendingTransactions.length > 0 && (
                    <Tag color="warning" style={{ marginLeft: 8 }}>
                      {pendingTransactions.length}
                    </Tag>
                  )}
                </span>
              ),
              children: (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Title level={5}>Transaksi Menunggu Pembayaran</Title>
                    <Button 
                      type="primary"
                      icon={<ReloadOutlined />}
                      loading={refreshing}
                      onClick={handleManualRefresh}
                    >
                      {refreshing ? 'Memperbarui...' : 'Perbarui Status'}
                    </Button>
                  </div>
                  
                  {pendingTransactions.length === 0 ? (
                    <Empty description="Tidak ada transaksi yang menunggu pembayaran" />
                  ) : (
                    <Table
                      dataSource={pendingTransactions}
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
                          dataIndex: 'plan_name',
                          key: 'plan_name',
                        },
                        {
                          title: 'Metode',
                          dataIndex: 'payment_name',
                          key: 'payment_name',
                        },
                        {
                          title: 'Total',
                          dataIndex: 'total_amount',
                          key: 'total_amount',
                          render: (amount) => `Rp ${parseInt(amount).toLocaleString('id-ID')}`,
                        },
                        {
                          title: 'Batas Waktu',
                          dataIndex: 'expired_at',
                          key: 'expired_at',
                          render: (date) => moment(date).format('DD MMM YYYY HH:mm'),
                        },
                        {
                          title: 'Aksi',
                          key: 'action',
                          render: (_, record) => (
                            <Space>
                              <Button 
                                type="primary" 
                                size="small"
                                onClick={() => {
                                  try {
                                    setPaymentResult(record);
                                    setPaymentModalVisible(true);
                                  } catch (error) {
                                    console.error('Error setting payment result:', error);
                                    message.error('Terjadi kesalahan. Silakan coba lagi.');
                                  }
                                }}
                              >
                                Lihat Detail
                              </Button>
                              <Button 
                                size="small" 
                                onClick={() => handleCheckStatus(record.reference)}
                                loading={checkingStatus}
                              >
                                Cek Status
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                      pagination={{ pageSize: 5 }}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      </div>

      {/* Payment Modal */}
      <Modal
        title={paymentResult ? "Detail Transaksi" : "Pembayaran Langganan"}
        open={paymentModalVisible}
        onCancel={() => {
          try {
            // Jangan tutup modal jika sedang loading atau ada error
            if (paymentLoading) {
              console.log('Modal tidak bisa ditutup saat loading');
              return;
            }
            
            console.log('Menutup modal pembayaran');
            setPaymentModalVisible(false);
            setPaymentResult(null);
            setIsPaymentProcessing(false); // Reset flag saat modal ditutup
            
            // Bersihkan form
            form.resetFields();
          } catch (error) {
            console.error('Error closing modal:', error);
            setPaymentModalVisible(false);
            setPaymentResult(null);
            setIsPaymentProcessing(false); // Reset flag saat modal ditutup
          }
        }}
        footer={
          paymentResult ? [
            <Button key="close" onClick={() => {
              try {
                console.log('Menutup modal dari footer');
                
                // BARU: Hentikan polling jika ada
                stopPaymentPolling();
                
                setPaymentModalVisible(false);
                setPaymentResult(null);
                setIsPaymentProcessing(false); // Reset flag saat modal ditutup
                
                // Bersihkan form
                form.resetFields();
              } catch (error) {
                console.error('Error closing modal:', error);
                stopPaymentPolling(); // Pastikan polling dihentikan
                setPaymentModalVisible(false);
                setPaymentResult(null);
                setIsPaymentProcessing(false); // Reset flag saat modal ditutup
              }
            }}>
              Tutup
            </Button>
          ] : null
        }
        width={700}
        closable={!paymentLoading} // Tidak bisa ditutup saat loading
      >
        {selectedPlan && !paymentResult && (
          <Form form={form} layout="vertical" onFinish={handlePayment}>
            <div style={{ marginBottom: 20 }}>
              <Title level={4}>Paket: {selectedPlan.name}</Title>
              <Paragraph>
                <Text strong>Harga:</Text> Rp {selectedPlan.price.toLocaleString('id-ID')}
              </Paragraph>
              <Paragraph>
                <Text strong>Durasi:</Text> {selectedPlan.duration_days} hari
              </Paragraph>
              <Paragraph>
                <Text strong>Deskripsi:</Text> {selectedPlan.description || `Langganan standar selama ${selectedPlan.name}`}
              </Paragraph>
            </div>
            
            <Divider />
            
            <Form.Item
              name="name"
              label="Nama Lengkap"
              rules={[{ required: true, message: 'Harap masukkan nama lengkap' }]}
              initialValue={user?.username}
            >
              <Input placeholder="Nama lengkap sesuai identitas" />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Harap masukkan email' },
                { type: 'email', message: 'Format email tidak valid' }
              ]}
              initialValue={user?.email}
            >
              <Input placeholder="Email aktif untuk notifikasi pembayaran" />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label="Nomor Telepon"
              rules={[
                { required: true, message: 'Harap masukkan nomor telepon' },
                { pattern: /^[0-9+]+$/, message: 'Hanya angka dan tanda + diperbolehkan' }
              ]}
            >
              <Input placeholder="Contoh: 081234567890" />
            </Form.Item>
            
            <Divider />
            
            <Form.Item
              name="payment_method"
              label="Metode Pembayaran"
              rules={[{ required: true, message: 'Harap pilih metode pembayaran' }]}
            >
              <Radio.Group buttonStyle="solid" onChange={(e) => {
                try {
                  console.log("Metode pembayaran dipilih:", e.target.value);
                  form.setFieldsValue({ payment_method: e.target.value });
                } catch (error) {
                  console.error('Error setting payment method:', error);
                }
              }}>
                {paymentMethods
                  .filter(method => method.active)
                  .map((method) => (
                    <Radio.Button 
                      key={method.code} 
                      value={method.code} 
                      style={{ 
                        marginRight: 8, 
                        marginBottom: 8, 
                        padding: '8px 12px',
                        display: 'inline-flex',
                        alignItems: 'center' 
                      }}
                    >
                      {method.name}
                      {method.fee > 0 && <Text type="secondary" style={{ marginLeft: 4 }}> (+{method.fee})</Text>}
                    </Radio.Button>
                  ))}
              </Radio.Group>
            </Form.Item>
            
            {form.getFieldValue('payment_method') && (
              <div style={{ marginBottom: 16 }}>
                {(() => {
                  try {
                    const selectedMethod = paymentMethods.find(
                      method => method.code === form.getFieldValue('payment_method')
                    );
                    if (!selectedMethod) return null;
                    
                    return (
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Harga Paket">
                          Rp {selectedPlan.price.toLocaleString('id-ID')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Biaya Admin">
                          Rp {selectedMethod.fee.toLocaleString('id-ID')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Pembayaran">
                          <Text strong>
                            Rp {(selectedPlan.price + selectedMethod.fee).toLocaleString('id-ID')}
                          </Text>
                        </Descriptions.Item>
                      </Descriptions>
                    );
                  } catch (error) {
                    console.error('Error rendering payment summary:', error);
                    return null;
                  }
                })()}
              </div>
            )}
            
            <Form.Item style={{ marginTop: 24 }}>
              <Button 
                type="primary" 
                htmlType="submit"
                loading={paymentLoading}
                disabled={paymentLoading || !form.getFieldValue('payment_method')}
                block
              >
                Lanjutkan Pembayaran
              </Button>
            </Form.Item>
          </Form>
        )}
        
        {/* Hasil Pembayaran */}
        {paymentResult && renderPaymentResult(paymentResult)}
        
        {paymentLoading && !paymentResult && (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px' }}>Memproses pembayaran...</div>
          </div>
        )}
      </Modal>
    </div>
  );
};


export default SubscriptionPage;