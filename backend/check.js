require('dotenv').config();
const prisma = require('./prismaClient');

async function check() {
  try {
    const txs = await prisma.transaction.findMany();
    console.log("All transactions in DB:", txs);
    
    if (txs.length === 0) {
      console.log("No transactions found at all in DB!");
      return;
    }

    const userId = txs[0].userId;
    
    const now = new Date();
    console.log("Server now():", now.toISOString());
    console.log("Local now():", now.toString());
    
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    
    console.log("startOfDay:", startOfDay.toISOString());
    console.log("endOfDay:", endOfDay.toISOString());

    const filtered = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });

    console.log("Filtered 'today' transactions:", filtered);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    console.log("monthStart:", monthStart.toISOString());
    const monthFiltered = await prisma.transaction.findMany({
      where: {
        userId,
        date: {
          gte: monthStart,
          lt: endOfDay
        }
      }
    });
    console.log("Filtered 'thisMonth' transactions:", monthFiltered);

  } catch(e) {
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
check();
