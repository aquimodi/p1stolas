#!/usr/bin/env node

import http from 'http';
import https from 'https';

console.log('🔍 Verificando conectividad Frontend-Backend desde D:/inetpub/pistolas...\n');

// Función para hacer peticiones HTTP
function makeRequest(url, description) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const module = urlObj.protocol === 'https:' ? https : http;
    
    console.log(`⏳ ${description}: ${url}`);
    
    const req = module.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: OK (${res.statusCode})`);
          try {
            const json = JSON.parse(data);
            console.log(`   Respuesta: ${json.message || json.status || 'OK'}`);
          } catch (e) {
            console.log(`   Respuesta: ${data.substring(0, 100)}...`);
          }
        } else {
          console.log(`❌ ${description}: Error ${res.statusCode}`);
        }
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description}: ${error.message}`);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve(false);
    });
  });
}

async function checkConnectivity() {
  console.log('📍 Directorio actual:', process.cwd());
  console.log('📂 Verificando ubicación: D:/inetpub/pistolas\n');

  const tests = [
    {
      url: 'http://localhost:3002/api/health',
      description: 'Backend API Health Check'
    },
    {
      url: 'http://localhost:3002/api',
      description: 'Backend API Root'
    },
    {
      url: 'http://localhost:3002',
      description: 'Frontend servido por Express'
    },
    {
      url: 'http://localhost:3002/api/diagnostics/full',
      description: 'Diagnósticos completos'
    }
  ];

  const results = [];
  
  for (const test of tests) {
    const result = await makeRequest(test.url, test.description);
    results.push(result);
    console.log(''); // Línea en blanco
  }

  console.log('📊 Resumen de conectividad:');
  console.log(`   API Health Check: ${results[0] ? '✅' : '❌'}`);
  console.log(`   API Root: ${results[1] ? '✅' : '❌'}`);
  console.log(`   Frontend: ${results[2] ? '✅' : '❌'}`);
  console.log(`   Diagnósticos: ${results[3] ? '✅' : '❌'}`);
  
  if (results.every(r => r)) {
    console.log('\n🎉 ¡Todas las conexiones funcionan correctamente en D:/inetpub/pistolas!');
  } else {
    console.log('\n🚨 Hay problemas de conectividad. Revisar configuración.');
    
    if (!results[0] && !results[1]) {
      console.log('\n💡 Sugerencias:');
      console.log('   - Verificar que el backend esté ejecutándose: npm run dev:backend');
      console.log('   - Revisar los logs del servidor: pm2 logs datacenter-api');
      console.log('   - Comprobar que el puerto 3002 no esté ocupado: netstat -an | findstr ":3002"');
      console.log('   - Verificar ubicación del proyecto: D:/inetpub/pistolas');
    } else if (!results[2]) {
      console.log('\n💡 Sugerencias para Frontend:');
      console.log('   - Verificar que npm run build se ejecutó correctamente');
      console.log('   - Comprobar que existe la carpeta dist: dir D:\\inetpub\\pistolas\\dist');
      console.log('   - Reiniciar el servidor: pm2 restart datacenter-api');
    }
  }
  
  process.exit(results.every(r => r) ? 0 : 1);
}

checkConnectivity();