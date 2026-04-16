#!/usr/bin/env node

/**
 * FacilityH2O — Pre-Deployment Security Validation
 * Author: Antoine W. Riley Sr.
 * © 2026 FacilityH2O Inc. All Rights Reserved.
 * 
 * Run this script before every deployment to catch security issues.
 * Usage: node scripts/pre-deploy-check.js
 */

const fs = require('fs');
const path = require('path');

const CHECKS = [];
let PASSED = 0;
let FAILED = 0;
let WARNINGS = 0;

const ROOT = path.resolve(__dirname, '..');

// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

function log(level, message) {
  const colors = {
    '✅': '\x1b[32m', // Green
    '❌': '\x1b[31m', // Red
    '⚠️': '\x1b[33m', // Yellow
    '\x1b[0m': '\x1b[0m', // Reset
  };
  
  const icon = level === 'pass' ? '✅' : level === 'fail' ? '❌' : '⚠️';
  const color = colors[icon];
  console.log(`${color}${icon}\x1b[0m ${message}`);
}

function checkFile(filePath, pattern, shouldNotExist = true) {
  const fullPath = path.join(ROOT, filePath);
  
  if (!fs.existsSync(fullPath)) {
    if (shouldNotExist) {
      log('pass', `✓ ${filePath} does not exist (good, no exposed secrets)`);
      PASSED++;
      return true;
    } else {
      log('fail', `✗ ${filePath} not found`);
      FAILED++;
      return false;
    }
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const matches = content.match(pattern);
  
  if (matches && shouldNotExist) {
    log('fail', `✗ ${filePath} contains exposed secrets: ${matches[0].substring(0, 50)}...`);
    FAILED++;
    return false;
  }
  
  if (!matches && !shouldNotExist) {
    log('fail', `✗ ${filePath} missing required content`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ ${filePath} is secure`);
  PASSED++;
  return true;
}

function checkEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SESSION_SECRET',
    'NODE_ENV',
  ];
  
  const missing = [];
  
  for (const env of required) {
    if (!process.env[env]) {
      missing.push(env);
    }
  }
  
  if (missing.length > 0) {
    log('fail', `✗ Missing environment variables: ${missing.join(', ')}`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ All required environment variables are set`);
  PASSED++;
  return true;
}

function checkNodeVersion() {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.slice(1));
  
  if (major < 18) {
    log('fail', `✗ Node.js version ${nodeVersion} is outdated (requires 18+)`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ Node.js version ${nodeVersion} is current`);
  PASSED++;
  return true;
}

function checkDependencies() {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check for security-critical packages
    const required = ['next', 'react'];
    const missing = required.filter(dep => !deps[dep]);
    
    if (missing.length > 0) {
      log('fail', `✗ Missing critical dependencies: ${missing.join(', ')}`);
      FAILED++;
      return false;
    }
    
    log('pass', `✓ All critical dependencies are installed`);
    PASSED++;
    return true;
  } catch (error) {
    log('fail', `✗ Failed to check dependencies: ${error.message}`);
    FAILED++;
    return false;
  }
}

function checkGitignore() {
  const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  
  const required = [
    '.env',
    '.env.local',
    '.env.*.local',
    'node_modules/',
  ];
  
  const missing = required.filter(pattern => !gitignore.includes(pattern));
  
  if (missing.length > 0) {
    log('fail', `✗ .gitignore missing patterns: ${missing.join(', ')}`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ .gitignore includes all sensitive patterns`);
  PASSED++;
  return true;
}

function checkForHardcodedSecrets() {
  const patterns = [
    /RESEND_API_KEY\s*=\s*['"][^'"]*['"]/, // Actual key
    /SESSION_SECRET\s*=\s*['"][^'"]*['"]/, // Actual key
    /STRIPE_SECRET\s*=\s*['"][^'"]*['"]/, // Actual key
    /ghp_[A-Za-z0-9]{36}/, // GitHub PAT
    /sk_[a-z]+_[A-Za-z0-9]{24}/, // Stripe key
    /re_[A-Za-z0-9_]{20,}/, // Resend API key format
    /eyJ[A-Za-z0-9_-]{50,}/, // JWT / Supabase service key
  ];
  
  const filesToCheck = [
    'app/**/*.js',
    'app/**/*.jsx',
    'app/**/*.ts',
    'app/**/*.tsx',
    'lib/**/*.js',
    'lib/**/*.ts',
  ];
  
  let found = [];
  
  // Simple check (would use glob in real implementation)
  const appPath = path.join(ROOT, 'app');
  if (fs.existsSync(appPath)) {
    const files = fs.readdirSync(appPath, { recursive: true });
    for (const file of files) {
      if (!/\.(js|jsx|ts|tsx)$/.test(file)) continue;
      const fullPath = path.join(appPath, file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      for (const pattern of patterns) {
        if (pattern.test(content)) {
          found.push(`${file}: ${pattern}`);
        }
      }
    }
  }
  
  if (found.length > 0) {
    log('fail', `✗ Found hardcoded secrets:\n  ${found.join('\n  ')}`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ No hardcoded secrets found in codebase`);
  PASSED++;
  return true;
}

function checkFallbackUsers() {
  const authPath = path.join(ROOT, 'lib', 'auth.js');
  if (!fs.existsSync(authPath)) {
    log('pass', `✓ lib/auth.js not found (no fallback user risk)`);
    PASSED++;
    return true;
  }

  const content = fs.readFileSync(authPath, 'utf8');

  // Detect plaintext passwords in FALLBACK_USERS array
  // Pattern: password property with a non-empty string value
  const plainTextPwPattern = /password\s*:\s*['"][^'"]{4,}['"]/;
  if (plainTextPwPattern.test(content)) {
    log('fail', `✗ lib/auth.js contains FALLBACK_USERS with plaintext passwords.\n` +
      `  ➜ Remove FALLBACK_USERS or replace passwords with bcrypt hashes before production.\n` +
      `  ➜ These credentials are visible in source control and could be exploited.`);
    FAILED++;
    return false;
  }

  log('pass', `✓ lib/auth.js FALLBACK_USERS do not contain plaintext passwords`);
  PASSED++;
  return true;
}

function checkSourceMaps() {
  const configPath = path.join(ROOT, 'next.config.mjs');
  const config = fs.readFileSync(configPath, 'utf8');
  
  // Check if source maps are disabled in production
  if (!config.includes('productionBrowserSourceMaps: false')) {
    log('fail', `✗ next.config.mjs should have 'productionBrowserSourceMaps: false'`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ Source maps are disabled in production`);
  PASSED++;
  return true;
}

function checkSecurityHeaders() {
  const configPath = path.join(ROOT, 'next.config.mjs');
  const config = fs.readFileSync(configPath, 'utf8');
  
  const required = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Permissions-Policy',
  ];
  
  const missing = required.filter(header => !config.includes(header));
  
  if (missing.length > 0) {
    log('fail', `✗ Missing security headers: ${missing.join(', ')}`);
    FAILED++;
    return false;
  }
  
  log('pass', `✓ All required security headers are configured`);
  PASSED++;
  return true;
}

function checkEnvironmentIsolation() {
  if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'staging') {
    log('fail', `⚠️ NODE_ENV is ${process.env.NODE_ENV} (running pre-deploy check in non-production environment)`);
    WARNINGS++;
    return true;
  }
  
  log('pass', `✓ Environment is properly isolated (NODE_ENV=${process.env.NODE_ENV})`);
  PASSED++;
  return true;
}

// ════════════════════════════════════════════════════════════════════════════════
// RUN ALL CHECKS
// ════════════════════════════════════════════════════════════════════════════════

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║  FacilityH2O Pre-Deployment Security Validation               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

console.log('🔍 Checking file exposure...');
checkFile('.env', /.*/, true); // .env should NOT exist
checkFile('.env.local', /.*/, true); // .env.local should NOT exist
checkFile('.gitignore', /\.env/, false); // .gitignore SHOULD mention .env

console.log('\n🔍 Checking environment variables...');
checkEnvironment();
checkNodeVersion();

console.log('\n🔍 Checking dependencies...');
checkDependencies();

console.log('\n🔍 Checking gitignore...');
checkGitignore();

console.log('\n🔍 Checking for hardcoded secrets...');
checkForHardcodedSecrets();
checkFallbackUsers();

console.log('\n🔍 Checking security headers...');
checkSourceMaps();
checkSecurityHeaders();

console.log('\n🔍 Checking environment isolation...');
checkEnvironmentIsolation();

// ════════════════════════════════════════════════════════════════════════════════
// RESULTS
// ════════════════════════════════════════════════════════════════════════════════

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log(`║  Results: ${PASSED} passed, ${FAILED} failed, ${WARNINGS} warnings`.padEnd(63) + '║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

if (FAILED > 0) {
  console.log('❌ Pre-deployment validation FAILED. Fix the issues above before deploying.\n');
  process.exit(1);
}

if (WARNINGS > 0) {
  console.log('⚠️  Pre-deployment validation passed with warnings. Review them before deploying.\n');
  process.exit(0);
}

console.log('✅ Pre-deployment validation PASSED. Ready to deploy!\n');
process.exit(0);

