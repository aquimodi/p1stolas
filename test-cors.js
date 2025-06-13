#!/usr/bin/env node

import http from 'http';

console.log('🧪 Probando configuración de CORS...\n');

// Test CORS with different origins
const testOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://localhost:5173',
  null // No origin
];

async function testCorsWithOrigin(origin) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/test-cors',
      method: 'GET',
      headers: {}
    };

    if (origin) {
      options.headers['Origin'] = origin;
    }

    console.log(`⏳ Testing${origin ? ` with origin: ${origin}` : ' without origin'}...`);

    const req = http.request(options, (res) => {
      let data = '';
      
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   CORS Headers:`);
      console.log(`     Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'not set'}`);
      console.log(`     Access-Control-Allow-Credentials: ${res.headers['access-control-allow-credentials'] || 'not set'}`);
      console.log(`     Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'not set'}`);
      
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ Success`);
          try {
            const json = JSON.parse(data);
            console.log(`   Response: ${json.message}`);
          } catch (e) {
            console.log(`   Response: OK`);
          }
        } else {
          console.log(`❌ Failed with status ${res.statusCode}`);
        }
        console.log('');
        resolve(res.statusCode === 200);
      });
    });

    req.on('error', (error) => {
      console.log(`❌ Error: ${error.message}`);
      console.log('');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      console.log(`⏰ Timeout`);
      console.log('');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testPreflightRequest() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/test-cors',
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type,Authorization'
      }
    };

    console.log(`⏳ Testing preflight request (OPTIONS)...`);

    const req = http.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log(`   CORS Headers:`);
      console.log(`     Access-Control-Allow-Origin: ${res.headers['access-control-allow-origin'] || 'not set'}`);
      console.log(`     Access-Control-Allow-Methods: ${res.headers['access-control-allow-methods'] || 'not set'}`);
      console.log(`     Access-Control-Allow-Headers: ${res.headers['access-control-allow-headers'] || 'not set'}`);
      console.log(`     Access-Control-Max-Age: ${res.headers['access-control-max-age'] || 'not set'}`);
      
      if (res.statusCode === 200) {
        console.log(`✅ Preflight Success`);
      } else {
        console.log(`❌ Preflight Failed with status ${res.statusCode}`);
      }
      console.log('');
      resolve(res.statusCode === 200);
    });

    req.on('error', (error) => {
      console.log(`❌ Preflight Error: ${error.message}`);
      console.log('');
      resolve(false);
    });

    req.end();
  });
}

async function runTests() {
  const results = [];
  
  // Test with different origins
  for (const origin of testOrigins) {
    const result = await testCorsWithOrigin(origin);
    results.push(result);
  }
  
  // Test preflight request
  const preflightResult = await testPreflightRequest();
  results.push(preflightResult);

  console.log('📊 Resumen de pruebas CORS:');
  console.log(`   Con origin localhost:5173: ${results[0] ? '✅' : '❌'}`);
  console.log(`   Con origin 127.0.0.1:5173: ${results[1] ? '✅' : '❌'}`);
  console.log(`   Con origin https:5173: ${results[2] ? '✅' : '❌'}`);
  console.log(`   Sin origin: ${results[3] ? '✅' : '❌'}`);
  console.log(`   Preflight (OPTIONS): ${results[4] ? '✅' : '❌'}`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 ¡Todas las pruebas CORS pasaron correctamente!');
  } else {
    console.log('\n🚨 Algunas pruebas CORS fallaron. Revisar configuración.');
  }
  
  process.exit(results.every(r => r) ? 0 : 1);
}

runTests();