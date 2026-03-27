import {
  getCurrentMember,
  openAuthConsoleModal,
  openAuthAdminModal,
} from '@bigstrider/transcodes-sdk';
import { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Avatar, Descriptions, Divider, Space, Spin } from 'antd';
import { UserOutlined, SafetyOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';
import { Text } from '@/components/text';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  projectId: string;
}

export const ProfilePage = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const transcodesUser = await getCurrentMember();
        if (transcodesUser) {
          setUser({
            id: transcodesUser.id || '',
            name: transcodesUser.name || '',
            email: transcodesUser.email || '',
            role: transcodesUser.role || '',
            projectId: transcodesUser.projectId || '',
          });
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleManageMFA = async () => {
    await openAuthConsoleModal();
  };

  const handleOpenAdminModal = async () => {
    try {
      const response = await openAuthAdminModal({
        allowedRoles: ['admin'],
      });

      console.log('handleOpenAdminModal response', response);
    } catch (error) {
      console.error('Error opening admin modal:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Text
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
          }}
        >
          Profile Settings
        </Text>
        <div style={{ color: '#8c8c8c', marginTop: '8px' }}>
          Manage your account settings and security preferences
        </div>
      </div>

      <Row gutter={[24, 24]}>
        {/* User Info Card */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
                <Text>Account Information</Text>
              </div>
            }
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <Avatar
                size={80}
                icon={
                  <UserOutlined
                    onPointerEnterCapture={undefined}
                    onPointerLeaveCapture={undefined}
                  />
                }
                style={{ backgroundColor: '#1890ff' }}
              />
              <div style={{ marginLeft: '24px' }}>
                <Text
                  style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    display: 'block',
                  }}
                >
                  {user?.name || user?.email || ''}
                </Text>
                <Text style={{ color: '#8c8c8c' }}>{user?.email || ''}</Text>
              </div>
            </div>

            <Divider />

            <Descriptions column={1} labelStyle={{ fontWeight: 'bold' }}>
              <Descriptions.Item
                label={
                  <>
                    <IdcardOutlined
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    />{' '}
                    User ID
                  </>
                }
              >
                {user?.id || ''}
              </Descriptions.Item>
              <Descriptions.Item
                label={
                  <>
                    <MailOutlined
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    />{' '}
                    Email
                  </>
                }
              >
                {user?.email || ''}
              </Descriptions.Item>
              <Descriptions.Item label="Role">
                <Text strong style={{ color: '#1890ff' }}>
                  {user?.role || ''}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Project ID">{user?.projectId || ''}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Security Settings Card */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SafetyOutlined
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                />
                <Text>Security Settings</Text>
              </div>
            }
          >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                  Multi-Factor Authentication
                </Text>
                <Text
                  style={{
                    color: '#8c8c8c',
                    fontSize: '12px',
                    display: 'block',
                    marginBottom: '12px',
                  }}
                >
                  Add an extra layer of security to your account
                </Text>
                <Button
                  type="primary"
                  icon={
                    <SafetyOutlined
                      onPointerEnterCapture={undefined}
                      onPointerLeaveCapture={undefined}
                    />
                  }
                  onClick={handleManageMFA}
                  block
                >
                  Manage Authentication
                </Button>
              </div>

              <div>
                <Button type="default" onClick={handleOpenAdminModal} block>
                  Open Admin Modal
                </Button>
              </div>

              <Divider style={{ margin: '8px 0' }} />
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
