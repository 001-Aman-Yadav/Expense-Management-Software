const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/Settings.jsx',
  'frontend/src/pages/Income.jsx',
  'frontend/src/pages/Expenses.jsx',
  'frontend/src/pages/Dashboard.jsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace axios with API instance
  content = content.replace(/import axios from 'axios';/g, "import api from '../services/api';");
  
  // Replace axios.method calls with api.method
  content = content.replace(/axios\.(get|post|put|delete)\(/g, 'api.$1(');
  
  // Remove hardcoded host
  content = content.replace(/http:\/\/localhost:5000\/api/g, '');
  
  // Remove explicit headers object for auth (since interceptor does it)
  // This regex matches: , { headers: { Authorization: `Bearer ${token}` } }
  // or similar.
  content = content.replace(/,\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{token\}`\s*\}\s*\}/g, '');
  
  // There's also `const token = localStorage.getItem('token');` which will become unused, but that's fine.
  
  fs.writeFileSync(filePath, content);
});

console.log('Refactored API calls');
