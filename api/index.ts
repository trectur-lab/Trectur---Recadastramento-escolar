import { app, startServer } from '../server';

let initialized = false;

export default async (req: any, res: any) => {
  if (!initialized) {
    await startServer();
    initialized = true;
  }
  return app(req, res);
};
