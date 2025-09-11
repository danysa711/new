import React from 'react';
import { Typography, Card, Divider, Space } from 'antd';

const { Title, Paragraph, Text } = Typography;

const PrivacyPolicy = () => {
  return (
    <Card>
      <Title level={2}>Kebijakan Privasi Kinterstore</Title>
      <Divider />
      
      <Paragraph>
        <Text strong></Text>
      </Paragraph>
      
      <Paragraph>
        Kami berkomitmen untuk melindungi privasi Anda. 
        Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda 
        saat Anda menggunakan layanan kami untuk mengelola stok toko Shopee Anda.
      </Paragraph>
      
      <Title level={3}>Informasi yang Kami Kumpulkan</Title>
      <Paragraph>
        <ul>
          <li>Informasi akun: nama, email, username, dan kata sandi terenkripsi</li>
          <li>Informasi pembayaran: untuk pemrosesan langganan (diproses melalui penyedia pembayaran pihak ketiga (Tripay)</li>
          <li>Data penggunaan: cara Anda berinteraksi dengan layanan kami</li>
          <li>Informasi perangkat: Support Perangkat Windows 10/11 dengan spesifikasi Minimum Processor 2 Core, RAM 4GB</li>
        </ul>
      </Paragraph>
      
      <Title level={3}>Bagaimana Kami Menggunakan Informasi Anda</Title>
      <Paragraph>
        <ul>
          <li>Menyediakan layanan pengiriman produk shopee secara otomatis</li>
          <li>Memproses transaksi dan mengelola langganan</li>
          <li>Mengirim pemberitahuan terkait layanan</li>
          <li>Meningkatkan dan mengembangkan layanan kami</li>
          <li>Melindungi keamanan dan integritas platform kami</li>
        </ul>
      </Paragraph>
      
      <Title level={3}>Keamanan Data</Title>
      <Paragraph>
        Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang tepat untuk melindungi data Anda. 
        Namun, tidak ada metode transmisi internet atau penyimpanan elektronik yang 100% aman. 
        Meskipun kami berusaha menggunakan cara yang dapat diterima secara komersial untuk melindungi informasi pribadi Anda, 
        kami tidak dapat menjamin keamanan absolutnya.
      </Paragraph>
      
      <Title level={3}>Pengungkapan kepada Pihak Ketiga</Title>
      <Paragraph>
        Kami tidak menjual informasi pribadi Anda. Kami dapat membagikan informasi dengan:
        <ul>
          <li>Penyedia layanan pihak ketiga yang membantu kami menjalankan bisnis</li>
          <li>Mitra bisnis untuk tujuan integrasi API</li>
          <li>Pihak berwenang jika diwajibkan oleh hukum</li>
        </ul>
      </Paragraph>
      
      <Title level={3}>Kontak</Title>
      <Paragraph>
        Jika Anda memiliki pertanyaan tentang kebijakan privasi kami, silakan hubungi kami di:
        <br />
        Email: support@kinterstore.my.id
        <br />
        WhatsApp: +6281284712684
      </Paragraph>
    </Card>
  );
};

export default PrivacyPolicy;