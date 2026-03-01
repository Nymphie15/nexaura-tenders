module.exports = {
  apps: [{
    name: 'appel-offre-web',
    script: '.next/standalone/server.js',
    env: {
      PORT: 3001,
      NODE_ENV: 'production',
      HOSTNAME: '0.0.0.0'
    },
    instances: 1,
    autorestart: true,
    max_memory_restart: '512M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
