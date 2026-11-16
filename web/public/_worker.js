export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/v1') || url.pathname.startsWith('/pg')) {
      url.hostname = 'api.tokenni.com';
      // forward the real visitor IP so new-api logs/audits see the client, not the Pages edge
      const clientIp = request.headers.get('CF-Connecting-IP');
      const proxyReq = new Request(url.toString(), request);
      if (clientIp) {
        proxyReq.headers.set('X-Forwarded-For', clientIp);
        proxyReq.headers.set('X-Real-IP', clientIp);
      }
      const resp = await fetch(proxyReq);
      const headers = new Headers(resp.headers);
      headers.delete('x-new-api-version');
      headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
      return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
    }
    const resp = await env.ASSETS.fetch(request);
    const headers = new Headers(resp.headers);
    headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.tokenni.com https://tokenni.com wss://api.tokenni.com; media-src 'self' data: https:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
  }
};
