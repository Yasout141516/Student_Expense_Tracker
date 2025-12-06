const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Category = require('../models/Category');
const Expense = require('../models/Expense');
const Income = require('../models/Income');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const RecurringExpense = require('../models/RecurringExpense');

// Load env variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Clear all data
const clearData = async () => {
  try {
    await User.deleteMany();
    await Category.deleteMany();
    await Expense.deleteMany();
    await Income.deleteMany();
    await Budget.deleteMany();
    await Goal.deleteMany();
    await RecurringExpense.deleteMany();
    console.log('🗑️  All data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Seed data
const seedData = async () => {
  try {
    // Clear existing data
    await clearData();

    // 1. Create a test user
    const user = await User.create({
      name: 'John Doe',
      email: 'john@student.edu',
      password: 'password123',
      currency: 'HKD'
    });
    console.log('✅ User created:', user.email);

    // 2. Create categories
    const categories = await Category.insertMany([
      { userId: user._id, type: 'Food & Snacks' },
      { userId: user._id, type: 'Transport' },
      { userId: user._id, type: 'Rent' },
      { userId: user._id, type: 'Books & Stationery' },
      { userId: user._id, type: 'Social Outings' },
      { userId: user._id, type: 'Utilities' }
    ]);
    console.log('✅ Categories created:', categories.length);

    // 3. Create expenses
    const expenses = await Expense.insertMany([
      {
        userId: user._id,
        categoryId: categories[0]._id, // Food
        amount: 45.50,
        date: new Date('2024-12-01'),
        note: 'Lunch at campus cafe'
      },
      {
        userId: user._id,
        categoryId: categories[1]._id, // Transport
        amount: 20.00,
        date: new Date('2024-12-02'),
        note: 'Bus fare'
      },
      {
        userId: user._id,
        categoryId: categories[0]._id, // Food
        amount: 85.00,
        date: new Date('2024-12-03'),
        note: 'Grocery shopping'
      },
      {
        userId: user._id,
        categoryId: categories[4]._id, // Social
        amount: 120.00,
        date: new Date('2024-12-04'),
        note: 'Dinner with friends'
      }
    ]);
    console.log('✅ Expenses created:', expenses.length);

    // 4. Create income
    const incomes = await Income.insertMany([
      {
        userId: user._id,
        amount: 5000.00,
        incomeType: 'Part-time job',
        date: new Date('2024-12-01'),
        description: 'November salary'
      },
      {
        userId: user._id,
        amount: 1000.00,
        incomeType: 'Allowance',
        date: new Date('2024-12-01'),
        description: 'Monthly allowance from parents'
      }
    ]);
    console.log('✅ Income records created:', incomes.length);

    // 5. Create budgets
    const budgets = await Budget.insertMany([
      {
        userId: user._id,
        categoryId: categories[0]._id, // Food budget
        month: new Date('2024-12-01'),
        limitAmount: 1500.00
      },
      {
        userId: user._id,
        categoryId: categories[1]._id, // Transport budget
        month: new Date('2024-12-01'),
        limitAmount: 500.00
      },
      {
        userId: user._id,
        categoryId: null, // Overall monthly budget
        month: new Date('2024-12-01'),
        limitAmount: 4000.00
      }
    ]);
    console.log('✅ Budgets created:', budgets.length);

    // 6. Create goals
    const goals = await Goal.insertMany([
      {
        userId: user._id,
        goalName: 'New Laptop',
        targetAmount: 10000.00,
        currentAmount: 1500.00,
        targetDate: new Date('2025-06-30')
      },
      {
        userId: user._id,
        goalName: 'Summer Travel',
        targetAmount: 5000.00,
        currentAmount: 500.00,
        targetDate: new Date('2025-07-15')
      }
    ]);
    console.log('✅ Goals created:', goals.length);

    // 7. Create recurring expense
    const recurringExpenses = await RecurringExpense.insertMany([
      {
        userId: user._id,
        categoryId: categories[2]._id, // Rent
        amount: 3500.00,
        frequency: 'monthly',
        startDate: new Date('2024-09-01'),
        endDate: new Date('2025-06-30'),
        description: 'Dorm rent',
        isActive: true
      }
    ]);
    console.log('✅ Recurring expenses created:', recurringExpenses.length);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: 1`);
    console.log(`   Categories: ${categories.length}`);
    console.log(`   Expenses: ${expenses.length}`);
    console.log(`   Income: ${incomes.length}`);
    console.log(`   Budgets: ${budgets.length}`);
    console.log(`   Goals: ${goals.length}`);
    console.log(`   Recurring Expenses: ${recurringExpenses.length}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
};

// Run seeder
const runSeeder = async () => {
  await connectDB();
  await seedData();
  process.exit();
};

runSeeder();