const prisma = require('../prismaClient');

exports.getTransactions = async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.user.id },
      orderBy: { date: 'desc' },
      include: { account: true, category: true, sourceAccount: true, destinationAccount: true }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

exports.createTransaction = async (req, res) => {
  try {
    let { type, amount, date, description, accountId, categoryId, sourceAccountId, destinationAccountId, notes, paymentMethod } = req.body;
    
    // Auto-assign default account if missing
    if (!accountId) {
      let defaultAccount = await prisma.account.findFirst({ where: { userId: req.user.id } });
      if (!defaultAccount) {
        defaultAccount = await prisma.account.create({
          data: { userId: req.user.id, name: 'Main Account', type: 'CASH', currentBalance: 0, openingBalance: 0 }
        });
      }
      accountId = defaultAccount.id;
    }

    // Auto-assign default category if missing
    if (!categoryId) {
      let defaultCategory = await prisma.category.findFirst({ where: { userId: req.user.id, type } });
      if (!defaultCategory) {
        defaultCategory = await prisma.category.create({
          data: { userId: req.user.id, name: type === 'INCOME' ? 'General Income' : 'General Expense', type }
        });
      }
      categoryId = defaultCategory.id;
    }

    // Use Prisma interactive transaction to update both transaction and account balance
    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          userId: req.user.id,
          type,
          amount,
          date: new Date(date),
          description,
          accountId,
          categoryId,
          sourceAccountId,
          destinationAccountId,
          notes,
          paymentMethod: paymentMethod || 'CASH'
        }
      });

      if (type === 'EXPENSE') {
        await tx.account.update({
          where: { id: accountId },
          data: { currentBalance: { decrement: amount } }
        });
      } else if (type === 'INCOME') {
        await tx.account.update({
          where: { id: accountId },
          data: { currentBalance: { increment: amount } }
        });
      } else if (type === 'TRANSFER') {
        await tx.account.update({
          where: { id: sourceAccountId },
          data: { currentBalance: { decrement: amount } }
        });
        await tx.account.update({
          where: { id: destinationAccountId },
          data: { currentBalance: { increment: amount } }
        });
      }

      return transaction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating transaction' });
  }
};

exports.updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, description, paymentMethod } = req.body;
    
    // Find existing transaction
    const existingTx = await prisma.transaction.findUnique({
      where: { id, userId: req.user.id }
    });

    if (!existingTx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Difference in amount (new - old)
    const amountDiff = Number(amount) - Number(existingTx.amount);

    const result = await prisma.$transaction(async (tx) => {
      const updatedTx = await tx.transaction.update({
        where: { id },
        data: {
          amount: Number(amount),
          date: new Date(date),
          description,
          paymentMethod: paymentMethod || existingTx.paymentMethod
        }
      });

      // Update account balance if amount changed
      if (amountDiff !== 0) {
        if (existingTx.type === 'EXPENSE') {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { currentBalance: { decrement: amountDiff } }
          });
        } else if (existingTx.type === 'INCOME') {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { currentBalance: { increment: amountDiff } }
          });
        }
      }

      return updatedTx;
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating transaction' });
  }
};

exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTx = await prisma.transaction.findUnique({
      where: { id, userId: req.user.id }
    });

    if (!existingTx) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Reverse the balance effect
      if (existingTx.type === 'EXPENSE') {
        await tx.account.update({
          where: { id: existingTx.accountId },
          data: { currentBalance: { increment: existingTx.amount } }
        });
      } else if (existingTx.type === 'INCOME') {
        await tx.account.update({
          where: { id: existingTx.accountId },
          data: { currentBalance: { decrement: existingTx.amount } }
        });
      }

      // Delete transaction
      await tx.transaction.delete({
        where: { id }
      });
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting transaction' });
  }
};
