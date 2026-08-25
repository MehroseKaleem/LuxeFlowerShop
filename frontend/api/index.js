export default async (req, res) => {
  const { reqHandler } = await import('../dist/flowerweb/server/server.mjs');
  // Angular's SSR request handler rebuilds the request as a Web-standard
  // Request/Headers object internally, which rejects the "host" header as a
  // forbidden header name. Vercel already forwards the real hostname via
  // x-forwarded-host, so drop the raw host header to avoid the conflict.
  delete req.headers.host;
  return reqHandler(req, res);
};
