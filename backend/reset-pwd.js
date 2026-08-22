const prisma = require('./prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('12345678', salt);
  
  // Update the only user in the database
  await prisma.user.updateMany({
    data: { 
      email: 'admin123@gmail.com',
      password: hashedPassword 
    }
  });
  console.log('Credentials updated successfully to admin123@gmail.com / 12345678');
}

main().finally(() => prisma.$disconnect());
