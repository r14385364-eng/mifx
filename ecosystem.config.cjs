module.exports = {
  apps: [
    {
      name: "gotrade",
      script: "node_modules/vite/bin/vite.js",
      args: "preview --host 0.0.0.0 --port 3000 --strictPort",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
