import { readFileSync } from 'fs';
const env = readFileSync('.env', 'utf8');
console.log(env);
