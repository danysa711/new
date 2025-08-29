// File: react/src/components/tables/SoftwareTableWithFilter.jsx

import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Typography, Tag, Button, 
  Input, Form, message, Modal, Popconfirm 
} from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axiosInstance from '../../services/axios';
import { useUserDataFilter } from '../UserDataFilterContext';

const { Title } = Typography;

const SoftwareTableWithFilter = () => {
  const [software, setSoftware] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredSoftware, setFilteredSoftware] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add');
  const [selectedSoftware, setSelectedSoftware] = useState(null);
  const [form] = Form.useForm();
  
  // Gunakan hook useUserDataFilter untuk mendapatkan helper functions
  const { addUserIdToParams, addUserIdToBody, isOwnedByUser, userRole } = useUserDataFilter();

  // Ambil daftar software dengan filter user_id
  const fetchSoftware = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Tambahkan user_id ke parameter query
      const params = addUserIdToParams();
      
      const response = await axiosInstance.get('/api/software', { params });
      setSoftware(response.data);
      setFilteredSoftware(response.data);
    } catch (err) {
      console.error("Error fetching software:", err);
      setError("Gagal memuat data produk");
    } finally {
      setLoading(false);
    }
  };

  // Load data saat komponen dimuat
  useEffect(() => {
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

  // Membuka modal untuk tambah/edit software
  const handleOpenModal = (type, software = null) => {
    setModalType(type);
    setSelectedSoftware(software);
    form.resetFields();
    
    if (type === 'edit' && software) {
      form.setFieldsValue({
        name: software.name,
        requires_license: software.requires_license,
        search_by_version: software.search_by_version
      });
    }
    
    setIsModalVisible(true);
  };

  // Menangani submit form modal
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      if (modalType === 'add') {
        // Tambahkan user_id ke body request
        const body = addUserIdToBody(values);
        
        const response = await axiosInstance.post('/api/software', body);
        message.success("Software berhasil ditambahkan");
      } else if (modalType === 'edit') {
        // Tambahkan user_id ke body request
        const body = addUserIdToBody(values);
        
        const response = await axiosInstance.put(`/api/software/${selectedSoftware.id}`, body);
        message.success("Software berhasil diperbarui");
      }
      
      setIsModalVisible(false);
      fetchSoftware(); // Refresh data
    } catch (err) {
      console.error("Error submitting form:", err);
      message.error(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  // Menangani hapus software
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      
      const response = await axiosInstance.delete(`/api/software/${id}`);
      message.success("Software berhasil dihapus");
      fetchSoftware(); // Refresh data
    } catch (err) {
      console.error("Error deleting software:", err);
      message.error(err.response?.data?.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
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
    },
    {
      title: 'Aksi',
      key: 'action',
      render: (_, record) => {
        // Cek apakah user pemilik data atau admin
        const canEdit = isOwnedByUser(record) || userRole === 'admin';
        
        if (!canEdit) {
          return <Text type="secondary">Tidak ada akses</Text>;
        }
        
        return (
          <Space>
            <Button 
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleOpenModal('edit', record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Apakah Anda yakin ingin menghapus?"
              onConfirm={() => handleDelete(record.id)}
              okText="Ya"
              cancelText="Tidak"
            >
              <Button 
                danger
                icon={<DeleteOutlined />}
              >
                Hapus
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <Title level={2}>Daftar Produk</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Input
            placeholder="Cari produk..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={handleSearch}
            style={{ width: 300 }}
          />
          
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal('add')}
          >
            Tambah Produk
          </Button>
        </div>
        
        <Table
          dataSource={filteredSoftware}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: error || 'Tidak ada data produk' }}
        />
      </Card>
      
      {/* Modal Tambah/Edit Software */}
      <Modal
        title={modalType === 'add' ? 'Tambah Produk Baru' : 'Edit Produk'}
        open={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Nama Produk"
            rules={[{ required: true, message: 'Nama produk harus diisi' }]}
          >
            <Input placeholder="Masukkan nama produk" />
          </Form.Item>
          
          <Form.Item
            name="requires_license"
            label="Membutuhkan Stok"
            valuePropName="checked"
          >
            <Input type="checkbox" />
          </Form.Item>
          
          <Form.Item
            name="search_by_version"
            label="Cari Berdasarkan Variasi"
            valuePropName="checked"
            dependencies={['requires_license']}
          >
            <Input 
              type="checkbox" 
              disabled={!form.getFieldValue('requires_license')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SoftwareTableWithFilter;