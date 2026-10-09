const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend integration
app.use(cors());

// Parse JSON and URL-encoded bodies
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for uploaded screenshots and landing website
const path = require('path');
const fs = require('fs');
app.use('/uploads', express.static(path.join(__dirname, '..', '_public_html (1)', 'uploads')));

// Serve APK files
app.use('/apk', express.static(path.join(__dirname, '..', 'landing', 'public', 'apk')));
app.use('/apk', express.static(path.join(__dirname, '..', 'landing', 'apk')));

app.get('/api/download-apk', (req, res) => {
  const apkPath = path.join(__dirname, '..', 'landing', 'public', 'apk', 'gama-567.apk');
  if (fs.existsSync(apkPath)) {
    res.download(apkPath, 'gama-567.apk');
  } else {
    const fallbackPath = path.join(__dirname, '..', 'landing', 'apk', 'gama-567.apk');
    if (fs.existsSync(fallbackPath)) {
      res.download(fallbackPath, 'gama-567.apk');
    } else {
      res.status(404).json({ success: '0', msg: 'APK file not found' });
    }
  }
});

const landingDistPath = path.join(__dirname, '..', 'landing', 'dist');
if (fs.existsSync(landingDistPath)) {
  app.use('/landing', express.static(landingDistPath));
} else {
  app.use('/landing', express.static(path.join(__dirname, '..', 'landing')));
}



// Routes
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.use('/api', apiRoutes);
app.use('/api/admin', adminRoutes);

// Base route & Health check
app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

app.get('/', (req, res) => {
  res.json({ message: 'GAMA567 API Server is running!', health: '/api/health' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: '0', msg: 'Something went wrong!', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
