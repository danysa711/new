import React, { useState } from 'react';
import { findOrders } from '../services/axios';

const OrderSearchForm = () => {
  // State untuk form
  const [orderData, setOrderData] = useState({
    order_id: '',
    item_name: '',
    os: '',
    version: '',
    item_amount: 1
  });
  
  const [customBackendUrl, setCustomBackendUrl] = useState('');
  const [useCustomBackend, setUseCustomBackend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  
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
      
      // Validasi custom backend URL jika digunakan
      if (useCustomBackend && (!customBackendUrl || 
          (!customBackendUrl.startsWith('http://') && !customBackendUrl.startsWith('https://')))) {
        throw new Error('URL backend tidak valid. Harus dimulai dengan http:// atau https://');
      }
      
      // Panggil API untuk mencari pesanan
      const response = await findOrders(
        orderData, 
        useCustomBackend ? customBackendUrl : null
      );
      
      setResults(response);
    } catch (err) {
      console.error('Error searching for order:', err);
      setError(err.message || 'Gagal mencari pesanan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Menangani penggunaan URL backend default
  const handleUseDefaultBackend = () => {
    setUseCustomBackend(false);
  };
  
  // Styles untuk komponen
  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '20px',
      color: '#333'
    },
    form: {
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    formGroup: {
      marginBottom: '15px'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold'
    },
    input: {
      width: '100%',
      padding: '10px',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      fontSize: '14px'
    },
    checkbox: {
      marginRight: '10px'
    },
    buttonGroup: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '20px'
    },
    button: {
      padding: '10px 20px',
      backgroundColor: '#1890ff',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    resetButton: {
      padding: '10px 20px',
      backgroundColor: 'transparent',
      border: '1px solid #d9d9d9',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    error: {
      backgroundColor: '#fff1f0',
      border: '1px solid #ffccc7',
      borderRadius: '4px',
      padding: '10px',
      marginBottom: '20px',
      color: '#f5222d'
    },
    results: {
      marginTop: '30px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
    },
    resultTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: '#333'
    },
    resultItem: {
      padding: '10px',
      borderBottom: '1px solid #f0f0f0'
    },
    resultLabel: {
      fontWeight: 'bold',
      marginRight: '10px'
    },
    licenseList: {
      marginTop: '10px',
      padding: '10px',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px'
    },
    licenseItem: {
      padding: '5px 10px',
      backgroundColor: '#e6f7ff',
      border: '1px solid #91d5ff',
      borderRadius: '4px',
      margin: '5px',
      display: 'inline-block'
    },
    advancedToggle: {
      marginTop: '20px',
      padding: '10px',
      backgroundColor: '#f9f9f9',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    advancedSection: {
      padding: '15px',
      backgroundColor: '#fafafa',
      borderRadius: '4px',
      marginTop: '10px'
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Pencarian Pesanan</h2>
      
      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="order_id" style={styles.label}>Nomor Pesanan Shopee</label>
          <input
            type="text"
            id="order_id"
            name="order_id"
            value={orderData.order_id}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Masukkan nomor pesanan"
            required
          />
        </div>
        
        <div style={styles.formGroup}>
          <label htmlFor="item_name" style={styles.label}>Nama Produk</label>
          <input
            type="text"
            id="item_name"
            name="item_name"
            value={orderData.item_name}
            onChange={handleInputChange}
            style={styles.input}
            placeholder="Masukkan nama produk"
            required
          />
        </div>
        
        <div style={{display: 'flex', gap: '15px'}}>
          <div style={{...styles.formGroup, flex: 1}}>
            <label htmlFor="os" style={styles.label}>Variasi 1 (OS)</label>
            <input
              type="text"
              id="os"
              name="os"
              value={orderData.os}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Contoh: Windows, macOS"
            />
          </div>
          
          <div style={{...styles.formGroup, flex: 1}}>
            <label htmlFor="version" style={styles.label}>Variasi 2 (Versi)</label>
            <input
              type="text"
              id="version"
              name="version"
              value={orderData.version}
              onChange={handleInputChange}
              style={styles.input}
              placeholder="Contoh: 2.0, Premium"
            />
          </div>
        </div>
        
        <div style={styles.formGroup}>
          <label htmlFor="item_amount" style={styles.label}>Jumlah Item</label>
          <input
            type="number"
            id="item_amount"
            name="item_amount"
            value={orderData.item_amount}
            onChange={handleAmountChange}
            style={styles.input}
            min="1"
          />
        </div>
        
        <div style={styles.advancedToggle} onClick={() => setUseCustomBackend(!useCustomBackend)}>
          <div style={{display: 'flex', alignItems: 'center'}}>
            <input
              type="checkbox"
              id="useCustomBackend"
              checked={useCustomBackend}
              onChange={() => {}}
              style={styles.checkbox}
            />
            <label htmlFor="useCustomBackend">Gunakan URL Backend Kustom</label>
          </div>
        </div>
        
        {useCustomBackend && (
          <div style={styles.advancedSection}>
            <div style={styles.formGroup}>
              <label htmlFor="customBackendUrl" style={styles.label}>URL Backend</label>
              <input
                type="url"
                id="customBackendUrl"
                value={customBackendUrl}
                onChange={(e) => setCustomBackendUrl(e.target.value)}
                style={styles.input}
                placeholder="https://db.kinterstore.my.id"
              />
              <div style={{marginTop: '8px'}}>
                <button
                  type="button"
                  onClick={handleUseDefaultBackend}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d9d9d9',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Gunakan Default
                </button>
                <span style={{marginLeft: '10px', fontSize: '12px', color: '#888'}}>
                  Gunakan ini untuk mengirim permintaan ke backend lain
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div style={styles.buttonGroup}>
          <button
            type="button"
            onClick={() => {
              setOrderData({
                order_id: '',
                item_name: '',
                os: '',
                version: '',
                item_amount: 1
              });
              setCustomBackendUrl('');
              setUseCustomBackend(false);
              setResults(null);
              setError(null);
            }}
            style={styles.resetButton}
          >
            Reset
          </button>
          
          <button
            type="submit"
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'Mencari...' : 'Cari Pesanan'}
          </button>
        </div>
      </form>
      
      {results && (
        <div style={styles.results}>
          <h3 style={styles.resultTitle}>Hasil Pencarian</h3>
          
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Status:</span>
            <span>{results.message}</span>
          </div>
          
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Produk:</span>
            <span>{results.item}</span>
          </div>
          
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Nomor Pesanan:</span>
            <span>{results.order_id || '-'}</span>
          </div>
          
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Download Link:</span>
            {results.download_link ? (
              <a href={results.download_link} target="_blank" rel="noopener noreferrer">
                {results.download_link}
              </a>
            ) : (
              <span>Tidak ada link download</span>
            )}
          </div>
          
          <div style={styles.resultItem}>
            <span style={styles.resultLabel}>Lisensi:</span>
            {results.licenses && results.licenses.length > 0 ? (
              <div style={styles.licenseList}>
                {results.licenses.map((license, index) => (
                  <div key={index} style={styles.licenseItem}>
                    {license}
                  </div>
                ))}
              </div>
            ) : (
              <span>Tidak ada lisensi</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSearchForm;