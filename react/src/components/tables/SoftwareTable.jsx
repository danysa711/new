import React, { useState, useEffect } from 'react';
import {
  getAllSoftware,
  deleteSoftware,
  createSoftware,
  updateSoftware
} from "../../api/software-service";
import MainTable from './MainTable';
import { Button, Form, message, Modal, Popconfirm, Input } from "antd";

const SoftwareTable = () => {
  const [softwareData, setSoftwareData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSoftware, setNewSoftware] = useState({
    name: '',
    requires_license: false,
    search_by_version: false
  });

  useEffect(() => {
    const fetchSoftware = async () => {
      try {
        setLoading(true);
        const data = await getAllSoftware();
        setSoftwareData(data);
      } catch (err) {
        console.error("Error fetching software:", err);
        setError("Gagal memuat data produk");
      } finally {
        setLoading(false);
      }
    };

    fetchSoftware();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleDelete = async (id) => {
    try {
      await deleteSoftware(id);
      message.success("Software berhasil dihapus!");
      
      // Refresh the software list
      const data = await getAllSoftware();
      setSoftwareData(data);
    } catch (error) {
      console.error("Error deleting software:", error);
      message.error("Gagal menghapus software");
    }
  };

  const handleAddData = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    if (isEditMode) {
      try {
        await updateSoftware(newSoftware.id, newSoftware);
        message.success("Software berhasil diperbarui!");
        setIsModalVisible(false);
        setIsEditMode(false);
        setNewSoftware({ name: "", requires_license: false, search_by_version: false });
        
        // Refresh the software list
        const data = await getAllSoftware();
        setSoftwareData(data);
      } catch (error) {
        console.error("Error updating software:", error);
        message.error("Gagal memperbarui software");
      }
    } else {
      try {
        await createSoftware(newSoftware);
        message.success("Software berhasil ditambahkan!");
        setIsModalVisible(false);
        setNewSoftware({ name: "", requires_license: false, search_by_version: false });
        
        // Refresh the software list
        const data = await getAllSoftware();
        setSoftwareData(data);
      } catch (error) {
        console.error("Error adding software:", error);
        message.error("Gagal menambahkan software");
      }
    }
  };
  
  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setNewSoftware({
      name: '',
      requires_license: false,
      search_by_version: false
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSoftware((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleLicenseChange = (e) => {
    const newRequiresLicense = e.target.checked;
  
    setNewSoftware((prevState) => ({
      ...prevState,
      requires_license: newRequiresLicense,
      search_by_version: !newRequiresLicense ? false : prevState.search_by_version,
    }));
  };

  const handleSearchByVersion = (e) => {
    setNewSoftware((prevState) => ({
      ...prevState,
      search_by_version: e.target.checked,
    }));
  };

  const handleEdit = (software) => {
    setIsEditMode(true);
    setNewSoftware(software);
    setIsModalVisible(true);
  };

  const columns = [
    { 
      title: "Nama Produk", 
      dataIndex: "name", 
      key: "name" ,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: "Membutuhkan Stok",
      dataIndex: "requires_license",
      key: "requires_license",
      render: (text) => (text ? "Yes" : "No"),
    },
    {
      title: "Cari Berdasarkan Variasi",
      dataIndex: "search_by_version",
      key: "search_by_version",
      render: (text) => (text ? "Yes" : "No"),
    },
    {
      title: "Tanggal Ditambahkan",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => new Date(date).toLocaleDateString('id-ID'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: "Aksi",
      key: "action",
      render: (_, record) => (
        <>
          <Popconfirm title="Yakin ingin menghapus?" onConfirm={() => handleDelete(record.id)}>
            <Button danger>Hapus</Button>
          </Popconfirm>
          <Button
            style={{ marginLeft: 8 }}
            onClick={() => handleEdit(record)}
          >
            Ubah
          </Button>
        </>
      ),
    },
  ];

  return( 
  <div>
    <MainTable data={softwareData} columns={columns} onAdd={handleAddData} />
  
    <Modal
        title={isEditMode ? "Ubah Produk" : "Tambahkan Produk Baru"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        okText={isEditMode ? "Update" : "Add"}
      >
        <Form>
          <Form.Item label="Nama Produk">
            <Input
              name="name"
              value={newSoftware.name}
              onChange={handleInputChange}
            />
          </Form.Item>
          <Form.Item label="Membutuhkan Stok">
            <Input
              name="requires_license"
              type="checkbox"
              checked={newSoftware.requires_license}
              onChange={handleLicenseChange}
            />
          </Form.Item>
          <Form.Item label="Cari Berdasarkan Variasi">
            <Input
              name="search_by_version"
              type="checkbox"
              checked={newSoftware.search_by_version}
              disabled={newSoftware.requires_license === false}
              onChange={handleSearchByVersion}
            />
          </Form.Item>
        </Form>
      </Modal>
  </div>
)
};

export default SoftwareTable;