/**
 * PM2 Ecosystem Configuration for SmartERP Production Server
 * Usage: pm2 start ecosystem.config.cjs
 */

module.exports = {
  apps: [
    {
      name: 'smarterp-production',
      script: 'dist/server.js',
      instances: 'max', // Use all CPU cores or set to 1/2
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
