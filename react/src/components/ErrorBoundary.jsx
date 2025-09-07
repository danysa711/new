// File: react/src/components/ErrorBoundary.jsx
import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <Result
          status="error"
          title="Terjadi Kesalahan"
          subTitle="Maaf, komponen ini mengalami error. Silakan coba muat ulang halaman."
          extra={[
            <Button 
              type="primary" 
              key="reload" 
              onClick={() => window.location.reload()}
            >
              Muat Ulang
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;