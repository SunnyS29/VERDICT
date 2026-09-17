import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser', fullyParallel: true, workers: 2, timeout: 30000,
  use: {baseURL:'http://127.0.0.1:4177/VERDICT/',
    launchOptions:process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}, trace:'retain-on-failure'},
  projects:[{name:'desktop',use:{viewport:{width:1280,height:900}}},{name:'mobile',use:{viewport:{width:390,height:844}}}],
  webServer:{command:'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4177 --strictPort',url:'http://127.0.0.1:4177/VERDICT/',reuseExistingServer:!process.env.CI},
});
