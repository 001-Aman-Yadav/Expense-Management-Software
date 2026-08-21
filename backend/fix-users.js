const prisma = require('./prismaClient');

async function fixUsers() {
  const adminUserId = '8002abb9-a232-4dc7-b715-73656aa14523';
  
  // Delete all users except the admin one
  await prisma.user.deleteMany({
    where: {
      id: {
        not: adminUserId
      }
    }
  });

  console.log('Deleted other users. Only the main user remains.');
}

fixUsers().finally(() => prisma.$disconnect());
