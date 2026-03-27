'use client';
import { useState, useEffect } from 'react';
import { Card, Col, Row, Button, Table, Tag, message, Statistic, Spin, Alert } from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  WalletOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Text } from '@/components/text';
import { payoutApi, PayoutTransaction, Earnings } from '@/api/payouts';
import * as Transcodes from '@bigstrider/transcodes-sdk';

export const PayoutPage = () => {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [transactions, setTransactions] = useState<PayoutTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch payout data on component mount
  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async (showSuccessMessage = false) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await payoutApi.getAll();

      if (response.data) {
        setEarnings(response.data.earnings);
        setTransactions(response.data.transactions);

        // Only show success message when manually refreshing
        if (showSuccessMessage) {
          message.success('Payout data loaded successfully');
        }
      } else if (response.error) {
        console.error('❌ API Error:', response.error);
        setApiError(response.error);
        message.error(`Failed to load data: ${response.error}`);
      }
    } catch (error) {
      const errorMsg = 'Failed to fetch payout data';
      console.error('❌ Fetch error:', error);
      setApiError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayout = async () => {
    // Step 1: IDP Step-up Authentication
    const stepUpAuth = await Transcodes.openAuthIdpModal({
      resource: 'payout',
      action: 'create',
    });

    console.log('handlePayout stepUpAuth response', stepUpAuth);

    if (!stepUpAuth.success) {
      message.error('Authentication failed or was cancelled');
      return;
    }

    // Extract SID from IDP response
    const sid = stepUpAuth.payload?.[0]?.sid;
    if (!sid) {
      message.error('Step-up session ID not found');
      return;
    }

    if (!earnings || earnings.availableBalance <= 0) {
      message.warning('No available balance to payout');
      return;
    }

    setIsProcessing(true);

    try {
      const payoutAmount = earnings.availableBalance;

      // Step 2: Call backend API with Transcodes token + SID in body
      const response = await payoutApi.requestPayout(
        {
          amount: payoutAmount,
          description: 'Payout initiated via IDP authentication',
        },
        sid,
      );

      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to create payout');
      }

      const result = response.data;
      console.log('Payout created:', result);

      // Step 3: Update UI with backend response
      setEarnings(result.earnings);
      setTransactions([result.transaction, ...transactions]);

      message.success(`Successfully initiated payout of $${payoutAmount.toFixed(2)}`);

      // Track payout action
      // await Transcodes.trackUserAction({
      //   tag: 'payout:request',
      //   severity: 'high',
      //   status: true,
      //   metadata: {
      //     amount: payoutAmount,
      //     transactionId: result.transaction.id,
      //     sid: stepUpAuth.payload[0]?.sid,
      //     timestamp: new Date().toISOString(),
      //   },
      // });

      // Step 4: Simulate processing -> completed after 2 seconds
      setTimeout(async () => {
        try {
          const statusResponse = await payoutApi.updateTransactionStatus(
            result.transaction.id,
            'completed',
          );

          if (statusResponse.data) {
            setTransactions((prev) =>
              prev.map((t) =>
                t.id === result.transaction.id ? statusResponse.data!.transaction : t,
              ),
            );
            message.info('Payout completed successfully');
          }
        } catch (error) {
          console.error('Failed to update transaction status:', error);
        }
      }, 2000);
    } catch (error) {
      console.error('Payout error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to process payout');

      // Track failed payout
      await Transcodes.trackUserAction({
        tag: 'payout:request',
        severity: 'high',
        status: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
        },
      }).catch(console.error);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusTag = (status: PayoutTransaction['status']) => {
    const statusConfig = {
      completed: {
        color: 'success',
        icon: (
          <CheckCircleOutlined
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          />
        ),
        text: 'Completed',
      },
      processing: {
        color: 'processing',
        icon: <SyncOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />,
        text: 'Processing',
      },
      pending: {
        color: 'warning',
        icon: (
          <ClockCircleOutlined
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          />
        ),
        text: 'Pending',
      },
      failed: {
        color: 'error',
        icon: (
          <CloseCircleOutlined
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          />
        ),
        text: 'Failed',
      },
    };

    const config = statusConfig[status];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) =>
        new Date(date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => (
        <Text strong style={{ fontSize: '14px' }}>
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: PayoutTransaction['status']) => getStatusTag(status),
    },
  ];

  if (isLoading) {
    return (
      <div
        style={{
          padding: '24px',
          textAlign: 'center',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" tip="Loading payout data..." />
      </div>
    );
  }

  if (!earnings) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Failed to load payout data"
          description={
            <div>
              <p>{apiError || 'Unable to connect to backend API'}</p>
              <p style={{ marginTop: '8px', color: '#8c8c8c' }}>
                Backend URL: <code>http://localhost:3007/api/payouts</code>
              </p>
              <p style={{ marginTop: '8px', color: '#8c8c8c' }}>
                Make sure the backend server is running on port 3007
              </p>
            </div>
          }
          type="error"
          showIcon
          action={
            <Button
              size="small"
              danger
              onClick={() => fetchPayoutData(true)}
              icon={
                <ReloadOutlined
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                />
              }
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Text
            style={{
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            Earnings & Payouts
          </Text>
          <div style={{ color: '#8c8c8c', marginTop: '8px' }}>
            Manage your earnings and request payouts
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={
              <ReloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            }
            onClick={() => fetchPayoutData(true)}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            danger
            onClick={async () => {
              try {
                const response = await payoutApi.reset();
                if (response.data) {
                  setEarnings(response.data.earnings);
                  setTransactions(response.data.transactions);
                  message.success('Payout data reset to default');
                }
              } catch (error) {
                message.error('Failed to reset data');
              }
            }}
          >
            Reset Demo Data
          </Button>
        </div>
      </div>

      {/* Earnings Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Earned"
              value={earnings.totalEarned}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Balance"
              value={earnings.availableBalance}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending"
              value={earnings.pendingBalance}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Paid Out"
              value={earnings.paidOut}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Payout Request Card */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row justify="space-between" align="middle">
          <Col xs={24} md={16}>
            <div style={{ color: 'white' }}>
              <Text
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: 'white',
                  display: 'block',
                  marginBottom: '8px',
                }}
              >
                Request Payout
              </Text>
              <Text style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Available balance:{' '}
                <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {formatCurrency(earnings.availableBalance)}
                </span>
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: 'right', marginTop: '16px' }}>
            <Button
              type="primary"
              size="large"
              onClick={handlePayout}
              disabled={isProcessing || earnings.availableBalance <= 0}
              loading={isProcessing}
              icon={
                <WalletOutlined
                  onPointerEnterCapture={undefined}
                  onPointerLeaveCapture={undefined}
                />
              }
              style={{
                background: 'white',
                color: '#667eea',
                borderColor: 'white',
                fontWeight: 'bold',
              }}
            >
              {isProcessing ? 'Processing...' : 'Request Payout'}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Transaction History */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            <Text>Transaction History</Text>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};
