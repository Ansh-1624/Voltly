process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres.tficwfvajwthwoqqvaqy:mahiiaaruu%401624@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';

let appInstance: any;

export default async function handler(req: any, res: any) {
  try {
    if (!appInstance) {
      const serverModule = await import('../server/src/index');
      appInstance = serverModule.default || serverModule.app || serverModule;
    }
    return appInstance(req, res);
  } catch (err: any) {
    console.error('Fatal API handler error on Vercel:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: 'Vercel Serverless Invocation Exception',
      message: err.message,
      stack: err.stack,
    });
  }
}
