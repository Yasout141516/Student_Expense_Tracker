import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  Select,
  message,
  Popconfirm,
  Row,
  Col,
  Progress,
  Statistic,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { budgetAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';

const Budget = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalBudget: 0,
    totalSpent: 0,
    remaining: 0,
    overBudget: 0,
  });

  const currency = user?.currency || 'BDT';

  useEffect(() => {
    fetchCategories();
    fetchBudgets();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryAPI.getAll();
      const expenseCategories = response.data.data.filter(
        (cat) => cat.categoryType === 'expense'
      );
      setCategories(expenseCategories);
    } catch (error) {
      message.error('Failed to fetch categories');
    }
  };

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const response = await budgetAPI.getAll();
      setBudgets(response.data.data);

      // Calculate stats
      const totalBudget = response.data.data.reduce((sum, b) => sum + b.limit, 0);
      const totalSpent = response.data.data.reduce((sum, b) => sum + (b.spent || 0), 0);
      const remaining = totalBudget - totalSpent;
      const overBudget = response.data.data.filter(b => (b.spent || 0) > b.limit).length;

      setStats({ totalBudget, totalSpent, remaining, overBudget });
    } catch (error) {
      message.error('Failed to fetch budgets');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      form.setFieldsValue({
        categoryId: budget.categoryId._id,
        limit: budget.limit,
        period: budget.period,
      });
    } else {
      setEditingBudget(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingBudget(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      if (editingBudget) {
        await budgetAPI.update(editingBudget._id, values);
        message.success('Budget updated successfully');
      } else {
        await budgetAPI.create(values);
        message.success('Budget created successfully');
      }
      handleCancel();
      fetchBudgets();
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Failed to save budget'
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await budgetAPI.delete(id);
      message.success('Budget deleted successfully');
      fetchBudgets();
    } catch (error) {
      message.error('Failed to delete budget');
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return '#ff4d4f';
    if (percentage >= 80) return '#faad14';
    return '#52c41a';
  };

  const getStatusTag = (spent, limit) => {
    const percentage = (spent / limit) * 100;
    if (percentage >= 100) {
      return <Tag color="red">Over Budget</Tag>;
    } else if (percentage >= 80) {
      return <Tag color="orange">Warning</Tag>;
    } else {
      return <Tag color="green">On Track</Tag>;
    }
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'categoryId',
      key: 'category',
      render: (category) => (
        <Tag color="blue">{category?.type || 'Uncategorized'}</Tag>
      ),
    },
    {
      title: 'Period',
      dataIndex: 'period',
      key: 'period',
      render: (period) => (
        <Tag>{period.charAt(0).toUpperCase() + period.slice(1)}</Tag>
      ),
    },
    {
      title: 'Budget Limit',
      dataIndex: 'limit',
      key: 'limit',
      render: (limit) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(limit, currency)}
        </span>
      ),
    },
    {
      title: 'Spent',
      dataIndex: 'spent',
      key: 'spent',
      render: (spent) => (
        <span style={{ fontWeight: 600, color: '#ff4d4f' }}>
          {formatCurrency(spent || 0, currency)}
        </span>
      ),
    },
    {
      title: 'Remaining',
      key: 'remaining',
      render: (_, record) => {
        const remaining = record.limit - (record.spent || 0);
        return (
          <span style={{ fontWeight: 600, color: remaining >= 0 ? '#52c41a' : '#ff4d4f' }}>
            {formatCurrency(remaining, currency)}
          </span>
        );
      },
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const percentage = Math.round(((record.spent || 0) / record.limit) * 100);
        return (
          <Progress
            percent={percentage}
            strokeColor={getProgressColor(percentage)}
            style={{ width: '120px' }}
          />
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => getStatusTag(record.spent || 0, record.limit),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => showModal(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this budget?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          Budget Management
        </h1>
        <p style={{ color: '#8c8c8c', margin: 0 }}>
          Set and track your spending limits by category
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={stats.totalBudget}
              precision={2}
              suffix={currency}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Spent"
              value={stats.totalSpent}
              precision={2}
              suffix={currency}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Remaining"
              value={stats.remaining}
              precision={2}
              suffix={currency}
              valueStyle={{ color: stats.remaining >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Over Budget"
              value={stats.overBudget}
              prefix={stats.overBudget > 0 ? <WarningOutlined /> : <CheckCircleOutlined />}
              valueStyle={{ color: stats.overBudget > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alert for over budget */}
      {stats.overBudget > 0 && (
        <Alert
          message={`Warning: ${stats.overBudget} budget(s) exceeded!`}
          description="You have exceeded your budget limits in some categories. Review your spending."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Add Budget Button */}
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Add Budget
        </Button>
      </div>

      {/* Budgets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={budgets}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} budgets`,
          }}
        />
      </Card>

      {/* Add/Edit Budget Modal */}
      <Modal
        title={editingBudget ? 'Edit Budget' : 'Create New Budget'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            period: 'monthly',
          }}
        >
          <Form.Item
            label="Category"
            name="categoryId"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              {categories.map((cat) => (
                <Select.Option key={cat._id} value={cat._id}>
                  {cat.type}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Budget Limit"
            name="limit"
            rules={[
              { required: true, message: 'Please enter budget limit' },
              { type: 'number', min: 0.01, message: 'Limit must be greater than 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="0.00"
              prefix={currency}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="Period"
            name="period"
            rules={[{ required: true, message: 'Please select period' }]}
          >
            <Select placeholder="Select period">
              <Select.Option value="daily">Daily</Select.Option>
              <Select.Option value="weekly">Weekly</Select.Option>
              <Select.Option value="monthly">Monthly</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingBudget ? 'Update' : 'Create'} Budget
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Budget;