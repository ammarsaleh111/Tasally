/**
 * Environment Variable Validation
 * 
 * Ensures all required environment variables are set properly
 * for production deployments
 */

const REQUIRED_ENV_VARS = {
  production: [
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
    'ADMIN_SECRET',
  ],
  development: [],
};

const OPTIONAL_ENV_VARS = [
  'WORDNIK_API_KEY', // Word validation
];

/**
 * Validate environment variables based on NODE_ENV
 */
export function validateEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = REQUIRED_ENV_VARS[env] || [];
  const missing = [];
  const warnings = [];

  // Check required variables
  for (const varName of required) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Check optional variables
  for (const varName of OPTIONAL_ENV_VARS) {
    if (!process.env[varName]) {
      warnings.push(varName);
    }
  }

  // Validate admin credentials strength (production only)
  if (env === 'production') {
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_USERNAME === 'admin') {
      warnings.push('ADMIN_USERNAME is set to default value - change for production!');
    }

    if (process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length < 12) {
      warnings.push('ADMIN_PASSWORD is too short - use at least 12 characters!');
    }

    if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length < 32) {
      warnings.push('ADMIN_SECRET is too short - use at least 32 characters!');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Log environment validation results
 */
export function logEnvironmentStatus() {
  const result = validateEnvironment();
  const env = process.env.NODE_ENV || 'development';

  console.log(`\n🔒 Security Configuration Check (${env}):`);

  if (result.valid) {
    console.log('✅ All required environment variables are set');
  } else {
    console.error('❌ Missing required environment variables:');
    result.missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    result.warnings.forEach(warning => {
      console.warn(`   - ${warning}`);
    });
  }

  console.log('');

  return result;
}

/**
 * Get safe environment info (never expose secrets)
 */
export function getSafeEnvironmentInfo() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    hasAdminUsername: !!process.env.ADMIN_USERNAME,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD,
    hasAdminSecret: !!process.env.ADMIN_SECRET,
    hasWordnikKey: !!process.env.WORDNIK_API_KEY,
  };
}
