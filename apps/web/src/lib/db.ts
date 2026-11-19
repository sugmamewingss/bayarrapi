import { PrismaClient } from "@prisma/client";

// Satu instance PrismaClient untuk seluruh aplikasi.
// Saat development, Next.js memuat ulang modul berkali-kali; instance disimpan
// di globalThis supaya koneksi ke basis data tidak terus bertambah.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
