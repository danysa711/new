// src/components/ErrorBoundary.jsx
import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state sehingga render berikutnya akan menampilkan UI fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error ke layanan
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Tampilkan UI fallback
      return (
        <Result
          status="error"
          title="Terjadi Kesalahan"
          subTitle="Maaf, aplikasi mengalami error. Silakan coba muat ulang halaman."
          extra={[
            <Button 
              type="primary" 
              key="reload"
              onClick={() => {
                window.location.reload();
              }}
            >
              Muat Ulang
            </Button>,
            <Button 
              key="home"
              onClick={() => {
                window.location.href = '/';
              }}
            >
              Kembali ke Beranda
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;