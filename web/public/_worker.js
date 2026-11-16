export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/v1') || url.pathname.startsWith('/pg')) {
      url.hostname = 'api.tokenni.com';
      return fetch(new Request(url.toString(), request));
    }
    return env.ASSETS.fetch(request);
  }
};
