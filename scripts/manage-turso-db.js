#!/usr/bin/env node
/**
 * Manage Turso databases - delete and recreate
 */

const https = require('https');
const { URL } = require('url');

// Parse the database info from the URL
const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_TOKEN) {
  console.error('❌ Missing Turso credentials!');
  console.error('Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables');
  process.exit(1);
}

// Extract database name and organization from URL
// Format: libsql://database-name-org-slug.region.turso.io
const urlMatch = TURSO_URL.match(/libsql:\/\/([^-]+)-([^.]+)/);
if (!urlMatch) {
  console.error('❌ Could not parse database URL');
  process.exit(1);
}

const dbName = urlMatch[1];
const orgSlug = urlMatch[2];

console.log(`Database: ${dbName}`);
console.log(`Organization: ${orgSlug}`);
console.log('\n⚠️  WARNING: This will DELETE the existing database and all its data!');
console.log('Press Ctrl+C to cancel, or continue in 5 seconds...\n');

function makeApiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.turso.tech',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TURSO_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data: data });
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function deleteDatabase() {
  console.log(`\n🗑️  Deleting database: ${dbName}...`);

  try {
    await makeApiRequest('DELETE', `/v1/organizations/${orgSlug}/databases/${dbName}`);
    console.log('✅ Database deleted successfully!');
    return true;
  } catch (error) {
    if (error.message.includes('404')) {
      console.log('ℹ️  Database does not exist (already deleted)');
      return true;
    }
    console.error('❌ Failed to delete database:', error.message);
    return false;
  }
}

async function createDatabase() {
  console.log(`\n📦 Creating new database: ${dbName}...`);

  try {
    const result = await makeApiRequest('POST', `/v1/organizations/${orgSlug}/databases`, {
      name: dbName,
      group: 'default',
      seed: {
        type: 'database_upload'
      }
    });

    console.log('✅ Database created successfully!');
    console.log(`   Database ID: ${result.data.database?.DbId || 'N/A'}`);
    console.log(`   Hostname: ${result.data.database?.Hostname || 'N/A'}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to create database:', error.message);
    return false;
  }
}

async function generateToken() {
  console.log(`\n🔑 Generating new auth token...`);

  try {
    const result = await makeApiRequest('POST', `/v1/organizations/${orgSlug}/databases/${dbName}/auth/tokens`, {
      expiration: 'never',
      authorization: 'full-access'
    });

    const token = result.data.jwt;
    if (token) {
      console.log('✅ Token generated successfully!');
      console.log(`\n📋 Update your environment variables:`);
      console.log(`TURSO_DATABASE_URL=libsql://${dbName}-${orgSlug}.turso.io`);
      console.log(`TURSO_AUTH_TOKEN=${token}`);
      return token;
    }
  } catch (error) {
    console.error('❌ Failed to generate token:', error.message);
    return null;
  }
}

async function main() {
  // Wait 5 seconds
  await new Promise(resolve => setTimeout(resolve, 5000));

  console.log('🚀 Starting database management...\n');

  // Step 1: Delete existing database
  const deleted = await deleteDatabase();
  if (!deleted) {
    console.error('\n❌ Failed to delete database. Aborting.');
    process.exit(1);
  }

  // Step 2: Create new database
  const created = await createDatabase();
  if (!created) {
    console.error('\n❌ Failed to create database. Aborting.');
    process.exit(1);
  }

  // Step 3: Generate new token
  await generateToken();

  console.log('\n✅ Database management complete!');
  console.log('You can now upload your database file using the /v1/upload endpoint.');
}

main().catch(console.error);
