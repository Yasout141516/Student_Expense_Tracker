import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { incomeAPI, categoryAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const Income = () => {
  const { user } = useAuth();
  const [incomes, setIncomes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [form] = Form.useForm();
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [categoryForm] = Form.useForm();
  const [filters, setFilters] = useState({
    categoryId: null,
    startDate: null,
    endDate: null,
  });
  const [stats, setStats] = useState({
    total: 0,
    count: 0,
    average: 0,
  });

  const currency = user?.currency || 'BDT';

  useEffect(() => {
    fetchCategories();
    fetchIncomes();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      console.log('Fetching income categories...');
      const response = await categoryAPI.getAll();
      console.log('All categories from API:', response.data.data);
      
      // Filter only income categories
      const incomeCategories = response.data.data.filter(
        (cat) => cat.categoryType === 'income'
      );
      
      console.log('Filtered income categories:', incomeCategories);
      setCategories(incomeCategories);
    } catch (error) {
      console.error('Fetch categories error:', error);
      message.error('Failed to fetch categories');
    }
  };

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.categoryId) params.categoryId = filters.categoryId;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const response = await incomeAPI.getAll(params);
      setIncomes(response.data.data);

      // Calculate stats
      const total = response.data.data.reduce((sum, inc) => sum + inc.amount, 0);
      const count = response.data.data.length;
      const average = count > 0 ? total / count : 0;

      setStats({ total, count, average });
    } catch (error) {
      message.error('Failed to fetch income records');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (income = null) => {
    if (income) {
      setEditingIncome(income);
      form.setFieldsValue({
        amount: income.amount,
        categoryId: income.categoryId._id,
        date: dayjs(income.date),
        note: income.note,
      });
    } else {
      setEditingIncome(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingIncome(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        amount: values.amount,
        categoryId: values.categoryId,
        date: values.date.toISOString(),
        note: values.note || '',
      };

      if (editingIncome) {
        await incomeAPI.update(editingIncome._id, data);
        message.success('Income updated successfully');
      } else {
        await incomeAPI.create(data);
        message.success('Income added successfully');
      }

      handleCancel();
      fetchIncomes();
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Failed to save income'
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await incomeAPI.delete(id);
      message.success('Income deleted successfully');
      fetchIncomes();
    } catch (error) {
      message.error('Failed to delete income');
    }
  };

  const handleCreateCategory = async (values) => {
    try {
      // Create the category
      const createResponse = await categoryAPI.create({
        type: values.type,
        categoryType: 'income',
      });
      
      message.success('Category created successfully');
      
      // Get the newly created category ID
      const newCategoryId = createResponse.data?.data?._id || createResponse.data?._id;
      
      // Fetch updated categories
      const response = await categoryAPI.getAll();
      const incomeCategories = response.data.data.filter(
        (cat) => cat.categoryType === 'income'
      );
      
      // Update state with callback to ensure synchronization
      setCategories(incomeCategories);
      
      // Close modal
      setIsCategoryModalVisible(false);
      categoryForm.resetFields();
      
      // Use setTimeout to ensure state updates before setting form value
      setTimeout(() => {
        if (newCategoryId) {
          form.setFieldsValue({
            categoryId: newCategoryId
          });
        } else {
          // Fallback: find by name
          const newCategory = incomeCategories.find(cat => cat.type === values.type);
          if (newCategory) {
            form.setFieldsValue({
              categoryId: newCategory._id
            });
          }
        }
      }, 0);
      
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create category');
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateRangeChange = (dates) => {
    if (dates) {
      setFilters((prev) => ({
        ...prev,
        startDate: dates[0].toISOString(),
        endDate: dates[1].toISOString(),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        startDate: null,
        endDate: null,
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      categoryId: null,
      startDate: null,
      endDate: null,
    });
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Category',
      dataIndex: 'categoryId',
      key: 'category',
      render: (category) => (
        <Tag color="green">{category?.type || 'Uncategorized'}</Tag>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <span style={{ fontWeight: 600, color: '#52c41a' }}>
          {formatCurrency(amount, currency)}
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      ellipsis: true,
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
            title="Delete this income?"
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
          Income
        </h1>
        <p style={{ color: '#8c8c8c', margin: 0 }}>
          Track and manage your income sources
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Income"
              value={stats.total}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={currency}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Transactions"
              value={stats.count}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Average Income"
              value={stats.average}
              precision={2}
              suffix={currency}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder="Filter by Category"
              allowClear
              style={{ width: '100%' }}
              value={filters.categoryId}
              onChange={(value) => handleFilterChange('categoryId', value)}
            >
              {categories.map((cat) => (
                <Select.Option key={cat._id} value={cat._id}>
                  {cat.type}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              value={
                filters.startDate && filters.endDate
                  ? [dayjs(filters.startDate), dayjs(filters.endDate)]
                  : null
              }
            />
          </Col>
          <Col xs={24} sm={4} md={4}>
            <Button icon={<FilterOutlined />} onClick={clearFilters}>
              Clear
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6} style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showModal()}
              style={{ background: '#52c41a', borderColor: '#52c41a' }}
            >
              Add Income
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Income Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={incomes}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} income records`,
          }}
        />
      </Card>

      {/* Add/Edit Income Modal */}
      <Modal
        title={editingIncome ? 'Edit Income' : 'Add New Income'}
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
            date: dayjs(),
          }}
        >
          <Form.Item
            label="Amount"
            name="amount"
            rules={[
              { required: true, message: 'Please enter amount' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than 0' },
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
            label={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <span>Category</span>
                <Button 
                  type="link" 
                  size="small"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsCategoryModalVisible(true);
                  }}
                  style={{ padding: 0, height: 'auto' }}
                >
                  + Add Category
                </Button>
              </div>
            }
            name="categoryId"
            rules={[{ required: true, message: 'Please select category' }]}
            style={{ marginBottom: '24px' }}
          >
            <Select placeholder="Select category">
              {categories.length === 0 ? (
                <Select.Option disabled value="">
                  No categories yet - create one first!
                </Select.Option>
              ) : (
                categories.map((cat) => (
                  <Select.Option key={cat._id} value={cat._id}>
                    {cat.type}
                  </Select.Option>
                ))
              )}
            </Select>
          </Form.Item>

          <Form.Item
            label="Date"
            name="date"
            rules={[{ required: true, message: 'Please select date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Note" name="note">
            <Input.TextArea
              rows={3}
              placeholder="Add a note (optional)"
              maxLength={200}
              showCount
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
              >
                {editingIncome ? 'Update' : 'Add'} Income
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Create Category Modal */}
      <Modal
        title="Create New Income Category"
        open={isCategoryModalVisible}
        onCancel={() => {
          setIsCategoryModalVisible(false);
          categoryForm.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={categoryForm}
          layout="vertical"
          onFinish={handleCreateCategory}
        >
          <Form.Item
            label="Category Name"
            name="type"
            rules={[
              { required: true, message: 'Please enter category name' },
              { min: 2, message: 'Category name must be at least 2 characters' },
            ]}
          >
            <Input 
              placeholder="e.g., Salary, Freelance, Part-time Job"
              autoFocus
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => {
                setIsCategoryModalVisible(false);
                categoryForm.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Create Category
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Income;