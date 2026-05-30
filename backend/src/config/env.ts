import dotenv from "dotenv";

dotenv.config();

const requireEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT) || 3000,
  mongoUri: requireEnv("MONGO_URI"),
  jwtSecret: process.env.JWT_SECRET ?? "",
};
