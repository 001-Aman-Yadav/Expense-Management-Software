const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

exports.register = async (req, res) => {
  return res.status(403).json({ message: 'Registration is disabled. Only admin can login.' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const ADMIN_EMAIL = 'admin@gmail.com';
    const ADMIN_PASSWORD = 'admin';

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let user = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

      user = await prisma.user.create({
        data: {
          name: 'Admin',
          email: ADMIN_EMAIL,
          mobile: '0000000000',
          password: hashedPassword,
        }
      });

      await prisma.account.create({
        data: {
          name: 'Cash',
          type: 'CASH',
          currentBalance: 0,
          openingBalance: 0,
          userId: user.id
        }
      });

      const defaultCategories = [
        { name: 'Food & Dining', type: 'EXPENSE', userId: user.id, color: '#f43f5e' },
        { name: 'Transportation', type: 'EXPENSE', userId: user.id, color: '#8b5cf6' },
        { name: 'Shopping', type: 'EXPENSE', userId: user.id, color: '#ec4899' },
        { name: 'Entertainment', type: 'EXPENSE', userId: user.id, color: '#f59e0b' },
        { name: 'Salary', type: 'INCOME', userId: user.id, color: '#10b981' },
        { name: 'Freelance', type: 'INCOME', userId: user.id, color: '#0ea5e9' }
      ];
      await prisma.category.createMany({ data: defaultCategories });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, mobile: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
