import React, { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import EnhancedLoginPage from './EnhancedLoginPage';

const EnhancedLoginPage = () => {
  // State untuk form login
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [backendUrl, setBackendUrl] = useState(
    localStorage.getItem("backendUrl") || "https://db.kinterstore.my.id"
  );
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Context untuk autentikasi
  const { login } = useContext(AuthContext);

  // Fungsi untuk melakukan login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Validasi URL backend
      if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
        throw new Error("URL backend harus dimulai dengan http:// atau https://");
      }
      
      // Simpan URL backend di localStorage
      localStorage.setItem("backendUrl", backendUrl);
      
      // Panggil fungsi login dari AuthContext
      const result = await login(username, password, remember, backendUrl);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk menggunakan backend default
  const useDefaultBackend = () => {
    setBackendUrl("https://db.kinterstore.my.id");
  };

  // Fungsi untuk menguji koneksi ke backend
  const testConnection = async () => {
    try {
      setLoading(true);
      
      // Validasi URL
      if (!backendUrl.startsWith("http://") && !backendUrl.startsWith("https://")) {
        throw new Error("URL backend harus dimulai dengan http:// atau https://");
      }
      
      // Tes koneksi ke endpoint test API
      const response = await fetch(`${backendUrl}/api/test`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.message === "API is working") {
          alert("Koneksi ke backend berhasil!");
        } else {
          throw new Error("Respons dari backend tidak valid");
        }
      } else {
        throw new Error(`Koneksi gagal dengan status: ${response.status}`);
      }
    } catch (err) {
      setError(`Gagal terhubung ke backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginBox}>
        <h2 style={styles.title}>Login</h2>
        
        {error && <div style={styles.errorMessage}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label htmlFor="username" style={styles.label}>Username atau Email</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="Masukkan username atau email"
              required
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label htmlFor="password" style={styles.label}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="Masukkan password"
              required
            />
          </div>
          
          <div style={styles.checkboxGroup}>
            <input
              id="remember"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">Ingat Saya</label>
          </div>
          
          <div style={styles.advancedToggle}>
            <button 
              type="button" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={styles.advancedButton}
            >
              {showAdvanced ? "Sembunyikan Pengaturan Lanjutan" : "Tampilkan Pengaturan Lanjutan"}
            </button>
          </div>
          
          {showAdvanced && (
            <div style={styles.advancedSection}>
              <div style={styles.inputGroup}>
                <label htmlFor="backendUrl" style={styles.label}>URL Backend</label>
                <div style={styles.urlInputGroup}>
                  <input
                    id="backendUrl"
                    type="url"
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    style={styles.input}
                    placeholder="https://db.kinterstore.my.id"
                  />
                  <button 
                    type="button" 
                    onClick={testConnection} 
                    style={styles.testButton}
                    disabled={loading}
                  >
                    Test
                  </button>
                </div>
                <div style={styles.urlHelp}>
                  <button 
                    type="button" 
                    onClick={useDefaultBackend}
                    style={styles.defaultButton}
                  >
                    Gunakan Default
                  </button>
                  <span style={styles.helpText}>
                    Masukkan URL backend Anda atau gunakan default
                  </span>
                </div>
              </div>
            </div>
          )}
          
          <button 
            type="submit" 
            style={styles.loginButton} 
            disabled={loading}
          >
            {loading ? "Memproses..." : "Login"}
          </button>
          
          <div style={styles.registerLink}>
            Belum punya akun? <a href="/register">Daftar</a>
          </div>
        </form>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  loginBox: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '30px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '24px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: 'bold'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '14px'
  },
  urlInputGroup: {
    display: 'flex',
    gap: '8px'
  },
  testButton: {
    padding: '0 15px',
    backgroundColor: '#52c41a',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  urlHelp: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '8px',
    gap: '10px'
  },
  defaultButton: {
    padding: '4px 8px',
    backgroundColor: 'transparent',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  helpText: {
    fontSize: '12px',
    color: '#888'
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '8px'
  },
  advancedToggle: {
    marginBottom: '16px',
    textAlign: 'center'
  },
  advancedButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#1890ff',
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  advancedSection: {
    marginBottom: '16px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '4px',
    border: '1px solid #f0f0f0'
  },
  loginButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#1890ff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  registerLink: {
    marginTop: '16px',
    textAlign: 'center',
    fontSize: '14px'
  },
  errorMessage: {
    padding: '10px',
    marginBottom: '16px',
    backgroundColor: '#fff1f0',
    border: '1px solid #ffccc7',
    borderRadius: '4px',
    color: '#f5222d'
  }
};

export default EnhancedLoginPage;