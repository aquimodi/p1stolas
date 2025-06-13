#!/usr/bin/env node

import http from 'http';
import https from 'https';
import os from 'os';

console.log('🔍 Diagnóstico completo de conectividad del sistema...\n');

// Obtener información del sistema
function getSystemInfo() {
  const networkInterfaces = os.networkInterfaces();
  const interfaces = [];
  
  for (const [name, netInterface] of Object.entries(networkInterfaces)) {
    if (netInterface) {
      for (const iface of netInterface) {
        if (iface.family === 'IPv4' && !iface.internal) {
          interfaces.push({
            name,
            address: iface.address,
            netmask: iface.netmask
          });
        }
      }
    }
  }
  
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    interfaces,
    uptime: os.uptime(),
    memory: {
      total: Math.round(os.totalmem() / (1024 * 1024 * 1024) * 100) / 100 + ' GB',
      free: Math.round(os.freemem() / (1024 * 1024 * 1024) * 100) / 100 + ' GB'
    }
  };
}

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
            if (json.server && json.server.ip) {
              console.log(`   Servidor: ${json.server.ip}:${json.server.port}`);
            }
            if (json.cors) {
              console.log(`   CORS: ${json.cors.allowedOrigins || '*'}`);
              console.log(`   Acceso externo: ${json.cors.externalAccess ? 'Habilitado' : 'Deshabilitado'}`);
            }
            resolve({ success: true, data: json });
          } catch (e) {
            console.log(`   Respuesta: ${data.substring(0, 100)}...`);
            resolve({ success: true, data: { text: data.substring(0, 100) } });
          }
        } else {
          console.log(`❌ ${description}: Error ${res.statusCode}`);
          resolve({ success: false, status: res.statusCode });
        }
      });
    });
    
    req.on('error', (error) => {
      console.log(`❌ ${description}: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
    
    req.setTimeout(5000, () => {
      console.log(`⏰ ${description}: Timeout`);
      req.destroy();
      resolve({ success: false, error: 'Timeout' });
    });
  });
}

async function diagnoseConnectivity() {
  console.log('📊 Información del sistema:');
  const sysInfo = getSystemInfo();
  console.log(`   Hostname: ${sysInfo.hostname}`);
  console.log(`   Plataforma: ${sysInfo.platform} ${sysInfo.release}`);
  console.log(`   Interfaces de red:`);
  sysInfo.interfaces.forEach(iface => {
    console.log(`     - ${iface.name}: ${iface.address} (${iface.netmask})`);
  });
  console.log(`   Memoria: ${sysInfo.memory.free} libre de ${sysInfo.memory.total}`);
  console.log(`   Tiempo activo: ${Math.floor(sysInfo.uptime / 3600)} horas ${Math.floor((sysInfo.uptime % 3600) / 60)} minutos\n`);

  // Probar diferentes configuraciones de IP
  const ipConfigurations = [
    { ip: 'localhost', port: 3002 },
    { ip: '127.0.0.1', port: 3002 },
    ...sysInfo.interfaces.map(iface => ({ ip: iface.address, port: 3002 })),
    { ip: '0.0.0.0', port: 3002 }
  ];

  console.log('🔍 Probando conectividad en diferentes configuraciones IP:');
  
  const results = {};
  
  for (const config of ipConfigurations) {
    console.log(`\n📡 Probando ${config.ip}:${config.port}:`);
    
    const healthResult = await makeRequest(
      `http://${config.ip}:${config.port}/api/health`,
      `Health Check (${config.ip})`
    );
    
    const corsResult = await makeRequest(
      `http://${config.ip}:${config.port}/api/test-cors`,
      `CORS Test (${config.ip})`
    );
    
    results[config.ip] = {
      health: healthResult.success,
      cors: corsResult.success,
      details: {
        health: healthResult.data,
        cors: corsResult.data
      }
    };
    
    console.log(`   Resumen para ${config.ip}:${config.port}:`);
    console.log(`   - Health Check: ${healthResult.success ? '✅' : '❌'}`);
    console.log(`   - CORS Test: ${corsResult.success ? '✅' : '❌'}`);
  }

  console.log('\n📊 Resumen de diagnóstico:');
  let anySuccess = false;
  
  for (const [ip, result] of Object.entries(results)) {
    console.log(`   ${ip}: ${result.health && result.cors ? '✅ Funciona correctamente' : '❌ Problemas de conectividad'}`);
    if (result.health && result.cors) {
      anySuccess = true;
    }
  }
  
  if (anySuccess) {
    console.log('\n🎉 ¡El servidor está accesible en al menos una configuración IP!');
    console.log('   Recomendación: Utiliza la IP que funciona correctamente en tu configuración.');
  } else {
    console.log('\n🚨 No se pudo conectar a ninguna configuración IP.');
    console.log('\n💡 Sugerencias:');
    console.log('   - Verifica que el servidor esté en ejecución: npm run dev:backend o pm2 status');
    console.log('   - Comprueba que el puerto 3002 no esté bloqueado por el firewall');
    console.log('   - Revisa la configuración de IP_ADDRESS en el archivo .env');
    console.log('   - Asegúrate de que la variable IP_ADDRESS esté configurada correctamente');
    console.log('   - Prueba con IP_ADDRESS=0.0.0.0 para escuchar en todas las interfaces');
  }
  
  process.exit(anySuccess ? 0 : 1);
}

diagnoseConnectivity();