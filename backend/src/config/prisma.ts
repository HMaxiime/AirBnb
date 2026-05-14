import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Load the database URL once and fail fast if it is missing.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "Missing DATABASE_URL. Add it to your environment (for example in a .env file).",
  );
}

// Create one Prisma client shared across the app.
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// Connect during startup so route handlers only run after the DB is ready.
export async function connectDB() {
  await prisma.$connect();
  console.log("Database Connected successfully");
}

export default prisma;
