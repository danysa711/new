import React from 'react';
import { Typography } from 'antd';
import logoImage from '../../assets/images/kinterstore-logo.png'; // Pastikan path ini benar

const { Title } = Typography;

const Logo = ({ collapsed = false, size = 'default' }) => {
  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'flex-start',
    padding: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
  };

  const imageStyle = {
    height: size === 'large' ? '32px' : '24px',
    marginRight: collapsed ? 0 : 8,
  };

  return (
    <div style={logoStyle}>
      <img 
        src={logoImage} 
        alt="Kinterstore Logo" 
        style={imageStyle} 
      />
      {!collapsed && (
        <Title 
          level={size === 'large' ? 3 : 5} 
          style={{ color: 'white', margin: 0 }}
        >
          Kinterstore
        </Title>
      )}
    </div>
  );
};

export default Logo;