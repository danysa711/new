import React, { useState, useEffect, useContext } from 'react';
import { 
  Table, Card, Typography, Tag, Button, 
  Input, Select, Form, message, Modal 
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllSoftwareVersion } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const UserVersionTable = () => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredVersions, setFilteredVersions] = useState([]);
  const { user } = useContext(AuthContext);

  // Memuat data variasi produk saat komponen dimuat
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        await getAllSoftwareVersion(setVersions, setLoading, setError);
      } catch (err) {
        console.error("Error fetching software versions:", err);
        setError("Gagal memuat data variasi produk");
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, []);

  // Mengubah data untuk ditampilkan
  const processedVersions = versions.map(version => ({
    id: version.id,
    name: version.Software ? version.Software.name : "Unknown",
    version: version.version,
    os: version.os,
    download_link: version.download_link,
    software_id: version.software_id,
    createdAt: version.createdAt
  }));

  // Filter variasi produk saat pencarian berubah
  useEffect(() => {
    if (processedVersions) {
      const filtered = processedVersions.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.version.toLowerCase().includes(searchText.toLowerCase()) ||
        item.os.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredVersions(filtered);
    }
  }, [processedVersions, searchText]);

  // Menangani perubahan pada input pencarian
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Definisi kolom untuk tabel
  const columns = [
    { 
      title: 'Nama Produk', 
      dataIndex: 'name', 
      key: 'name',
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    { 
      title: 'Variasi¹', 
      dataIndex: 'os', 
      key: 'os',
      sorter: (a, b) => a.os.localeCompare(b.os)
    },
    { 
      title: 'Variasi²', 
      dataIndex: 'version', 
      key: 'version',
      sorter: (a, b) => a.version.localeCompare(b.version)
    },
    { 
      title: 'Download Link', 
      dataIndex: 'download_link', 
      key: 'download_link',
      render: (text) => (
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer">
            Lihat Link
          </a>
        ) : 'Tidak ada link'
      )
    },
    {
      title: 'Tanggal Ditambahkan',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('id-ID'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    }
  ];

  return (
    <div>
      <Title level={2}>Daftar Variasi Produk</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Cari variasi produk..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 300, marginBottom: 16 }}
        />
        
        <Table
          dataSource={filteredVersions}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: error || 'Tidak ada data variasi produk' }}
        />
      </Card>
    </div>
  );
};

export default UserVersionTable;