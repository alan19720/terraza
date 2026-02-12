import { PrismaClient } from "@prisma/client/extension";


export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});
