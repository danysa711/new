import React, { useState, useEffect, useContext } from 'react';
import { 
  Table, Card, Typography, Tag, Button, 
  Input, Select, Form, message, Modal,
  Collapse
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { getAllAvailableLicenses } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import _ from 'lodash';

const { Title, Text } = Typography;
const { Option } = Select;
const { Panel } = Collapse;

const UserLicenseTable = () => {
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const { user } = useContext(AuthContext);

  // Memuat data stok saat komponen dimuat
  useEffect(() => {
    const fetchLicenses = async () => {
      try {
        setLoading(true);
        await getAllAvailableLicenses(setLicenses, setLoading, setError);
      } catch (err) {
        console.error("Error fetching licenses:", err);
        setError("Gagal memuat data stok");
      } finally {
        setLoading(false);
      }
    };

    fetchLicenses();
  }, []);

 // Mengelompokkan data stok
const groupedData = _.groupBy(licenses.filter(license => !license.is_active), (item) => 
  `${item?.software_id}-${item?.software_version_id}`
);

  const tableData = Object.keys(groupedData).map((key) => {
    const softwareGroup = groupedData[key];

    return {
      software_id: softwareGroup[0]?.software_id,
      name: softwareGroup[0]?.Software?.name || "Unknown",
      software_version_id: [softwareGroup[0]?.software_version_id || "-", softwareGroup[0]?.SoftwareVersion?.version || "-" ],
      os: softwareGroup[0]?.SoftwareVersion?.os || "-",
      license_keys: softwareGroup
        .map((item) => item?.license_key?.trim())
        .filter((key) => key && key?.length > 0),
      amount: softwareGroup.length || 0,
    };
  });

  // Filter data stok saat pencarian berubah
  useEffect(() => {
    if (tableData) {
      const filtered = tableData.filter(item => 
        item.name.toLowerCase().includes(searchText.toLowerCase()) ||
        item.os.toLowerCase().includes(searchText.toLowerCase()) ||
        (item.software_version_id[1] && item.software_version_id[1].toLowerCase().includes(searchText.toLowerCase())) ||
        (item.license_keys.some(key => key.toLowerCase().includes(searchText.toLowerCase())))
      );
      setFilteredData(filtered);
    }
  }, [tableData, searchText]);

  // Menangani perubahan pada input pencarian
  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  // Definisi kolom untuk tabel
  const columns = [
    { 
      title: "Nama Produk", 
      dataIndex: "name", 
      key: "name",
      defaultSortOrder: 'ascend',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: "Variasi¹",
      dataIndex: "os",
      key: "os",
      sorter: (a, b) => a.os.localeCompare(b.os)
    },    
    {
      title: "Variasi²",
      dataIndex: "software_version_id",
      key: "software_version_id",
      render: (id, record) => record.software_version_id[1]
    },    
    { 
      title: "Jumlah Stok Tersedia", 
      dataIndex: "amount", 
      key: "amount",
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: "Detail",
      key: "detail",
      render: (_, record) => (
        <Collapse ghost>
          <Panel header="Lihat Stok" key="1">
            {record.license_keys.map((key, index) => (
              <Tag key={index} color="blue" style={{ margin: '4px' }}>
                {key}
              </Tag>
            ))}
          </Panel>
        </Collapse>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Daftar Stok Produk</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Input
          placeholder="Cari stok produk..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={handleSearch}
          style={{ width: 300, marginBottom: 16 }}
        />
        
        <Table
          dataSource={filteredData}
          columns={columns}
          rowKey={(record) => `${record.software_id}-${record.software_version_id[0]}`}
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: error || 'Tidak ada data stok produk' }}
        />
      </Card>
    </div>
  );
};

export default UserLicenseTable;