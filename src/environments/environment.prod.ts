import packageInfo from 'package.json';

export const environment = {
  production: true,
  baseUrl: 'https://localhost:5001',
  version: packageInfo.version
};
