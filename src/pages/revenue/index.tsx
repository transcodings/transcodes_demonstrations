import {
  DollarOutlined,
  DownloadOutlined,
  LineChartOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

// Antd icon type workaround for React 18+ DOM props
const Icon = (C: React.ComponentType) => (<C />) as ReactNode;
import { Card, Col, Row, Button, Table, Statistic, Spin, Alert, message } from 'antd';
import { Area, AreaConfig } from '@ant-design/plots';
import { Text } from '@/components/text';
import { useState, useEffect } from 'react';
import { revenueApi, MonthlyRevenue, MonthlyRevenueDetail } from '@/api/revenue';
import * as Transcodes from '@bigstrider/transcodes-sdk';

export const RevenueDashboard = () => {
  const [monthlyData, setMonthlyData] = useState<MonthlyRevenue[]>([]);
  const [monthlyDetails, setMonthlyDetails] = useState<MonthlyRevenueDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  // Fetch revenue data on component mount
  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async (showSuccessMessage = false) => {
    setIsLoading(true);
    setApiError(null);
    try {
      const response = await revenueApi.getAll();

      if (response.data) {
        setMonthlyData(response.data.monthlyData);
        setMonthlyDetails(response.data.monthlyDetails);

        if (showSuccessMessage) {
          message.success('Revenue data loaded successfully');
        }
      } else if (response.error) {
        setApiError(response.error);
        message.error(`Failed to load data: ${response.error}`);
      }
    } catch (error) {
      const errorMsg = 'Failed to fetch revenue data';
      console.error('❌ Fetch error:', error);
      setApiError(errorMsg);
      message.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary from fetched data
  const totalRevenue = monthlyData.reduce((sum, item) => sum + item.revenue, 0);
  const totalTransactions = monthlyData.reduce((sum, item) => sum + item.transactions, 0);
  const avgMonthlyRevenue = monthlyData.length > 0 ? totalRevenue / monthlyData.length : 0;
  const currentMonthRevenue =
    monthlyData.length > 0 ? monthlyData[monthlyData.length - 1].revenue : 0;
  const previousMonthRevenue =
    monthlyData.length > 1 ? monthlyData[monthlyData.length - 2].revenue : 0;
  const growthRate =
    previousMonthRevenue > 0
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100
      : 0;

  const chartConfig: AreaConfig = {
    data: monthlyData,
    xField: 'month',
    yField: 'revenue',
    smooth: true,
    animation: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    line: {
      color: '#1890ff',
    },
    yAxis: {
      label: {
        formatter: (v: string) => {
          return `$${Number(v) / 1000}k`;
        },
      },
    },

    tooltip: {
      formatter: (data) => {
        return {
          name: 'Revenue',
          value: `$${Number(data.revenue).toLocaleString()}`,
        };
      },
    },
  };

  const handleDownloadCSV = async () => {
    // Step 1: IDP Step-up Authentication
    const stepUpAuth = await Transcodes.openAuthIdpModal({
      resource: 'revenue',
      action: 'read',
    });

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

    try {
      // Step 2: Get CSV from backend (with SID in header)
      const response = await revenueApi.exportCSV(sid);

      if (response.error || !response.data) {
        throw new Error(response.error || 'Failed to export CSV');
      }

      // Step 3: Download the file
      const blob = response.data;
      const filename =
        response.filename || `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      message.success('Revenue report downloaded successfully');
    } catch (error) {
      message.error('Failed to download revenue report');
    }
  };

  const columns = [
    {
      title: 'Month',
      dataIndex: 'month',
      key: 'month',
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Fees (3%)',
      dataIndex: 'fees',
      key: 'fees',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Net Revenue',
      dataIndex: 'netRevenue',
      key: 'netRevenue',
      render: (value: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${value.toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Transactions',
      dataIndex: 'transactions',
      key: 'transactions',
      render: (value: number) => value.toLocaleString(),
    },
    {
      title: 'Avg Transaction',
      dataIndex: 'avgTransaction',
      key: 'avgTransaction',
      render: (value: number) => `$${value.toFixed(2)}`,
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
        <Spin size="large" tip="Loading revenue data..." />
      </div>
    );
  }

  if (apiError || monthlyData.length === 0) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Failed to load revenue data"
          description={
            <div>
              <p>{apiError || 'No data available'}</p>
              <p style={{ marginTop: '8px', color: '#8c8c8c' }}>
                Backend URL: <code>http://localhost:3007/api/revenue</code>
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
              onClick={() => fetchRevenueData(true)}
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
            Revenue Dashboard
          </Text>
          <div style={{ color: '#8c8c8c', marginTop: '8px' }}>
            Track your Stripe revenue and transaction metrics
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            icon={
              <ReloadOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            }
            onClick={() => fetchRevenueData(true)}
            loading={isLoading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            size="large"
            icon={
              <DownloadOutlined
                onPointerEnterCapture={undefined}
                onPointerLeaveCapture={undefined}
              />
            }
            onClick={handleDownloadCSV}
          >
            Get Revenue Report
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue (2024)"
              value={totalRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Current Month"
              value={currentMonthRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
              suffix={
                <span style={{ fontSize: '14px', color: '#52c41a' }}>
                  ↑ {growthRate.toFixed(1)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Monthly Revenue"
              value={avgMonthlyRevenue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={totalTransactions}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Card
        style={{ marginBottom: '24px' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LineChartOutlined
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
            <Text>Monthly Revenue Trend</Text>
          </div>
        }
      >
        <Area {...chartConfig} height={350} />
      </Card>

      {/* Monthly Details Table */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarOutlined onPointerEnterCapture={undefined} onPointerLeaveCapture={undefined} />
            <Text>Monthly Revenue Details</Text>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={monthlyDetails}
          rowKey="month"
          pagination={{ pageSize: 12 }}
        />
      </Card>
    </div>
  );
};
