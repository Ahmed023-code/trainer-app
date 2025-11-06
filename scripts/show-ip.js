#!/usr/bin/env node

/**
 * Display local IP addresses for remote access
 * Run with: npm run ip
 */

const os = require('os');

function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name,
          address: iface.address,
        });
      }
    }
  }

  return addresses;
}

function main() {
  const port = process.env.PORT || 3000;
  const addresses = getLocalIPs();

  console.log('\n🌐 Remote Access URLs\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (addresses.length === 0) {
    console.log('⚠️  No network interfaces found');
    console.log('   Make sure you are connected to a network\n');
    return;
  }

  console.log('Access your app from any device on the same network:\n');

  addresses.forEach(({ name, address }) => {
    console.log(`  📱 http://${address}:${port}`);
    console.log(`     (${name})\n`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 Tips:');
  console.log('   • Make sure both devices are on the same WiFi');
  console.log('   • Check your firewall settings if unable to connect');
  console.log('   • For internet access, use a service like ngrok\n');
}

main();
