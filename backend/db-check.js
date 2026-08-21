const prisma = require('./prismaClient');

async function main() {
  console.log('Users:', await prisma.user.findMany());
  console.log('Accounts:', await prisma.account.findMany());
  console.log('Transactions:', await prisma.transaction.findMany());
}

main().finally(() => prisma.$disconnect());
