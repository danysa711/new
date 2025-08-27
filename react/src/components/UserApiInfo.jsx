// File: react/src/components/UserApiInfo.jsx

import React, { useContext } from 'react';
import { Card, Typography, Space, Divider, Button } from 'antd';
import { LinkOutlined, CopyOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ConnectionContext } from '../context/ConnectionContext';

const { Title, Text, Paragraph } = Typography;

const UserApiInfo = ({ user }) => {
  const navigate = useNavigate();
  const { backendUrl } = useContext(ConnectionContext);
  
  if (!user) return null;
  
  // URL yang akan ditampilkan
  const userBackendUrl = user.backend_url || backendUrl || 'https://db.kinterstore.my.id';
  const publicApiUrl = `${userBackendUrl}/api/public/user/${user.url_slug}`;
  const ordersApiUrl = `${userBackendUrl}/api/orders/find`;
  
  return (
    <Card 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Informasi API</span>
          <Button 
            type="primary" 
            size="small" 
            icon={<LinkOutlined />}
            onClick={() => navigate(`/user/page/${user.url_slug}/backend-settings`)}
          >
            Pengaturan Backend
          </Button>
        </div>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Text strong>Backend URL:</Text>
          <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0 }}>
            {userBackendUrl}
          </Paragraph>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div>
          <Text strong>API URL Publik:</Text>
          <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0 }}>
            {publicApiUrl}
          </Paragraph>
        </div>
        
        <Divider style={{ margin: '12px 0' }} />
        
        <div>
          <Text strong>Endpoint Orders:</Text>
          <Paragraph style={{ marginBottom: 4 }}>
            Gunakan endpoint berikut untuk mencari dan memproses pesanan:
          </Paragraph>
          <Paragraph copyable={{ icon: <CopyOutlined /> }} style={{ marginBottom: 0 }}>
            {ordersApiUrl}
          </Paragraph>
        </div>
      </Space>
    </Card>
  );
};

export default UserApiInfo;