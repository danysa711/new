// components/QRISPayment.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Typography, Button, Spin, Alert, 
  Image, Descriptions, Tag, Space, Divider, Statistic 
} from 'antd';
import { 
  QrcodeOutlined, 
  ReloadOutlined, 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import CountDown from 'antd/lib/statistic/Countdown';

const { Title, Text, Paragraph } = Typography;

const QRISPayment = ({ 
  transaction, 
  onCheckStatus, 
  checkingStatus, 
  onPaymentDone 
}) => {
  // State untuk status timer
  const [timerFinished, setTimerFinished] = useState(false);
  
  // Hitung waktu tersisa pembayaran
  const getTimeRemaining = () => {
    if (!transaction || !transaction.expired_at) {
      return 0;
    }
    
    const now = new Date().getTime();
    const expiry = new Date(transaction.expired_at).getTime();
    const timeRemaining = expiry - now;
    
    return timeRemaining > 0 ? timeRemaining : 0;
  };
  
  // Effect untuk memeriksa apakah waktu habis
  useEffect(() => {
    if (getTimeRemaining() <= 0) {
      setTimerFinished(true);
    }
  }, [transaction]);
  
  // Handle saat timer selesai
  const handleTimerFinish = () => {
    setTimerFinished(true);
  };
  
  // Jika tidak ada transaksi
  if (!transaction) {
    return null;
  }
  
  // Jika pembayaran sudah lunas
  if (transaction.status === 'PAID') {
    return (
      <Card>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
          <Title level={3}>Pembayaran Berhasil</Title>
          <Paragraph>
            Terima kasih! Pembayaran Anda telah diverifikasi.
          </Paragraph>
          <Divider />
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Referensi">
              {transaction.reference}
            </Descriptions.Item>
            <Descriptions.Item label="Metode Pembayaran">
              {transaction.payment_name}
            </Descriptions.Item>
            <Descriptions.Item label="Jumlah">
              Rp {transaction.total_amount.toLocaleString('id-ID')}
            </Descriptions.Item>
            <Descriptions.Item label="Tanggal Pembayaran">
              {transaction.paid_at ? moment(transaction.paid_at).format('DD MMM YYYY HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>
          {onPaymentDone && (
            <Button 
              type="primary" 
              style={{ marginTop: 20 }}
              onClick={onPaymentDone}
            >
              Kembali
            </Button>
          )}
        </div>
      </Card>
    );
  }
  
  // Jika pembayaran expired
  if (transaction.status === 'EXPIRED' || timerFinished) {
    return (
      <Card>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <CloseCircleOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
          <Title level={3}>Pembayaran Kedaluwarsa</Title>
          <Paragraph>
            Waktu pembayaran telah habis. Silakan membuat transaksi baru.
          </Paragraph>
          <Divider />
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Referensi">
              {transaction.reference}
            </Descriptions.Item>
            <Descriptions.Item label="Metode Pembayaran">
              {transaction.payment_name}
            </Descriptions.Item>
            <Descriptions.Item label="Jumlah">
              Rp {transaction.total_amount.toLocaleString('id-ID')}
            </Descriptions.Item>
          </Descriptions>
          {onPaymentDone && (
            <Button 
              type="primary" 
              style={{ marginTop: 20 }}
              onClick={onPaymentDone}
            >
              Buat Transaksi Baru
            </Button>
          )}
        </div>
      </Card>
    );
  }
  
  // Pembayaran menunggu (default view)
  return (
    <Card>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Title level={3}>
          <Space>
            <QrcodeOutlined />
            Pembayaran QRIS
          </Space>
        </Title>
        <Tag color="orange" style={{ fontSize: 16, padding: '4px 8px' }}>
          <Space>
            <ClockCircleOutlined /> MENUNGGU PEMBAYARAN
          </Space>
        </Tag>
      </div>
      
      {/* Countdown Timer */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <Title level={4}>Selesaikan Pembayaran Dalam</Title>
        <CountDown 
          value={Date.now() + getTimeRemaining()} 
          format="HH:mm:ss"
          onFinish={handleTimerFinish}
        />
        <Paragraph type="secondary" style={{ marginTop: 8 }}>
          Batas waktu: {moment(transaction.expired_at).format('DD MMM YYYY HH:mm')}
        </Paragraph>
      </div>
      
      <Divider />
      
      {/* Info Pembayaran */}
      <Descriptions bordered column={1} size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Total Pembayaran">
          <Text strong style={{ fontSize: 16 }}>
            Rp {transaction.total_amount.toLocaleString('id-ID')}
          </Text>
        </Descriptions.Item>
        <Descriptions.Item label="Referensi">
          <Text copyable>{transaction.reference}</Text>
        </Descriptions.Item>
      </Descriptions>
      
      {/* QRIS Code */}
      {transaction.qr_url ? (
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Image 
            src={transaction.qr_url}
            alt="QRIS Code"
            style={{ maxWidth: 250, margin: '0 auto' }}
            fallback="https://via.placeholder.com/250x250?text=QR+Code"
          />
          <Paragraph style={{ marginTop: 16 }}>
            Scan QR Code di atas menggunakan aplikasi e-wallet atau mobile banking Anda
          </Paragraph>
        </div>
      ) : (
        <Alert
          message="QR Code tidak tersedia"
          description="Terjadi kesalahan saat memuat QR Code. Silakan coba periksa status pembayaran."
          type="warning"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}
      
      {/* Instruksi */}
      <Alert
        message="Cara Pembayaran QRIS"
        description={
          <ol style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li>Buka aplikasi e-wallet atau mobile banking Anda</li>
            <li>Pilih menu scan QR atau QRIS</li>
            <li>Scan QR Code di atas</li>
            <li>Periksa detail transaksi dan nominal pembayaran</li>
            <li>Selesaikan pembayaran sesuai petunjuk di aplikasi Anda</li>
            <li>Setelah pembayaran selesai, klik tombol "Periksa Status" di bawah</li>
          </ol>
        }
        type="info"
        showIcon
        style={{ marginBottom: 20 }}
      />
      
      {/* Tombol Aksi */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <Space>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={checkingStatus}
            onClick={() => onCheckStatus(transaction.reference)}
            size="large"
          >
            Periksa Status Pembayaran
          </Button>
          
          {onPaymentDone && (
            <Button onClick={onPaymentDone} size="large">
              Batal
            </Button>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default QRISPayment;