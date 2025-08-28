import React from 'react';

const UserApiInfo = ({ user }) => {
  if (!user) return null;
  
  // URL yang akan ditampilkan
  const userBackendUrl = user.backend_url || 'https://db.kinterstore.my.id';
  const publicApiUrl = `${userBackendUrl}/api/public/user/${user.url_slug}`;
  const ordersApiUrl = `${userBackendUrl}/api/orders/find`;
  
  // Function to copy text to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Teks berhasil disalin!');
      })
      .catch(err => {
        console.error('Gagal menyalin teks:', err);
      });
  };
  
  const styles = {
    card: {
      border: '1px solid #e8e8e8',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: 'white',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px'
    },
    title: {
      fontSize: '18px',
      fontWeight: 'bold',
      margin: 0
    },
    button: {
      backgroundColor: '#1890ff',
      color: 'white',
      border: 'none',
      padding: '5px 15px',
      borderRadius: '4px',
      cursor: 'pointer'
    },
    infoBox: {
      backgroundColor: '#e6f7ff',
      border: '1px solid #91d5ff',
      borderRadius: '4px',
      padding: '15px',
      marginBottom: '20px'
    },
    section: {
      marginBottom: '15px'
    },
    divider: {
      height: '1px',
      backgroundColor: '#e8e8e8',
      margin: '15px 0'
    },
    strong: {
      fontWeight: 'bold'
    },
    url: {
      padding: '8px',
      backgroundColor: '#f5f5f5',
      borderRadius: '4px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: '5px'
    },
    copyButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#1890ff',
      cursor: 'pointer'
    },
    tag: {
      display: 'inline-block',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      marginRight: '8px'
    },
    infoIcon: {
      marginLeft: '5px',
      color: '#1890ff',
      cursor: 'pointer'
    },
    linkButton: {
      backgroundColor: 'transparent',
      border: 'none',
      color: '#1890ff',
      cursor: 'pointer',
      padding: '5px 0'
    }
  };
  
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>Informasi API</h3>
        <button 
          style={styles.button}
          onClick={() => alert('Navigasi ke pengaturan backend')}
        >
          Pengaturan Backend
        </button>
      </div>
      
      <div style={styles.infoBox}>
        <strong>Backend URL adalah alamat server untuk koneksi API Anda</strong>
        <p>URL ini akan digunakan oleh aplikasi saat berkomunikasi dengan server. Anda dapat mengubahnya jika Anda menggunakan server backend pribadi.</p>
      </div>
      
      <div style={styles.section}>
        <span style={styles.strong}>Backend URL:</span>
        <div style={styles.url}>
          <span>{userBackendUrl}</span>
          <button 
            style={styles.copyButton}
            onClick={() => copyToClipboard(userBackendUrl)}
          >
            Salin
          </button>
        </div>
        <div style={{marginTop: '5px'}}>
          <span 
            style={{
              ...styles.tag, 
              backgroundColor: '#f6ffed',
              color: '#52c41a',
              border: '1px solid #b7eb8f'
            }}
          >
            Terhubung
          </span>
        </div>
      </div>
      
      <div style={styles.divider}></div>
      
      <div style={styles.section}>
        <span style={styles.strong}>API URL Publik:</span>
        <div 
          title="URL ini dapat digunakan oleh aplikasi lain untuk mengakses informasi publik tentang akun Anda"
          style={{display: 'inline-flex', alignItems: 'center'}}
        >
          <span style={styles.infoIcon}>ℹ️</span>
        </div>
        <div style={styles.url}>
          <span>{publicApiUrl}</span>
          <button 
            style={styles.copyButton}
            onClick={() => copyToClipboard(publicApiUrl)}
          >
            Salin
          </button>
        </div>
      </div>
      
      <div style={styles.divider}></div>
      
      <div style={styles.section}>
        <span style={styles.strong}>Endpoint Orders:</span>
        <div 
          title="Gunakan endpoint ini untuk integrasi dengan aplikasi lain yang membutuhkan data pesanan"
          style={{display: 'inline-flex', alignItems: 'center'}}
        >
          <span style={styles.infoIcon}>ℹ️</span>
        </div>
        <p>Gunakan endpoint berikut untuk mencari dan memproses pesanan:</p>
        <div style={styles.url}>
          <span>{ordersApiUrl}</span>
          <button 
            style={styles.copyButton}
            onClick={() => copyToClipboard(ordersApiUrl)}
          >
            Salin
          </button>
        </div>
      </div>
      
      <div style={styles.divider}></div>
      
      <button 
        style={styles.linkButton}
        onClick={() => window.open('https://documentation-link.example.com', '_blank')}
      >
        ℹ️ Lihat Dokumentasi API
      </button>
    </div>
  );
};

export default UserApiInfo;