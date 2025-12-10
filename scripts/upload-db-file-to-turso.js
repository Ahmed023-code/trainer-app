#!/usr/bin/env node
/**
 * Upload SQLite database file directly to Turso
 * Uses Turso's bulk upload API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

// Your local database - now using the core database
const LOCAL_DB = path.join(__dirname, '../public/db/usda-core.sqlite');

// Turso connection
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing Turso credentials!');
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables');
  process.exit(1);
}

async function uploadDatabaseFile() {
  console.log('🚀 Starting database file upload to Turso...\n');

  // Check if file exists
  if (!fs.existsSync(LOCAL_DB)) {
    console.error(`❌ Database file not found: ${LOCAL_DB}`);
    process.exit(1);
  }

  // Get file size
  const stats = fs.statSync(LOCAL_DB);
  const fileSizeMB = stats.size / (1024 * 1024);
  console.log(`📦 Database file: ${path.basename(LOCAL_DB)}`);
  console.log(`💾 File size: ${fileSizeMB.toFixed(2)} MB\n`);

  // Parse the Turso URL to get the upload endpoint
  const tursoUrl = new URL(TURSO_URL.replace('libsql://', 'https://'));
  const uploadUrl = `https://${tursoUrl.host}/v1/upload`;

  console.log(`📤 Uploading to: ${uploadUrl}`);
  console.log('⏳ This may take several minutes...\n');

  return new Promise((resolve, reject) => {
    const url = new URL(uploadUrl);

    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TURSO_TOKEN}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': stats.size
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Database uploaded successfully!');
          console.log(`\n📊 Status: ${res.statusCode}`);
          if (data) {
            console.log(`Response: ${data}`);
          }
          resolve();
        } else {
          console.error(`❌ Upload failed with status ${res.statusCode}`);
          console.error(`Response: ${data}`);
          reject(new Error(`Upload failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Upload failed:', error.message);
      reject(error);
    });

    // Stream the file to the request
    const fileStream = fs.createReadStream(LOCAL_DB);

    let uploadedBytes = 0;
    let lastProgress = 0;

    fileStream.on('data', (chunk) => {
      uploadedBytes += chunk.length;
      const progress = Math.floor((uploadedBytes / stats.size) * 100);

      // Update progress every 5%
      if (progress >= lastProgress + 5) {
        const uploadedMB = (uploadedBytes / (1024 * 1024)).toFixed(2);
        console.log(`📊 Progress: ${progress}% (${uploadedMB} MB / ${fileSizeMB.toFixed(2)} MB)`);
        lastProgress = progress;
      }
    });

    fileStream.on('error', (error) => {
      console.error('❌ File read error:', error.message);
      reject(error);
    });

    fileStream.pipe(req);
  });
}

uploadDatabaseFile().catch(console.error);
