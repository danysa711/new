import { Card, Row, Col, Statistic, Select, Spin, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useState, useEffect, useContext } from 'react';
import axiosInstance from '../../services/axios';
import { AuthContext } from '../../context/AuthContext';
import UserApiInfo from '../../components/UserApiInfo';

const { Option } = Select;
const { Title } = Typography;

const UserHomeView = () => {
  const [data, setData] = useState({
    totalSoftware: 0,
    totalSoftwareVersions: 0,
    totalLicenses: 0,
    usedLicenses: 0,
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

    // Menggunakan user_id sebagai filter untuk mendapatkan data khusus user
    const softwareResponse = await axiosInstance.post("/api/software/count", requestBody);
    const versionsResponse = await axiosInstance.post("/api/software-versions/count", requestBody);
    const licensesResponse = await axiosInstance.post("/api/licenses/count", requestBody);
    const availableLicensesResponse = await axiosInstance.post("/api/licenses/available/all/count", requestBody);
    const ordersResponse = await axiosInstance.post("/api/orders/count", requestBody);
    const usageResponse = await axiosInstance.post("/api/orders/usage", requestBody);

    // Perhitungan stok yang benar:
    // - totalLicenses adalah total keseluruhan stok
    // - availableLicensesResponse.data.availableLicenses adalah jumlah stok yang tersedia (belum digunakan)
    // - Jadi stok terpakai = totalLicenses - availableLicenses
    const totalLicenses = licensesResponse.data.totalLicenses || 0;
    const availableLicenses = availableLicensesResponse.data.availableLicenses || 0;
    const usedLicenses = totalLicenses - availableLicenses;

    setData({
      totalSoftware: softwareResponse.data.totalSoftware || 0,
      totalSoftwareVersions: versionsResponse.data.totalSoftwareVersions || 0,
      totalLicenses: totalLicenses,
      availableLicenses: availableLicenses,
      usedLicenses: usedLicenses, // Nilai terpakai yang benar
      totalOrders: ordersResponse.data.totalOrders || 0,
      softwareUsage: usageResponse.data || [],
    });

  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};
  
  useEffect(() => {
    fetchData();
  }, [timeRange, user.id]);

  const licenseData = [
  { name: 'Terpakai', value: data.usedLicenses },
  { name: 'Tersedia', value: data.totalLicenses - data.usedLicenses },
];

  const COLORS = ['#0088FE', '#00C49F'];

  return (
    <div style={{ padding: 20 }}>
      <Title level={2}>Dashboard</Title>

      <Row justify="end" style={{ marginBottom: 20 }}>
        <Select value={timeRange} onChange={setTimeRange} style={{ width: 150 }}>
          <Option value="7">7 Hari Terakhir</Option>
          <Option value="30">30 Hari Terakhir</Option>
          <Option value="90">90 Hari Terakhir</Option>
        </Select>
      </Row>

       <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <UserApiInfo user={user} />
        </Col>
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
          <Card title="Distribusi Stok">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={licenseData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                  {licenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Jumlah']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="Produk Terlaris">
            {loading ? (
              <Spin />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.softwareUsage}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" name="Jumlah Terjual" fill="#8884d8" barSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default UserHomeView;