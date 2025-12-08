import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Popconfirm,
  Row,
  Col,
  Progress,
  Statistic,
  Tag,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TrophyOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { goalAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/currency';
import dayjs from 'dayjs';

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({
    totalGoals: 0,
    completed: 0,
    inProgress: 0,
    totalTarget: 0,
    totalSaved: 0,
  });

  const currency = user?.currency || 'BDT';

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalAPI.getAll();
      setGoals(response.data.data);

      // Calculate stats
      const totalGoals = response.data.data.length;
      const completed = response.data.data.filter(g => g.currentAmount >= g.targetAmount).length;
      const inProgress = totalGoals - completed;
      const totalTarget = response.data.data.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalSaved = response.data.data.reduce((sum, g) => sum + g.currentAmount, 0);

      setStats({ totalGoals, completed, inProgress, totalTarget, totalSaved });
    } catch (error) {
      message.error('Failed to fetch goals');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (goal = null) => {
    if (goal) {
      setEditingGoal(goal);
      form.setFieldsValue({
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        targetDate: dayjs(goal.targetDate),
      });
    } else {
      setEditingGoal(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingGoal(null);
    form.resetFields();
  };

  const handleSubmit = async (values) => {
    try {
      const data = {
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount || 0,
        targetDate: values.targetDate.toISOString(),
      };

      if (editingGoal) {
        await goalAPI.update(editingGoal._id, data);
        message.success('Goal updated successfully');
      } else {
        await goalAPI.create(data);
        message.success('Goal created successfully');
      }

      handleCancel();
      fetchGoals();
    } catch (error) {
      message.error(
        error.response?.data?.message || 'Failed to save goal'
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await goalAPI.delete(id);
      message.success('Goal deleted successfully');
      fetchGoals();
    } catch (error) {
      message.error('Failed to delete goal');
    }
  };

  const calculateProgress = (current, target) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const calculateWeeklySavings = (goal) => {
    const remaining = goal.targetAmount - goal.currentAmount;
    const today = dayjs();
    const target = dayjs(goal.targetDate);
    const weeksLeft = Math.max(target.diff(today, 'week'), 1);
    return remaining / weeksLeft;
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 100) return '#52c41a';
    if (percentage >= 75) return '#1890ff';
    if (percentage >= 50) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>
          Financial Goals
        </h1>
        <p style={{ color: '#8c8c8c', margin: 0 }}>
          Set and track your savings goals
        </p>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Goals"
              value={stats.totalGoals}
              prefix={<RocketOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="In Progress"
              value={stats.inProgress}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Target Amount"
              value={stats.totalTarget}
              precision={2}
              suffix={currency}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Saved"
              value={stats.totalSaved}
              precision={2}
              suffix={currency}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress
              percent={stats.totalTarget > 0 ? Math.round((stats.totalSaved / stats.totalTarget) * 100) : 0}
              strokeColor="#52c41a"
              style={{ marginTop: '8px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Add Goal Button */}
      <div style={{ marginBottom: '16px', textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => showModal()}
        >
          Add Goal
        </Button>
      </div>

      {/* Goals Grid */}
      <Row gutter={[16, 16]}>
        {goals.length === 0 && !loading ? (
          <Col span={24}>
            <Card>
              <Empty
                image={<TrophyOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
                description="No goals yet. Create your first savings goal!"
              />
            </Card>
          </Col>
        ) : (
          goals.map((goal) => {
            const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
            const weeklySavings = calculateWeeklySavings(goal);
            const isCompleted = progress >= 100;
            const daysLeft = dayjs(goal.targetDate).diff(dayjs(), 'day');

            return (
              <Col xs={24} sm={12} lg={8} key={goal._id}>
                <Card
                  title={
                    <Space>
                      {goal.name}
                      {isCompleted && <Tag color="green">Completed</Tag>}
                    </Space>
                  }
                  extra={
                    <Space>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => showModal(goal)}
                      />
                      <Popconfirm
                        title="Delete this goal?"
                        onConfirm={() => handleDelete(goal._id)}
                        okText="Yes"
                        cancelText="No"
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>
                    </Space>
                  }
                >
                  <div style={{ marginBottom: '16px' }}>
                    <Progress
                      percent={progress}
                      strokeColor={getStatusColor(progress)}
                      status={isCompleted ? 'success' : 'active'}
                    />
                  </div>

                  <Row gutter={[8, 8]}>
                    <Col span={12}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Current</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#52c41a' }}>
                        {formatCurrency(goal.currentAmount, currency)}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Target</div>
                      <div style={{ fontSize: '16px', fontWeight: 600, color: '#1890ff' }}>
                        {formatCurrency(goal.targetAmount, currency)}
                      </div>
                    </Col>
                  </Row>

                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
                    <Row gutter={[8, 8]}>
                      <Col span={12}>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Days Left</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                          {daysLeft > 0 ? `${daysLeft} days` : 'Expired'}
                        </div>
                      </Col>
                      <Col span={12}>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Weekly Savings</div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>
                          {formatCurrency(Math.max(weeklySavings, 0), currency)}
                        </div>
                      </Col>
                    </Row>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                    Target Date: {dayjs(goal.targetDate).format('MMM DD, YYYY')}
                  </div>
                </Card>
              </Col>
            );
          })
        )}
      </Row>

      {/* Add/Edit Goal Modal */}
      <Modal
        title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
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
            currentAmount: 0,
          }}
        >
          <Form.Item
            label="Goal Name"
            name="name"
            rules={[
              { required: true, message: 'Please enter goal name' },
              { min: 2, message: 'Name must be at least 2 characters' },
            ]}
          >
            <Input placeholder="e.g., New Laptop, Emergency Fund, Travel" />
          </Form.Item>

          <Form.Item
            label="Target Amount"
            name="targetAmount"
            rules={[
              { required: true, message: 'Please enter target amount' },
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
            label="Current Amount"
            name="currentAmount"
            rules={[
              { type: 'number', min: 0, message: 'Amount cannot be negative' },
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
            label="Target Date"
            name="targetDate"
            rules={[{ required: true, message: 'Please select target date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingGoal ? 'Update' : 'Create'} Goal
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Goals;