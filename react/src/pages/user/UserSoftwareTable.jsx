import React, { useState, useEffect, useContext } from 'react';
import { 
  Table, Card, Typography, Tag, Button, 
  Input, Select, Form, message, Modal 
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllSoftware } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const UserSoftwareTable = () => {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredSoftware, setFilteredSoftware] = useState([]);
  const { user } = useContext(AuthContext);

  // Memuat data produk saat komponen dimuat
  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        setLoading(true);
        await getAllSoftware(setSoftware, setLoading, setError);
      } catch (err) {
        console.error("Error fetching software:", err);
        setError("Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    };

    fetchSoftware();
  }, []);

  // Filter produk saat pencarian berubah
  useEffect(() => {
    if (software) {
      const filtered = software.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredSoftware(filtered);
    }
  }, [software, searchText]);

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
      title: 'Membutuhkan Stok',
      dataIndex: 'requires_license',
      key: 'requires_license',
      render: (value) => (
        <Tag color={value ? 'green' : 'orange'}>
          {value ? 'Ya' : 'Tidak'}
        </Tag>
      ),
      filters: [
        { text: 'Ya', value: true },
        { text: 'Tidak', value: false }
      ],
      onFilter: (value, record) => record.requires_license === value,
    },
    {
      title: 'Cari Berdasarkan Variasi',
      dataIndex: 'search_by_version',
      key: 'search_by_version',
      render: (value) => (
        <Tag color={value ? 'blue' : 'default'}>
          {value ? 'Ya' : 'Tidak'}
        </Tag>
      ),
      filters: [
        { text: 'Ya', value: true },
        { text: 'Tidak', value: false }
      ],
      onFilter: (value, record) => record.search_by_version === value,
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
      <Title level={2}>Daftar Produk</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Cari produk..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 300, marginBottom: 16 }}
        />
        
        <Table
          dataSource={filteredSoftware}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: error || 'Tidak ada data produk' }}
        />
      </Card>
    </div>
  );
};

export default UserSoftwareTable;