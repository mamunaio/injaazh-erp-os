import { generate2FATempToken, verify2FATempToken } from './lib/auth.ts';

async function test() {
  try {
    console.log('Generating token...');
    const token = await generate2FATempToken('12345');
    console.log('Token generated:', token);
    
    console.log('Verifying token...');
    const userId = await verify2FATempToken(token);
    console.log('Verified userId:', userId);
  } catch (err) {
    console.error('Test error:', err);
  }
}

test();
