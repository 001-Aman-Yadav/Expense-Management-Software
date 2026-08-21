const prisma = require('../prismaClient');

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'thisMonth' } = req.query;

    // Get all accounts to calculate total balance
    const accounts = await prisma.account.findMany({ where: { userId } });
    const totalBalance = accounts.reduce((acc, account) => acc + Number(account.currentBalance), 0);

    // Determine date range based on filter
    const now = new Date();
    let startDate, endDate;
    
    // Set startOfDay to midnight in local time
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    // Set endOfDay to just before midnight of the next day in local time
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    if (filter === 'today') {
      startDate = startOfDay;
      endDate = endOfDay;
    } else if (filter === 'yesterday') {
      startDate = new Date(startOfDay);
      startDate.setDate(startDate.getDate() - 1);
      endDate = startOfDay;
    } else if (filter === 'thisWeek') {
      startDate = new Date(startOfDay);
      const day = startDate.getDay() || 7;
      startDate.setDate(startDate.getDate() - (day - 1));
      endDate = endOfDay;
    } else if (filter === 'thisMonth') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate = endOfDay;
    } else if (filter === 'thisYear') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = endOfDay;
    } else {
      // 'all'
      startDate = new Date(2000, 0, 1);
      endDate = endOfDay;
    }

    // Re-fetch transactions with proper date bounds
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          ...(filter !== 'all' ? { lt: endDate } : {})
        }
      },
      orderBy: { date: 'asc' }
    });

    const periodIncome = transactions
      .filter(tx => tx.type === 'INCOME')
      .reduce((acc, tx) => acc + Number(tx.amount), 0);
      
    const periodExpense = transactions
      .filter(tx => tx.type === 'EXPENSE')
      .reduce((acc, tx) => acc + Number(tx.amount), 0);

    // Group by day for the chart
    const dailyDataMap = {};
    
    // Initialize dates for the period to show empty bars (if period is short, like week or month)
    if (filter === 'thisWeek') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        if (d > now) break;
        const dateStr = d.toISOString().split('T')[0];
        dailyDataMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
      }
    } else if (filter === 'thisMonth') {
      const daysInMonth = now.getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), i);
        const dateStr = d.toISOString().split('T')[0];
        dailyDataMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
      }
    }

    transactions.forEach(tx => {
      const dateStr = new Date(tx.date).toISOString().split('T')[0];
      if (!dailyDataMap[dateStr]) {
        dailyDataMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
      }
      if (tx.type === 'INCOME') {
        dailyDataMap[dateStr].income += Number(tx.amount);
      } else if (tx.type === 'EXPENSE') {
        dailyDataMap[dateStr].expense += Number(tx.amount);
      }
    });

    const dailyData = Object.values(dailyDataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

    // Calculate category data for expenses (grouped by description since we don't have categories)
    const categoryMap = {};
    transactions.forEach(tx => {
      if (tx.type === 'EXPENSE') {
        const cat = tx.description || 'General';
        if (!categoryMap[cat]) categoryMap[cat] = 0;
        categoryMap[cat] += Number(tx.amount);
      }
    });

    const categoryData = Object.keys(categoryMap).map(key => ({
      name: key,
      value: categoryMap[key]
    })).sort((a, b) => b.value - a.value).slice(0, 6); // Top 6 categories

    // Include an 'Other' category if there are more than 6
    const otherValue = Object.keys(categoryMap).slice(6).reduce((acc, key) => acc + categoryMap[key], 0);
    if (otherValue > 0) {
      categoryData.push({ name: 'Other', value: otherValue });
    }

    const totalTransactions = transactions.length;

    res.json({
      totalBalance,
      periodIncome,
      periodExpense,
      totalTransactions,
      dailyData,
      categoryData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
};
