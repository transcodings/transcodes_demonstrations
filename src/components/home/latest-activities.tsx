import { UnorderedListOutlined, DownloadOutlined } from '@ant-design/icons';
import { Card, List, Space, Button, message } from 'antd';
import React, { useState } from 'react';
import { Text } from '../text';
import LatestActivitiesSkeleton from '../skeleton/latest-activities';
import { useList } from '@refinedev/core';
import {
  DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY,
  DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY,
} from '@/graphql/queries';
import dayjs from 'dayjs';
import CustomAvatar from '../custom-avatar';

const LatestActivities = () => {
  const [isExporting, setIsExporting] = useState(false);

  const {
    data: audit,
    isLoading: isLoadingAudit,
    isError,
    error,
  } = useList({
    resource: 'audits',
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_AUDITS_QUERY,
    },
  });

  const dealIds = audit?.data?.map((audit) => audit?.targetId);

  const { data: deals, isLoading: isLoadingDeals } = useList({
    resource: 'deals',
    queryOptions: { enabled: !!dealIds?.length },
    pagination: {
      mode: 'off',
    },
    filters: [{ field: 'id', operator: 'in', value: dealIds }],
    meta: {
      gqlQuery: DASHBOARD_LATEST_ACTIVITIES_DEALS_QUERY,
    },
  });

  if (isError) {
    return null;
  }

  const isLoading = isLoadingAudit || isLoadingDeals;

  const handleExportCSV = async () => {
    try {
      setIsExporting(true);

      // Prepare CSV data
      const csvRows: string[] = [];

      // CSV Headers
      csvRows.push('Date,User,Action,Deal Title,Company,Stage');

      // CSV Data rows
      audit?.data?.forEach((item) => {
        const deal = deals?.data.find((deal) => deal.id === String(item.targetId));

        if (deal) {
          const date = dayjs(deal.createdAt).format('MMM DD, YYYY - HH:mm');
          const user = item.user?.name || 'Unknown';
          const action = item.action === 'CREATE' ? 'created' : 'moved';
          const dealTitle = deal.title || 'Untitled';
          const company = deal.company?.name || 'Unknown';
          const stage = deal.stage?.title || 'Unknown';

          // Escape CSV values that contain commas or quotes
          const escapeCsvValue = (value: string) => {
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          };

          csvRows.push(
            `${escapeCsvValue(date)},${escapeCsvValue(user)},${escapeCsvValue(action)},${escapeCsvValue(dealTitle)},${escapeCsvValue(company)},${escapeCsvValue(stage)}`,
          );
        }
      });

      // Create CSV blob and download
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `latest-activities-${dayjs().format('YYYY-MM-DD-HHmmss')}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      message.success('CSV exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      message.error('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card
      headStyle={{ padding: '16px' }}
      bodyStyle={{ padding: '0 1rem' }}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UnorderedListOutlined />
          <Text size="sm" style={{ marginLeft: '0.5rem' }}>
            Latest Activities
          </Text>
        </div>
      }
      extra={
        <Button
          type="default"
          icon={<DownloadOutlined />}
          onClick={handleExportCSV}
          loading={isExporting}
          disabled={isLoading || !audit?.data?.length}
        >
          Export CSV
        </Button>
      }
    >
      {isLoading ? (
        <List
          itemLayout="horizontal"
          dataSource={Array.from({ length: 5 }).map((_, i) => ({ id: i }))}
          renderItem={(_, index) => <LatestActivitiesSkeleton key={index} />}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={audit?.data}
          renderItem={(item) => {
            const deal = deals?.data.find((deal) => deal.id === String(item.targetId)) || undefined;

            return (
              <List.Item>
                <List.Item.Meta
                  title={dayjs(deal?.createdAt).format('MMM DD, YYYY - HH:mm')}
                  avatar={
                    <CustomAvatar
                      shape="square"
                      size={48}
                      src={deal?.company.avatarUrl}
                      name={deal?.company.name}
                    />
                  }
                  description={
                    <Space size={4}>
                      <Text strong>{item.user?.name}</Text>
                      <Text>{item.action === 'CREATE' ? 'created' : 'moved'}</Text>
                      <Text strong> {deal?.title}</Text>
                      <Text>deal</Text>
                      <Text>{item.action === 'CREATE' ? 'in' : 'to'}</Text>
                      <Text strong>{deal?.stage?.title}</Text>
                    </Space>
                  }
                />
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );
};

export default LatestActivities;
