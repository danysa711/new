// File: react/src/pages/ApiProxy.jsx

import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Spin, Result, Typography } from 'antd';
import { ConnectionContext } from '../context/ConnectionContext';
import { AuthContext } from '../context/AuthContext';

const { Text } = Typography;

/**
 * Komponen ApiProxy berfungsi untuk meneruskan permintaan API dari domain frontend ke backend
 * Ini membantu mengatasi masalah CORS dan menyediakan cara untuk mengakses API dari domain yang sama
 */
const ApiProxy = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { backendUrl, isConnected } = useContext(ConnectionContext);
  const { token } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);

  useEffect(() => {
    const fetchFromBackend = async () => {
      try {
        // Pastikan backendUrl sudah dikonfigurasi
        if (!backendUrl) {
          setError('URL backend belum dikonfigurasi. Silakan atur di halaman pengaturan koneksi.');
          setLoading(false);
          return;
        }

        // Dapatkan path API dari URL saat ini
        const apiPath = location.pathname.replace('/api', '');
        const fullUrl = `${backendUrl}/api${apiPath}${location.search}`;
        
        console.log(`Meneruskan permintaan ke: ${fullUrl}`);

        // Dapatkan method, headers, dan body dari query params jika ada
        const method = new URLSearchParams(location.search).get('_method') || 'GET';
        let requestBody = null;
        
        try {
          const bodyParam = new URLSearchParams(location.search).get('_body');
          if (bodyParam) {
            requestBody = JSON.parse(bodyParam);
          }
        } catch (err) {
          console.error('Error parsing request body:', err);
        }

        // Siapkan headers
        const headers = {
          'Content-Type': 'application/json',
        };

        // Tambahkan token ke header jika tersedia
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Buat opsi untuk fetch
        const fetchOptions = {
          method,
          headers,
          credentials: 'include',
        };

        // Tambahkan body jika bukan GET
        if (method !== 'GET' && requestBody) {
          fetchOptions.body = JSON.stringify(requestBody);
        }

        // Lakukan fetch
        const response = await fetch(fullUrl, fetchOptions);
        
        // Cek status response
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Terjadi kesalahan' }));
          throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const data = await response.json();
        setResponse(data);
      } catch (err) {
        console.error('Error in API proxy:', err);
        setError(err.message || 'Terjadi kesalahan saat meneruskan permintaan ke backend');
      } finally {
        setLoading(false);
      }
    };

    fetchFromBackend();
  }, [location, backendUrl, token]);

  // Redirect ke halaman pengaturan jika backendUrl tidak dikonfigurasi
  useEffect(() => {
    if (!backendUrl && !loading) {
      navigate('/connection-settings');
    }
  }, [backendUrl, loading, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
        <Text style={{ marginLeft: 16 }}>Meneruskan permintaan ke backend...</Text>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Gagal Meneruskan Permintaan"
        subTitle={error}
        extra={[
          <Text key="1">URL Backend: {backendUrl}</Text>,
          <Text key="2">Endpoint: {location.pathname}</Text>,
        ]}
      />
    );
  }

  if (response) {
    return (
      <pre style={{ padding: 20 }}>{JSON.stringify(response, null, 2)}</pre>
    );
  }

  return null;
};

export default ApiProxy;