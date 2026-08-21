require('dotenv').config();
const { getDashboardStats } = require('./controllers/analytics.controller');

async function testController() {
  const req = {
    user: { id: "8002abb9-a232-4dc7-b715-73656aa14523" },
    query: { filter: 'thisMonth' }
  };
  const res = {
    json: (data) => console.log("SUCCESS:", JSON.stringify(data, null, 2)),
    status: (code) => ({
      json: (data) => console.log("ERROR STATUS", code, data)
    })
  };

  await getDashboardStats(req, res);
}

testController();
