import { Card, Row, Col, Statistic, Select, Spin, Typography, Table, Tag } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect } from 'react';

import { getSoftwareCount, getSoftwareVersionCount } from '../../api/software-service';
import { getLicenseCount } from '../../api/license-service';
import { getOrderCount, getOrderUsage } from '../../api/order-service';
import axiosInstance from '../../services/axios';

const { Option } = Select;
const { Title, Text } = Typography;

const HomeView = () => {
  const [data, setData] = useState({
    totalSoftware: 0,
    totalSoftwareVersions: 0,
    totalLicenses: 0,
    usedLicenses: 0,
    availableLicenses: 0,
    totalOrders: 0,
    softwareUsage: [],
    userStats: []
  });

  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(false);

  const calculateDateRange = (days) => {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - days);
    return {
      startDate: pastDate.toISOString().split("T")[0],
      endDate: today.toISOString().split("T")[0],
    };
  };

  const fetchData = async () => {
    setLoading(true);
  
    try {
      const { startDate, endDate } = calculateDateRange(Number(timeRange));
      const requestBody = { startDate, endDate };
  
      // Fetch all data using the API
      const [
        softwareCountData,
        versionsCountData,
        licensesCountData,
        availableLicensesData,
        ordersCountData,
        usageData
      ] = await Promise.all([
        getSoftwareCount(requestBody),
        getSoftwareVersionCount(requestBody),
        getLicenseCount(requestBody),
        getLicenseCount({ ...requestBody, available: true }),
        getOrderCount(requestBody),
        getOrderUsage(requestBody)
      ]);

      // Ambil data statistik pengguna
      let userStatsData = [];
      try {
        // Endpoint ini perlu dibuat di backend
        const userStatsResponse = await axiosInstance.get('/api/admin/user-license-stats');
        userStatsData = userStatsResponse.data || [];
      } catch (error) {
        console.error("Error saat mengambil statistik pengguna:", error);
      }

      // Hitung lisensi yang tersedia dan digunakan dengan benar
      const totalLicenses = licensesCountData.totalLicenses || 0;
      const availableLicenses = availableLicensesData.availableLicenses || 0;
      const usedLicenses = totalLicenses - availableLicenses;

      setData({
        totalSoftware: softwareCountData.totalSoftware || 0,
        totalSoftwareVersions: versionsCountData.totalSoftwareVersions || 0,
        totalLicenses: totalLicenses,
        availableLicenses: availableLicenses,
        usedLicenses: usedLicenses,
        totalOrders: ordersCountData.totalOrders || 0,
        softwareUsage: usageData || [],
        userStats: userStatsData
      });
    } catch (error) {
      console.error("Error saat mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [timeRange]);

  // Data untuk chart distribusi stok - DIKOREKSI dari kode asli
  const licenseData = [
    { name: 'Terpakai', value: data.usedLicenses, fill: '#FF8042' },
    { name: 'Tersedia', value: data.availableLicenses, fill: '#00C49F' },
  ];

  // Warna untuk chart
  const COLORS = ['#FF8042', '#00C49F'];

  // Kolom untuk tabel statistik pengguna
  const userStatsColumns = [
    {
      title: 'Pengguna',
      dataIndex: 'username',
      key: 'username',
      sorter: (a, b) => a.username.localeCompare(b.username)
    },
    {
      title: 'Total Stok',
      dataIndex: 'totalLicenses',
      key: 'totalLicenses',
      sorter: (a, b) => a.totalLicenses - b.totalLicenses
    },
    {
      title: 'Stok Terpakai',
      dataIndex: 'usedLicenses',
      key: 'usedLicenses',
      sorter: (a, b) => a.usedLicenses - b.usedLicenses,
      render: (value) => <Tag color="orange">{value}</Tag>
    },
    {
      title: 'Stok Tersedia',
      dataIndex: 'availableLicenses',
      key: 'availableLicenses',
      sorter: (a, b) => a.availableLicenses - b.availableLicenses,
      render: (value) => <Tag color="green">{value}</Tag>
    },
    {
      title: 'Total Pesanan',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a, b) => a.totalOrders - b.totalOrders
    }
  ];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Dashboard Admin</Title>

      <Row justify="end" style={{ marginBottom: 20 }}>
        <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }}>
          <Option value="7">7 Hari Terakhir</Option>
          <Option value="30">30 Hari Terakhir</Option>
          <Option value="90">90 Hari Terakhir</Option>
        </Select>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card title="Total Produk">
            <Statistic value={data.totalSoftware} />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Total Variasi Produk">
            <Statistic value={data.totalSoftwareVersions} />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Total Stok">
            <Statistic value={data.totalLicenses} />
          </Card>
        </Col>
        <Col span={6}>
          <Card title="Total Pesanan">
            <Statistic value={data.totalOrders} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col span={12}>
          <Card title="Distribusi Stok Seluruh Pengguna">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : (
              <>
                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                  <Col span={12}>
                    <Statistic 
                      title="Stok Tersedia" 
                      value={data.availableLicenses} 
                      valueStyle={{ color: '#00C49F' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic 
                      title="Stok Terpakai" 
                      value={data.usedLicenses} 
                      valueStyle={{ color: '#FF8042' }}
                    />
                  </Col>
                </Row>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={licenseData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {licenseData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} stok`, 'Jumlah']} />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Produk Terlaris">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : (
              data.softwareUsage && data.softwareUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.softwareUsage}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} terjual`, 'Jumlah']} />
                    <Bar dataKey="count" name="Jumlah Terjual" fill="#8884d8" barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  <Text>Belum ada data penjualan produk</Text>
                </div>
              )
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col span={24}>
          <Card title="Statistik Stok Per Pengguna">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spin />
              </div>
            ) : (
              data.userStats && data.userStats.length > 0 ? (
                <Table 
                  dataSource={data.userStats} 
                  columns={userStatsColumns} 
                  rowKey="id" 
                  pagination={{ pageSize: 10 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#999' }}>
                  <Text>Belum ada data statistik pengguna</Text>
                </div>
              )
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default HomeView;