// PM2 apps use default pm2 logs (~/.pm2/logs) so rebuilds can't break spawning.
module.exports = {
  apps: [
    {
      name: 'biztrack-backend',
      script: 'start.sh',
      interpreter: 'bash',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
        PATH: `${process.env.HOME}/.local/bin:${process.env.PATH}`,
      },
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '1G',
      kill_timeout: 10000,
    },
    {
      name: 'biztrack-frontend',
      script: 'server.js',
      cwd: './frontend/.next/standalone',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      time: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
