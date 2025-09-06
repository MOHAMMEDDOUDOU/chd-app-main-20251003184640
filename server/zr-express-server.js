const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'ZR Express Server is running',
    timestamp: new Date().toISOString()
  });
});

// ZR Express API proxy endpoint
app.post('/api/zr-express', async (req, res) => {
  try {
    console.log('📦 Received request from Frontend:', req.body);
    
    // ZR Express API configuration
    const ZR_EXPRESS_URL = 'https://zr-express.com/api/v1/orders';
    const ZR_EXPRESS_TOKEN = 'your-token-here'; // Replace with actual token
    const ZR_EXPRESS_KEY = 'your-key-here'; // Replace with actual key
    
    // Forward request to ZR Express
    const response = await fetch(ZR_EXPRESS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ZR_EXPRESS_TOKEN}`,
        'X-API-Key': ZR_EXPRESS_KEY
      },
      body: JSON.stringify(req.body)
    });
    
    const data = await response.json();
    console.log('✅ Response from ZR Express:', data);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Error communicating with ZR Express:', error);
    res.status(500).json({ 
      error: 'Failed to communicate with ZR Express',
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 ZR Express Server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/zr-express`);
  console.log('✅ Ready to handle requests from Frontend!');
});