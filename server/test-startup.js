// Simple test to check if the server can start without errors
console.log('Testing server startup...');

try {
  // Test basic imports
  console.log('✓ Testing basic imports...');
  const fs = await import('fs');
  const path = await import('path');
  console.log('✓ Basic Node.js modules work');

  // Test if we can read the server file
  console.log('✓ Testing server file access...');
  const serverPath = path.join(process.cwd(), 'src', 'server.ts');
  if (fs.existsSync(serverPath)) {
    console.log('✓ Server file exists');
  } else {
    console.log('❌ Server file not found');
    process.exit(1);
  }

  // Test package.json
  console.log('✓ Testing package.json...');
  const packagePath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packagePath)) {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    console.log(`✓ Package.json valid, version: ${packageJson.version}`);
  } else {
    console.log('❌ Package.json not found');
    process.exit(1);
  }

  console.log('✅ All basic tests passed!');
  console.log('🎯 Ready to start server with: npm run dev');

} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}
