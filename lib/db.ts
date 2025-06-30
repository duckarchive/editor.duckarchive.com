import catalog from "@/generated/prisma/catalog-client";
import duckarchive from "@/generated/prisma/duckarchive-client";
import duckkey from "@/generated/prisma/duckkey-client";
import inspector from "@/generated/prisma/inspector-client";

const catalogClientSingleton = () =>
  new catalog.PrismaClient({
    datasources: {
      db: {
        url: process.env.CATALOG_DATABASE_URL,
      },
    },
  });
const duckarchiveClientSingleton = () =>
  new duckarchive.PrismaClient({
    datasources: {
      db: {
        url: process.env.DUCKARCHIVE_DATABASE_URL,
      },
    },
  });

const duckkeyClientSingleton = () =>
  new duckkey.PrismaClient({
    datasources: {
      db: {
        url: process.env.DUCKKEY_DATABASE_URL,
      },
    },
  });

const inspectorClientSingleton = () =>
  new inspector.PrismaClient({
    datasources: {
      db: {
        url: process.env.INSPECTOR_DATABASE_URL,
      },
    },
  });

declare const globalThis: {
  catalogClientGlobal?: ReturnType<typeof catalogClientSingleton>;
  duckarchiveClientGlobal?: ReturnType<typeof duckarchiveClientSingleton>;
  duckkeyClientGlobal?: ReturnType<typeof duckkeyClientSingleton>;
  inspectorClientGlobal?: ReturnType<typeof inspectorClientSingleton>;
} & typeof global;

const catalogPrisma =
  globalThis.catalogClientGlobal ?? catalogClientSingleton();
const duckarchivePrisma =
  globalThis.duckarchiveClientGlobal ?? duckarchiveClientSingleton();
const duckkeyPrisma =
  globalThis.duckkeyClientGlobal ?? duckkeyClientSingleton();
const inspectorPrisma =
  globalThis.inspectorClientGlobal ?? inspectorClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalThis.catalogClientGlobal = catalogPrisma;
  globalThis.duckarchiveClientGlobal = duckarchivePrisma;
  globalThis.duckkeyClientGlobal = duckkeyPrisma;
  globalThis.inspectorClientGlobal = inspectorPrisma;
}

export { catalogPrisma, duckarchivePrisma, duckkeyPrisma, inspectorPrisma };
