import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Select } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, DollarOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    const result = await register(
      values.name,
      values.email,
      values.password,
      values.currency
    );
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-form-container">
      <Card className="auth-form-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <DollarOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
          <Title level={2} style={{ marginTop: '16px' }}>
            Create Account
          </Title>
          <Text type="secondary">Start tracking your expenses today</Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
          initialValues={{ currency: 'HKD' }}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: 'Please input your name!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Full Name"
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="Email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm Password"
            />
          </Form.Item>

          <Form.Item
            name="currency"
            rules={[{ required: true, message: 'Please select your currency!' }]}
          >
           <Select placeholder="Select Currency">
  <Option value="BDT">BDT - Bangladeshi Taka (৳)</Option>
  <Option value="HKD">HKD - Hong Kong Dollar</Option>
  <Option value="USD">USD - US Dollar</Option>
  <Option value="EUR">EUR - Euro</Option>
  <Option value="GBP">GBP - British Pound</Option>
  <Option value="JPY">JPY - Japanese Yen</Option>
  <Option value="CNY">CNY - Chinese Yuan</Option>
</Select>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              Register
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'center' }}>
            <Text>Already have an account? </Text>
            <Link to="/login">Login here</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;