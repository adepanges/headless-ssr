module.exports = {
  apps: [
    {
      name: 'FE-Prerender-Service',
      script: './server.js',
      instances: 1,
      exec_mode: 'cluster',
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};
