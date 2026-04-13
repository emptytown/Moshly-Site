const fs = require('fs');
const path = require('path');

console.log('--- auth-client.js Verification ---');
const authClient = fs.readFileSync('auth-client.js', 'utf8');
const hasCleaningLogic = authClient.includes("redirectUrl.split('?')[0].endsWith('.html')") &&
                         authClient.includes("redirectUrl.replace('.html', '')");
console.log('Has cleanUrl logic:', hasCleaningLogic ? '✅' : '❌');

console.log('\n--- _redirects Verification ---');
const redirects = fs.readFileSync('_redirects', 'utf8');
const htmlStripRule = redirects.includes('/*.html  /:1  301');
console.log('Has /*.html strip rule:', htmlStripRule ? '✅' : '❌');
const keyRoutes = ['/dashboard', '/login', '/signup', '/admin'];
keyRoutes.forEach(route => {
  const hasMap = (redirects.includes(`${route} `) && redirects.includes(`${route}.html`)) || redirects.includes(`${route}\t`);
  console.log(`Route ${route} mapped correctly:`, hasMap ? '✅' : '❌');
});

console.log('\n--- _middleware.js Verification ---');
const middleware = fs.readFileSync('functions/_middleware.js', 'utf8');
const handlesDashboard = middleware.includes("pathname === '/dashboard'") && middleware.includes("return next()");
const handlesAdmin = middleware.includes("pathname === '/admin'") && middleware.includes("return next()");
console.log('Handles /dashboard clean route:', handlesDashboard ? '✅' : '❌');
console.log('Handles /admin clean route:', handlesAdmin ? '✅' : '❌');

console.log('\n--- HTML Extension Usage in Logic ---');
const filesToCheck = ['dashboard-logic.js', 'login.html', 'signup.html', 'admin.html'];
filesToCheck.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /(location\.href|location\.replace|requireSession|requireGod)\s*(?:=|\()\s*['"]\/?[^'"]+\.html/g;
  const matches = content.match(regex);
  if (matches) {
    console.log(`${file}: Found potential .html issues:`, matches);
  } else {
    console.log(`${file}: No .html issues found ✅`);
  }
});
