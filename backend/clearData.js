require('dotenv').config();
const prisma = require('./prismaClient');

async function main() {
  try {
    // Delete all transactions
    const deletedTx = await prisma.transaction.deleteMany({});
    console.log(`Deleted ${deletedTx.count} transactions.`);

    // Delete all categories (except default ones, or just delete all and let them be recreated)
    const deletedCat = await prisma.category.deleteMany({});
    console.log(`Deleted ${deletedCat.count} categories.`);

    // Delete all accounts (or reset their balance)
    // It's safer to just delete the accounts; they will be recreated by the auto-assign logic
    const deletedAcc = await prisma.account.deleteMany({});
    console.log(`Deleted ${deletedAcc.count} accounts.`);

    console.log("All user data has been cleared! User accounts are kept intact.");
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
