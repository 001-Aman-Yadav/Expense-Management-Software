require('dotenv').config();
const prisma = require('./prismaClient');

async function main() {
  console.log('Seeding data...');

  const user = await prisma.user.findUnique({
    where: { email: 'admin@gmail.com' },
    include: {
      accounts: true,
      categories: true,
    }
  });

  if (!user) {
    console.log('Admin user not found. Please log in once to create the user.');
    return;
  }

  let account = user.accounts[0];
  if (!account) {
    console.log('No account found for user, creating one...');
    account = await prisma.account.create({
      data: {
        name: 'Cash',
        type: 'CASH',
        currentBalance: 0,
        openingBalance: 0,
        userId: user.id
      }
    });
  }

  if (user.categories.length === 0) {
    console.log('No categories found for user, creating them...');
    const defaultCategories = [
      { name: 'Food & Dining', type: 'EXPENSE', userId: user.id, color: '#f43f5e' },
      { name: 'Transportation', type: 'EXPENSE', userId: user.id, color: '#8b5cf6' },
      { name: 'Salary', type: 'INCOME', userId: user.id, color: '#10b981' }
    ];
    await prisma.category.createMany({ data: defaultCategories });
    user.categories = await prisma.category.findMany({ where: { userId: user.id } });
  }

  const foodCategory = user.categories.find(c => c.name === 'Food & Dining');
  const salaryCategory = user.categories.find(c => c.name === 'Salary');

  // Create Transactions
  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: salaryCategory?.id,
      type: 'INCOME',
      amount: 50000,
      date: new Date(),
      description: 'Monthly Salary',
      status: 'COMPLETED'
    }
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: foodCategory?.id,
      type: 'EXPENSE',
      amount: 1500,
      date: new Date(),
      description: 'Dinner at Restaurant',
      status: 'COMPLETED'
    }
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      accountId: account.id,
      categoryId: foodCategory?.id,
      type: 'EXPENSE',
      amount: 500,
      date: new Date(new Date().setDate(new Date().getDate() - 2)), // 2 days ago
      description: 'Groceries',
      status: 'COMPLETED'
    }
  });

  // Update Account Balance
  await prisma.account.update({
    where: { id: account.id },
    data: {
      currentBalance: 50000 - 1500 - 500
    }
  });

  // Create Budget
  if (foodCategory) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        categoryId: foodCategory.id,
        amount: 5000,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      }
    });
  }

  // Create Savings Goal
  await prisma.savingsGoal.create({
    data: {
      userId: user.id,
      name: 'New Laptop',
      targetAmount: 80000,
      currentAmount: 15000,
      targetDate: new Date(new Date().setMonth(new Date().getMonth() + 6)),
      description: 'Saving for a MacBook Pro'
    }
  });

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
