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
    
    // Check if any users exist in the database
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      // Seed default user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      const user = await prisma.user.create({
        data: {
          name: 'Admin',
          email: 'admin@gmail.com',
          mobile: '0000000000',
          password: hashedPassword,
        }
      });
      await prisma.account.create({
        data: { name: 'Cash', type: 'CASH', currentBalance: 0, openingBalance: 0, userId: user.id }
      });
      const defaultCategories = [
        { name: 'Food & Dining', type: 'EXPENSE', userId: user.id },
        { name: 'Salary', type: 'INCOME', userId: user.id }
      ];
      await prisma.category.createMany({ data: defaultCategories });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, profilePicture: user.profilePicture } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, mobile: true, profilePicture: true, createdAt: true }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Verify current password
    if (currentPassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
    }

    const updateData = {};
    if (email) updateData.email = email;
    
    if (newPassword && currentPassword) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, name: true, email: true, profilePicture: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    if (error.code === 'P2002') return res.status(400).json({ message: 'Email already exists' });
    res.status(500).json({ message: 'Error updating profile' });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    const { profilePicture } = req.body;
    if (!profilePicture) return res.status(400).json({ message: 'No photo provided' });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { profilePicture },
      select: { id: true, name: true, email: true, profilePicture: true }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error uploading photo' });
  }
};
