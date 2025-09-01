import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Alert, Spin, Typography, Divider, Tag, Space } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios'; // Pastikan axios diimpor
import { getActiveBackendUrl } from '../api/utils';

const { Title, Text, Paragraph } = Typography;

const OrderSearch = () => {
  // State untuk form
  const [orderData, setOrderData] = useState({
    order_id: '',
    item_name: '',
    os: '',
    version: '',
    item_amount: 1
  });
  
  const [backendUrl, setBackendUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
  // Ambil URL backend user saat komponen dimuat
  useEffect(() => {
    const url = getActiveBackendUrl();
    console.log("Backend URL diatur ke:", url);
    setBackendUrl(url);
  }, []);
  
  // Menangani perubahan pada form input
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Menangani perubahan pada jumlah item
  const handleAmountChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setOrderData(prev => ({
      ...prev,
      item_amount: value
    }));
  };
  
  // Menangani pengiriman form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults(null);
    
    try {
      // Validasi input
      if (!orderData.order_id || !orderData.item_name) {
        throw new Error('Nomor pesanan dan nama produk harus diisi');
      }
      
      console.log("Mengirim permintaan ke:", backendUrl);
      console.log("Data yang dikirim:", orderData);
      
      // Perbaikan: Gunakan axios langsung dengan token
      // Ambil token dari localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Anda harus login terlebih dahulu');
      }
      
      // Panggil API untuk mencari pesanan
      const response = await axios.post(
        `${backendUrl}/api/orders/find`, 
        orderData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // Tambahkan timeout 15 detik
        }
      );
      
      console.log("Respons API:", response.data);
      
      setResults(response.data);
    } catch (err) {
      console.error('Error searching for order:', err);
      // Perbaikan: Tangani berbagai jenis error dengan lebih baik
      if (err.response) {
        // Error dari server (status code selain 2xx)
        console.error('Server response error:', err.response.data);
        setError(err.response.data.message || `Error ${err.response.status}: ${err.response.statusText}`);
      } else if (err.request) {
        // Request dibuat tapi tidak ada respons
        console.error('No response received:', err.request);
        setError('Tidak ada respons dari server. Silakan periksa koneksi Anda dan coba lagi.');
      } else {
        // Error lainnya
        setError(err.message || 'Gagal mencari pesanan. Silakan coba lagi.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card title={<Title level={3}>Pencarian Pesanan</Title>}>
        <Alert
          message="Backend URL:"
          description={backendUrl || "Tidak tersedia"}
          type="info"
          showIcon
          style={{ marginBottom: '20px' }}
        />
        
        {error && (
          <Alert
            message="Error"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '20px' }}
          />
        )}
        
        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Nomor Pesanan Shopee"
            name="order_id"
            rules={[{ required: true, message: 'Nomor pesanan harus diisi' }]}
          >
            <Input
              value={orderData.order_id}
              onChange={(e) => handleInputChange(e)}
              placeholder="Masukkan nomor pesanan"
              name="order_id"
            />
          </Form.Item>
          
          <Form.Item
            label="Nama Produk"
            name="item_name"
            rules={[{ required: true, message: 'Nama produk harus diisi' }]}
          >
            <Input
              value={orderData.item_name}
              onChange={(e) => handleInputChange(e)}
              placeholder="Masukkan nama produk"
              name="item_name"
            />
          </Form.Item>
          
          <Space style={{ display: 'flex', width: '100%' }}>
            <Form.Item
              label="Variasi 1 (OS)"
              name="os"
              style={{ flex: 1 }}
            >
              <Input
                value={orderData.os}
                onChange={(e) => handleInputChange(e)}
                placeholder="Contoh: Windows, macOS"
                name="os"
              />
            </Form.Item>
            
            <Form.Item
              label="Variasi 2 (Versi)"
              name="version"
              style={{ flex: 1 }}
            >
              <Input
                value={orderData.version}
                onChange={(e) => handleInputChange(e)}
                placeholder="Contoh: 2.0, Premium"
                name="version"
              />
            </Form.Item>
          </Space>
          
          <Form.Item
            label="Jumlah Item"
            name="item_amount"
          >
            <Input
              type="number"
              value={orderData.item_amount}
              onChange={(e) => handleAmountChange(e)}
              min="1"
              name="item_amount"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SearchOutlined />}
                loading={loading}
              >
                Cari Pesanan
              </Button>
              
              <Button
                onClick={() => {
                  setOrderData({
                    order_id: '',
                    item_name: '',
                    os: '',
                    version: '',
                    item_amount: 1
                  });
                  setResults(null);
                  setError(null);
                }}
                icon={<ReloadOutlined />}
              >
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
        
        {loading && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '10px' }}>Mencari pesanan...</div>
          </div>
        )}
        
        {results && (
          <>
            <Divider />
            <Title level={4}>Hasil Pencarian</Title>
            
            <Alert
              message={results.message}
              type={results.licenses && results.licenses.length > 0 ? "success" : "warning"}
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Produk:</Text> {results.item}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Nomor Pesanan:</Text> {results.order_id || '-'}
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Download Link:</Text>
              {results.download_link ? (
                <a href={results.download_link} target="_blank" rel="noopener noreferrer">
                  {results.download_link}
                </a>
              ) : (
                <Text type="secondary">Tidak ada link download</Text>
              )}
            </div>
            
            <div>
              <Text strong>Lisensi:</Text>
              {results.licenses && results.licenses.length > 0 ? (
                <div style={{ marginTop: '10px' }}>
                  {results.licenses.map((license, index) => (
                    <Tag key={index} color="blue" style={{ margin: '5px' }}>
                      {license}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Text type="secondary"> Tidak ada lisensi</Text>
              )}
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default OrderSearch;