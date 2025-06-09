import AdminJS, { AdminJSOptions } from "adminjs";
import AdminJSExpress from "@adminjs/express";
import { Database, Resource, getModelByName } from "@adminjs/prisma";
import express from "express";
import { PrismaClient } from "@prisma/client";

const PORT = 3000;
const prisma = new PrismaClient();

AdminJS.registerAdapter({ Database, Resource });

const start = async () => {
  const app = express();
  const adminOptions: AdminJSOptions = {
    rootPath: '/admin',
    resources: [
      {
        resource: { model: getModelByName("Person"), client: prisma },
        options: {},
      },
      {
        resource: { model: getModelByName("Resource"), client: prisma },
        options: {},
      },
      {
        resource: { model: getModelByName("User"), client: prisma },
        options: {},
      },
    ],
  };

  const admin = new AdminJS(adminOptions);

  const adminRouter = AdminJSExpress.buildRouter(admin);
  app.use(admin.options.rootPath, adminRouter);

  app.listen(PORT, () => {
    console.log(
      `AdminJS started on http://localhost:${PORT}${admin.options.rootPath}`
    );
  });
};

start();
