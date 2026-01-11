/**
 * Security Test Suite
 * 
 * Run these tests to verify security hardening
 * Usage: node security-tests.js
 */

const XSS_PAYLOADS = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  'javascript:alert("XSS")',
  '<svg onload=alert("XSS")>',
  '<iframe src="javascript:alert(\'XSS\')">',
  '"><script>alert(String.fromCharCode(88,83,83))</script>',
  '<body onload=alert("XSS")>',
  '<input onfocus=alert("XSS") autofocus>',
  '<select onfocus=alert("XSS") autofocus>',
  '<textarea onfocus=alert("XSS") autofocus>',
  '<keygen onfocus=alert("XSS") autofocus>',
  '<video><source onerror="alert(\'XSS\')">',
  '<audio src=x onerror=alert("XSS")>',
  '<details open ontoggle=alert("XSS")>',
  '<marquee onstart=alert("XSS")>',
];

const INJECTION_PAYLOADS = [
  "'; DROP TABLE users--",
  "1' OR '1'='1",
  "admin'--",
  "' OR 1=1--",
  "<script>document.location='http://evil.com'</script>",
  "../../../etc/passwd",
  "..\\..\\..\\windows\\system32\\config\\sam",
  "%00",
  "\x00",
  "javascript:void(0)",
  "data:text/html,<script>alert('XSS')</script>",
];

const LONG_STRINGS = [
  'A'.repeat(1000),
  'A'.repeat(10000),
  'A'.repeat(100000),
];

const UNICODE_ATTACKS = [
  '𝕳𝖊𝖑𝖑𝖔',
  '😈💀👻',
  '\u202e\u202d',
  '﷽',
  'Ṫḧïṡ ïṡ ẗëṡẗ',
];

const EDGE_CASES = [
  '',
  ' ',
  '  ',
  '\n',
  '\r\n',
  '\t',
  '\0',
  null,
  undefined,
  'null',
  'undefined',
  'NaN',
  'Infinity',
];

async function testEndpoint(url, method, body) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();

    return {
      status: response.status,
      data,
      success: true,
    };
  } catch (error) {
    return {
      status: 0,
      error: error.message,
      success: false,
    };
  }
}

async function runSecurityTests() {
  console.log('🔒 SECURITY TEST SUITE\n');

  const baseUrl = process.env.TEST_URL || 'http://localhost:3000';
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  // Test 1: XSS Protection - Name Input
  console.log('📝 Testing XSS Protection on Name Input...');
  for (const payload of XSS_PAYLOADS) {
    const result = await testEndpoint(`${baseUrl}/api/players`, 'POST', {
      userId: 'test-user',
      name: payload,
    });

    const testResult = {
      name: `XSS: ${payload.substring(0, 50)}...`,
      passed: result.status === 400 || (result.data && !result.data.ok),
    };

    results.tests.push(testResult);
    if (testResult.passed) results.passed++;
    else results.failed++;
  }

  // Test 2: SQL Injection Protection
  console.log('💉 Testing Injection Protection...');
  for (const payload of INJECTION_PAYLOADS) {
    const result = await testEndpoint(`${baseUrl}/api/players`, 'POST', {
      userId: payload,
      name: 'Test User',
    });

    const testResult = {
      name: `Injection: ${payload.substring(0, 50)}...`,
      passed: result.status === 400 || result.status === 500,
    };

    results.tests.push(testResult);
    if (testResult.passed) results.passed++;
    else results.failed++;
  }

  // Test 3: Long String Protection
  console.log('📏 Testing Long String Protection...');
  for (const payload of LONG_STRINGS) {
    const result = await testEndpoint(`${baseUrl}/api/players`, 'POST', {
      userId: 'test-user',
      name: payload,
    });

    const testResult = {
      name: `Long string: ${payload.length} chars`,
      passed: result.status === 400 || result.status === 413,
    };

    results.tests.push(testResult);
    if (testResult.passed) results.passed++;
    else results.failed++;
  }

  // Test 4: Unicode Attack Protection
  console.log('🌐 Testing Unicode Attack Protection...');
  for (const payload of UNICODE_ATTACKS) {
    const result = await testEndpoint(`${baseUrl}/api/players`, 'POST', {
      userId: 'test-user',
      name: payload,
    });

    const testResult = {
      name: `Unicode: ${payload}`,
      passed: result.status === 200 || result.status === 400,
    };

    results.tests.push(testResult);
    if (testResult.passed) results.passed++;
    else results.failed++;
  }

  // Test 5: Rate Limiting
  console.log('🚦 Testing Rate Limiting...');
  const rateLimitRequests = [];
  for (let i = 0; i < 25; i++) {
    rateLimitRequests.push(
      testEndpoint(`${baseUrl}/api/word-validation`, 'POST', {
        word: 'test',
      })
    );
  }

  const rateLimitResults = await Promise.all(rateLimitRequests);
  const rateLimited = rateLimitResults.some(r => r.status === 429);

  const rateLimitTest = {
    name: 'Rate limiting enforced',
    passed: rateLimited,
  };

  results.tests.push(rateLimitTest);
  if (rateLimitTest.passed) results.passed++;
  else results.failed++;

  // Test 6: Admin Brute Force Protection
  console.log('🔐 Testing Admin Brute Force Protection...');
  const bruteForceRequests = [];
  for (let i = 0; i < 6; i++) {
    bruteForceRequests.push(
      testEndpoint(`${baseUrl}/api/admin/login`, 'POST', {
        username: 'admin',
        password: 'wrong-password',
      })
    );
  }

  const bruteForceResults = await Promise.all(bruteForceRequests);
  const blocked = bruteForceResults.some(r => r.status === 429);

  const bruteForceTest = {
    name: 'Admin brute force protection',
    passed: blocked,
  };

  results.tests.push(bruteForceTest);
  if (bruteForceTest.passed) results.passed++;
  else results.failed++;

  // Test 7: Security Headers
  console.log('🛡️  Testing Security Headers...');
  const headersResponse = await fetch(baseUrl);
  const headers = headersResponse.headers;

  const requiredHeaders = {
    'x-frame-options': 'DENY',
    'x-content-type-options': 'nosniff',
    'x-xss-protection': '1; mode=block',
    'content-security-policy': true,
  };

  for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
    const value = headers.get(header);
    const passed = expectedValue === true ? !!value : value === expectedValue;

    const headerTest = {
      name: `Header: ${header}`,
      passed,
    };

    results.tests.push(headerTest);
    if (headerTest.passed) results.passed++;
    else results.failed++;
  }

  // Summary
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  // Show failed tests
  if (results.failed > 0) {
    console.log('❌ Failed Tests:');
    results.tests
      .filter(t => !t.passed)
      .forEach(t => {
        console.log(`   - ${t.name}`);
      });
  }

  return results;
}

// Run tests if executed directly
if (typeof window === 'undefined' && require.main === module) {
  runSecurityTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

export { runSecurityTests, XSS_PAYLOADS, INJECTION_PAYLOADS };
