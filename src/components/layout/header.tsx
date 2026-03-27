import { Layout, Space, Button } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import CurrentUser from './current-user';
import React from 'react';
import * as Transcodes from '@bigstrider/transcodes-sdk';

const Header = () => {
  const headerStyles: React.CSSProperties = {
    background: '#fff',
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 999,
  };

  const [pwaInstalled, setPwaInstalled] = React.useState(false);

  React.useEffect(() => {
    if (Transcodes.isInitialized()) {
      setPwaInstalled(Transcodes.isPwaInstalled());
    }
  }, []);

  return (
    <Layout.Header style={headerStyles}>
      <Space align="center" size="middle">
        {!pwaInstalled && (
          <Button
            type="primary"
            icon={<ToolOutlined />}
            onClick={() => document.getElementById('install-button')?.click()}
          >
            Installation
          </Button>
        )}

        <CurrentUser />
      </Space>
    </Layout.Header>
  );
};

export default Header;
