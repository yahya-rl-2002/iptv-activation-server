/**
 * ACTIVATION SERVER
 * Simple API server to manage device activations
 * This bridges the gap between the web activation page and the Electron app
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Use Railway's PORT environment variable, fallback to 3333 for local development
const PORT = process.env.PORT || 3333;
const ACTIVATIONS_FILE = path.join(__dirname, 'activations.json');

// Load existing activations or create empty array
let activations = [];
if (fs.existsSync(ACTIVATIONS_FILE)) {
    try {
        const data = fs.readFileSync(ACTIVATIONS_FILE, 'utf8');
        activations = JSON.parse(data);
        console.log(`📂 Loaded ${activations.length} existing activations`);
    } catch (error) {
        console.error('❌ Error loading activations:', error);
        activations = [];
    }
}

// Save activations to file
function saveActivations() {
    try {
        fs.writeFileSync(ACTIVATIONS_FILE, JSON.stringify(activations, null, 2));
        console.log(`💾 Saved ${activations.length} activations to disk`);
        return true;
    } catch (error) {
        console.error('❌ Error saving activations:', error);
        return false;
    }
}

// CORS headers for cross-origin requests
function setCORSHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Create HTTP server
const server = http.createServer((req, res) => {
    setCORSHeaders(res);

    // Handle OPTIONS request (CORS preflight)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parse URL and method
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    console.log(`📥 ${req.method} ${pathname}`);

    // ROUTE: POST /activate - Activate a device
    if (pathname === '/activate' && req.method === 'POST') {
        let body = '';
        
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { macAddress, deviceKey } = JSON.parse(body);

                if (!macAddress || !deviceKey) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'MAC Address and Device Key are required' 
                    }));
                    return;
                }

                // Check if already activated
                const existing = activations.find(
                    a => a.macAddress === macAddress && a.deviceKey === deviceKey
                );

                if (existing) {
                    console.log(`✅ Device already activated: ${macAddress} - ${deviceKey}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Device already activated',
                        activationDate: existing.activationDate
                    }));
                    return;
                }

                // Add new activation
                const newActivation = {
                    macAddress,
                    deviceKey,
                    activationDate: new Date().toISOString(),
                    licenseType: 'lifetime'
                };

                activations.push(newActivation);
                
                if (saveActivations()) {
                    console.log(`✅ New device activated: ${macAddress} - ${deviceKey}`);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        message: 'Device activated successfully',
                        activationDate: newActivation.activationDate
                    }));
                } else {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: false, 
                        error: 'Failed to save activation' 
                    }));
                }

            } catch (error) {
                console.error('❌ Error processing activation:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: 'Invalid request data' 
                }));
            }
        });
    }
    
    // ROUTE: GET /verify?macAddress=xxx&deviceKey=xxx - Verify activation
    else if (pathname === '/verify' && req.method === 'GET') {
        const macAddress = url.searchParams.get('macAddress');
        const deviceKey = url.searchParams.get('deviceKey');

        if (!macAddress || !deviceKey) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: 'MAC Address and Device Key are required' 
            }));
            return;
        }

        const activation = activations.find(
            a => a.macAddress === macAddress && a.deviceKey === deviceKey
        );

        if (activation) {
            console.log(`✅ Activation verified: ${macAddress} - ${deviceKey}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true,
                activated: true,
                activationDate: activation.activationDate,
                licenseType: activation.licenseType
            }));
        } else {
            console.log(`❌ Activation not found: ${macAddress} - ${deviceKey}`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: true,
                activated: false
            }));
        }
    }
    
    // ROUTE: GET /activations - List all activations (for admin/debug)
    else if (pathname === '/activations' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: true,
            count: activations.length,
            activations: activations
        }));
    }
    
    // Unknown route
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            success: false, 
            error: 'Route not found' 
        }));
    }
});

// Get local IP address for network access
function getLocalIP() {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal (loopback) and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const LOCAL_IP = getLocalIP();

// Start server - Listen on all interfaces (0.0.0.0) to allow network access
server.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('🚀 ================================');
    console.log('🔐 ACTIVATION SERVER STARTED');
    console.log('🚀 ================================');
    console.log(`📡 Server running on:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://${LOCAL_IP}:${PORT}`);
    console.log(`📂 Activations file: ${ACTIVATIONS_FILE}`);
    console.log(`✅ Current activations: ${activations.length}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  POST   http://${LOCAL_IP}:${PORT}/activate`);
    console.log(`  GET    http://${LOCAL_IP}:${PORT}/verify?macAddress=xxx&deviceKey=xxx`);
    console.log(`  GET    http://${LOCAL_IP}:${PORT}/activations`);
    console.log('');
    console.log('🌐 To access from other devices on your network:');
    console.log(`   Use: http://${LOCAL_IP}:${PORT}`);
    console.log('');
    console.log('Press Ctrl+C to stop the server');
    console.log('================================');
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please close the other server first.`);
    } else {
        console.error('❌ Server error:', error);
    }
    process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Shutting down activation server...');
    saveActivations();
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});








