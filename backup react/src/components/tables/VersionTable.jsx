import React, { useState, useEffect } from 'react';
import { 
  getAllSoftwareVersions,
  createSoftwareVersion,
  updateSoftwareVersion,
  deleteSoftwareVersion,
  getAllSoftware
} from "../../api/software-service";
import MainTable from './MainTable';
import { Button, Form, message, Modal, Popconfirm, Input, Select } from "antd";

const VersionTable = () => {
  const [softwareVersions, setSoftwareVersions] = useState([]);
  const [softwareList, setSoftwareList] = useState([]);
  const [loadingSoftware, setLoadingSoftware] = useState(false); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newSoftwareVersion, setNewSoftwareVersion] = useState({
    name: "",
    software_id: null, 
    version: null, 
    os: "", 
    download_link: ""
  });

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const data = await getAllSoftwareVersions();
        setSoftwareVersions(data);
      } catch (err) {
        console.error("Error fetching software versions:", err);
        setError("Gagal memuat data variasi produk");
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
    
    if (isModalVisible) {
      const fetchSoftware = async () => {
        try {
          setLoadingSoftware(true);
          const data = await getAllSoftware();
          setSoftwareList(data);
        } catch (err) {
          console.error("Error fetching software:", err);
          setError("Gagal memuat data software");
        } finally {
          setLoadingSoftware(false);
        }
      };
      
      fetchSoftware();
    }
  }, [isModalVisible]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  const handleDelete = async (id) => {
    try {
      await deleteSoftwareVersion(id);
      message.success("Variasi produk berhasil dihapus!");
      
      // Refresh the version list
      const data = await getAllSoftwareVersions();
      setSoftwareVersions(data);
    } catch (error) {
      console.error("Error deleting software version:", error);
      message.error("Gagal menghapus variasi produk");
    }
  };

  const handleAddData = () => {
    setIsModalVisible(true);
  };

  const handleOk = async () => {
    if (isEditMode) {
      try {
        await updateSoftwareVersion(newSoftwareVersion.id, newSoftwareVersion);
        message.success("Variasi produk berhasil diperbarui!");
        setIsModalVisible(false);
        setIsEditMode(false);
        setNewSoftwareVersion({
          name: "",
          software_id: null, 
          version: null, 
          os: "", 
          download_link: ""
        });
        
        // Refresh the version list
        const data = await getAllSoftwareVersions();
        setSoftwareVersions(data);
      } catch (error) {
        console.error("Error updating software version:", error);
        message.error("Gagal memperbarui variasi produk");
      }
    } else {
      try {
        await createSoftwareVersion(newSoftwareVersion);
        message.success("Variasi produk berhasil ditambahkan!");
        setIsModalVisible(false);
        setNewSoftwareVersion({
          name: "",
          software_id: null, 
          version: null, 
          os: "", 
          download_link: ""
        });
        
        // Refresh the version list
        const data = await getAllSoftwareVersions();
        setSoftwareVersions(data);
      } catch (error) {
        console.error("Error adding software version:", error);
        message.error("Gagal menambahkan variasi produk");
      }
    }
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setIsEditMode(false);
    setNewSoftwareVersion({
      name: "",
      software_id: null, 
      version: null, 
      os: "", 
      download_link: ""
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSoftwareVersion((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSoftwareChange = (value) => {
    setNewSoftwareVersion((prevState) => ({
      ...prevState,
      software_id: value,
    }));
  };

  const handleEdit = (software) => {
    setIsEditMode(true);
    setNewSoftwareVersion({
      id: software.id,
      name: software.name,
      software_id: software.software_id,
      version: software.version,
      os: software.os,
      download_link: software.download_link
    });
    setIsModalVisible(true);
  };

  const columns = [
    { 
      title: "Nama Produk", 
      dataIndex: "name", 
      key: "name",
      render: (text) => text,
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    { 
      title: "Variasi¹", 
      dataIndex: "os", 
      key: "os",
      render: (text) => text,
    },
    { 
      title: "Variasi²", 
      dataIndex: "version", 
      key: "Version",
      render: (text) => text,
    },
    { 
      title: "Download Link", 
      dataIndex: "download_link", 
      key: "download_link",
      render: (text) => <a href={text} target="_blank" rel="noopener noreferrer">{text}</a>,
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

  // Mengubah data untuk ditampilkan
  const processedVersions = softwareVersions.map(version => ({
    id: version.id,
    name: version.Software ? version.Software.name : "Unknown",
    version: version.version,
    os: version.os,
    download_link: version.download_link,
    software_id: version.software_id,
    createdAt: version.createdAt
  }));

  return( 
  <div>
    <MainTable 
      data={processedVersions} 
      columns={columns} 
      onAdd={handleAddData} 
    />
  
    <Modal
      title={isEditMode ? "Ubah Variasi Produk" : "Tambahkan Variasi Produk"}
      open={isModalVisible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText={isEditMode ? "Update" : "Add"}
    >
      <Form>
        <Form.Item label="Produk">
          <Select
            name="software_id"
            value={newSoftwareVersion.software_id}
            onChange={handleSoftwareChange}
            loading={loadingSoftware}
            showSearch
            placeholder="Pilih Produk"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            {softwareList.map((software) => (
              <Select.Option key={software.id} value={software.id}>
                {software.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item label="Variasi-1">
          <Input
            name="os"
            value={newSoftwareVersion.os}
            onChange={handleInputChange}
          />
        </Form.Item>
        <Form.Item label="Variasi-2">
          <Input
            name="version"
            value={newSoftwareVersion.version}
            onChange={handleInputChange}
          />
        </Form.Item>
        <Form.Item label="Download Link">
          <Input
            name="download_link"
            value={newSoftwareVersion.download_link}
            onChange={handleInputChange}
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
)
};

export default VersionTable;