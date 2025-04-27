require('dotenv').config();
const express = require('express');
const sql = require('mssql');
const chokidar = require('chokidar');
const path = require('path');

const app = express();
let connectionStatus = {
  connected: false,
  message: 'Not tested yet',
  timestamp: null
};

// SQL Server configuration
const config = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: true,
    trustServerCertificate: true
  }
};

// Database connection tester
async function testConnection() {
  try {
    const pool = await sql.connect(config);
    await pool.request().query('SELECT 1 as test');
    connectionStatus = {
      connected: true,
      message: 'Connection successful',
      timestamp: new Date()
    };
    await pool.close();
  } catch (error) {
    connectionStatus = {
      connected: false,
      message: `Connection failed: ${error.message}`,
      timestamp: new Date()
    };
  }
}

// Watch .env file for changes
const envPath = path.join(__dirname, '../.env');
chokidar.watch(envPath).on('change', () => {
  console.log('.env file changed, reloading...');
  delete require.cache[require.resolve('dotenv')];
  require('dotenv').config();
  Object.assign(config, {
    server: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
  });
  testConnection();
});

// Initial connection test
testConnection();

// Routes
app.get('/', (req, res) => {
    const statusPage = `
      <html>
        <head>
          <title>Yosral | Check SQL Server Status</title>
          <style>
            .password-container { display: flex; align-items: center; gap: 10px; }
            .toggle-btn { 
              padding: 2px 8px;
              cursor: pointer;
              background: #007bff;
              color: white;
              border: none;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <h1>SQL Server Connection Status</h1>
          <p>Last checked: ${connectionStatus.timestamp}</p>
          <p>Status: ${connectionStatus.connected ? '✅ Connected' : '❌ Failed'}</p>
          <p>Message: ${connectionStatus.message}</p>
          
          <h2>Current Configuration</h2>
          <table>
            <tr><td>Server:</td><td>${process.env.DB_SERVER}</td></tr>
            <tr><td>Database:</td><td>${process.env.DB_DATABASE}</td></tr>
            <tr><td>User:</td><td>${process.env.DB_USER}</td></tr>
            <tr>
              <td>Password:</td>
              <td>
                  <input type="password" id="password" value="${process.env.DB_PASSWORD}" readonly>
                  <button class="toggle-btn" onclick="togglePassword()">Show</button>
              </td>
            </tr>
          </table>
  
          <script>
            function togglePassword() {
              const passwordField = document.getElementById('password');
              const toggleBtn = document.querySelector('.toggle-btn');
              
              if (passwordField.type === 'password') {
                passwordField.type = 'text';
                toggleBtn.textContent = 'Hide';
              } else {
                passwordField.type = 'password';
                toggleBtn.textContent = 'Show';
              }
            }
          </script>
        </body>
      </html>
    `;
    res.send(statusPage);
  });

// Start server
const port = process.env.APP_PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on ${process.env.APP_URL}`);
});