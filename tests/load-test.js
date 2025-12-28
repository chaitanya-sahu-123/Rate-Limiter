const http = require('http');

async function makeRequest(userId) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 7005,
      path: '/ping',
      headers: { 'user-id': `user_${userId}` }
    }, (res) => {
      resolve({ status: res.statusCode });
    });
    
    req.on('error', () => resolve({ status: 500 }));
    req.setTimeout(5000, () => resolve({ status: 408 }));
    req.end();
  });
}

async function loadTest() {
  console.log('🧪 Load Test: 10,000 requests with 100 concurrent users\n');
  
  const startTime = Date.now();
  let successful = 0;
  let rateLimited = 0;
  let errors = 0;
  
  // Create 10,000 requests with 100 different users
  const promises = [];
  for (let i = 0; i < 10000; i++) {
    const userId = i % 100; // 100 different users
    promises.push(
      makeRequest(userId).then(result => {
        if (result.status === 200) successful++;
        else if (result.status === 429) rateLimited++;
        else errors++;
        
        // Progress
        if ((successful + rateLimited + errors) % 1000 === 0) {
          process.stdout.write(`\r📊 Progress: ${successful + rateLimited + errors}/10000`);
        }
      })
    );
    
    // Small delay every 100 requests
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
  
  await Promise.all(promises);
  
  const duration = (Date.now() - startTime) / 1000;
  const rps = (10000 / duration).toFixed(2);
  
  console.log('\n\n📊 LOAD TEST RESULTS');
  console.log('='.repeat(40));
  console.log(`📈 Total: 10,000 requests`);
  console.log(`✅ Successful: ${successful} (${(successful/100).toFixed(1)}%)`);
  console.log(`🚫 Rate Limited: ${rateLimited} (${(rateLimited/100).toFixed(1)}%)`);
  console.log(`❌ Errors: ${errors} (${(errors/100).toFixed(1)}%)`);
  console.log(`⏱️  Duration: ${duration.toFixed(2)}s`);
  console.log(`🔥 Throughput: ${rps} requests/second`);
  
  if (parseFloat(rps) >= 500) {
    console.log('🏆 SUCCESS: 500+ RPS target achieved!');
  }
}

// Start test
console.log('🔍 Checking server...');
makeRequest('health_check').then(result => {
  if (result.status === 200 || result.status === 400) {
    loadTest();
  } else {
    console.log('❌ Server not responding. Start with: npm start');
  }
}).catch(() => {
  console.log('❌ Cannot connect to server. Start with: npm start');
});
