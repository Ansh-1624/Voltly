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
