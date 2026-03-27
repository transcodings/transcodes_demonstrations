'use client';
import { useLogin } from '@refinedev/core';
import { Button, Card, Typography, Space, Spin } from 'antd';
import { SafetyOutlined, LoginOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text } = Typography;

export const Login = () => {
  const { mutate: login, isLoading } = useLogin();
  const [isModalOpening, setIsModalOpening] = useState(false);

  const handleLogin = async () => {
    setIsModalOpening(true);
    try {
      await login({});
    } finally {
      setIsModalOpening(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Card
        style={{
          width: 400,
          textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          borderRadius: 16,
        }}
        bodyStyle={{ padding: '48px 32px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Logo/Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              margin: '0 auto',
            }}
          >
            <SafetyOutlined
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
              style={{ fontSize: 40, color: 'white' }}
            />
          </div>

          {/* Title */}
          <div>
            <Title level={2} style={{ marginBottom: 8 }}>
              Welcome Back
            </Title>
            <Text type="secondary">Sign in securely with Passkey or MFA</Text>
          </div>

          {/* Login Button */}
          <Button
            type="primary"
            size="large"
            icon={isLoading || isModalOpening ? <Spin size="small" /> : <LoginOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />}
            onClick={handleLogin}
            disabled={isLoading || isModalOpening}
            style={{
              width: '100%',
              height: 50,
              fontSize: 16,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
              border: 'none',
            }}
          >
            {isLoading || isModalOpening ? 'Opening...' : 'Sign in with Transcodes'}
          </Button>

          {/* Footer */}
          <Text type="secondary" style={{ fontSize: 12 }}>
            Powered by Transcodes Authentication
          </Text>
        </Space>
      </Card>
    </div>
  );
};
