import React from 'react';
import { Typography, Card, Collapse, Divider, Button, Space } from 'antd';
import { QuestionCircleOutlined, WhatsAppOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

const HelpCenter = () => {
  const openWhatsapp = () => {
    window.open('https://wa.me/6281284712684?text=Halo,%20saya%20membutuhkan%20bantuan%20dengan%20Kinterstore', '_blank');
  };

  return (
    <Card>
      <Title level={2}>Pusat Bantuan Kinterstore</Title>
      <Divider />
      
      <Paragraph>
        Temukan jawaban untuk pertanyaan umum tentang cara menggunakan Kinterstore untuk mengelola stok produk Shopee Anda.
      </Paragraph>
      
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<WhatsAppOutlined />} 
          onClick={openWhatsapp}
          style={{ marginBottom: 16 }}
        >
          Hubungi Kami via WhatsApp
        </Button>
      </Space>
      
      <Title level={3}>Pertanyaan Umum</Title>
      
      <Collapse bordered={false} expandIconPosition="right">
        <Panel header="Bagaimana cara memulai menggunakan layanan kami?" key="1">
          <Paragraph>
            <ol>
              <li>Daftar dan buat akun di Kinterstore</li>
              <li>Pilih paket langganan yang sesuai dengan kebutuhan Anda</li>
              <li>Selesaikan pembayaran untuk mengaktifkan akun Anda</li>
              <li>Masukkan nama produk, variasi, dan stok dari toko Shopee Anda</li>
              <li>Sistem kami akan mulai mengelola stok dan mengirimkan pesanan secara otomatis</li>
            </ol>
          </Paragraph>
        </Panel>
        
        <Panel header="Bagaimana cara kerja sistem otomatis layanan kami?" key="2">
          <Paragraph>
            Kinterstore bekerja dengan proses sebagai berikut:
            <ol>
              <li>Anda mendaftarkan produk, variasi, dan stok di dashboard Kinterstore</li>
              <li>Ketika ada pesanan di toko Shopee Anda, sistem kami akan mendeteksinya</li>
              <li>Dalam waktu kurang dari 1 menit, sistem kami akan mengirimkan pesanan secara otomatis</li>
              <li>Stok produk akan diperbarui secara real-time di dashboard Anda</li>
              <li>Anda dapat memantau semua aktivitas penjualan dari dashboard Kinterstore</li>
            </ol>
          </Paragraph>
        </Panel>
        
        <Panel header="Berapa lama waktu pengiriman pesanan otomatis?" key="3">
          <Paragraph>
            Sistem kami dirancang untuk mengirimkan pesanan secara otomatis dalam waktu kurang dari 1 menit setelah pembeli melakukan pembelian di toko Shopee Anda.
          </Paragraph>
        </Panel>
        
        <Panel header="Apakah saya bisa mencoba layanan sebelum berlangganan?" key="4">
          <Paragraph>
            Ya, kami menyediakan opsi trial. Klik tombol "Request Trial" di dashboard pada menu 'Akun' untuk menghubungi tim kami melalui WhatsApp dan kami akan mengatur periode trial untuk Anda.
          </Paragraph>
        </Panel>
        
        <Panel header="Bagaimana cara memperpanjang langganan?" key="5">
          <Paragraph>
            Untuk memperpanjang langganan:
            <ol>
              <li>Login ke akun Kinterstore Anda</li>
              <li>Klik menu "Langganan"</li>
              <li>Pilih paket yang ingin Anda perpanjang</li>
              <li>Selesaikan pembayaran untuk mengaktifkan perpanjangan</li>
            </ol>
          </Paragraph>
        </Panel>
      </Collapse>
      
      <Divider />
      
      <Title level={3}>Panduan Penggunaan</Title>
      <Collapse bordered={false} expandIconPosition="right">
        <Panel header="Cara Menambahkan Produk Baru" key="6">
          <Paragraph>
            <ol>
              <li>Klik menu "Produk" di sidebar</li>
              <li>Klik tombol "Tambah Produk"</li>
              <li>Isi formulir dengan informasi produk yang sesuai dengan produk di Shopee Anda</li>
              <li>Klik "Simpan" untuk menambahkan produk ke sistem</li>
            </ol>
          </Paragraph>
        </Panel>
        
        <Panel header="Cara Menambahkan Variasi Produk" key="7">
          <Paragraph>
            <ol>
              <li>Klik menu "Variasi Produk" di sidebar</li>
              <li>Klik tombol "Tambah Variasi"</li>
              <li>Pilih produk yang ingin ditambahkan variasinya</li>
              <li>Isi informasi variasi (warna, ukuran, model, dll.)</li>
              <li>Klik "Simpan" untuk menambahkan variasi</li>
            </ol>
          </Paragraph>
        </Panel>
        
        <Panel header="Cara Mengelola Stok Produk" key="8">
          <Paragraph>
            <ol>
              <li>Klik menu "Stok" di sidebar</li>
              <li>Lihat daftar stok produk Anda</li>
              <li>Klik "Edit" pada produk yang ingin diubah stoknya</li>
              <li>Perbarui jumlah stok</li>
              <li>Klik "Simpan" untuk memperbarui stok</li>
            </ol>
          </Paragraph>
        </Panel>
      </Collapse>
    </Card>
  );
};

export default HelpCenter;