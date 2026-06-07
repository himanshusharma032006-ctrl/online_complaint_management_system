const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'client', 'dist');
const dest = path.join(__dirname, 'public');

console.log('📦 Vercel post-build: Copying client/dist to root public/ directory...');

try {
  // Clear any existing public folder
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }

  // Copy build output
  fs.cpSync(src, dest, { recursive: true });
  console.log('✅ Client files successfully copied to root public/ folder!');
} catch (error) {
  console.error('❌ Failed to copy client build to public/ folder:', error.message);
  process.exit(1);
}
