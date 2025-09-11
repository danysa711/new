import React from 'react';
import { Typography, Card, Divider } from 'antd';

const { Title, Paragraph, Text } = Typography;

const TermsOfService = () => {
  return (
    <Card>
      <Title level={2}>Ketentuan Layanan Kinterstore</Title>
      <Divider />
      
      <Paragraph>
        <Text strong></Text>
      </Paragraph>
      
      <Paragraph>
        Selamat datang di Kinterstore! Ketentuan Layanan ini mengatur penggunaan Anda terhadap layanan Kinterstore, 
        platform pengelolaan stok otomatis untuk penjual Shopee.
      </Paragraph>
      
      <Title level={3}>1. Penerimaan Ketentuan</Title>
      <Paragraph>
        Dengan mengakses atau menggunakan layanan Kinterstore, Anda menyetujui untuk terikat oleh Ketentuan Layanan ini. 
        Jika Anda tidak setuju dengan ketentuan ini, Anda tidak boleh menggunakan layanan kami.
      </Paragraph>
      
      <Title level={3}>2. Deskripsi Layanan</Title>
      <Paragraph>
        Kinterstore menyediakan platform pengelolaan stok otomatis yang memungkinkan penjual Shopee untuk:
        <ul>
          <li>Mendaftarkan produk dan variasinya</li>
          <li>Mengelola stok produk secara terpusat</li>
          <li>Mengirimkan pesanan secara otomatis</li>
          <li>Memantau aktivitas penjualan</li>
        </ul>
      </Paragraph>
      
      <Title level={3}>3. Akun Pengguna</Title>
      <Paragraph>
        Untuk menggunakan layanan kami, Anda harus membuat akun. Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda 
        dan semua aktivitas yang terjadi di bawah akun Anda. Anda harus segera memberi tahu kami tentang penggunaan yang tidak sah.
      </Paragraph>
      
      <Title level={3}>4. Langganan dan Pembayaran</Title>
      <Paragraph>
        <ul>
          <li>Kami menawarkan berbagai paket langganan dengan fitur yang berbeda</li>
          <li>Pembayaran langganan bersifat non-refundable kecuali ditentukan lain</li>
          <li>Anda dapat membatalkan langganan kapan saja, tetapi tidak ada pengembalian dana untuk periode yang belum digunakan</li>
          <li>Kami berhak mengubah harga dengan pemberitahuan sebelumnya</li>
        </ul>
      </Paragraph>
      
      <Title level={3}>5. Penggunaan yang Dilarang</Title>
      <Paragraph>
        Anda tidak boleh:
        <ul>
          <li>Menggunakan layanan untuk tujuan ilegal atau tidak sah</li>
          <li>Melanggar hak kekayaan intelektual pihak ketiga</li>
          <li>Mengganggu atau mencoba mengganggu integritas layanan</li>
          <li>Menjual kembali layanan tanpa otorisasi tertulis dari kami</li>
        </ul>
      </Paragraph>
      
      <Title level={3}>6. Kontak</Title>
      <Paragraph>
        Jika Anda memiliki pertanyaan tentang Ketentuan Layanan ini, silakan hubungi kami di:
        <br />
        Email: support@kinterstore.my.id
        <br />
        WhatsApp: +6281284712684
      </Paragraph>
    </Card>
  );
};

export default TermsOfService;