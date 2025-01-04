// // test/config/setup.ts
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

const prisma = new PrismaClient();

global.beforeAll(async () => {
  try {
    // Reset database
    execSync('npx prisma migrate reset --force');
    
    // Run migrations
    execSync('npx prisma migrate deploy');
    
    // Generate Prisma Client
    execSync('npx prisma generate');
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
});

global.afterAll(async () => {
  await prisma.$disconnect();
});

// import { execSync } from 'child_process';
// import { PrismaClient } from '@prisma/client';
// import * as dotenv from 'dotenv';
// import path from 'path';

// dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// const prisma = new PrismaClient();

// global.beforeAll(async () => {
//   try {
//     execSync('npx prisma migrate reset --force');
//     execSync('npx prisma migrate deploy');
//     execSync('npx prisma generate');
//   } catch (error) {
//     console.error('Error setting up test database:', error);
//     throw error;
//   }
// });

// global.afterAll(async () => {
//   await prisma.$disconnect();
// });