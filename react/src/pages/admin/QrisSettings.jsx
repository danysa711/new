// react/src/pages/admin/QrisSettings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Card, Form, Input, Button, Switch, InputNumber, 
  Upload, message, Typography, Space, Divider, Row, Col
} from 'antd';
import { 
  UploadOutlined, QrcodeOutlined, SaveOutlined,
  InfoCircleOutlined 
} from '@ant-design/icons';
import axiosInstance from '../../services/axios';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const QrisSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [initialValues, setInitialValues] = useState({
    merchant_name: '',
    is_active: true,
    expiry_hours: 24,
    instructions: ''
  });

  // Memuat data pengaturan QRIS
  useEffect(() => {
    const fetchSettings = async () => {
  try {
    setLoading(true);
    
    try {
      // Tambahkan parameter admin=true
      const response = await axiosInstance.get('/api/admin/qris-settings?admin=true');
      const settings = response.data;
      
      setInitialValues({
        merchant_name: settings.merchant_name,
        is_active: settings.is_active,
        expiry_hours: settings.expiry_hours,
        instructions: settings.instructions
      });
      
      setImageUrl(settings.qris_image);
      form.setFieldsValue({
        merchant_name: settings.merchant_name,
        is_active: settings.is_active,
        expiry_hours: settings.expiry_hours,
        instructions: settings.instructions
      });
    } catch (error) {
      console.error("Error fetching QRIS settings:", error);
      
      // Pesan error spesifik
      if (error.response?.status === 500) {
        message.error("Server error: Tabel QRIS mungkin belum dibuat. Lihat konsol untuk detail.");
        console.error("Jalankan SQL untuk membuat tabel QrisSettings dan QrisPayments");
      } else if (error.response?.status === 401) {
        message.error("Akses ditolak. Pastikan Anda memiliki hak admin.");
      } else {
        message.error("Gagal memuat pengaturan QRIS");
      }
      
      // Set nilai default
      const defaultValues = {
        merchant_name: 'Kinterstore',
        is_active: true,
        expiry_hours: 24,
        instructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda.'
      };
      
      setInitialValues(defaultValues);
      form.setFieldsValue(defaultValues);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    message.error("Terjadi kesalahan tak terduga");
  } finally {
    setLoading(false);
  }
};
    
    fetchSettings();
  }, [form]);

  // Handle upload gambar QRIS
  const handleImageUpload = (info) => {
    if (info.file.status === 'done') {
      getBase64(info.file.originFileObj, (url) => {
        setImageUrl(url);
      });
      message.success(`${info.file.name} berhasil diunggah`);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} gagal diunggah`);
    }
  };

  // Fungsi untuk konversi gambar ke base64
  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  // react/src/pages/admin/QrisSettings.jsx (lanjutan)
  // Handle submit form
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      if (!imageUrl) {
        message.error("Gambar QRIS harus diunggah");
        setLoading(false);
        return;
      }
      
      const payload = {
        ...values,
        qris_image: imageUrl
      };
      
      const response = await axiosInstance.post('/api/admin/qris-settings', payload);
      
      if (response.data) {
        message.success("Pengaturan QRIS berhasil disimpan");
        setInitialValues(values);
      }
    } catch (error) {
      console.error("Error saving QRIS settings:", error);
      message.error("Gagal menyimpan pengaturan QRIS");
    } finally {
      setLoading(false);
    }
  };

  // Custom upload request untuk mengonversi gambar ke base64
  const customUploadRequest = ({ file, onSuccess, onError }) => {
    if (file.size > 2 * 1024 * 1024) {
      message.error("Ukuran gambar tidak boleh melebihi 2MB");
      onError(new Error("File too large"));
      return;
    }
    
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      setImageUrl(reader.result);
      onSuccess("ok");
    };
    reader.onerror = (error) => {
      onError(error);
    };
  };

  return (
    <div>
      <Title level={2}>Pengaturan Pembayaran QRIS</Title>
      
      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={handleSubmit}
        >
          <Row gutter={24}>
            <Col span={12}>
              <Form.Item
                name="merchant_name"
                label="Nama Merchant"
                rules={[{ required: true, message: "Nama merchant harus diisi" }]}
              >
                <Input placeholder="contoh: Kinterstore" />
              </Form.Item>
              
              <Form.Item
                name="is_active"
                label="Aktifkan Pembayaran QRIS"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              
              <Form.Item
                name="expiry_hours"
                label="Masa Berlaku Pembayaran (jam)"
                rules={[{ required: true, message: "Masa berlaku harus diisi" }]}
              >
                <InputNumber min={1} max={72} style={{ width: '100%' }} />
              </Form.Item>
              
              <Form.Item
                name="instructions"
                label="Instruksi Pembayaran"
              >
                <TextArea rows={4} placeholder="Masukkan instruksi cara pembayaran QRIS" />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                label="Gambar QRIS"
                tooltip="Unggah gambar QRIS yang akan ditampilkan kepada pelanggan"
                rules={[{ required: true, message: "Gambar QRIS harus diunggah" }]}
              >
                <Upload
                  name="qris_image"
                  listType="picture-card"
                  className="avatar-uploader"
                  showUploadList={false}
                  customRequest={customUploadRequest}
                  beforeUpload={(file) => {
                    const isImage = file.type.startsWith('image/');
                    if (!isImage) {
                      message.error('Anda hanya dapat mengunggah file gambar!');
                    }
                    return isImage;
                  }}
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="QRIS" style={{ width: '100%' }} />
                  ) : (
                    <div>
                      <QrcodeOutlined style={{ fontSize: 36 }} />
                      <div style={{ marginTop: 8 }}>Unggah</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
              
              {imageUrl && (
                <div style={{ marginTop: 10 }}>
                  <Button 
                    danger 
                    onClick={() => setImageUrl('')}
                    style={{ marginBottom: 16 }}
                  >
                    Hapus Gambar
                  </Button>
                </div>
              )}
              
              <Paragraph style={{ marginTop: 16 }}>
                <InfoCircleOutlined style={{ marginRight: 8 }} />
                <Text type="secondary">
                  Unggah gambar QRIS dari penyedia pembayaran Anda. 
                  Pelanggan akan memindai kode ini untuk melakukan pembayaran.
                </Text>
              </Paragraph>
            </Col>
          </Row>
          
          <Divider />
          
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Simpan Pengaturan
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default QrisSettings;