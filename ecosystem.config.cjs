module.exports = {
  apps: [{
    name: "gotrade",
    cwd: "/root/mifx",
    script: "node_modules/vite/bin/vite.js",
    args: "preview --host 127.0.0.1 --port 3007 --strictPort",
    env: {
      NODE_ENV: "production",
      DATABASE_URL: "postgresql://postgres:EDUJUANDA12345@127.0.0.1:5432/MIFX",
      ADMIN_EMAIL: "admin@mixf.com",
      ADMIN_PASSWORD: "password123"
    }
  }]
}
