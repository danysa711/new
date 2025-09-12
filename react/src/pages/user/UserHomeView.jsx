import { Card, Row, Col, Statistic, Select, Spin, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect, useContext } from 'react';
import axiosInstance from '../../services/axios';
import { AuthContext } from '../../context/AuthContext';
// Removed the UserApiInfo import since we're not using it anymore

const { Option } = Select;
const { Title, Text } = Typography;

const UserHomeView = () => {
  const [data, setData] = useState({
    totalSoftware: 0,
    totalSoftwareVersions: 0,
    totalLicenses: 0,
    usedLicenses: 0,
    availableLicenses: 0,
    totalOrders: 0,
    softwareUsage: [],
  });

  const [timeRange, setTimeRange] = useState("30");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);

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
      const requestBody = { startDate, endDate, user_id: user.id };

      // Gunakan API untuk mendapatkan data khusus pengguna
      const [
        softwareResponse,
        versionsResponse,
        licensesResponse,
        availableLicensesResponse,
        ordersResponse,
        usageResponse
      ] = await Promise.all([
        axiosInstance.post("/api/software/count", requestBody),
        axiosInstance.post("/api/software-versions/count", requestBody),
        axiosInstance.post("/api/licenses/count", requestBody),
        axiosInstance.post("/api/licenses/available/all/count", requestBody),
        axiosInstance.post("/api/orders/count", requestBody),
        axiosInstance.post("/api/orders/usage", requestBody)
      ]);

      // Hitung stok yang tersedia dan terpakai dengan benar
      const totalLicenses = licensesResponse.data.totalLicenses || 0;
      const availableLicenses = availableLicensesResponse.data.availableLicenses || 0;
      const usedLicenses = totalLicenses - availableLicenses;

      setData({
        totalSoftware: softwareResponse.data.totalSoftware || 0,
        totalSoftwareVersions: versionsResponse.data.totalSoftwareVersions || 0,
        totalLicenses: totalLicenses,
        availableLicenses: availableLicenses,
        usedLicenses: usedLicenses,
        totalOrders: ordersResponse.data.totalOrders || 0,
        softwareUsage: usageResponse.data || [],
      });

    } catch (error) {
      console.error("Error saat mengambil data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, [timeRange, user.id]);

  // Data untuk chart distribusi stok
  const licenseData = [
    { name: 'Terpakai', value: data.usedLicenses, fill: '#FF8042' },
    { name: 'Tersedia', value: data.availableLicenses, fill: '#00C49F' },
  ];

  return (
    <div style={{ padding: 20 }}>

      <Row justify="end" style={{ marginBottom: 20 }}>
        <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }}>
          <Option value="7">7 Hari Terakhir</Option>
          <Option value="30">30 Hari Terakhir</Option>
          <Option value="90">90 Hari Terakhir</Option>
        </Select>
      </Row>

      {/* Removed the API Information section */}

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
          <Card title="Distribusi Stok">
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
          <Card title="Produk Terlaris Anda">
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
    </div>
  );
};

export default UserHomeView;