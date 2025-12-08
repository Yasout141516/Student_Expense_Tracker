import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Typography, 
  Spin,
  Alert,
  Table,
  Tag,
  Progress,
  Empty
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  WalletOutlined,
  SaveOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Line, Column, Pie } from '@ant-design/charts';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';
import { formatCurrency } from '../utils/currency';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [burnRate, setBurnRate] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all dashboard data
      const [summaryRes, burnRateRes, transactionsRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getBurnRate(),
        dashboardAPI.getRecentTransactions(10),
      ]);

      setSummary(summaryRes.data.data);
      setBurnRate(burnRateRes.data.data);
      setRecentTransactions(transactionsRes.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  // No data state
  if (!summary) {
    return (
      <Alert
        message="No data available"
        description="Start by adding your first expense or income."
        type="info"
        showIcon
      />
    );
  }

  const currency = user?.currency || 'BDT';

  // Prepare chart data
  const categoryData = summary.topCategories?.map(cat => ({
    category: cat.categoryName,
    value: cat.total,
  })) || [];

  const dailySpendingData = burnRate?.dailySpending?.map(item => ({
    day: `Day ${item.day}`,
    amount: item.amount,
  })) || [];

  // Recent transactions table columns
  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'income' ? 'green' : 'red'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount, record) => (
        <Text strong style={{ color: record.type === 'income' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'income' ? '+' : '-'}
          {formatCurrency(amount, currency)}
        </Text>
      ),
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
    },
  ];

  return (
    <div>
      {/* Header */}
      <Title level={2}>
        Welcome back, {user?.name}! 👋
      </Title>
      <Text type="secondary">
        Here's what's happening with your finances today.
      </Text>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        {/* Total Income */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Income"
              value={summary.overview.totalIncome}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
              prefix={<WalletOutlined />}
              suffix={currency}
            />
          </Card>
        </Col>

        {/* Total Expenses */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Expenses"
              value={summary.overview.totalExpenses}
              precision={2}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<DollarOutlined />}
              suffix={currency}
            />
          </Card>
        </Col>

        {/* Savings */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Savings"
              value={summary.overview.savings}
              precision={2}
              valueStyle={{ color: summary.overview.savings >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={<SaveOutlined />}
              suffix={currency}
            />
          </Card>
        </Col>

        {/* Savings Rate */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Savings Rate"
              value={summary.overview.savingsRate}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
              prefix={
                summary.overview.savingsRate >= 0 ? 
                <ArrowUpOutlined /> : 
                <ArrowDownOutlined />
              }
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      {/* Budget Alerts */}
      {summary.budgetAlerts && 
       (summary.budgetAlerts.exceeded > 0 || summary.budgetAlerts.danger > 0) && (
        <Alert
          message="Budget Alert!"
          description={
            <div>
              {summary.budgetAlerts.exceeded > 0 && (
                <Text>
                  <WarningOutlined /> {summary.budgetAlerts.exceeded} budget(s) exceeded. 
                </Text>
              )}
              {summary.budgetAlerts.danger > 0 && (
                <Text>
                  {' '}⚠️ {summary.budgetAlerts.danger} budget(s) at 80%+.
                </Text>
              )}
            </div>
          }
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        {/* Spending by Category */}
        <Col xs={24} lg={12}>
          <Card title="Top Spending Categories">
            {categoryData.length > 0 ? (
             <Pie
  data={categoryData}
  angleField="value"
  colorField="category"
  radius={0.8}
  interactions={[{ type: 'element-active' }]}
/>
            ) : (
              <Empty description="No expense data yet" />
            )}
          </Card>
        </Col>

        {/* Daily Spending Trend */}
        <Col xs={24} lg={12}>
          <Card title="Daily Spending This Month">
            {dailySpendingData.length > 0 ? (
              <Column
                data={dailySpendingData}
                xField="day"
                yField="amount"
                color="#1890ff"
                columnStyle={{
                  radius: [4, 4, 0, 0],
                }}
              />
            ) : (
              <Empty description="No spending data yet" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Burn Rate Card */}
      <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
        <Col xs={24} lg={12}>
          <Card title="💰 Burn Rate Analysis">
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Daily"
                  value={burnRate?.burnRate?.daily || 0}
                  precision={2}
                  suffix={currency}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Weekly"
                  value={burnRate?.burnRate?.weekly || 0}
                  precision={2}
                  suffix={currency}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Monthly"
                  value={burnRate?.burnRate?.monthly || 0}
                  precision={2}
                  suffix={currency}
                />
              </Col>
            </Row>
            <div style={{ marginTop: '16px' }}>
              <Text type="secondary">
                Projected Monthly Spend: {' '}
                <Text strong>
                  {formatCurrency(burnRate?.projections?.projectedMonthlySpend || 0, currency)}
                </Text>
              </Text>
            </div>
          </Card>
        </Col>

        {/* Goals Progress */}
        <Col xs={24} lg={12}>
          <Card title="🎯 Goals Progress">
            {summary.goals.total > 0 ? (
              <>
                <Statistic
                  title="Active Goals"
                  value={summary.goals.total}
                />
                <div style={{ marginTop: '16px' }}>
                  <Text type="secondary">Average Progress:</Text>
                  <Progress
                    percent={parseFloat(summary.goals.averageProgress)}
                    status="active"
                  />
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Text type="secondary">
                    Total Saved: {formatCurrency(summary.goals.totalCurrentAmount, currency)} / {' '}
                    {formatCurrency(summary.goals.totalTargetAmount, currency)}
                  </Text>
                </div>
              </>
            ) : (
              <Empty description="No active goals" />
            )}
          </Card>
        </Col>
      </Row>

      {/* Recent Transactions */}
      <Card 
        title="Recent Transactions" 
        style={{ marginTop: '24px' }}
      >
        {recentTransactions.length > 0 ? (
          <Table
            columns={transactionColumns}
            dataSource={recentTransactions}
            rowKey="_id"
            pagination={false}
          />
        ) : (
          <Empty description="No transactions yet" />
        )}
      </Card>
    </div>
  );
};

export default Dashboard;