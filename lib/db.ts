import { PrismaClient as DuckarchiveClient } from "@generated/prisma/duckarchive/client/client";
import { PrismaClient as DuckkeyClient } from "@generated/prisma/duckkey/client/client";
import { PrismaClient as InspectorClient } from "@generated/prisma/inspector/client/client";
import { PrismaPg } from "@prisma/adapter-pg";

const duckarchiveClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DUCKARCHIVE_DATABASE_URL,
  });
  return new DuckarchiveClient({ adapter });
};

const duckkeyClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DUCKKEY_DATABASE_URL,
  });
  return new DuckkeyClient({ adapter });
};

const inspectorClientSingleton = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.INSPECTOR_DATABASE_URL,
  });
  return new InspectorClient({ adapter });
};

declare const globalThis: {
  duckarchiveClientGlobal?: ReturnType<typeof duckarchiveClientSingleton>;
  duckkeyClientGlobal?: ReturnType<typeof duckkeyClientSingleton>;
  inspectorClientGlobal?: ReturnType<typeof inspectorClientSingleton>;
} & typeof global;

const duckarchivePrisma =
  globalThis.duckarchiveClientGlobal ?? duckarchiveClientSingleton();
const duckkeyPrisma =
  globalThis.duckkeyClientGlobal ?? duckkeyClientSingleton();
const inspectorPrisma =
  globalThis.inspectorClientGlobal ?? inspectorClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.duckarchiveClientGlobal = duckarchivePrisma;
  globalThis.duckkeyClientGlobal = duckkeyPrisma;
  globalThis.inspectorClientGlobal = inspectorPrisma;
}

export { duckarchivePrisma, duckkeyPrisma, inspectorPrisma };
