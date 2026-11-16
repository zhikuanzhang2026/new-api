export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/v1') || url.pathname.startsWith('/pg')) {
      url.hostname = 'api.tokenni.com';
      // forward the real visitor IP so new-api logs/audits see the client, not the Pages edge.
      // CF-Connecting-IP is not always present on the request the Worker sees, so fall back
      // to the incoming X-Forwarded-For, which the edge already set to the real client IP.
      const forwarded = request.headers.get('X-Forwarded-For') || '';
      const clientIp = request.headers.get('CF-Connecting-IP') || forwarded.split(',')[0].trim();
      const proxyReq = new Request(url.toString(), request);
      if (clientIp) {
        proxyReq.headers.set('X-Forwarded-For', clientIp);
        proxyReq.headers.set('X-Real-IP', clientIp);
      }
      // Talk to the origin directly (resolveOverride keeps SNI/hostname as api.tokenni.com).
      // Going through the CF edge for api.tokenni.com would overwrite X-Forwarded-For with
      // the Worker egress IP. The Worker egresses from Cloudflare IPs, so it passes the
      // origin firewall that only allows Cloudflare ranges on 443.
      const resp = await fetch(proxyReq, { cf: { resolveOverride: '161.153.54.238' } });
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
    // CSP allows Turnstile (challenges.cloudflare.com): script + challenge iframe + API calls.
    headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.tokenni.com https://tokenni.com wss://api.tokenni.com https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; media-src 'self' data: https:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'");
    return new Response(resp.body, { status: resp.status, statusText: resp.statusText, headers });
  }
};
