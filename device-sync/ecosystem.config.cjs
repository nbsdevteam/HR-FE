/**
 * PM2 Ecosystem Configuration
 * ────────────────────────────
 * Run the HR Device Sync Service as a permanent background daemon.
 *
 * Setup (one-time):
 *   npm install -g pm2
 *   cd device-sync
 *   pm2 start ecosystem.config.cjs
 *   pm2 save
 *   pm2 startup        ← makes it auto-start on boot
 *
 * Commands:
 *   pm2 status          — see running services
 *   pm2 logs hr-sync    — view live logs
 *   pm2 restart hr-sync — restart the service
 *   pm2 stop hr-sync    — stop the service
 *   pm2 monit           — real-time dashboard
 */

module.exports = {
  apps: [
    {
      name: "hr-sync",
      script: "sync-service.mjs",
      cwd: __dirname,

      // Auto-restart on crash
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 5000,

      // Watch for config changes (auto-restart on .env change)
      watch: [".env"],
      watch_delay: 2000,
      ignore_watch: ["node_modules", "logs", "*.log"],

      // Memory limit — restart if exceeds 300MB
      max_memory_restart: "300M",

      // Logging
      error_file: "./logs/hr-sync-error.log",
      out_file: "./logs/hr-sync-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,

      // Environment
      env: {
        NODE_ENV: "production",
      },

      // Cron-based restart at 3 AM daily (fresh start)
      cron_restart: "0 3 * * *",
    },
  ],
};
