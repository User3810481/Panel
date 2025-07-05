export let API_URL = 'http://localhost:19222/';
export const DEFAULT_API_HOST = 'localhost';
export const DEFAULT_API_PORT = '19222';

export function setApiUrl(host, port) {
  API_URL = `http://${host}:${port}/`;
  console.log('API URL set to:', API_URL); // For debugging
}