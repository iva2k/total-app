import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.iva2k.totalapp',
  appName: 'total-app',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
