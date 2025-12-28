const http = require('http');

async function makeRequest(path, userId = 'demo_user') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 7005,
      path: path,
      headers: { 'user-id': userId }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: JSON.parse(data || '{}')
        });
      });
    });

    req.on('error', () => resolve({ status: 500, error: 'Connection failed' }));
    req.end();
  });
}

async function runDemo() {
  console.log('🎯 Rate Limiter Demo\n');

  // 1. Basic test
  console.log('1. Testing basic endpoint:');
  const basic = await makeRequest('/ping');
  console.log(`   Status: ${basic.status} | Limit: ${basic.headers['x-ratelimit-limit']}`);

  // 2. Test rate limiting
  console.log('\n2. Testing rate limiting (10 requests):');
  for (let i = 1; i <= 10; i++) {
    const result = await makeRequest('/ping', 'rapid_user');
    const status = result.status === 200 ? '✅' : '🚫';
    console.log(`   Request ${i}: ${status} ${result.status}`);
    if (result.status === 429) break;
  }

  // 3. Test different endpoints
  console.log('\n3. Testing different endpoints:');
  const api = await makeRequest('/api/users', 'api_user');
  console.log(`   API: Status ${api.status} | Limit: ${api.headers['x-ratelimit-limit']}`);

  // 4. Check metrics
  console.log('\n4. Current metrics:');
  const metrics = await makeRequest('/metrics');
  if (metrics.data?.data) {
    const m = metrics.data.data;
    console.log(`   Total: ${m.totalRequests} | Blocked: ${m.blockedRequests} | RPS: ${m.requestsPerSecond}`);
  }

  console.log('\n🎉 Demo completed!');
}

// Check server health first
makeRequest('/health').then(result => {
  if (result.status === 200) {
    runDemo();
  } else {
    console.log('❌ Server not running. Start with: npm start');
  }
}).catch(() => {
  console.log('❌ Cannot connect to server. Start with: npm start');
});
