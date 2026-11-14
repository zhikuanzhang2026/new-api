export async function onRequest(context) {
  const url = new URL(context.request.url);
  url.hostname = 'api.tokenni.com';
  return fetch(new Request(url.toString(), context.request));
}
