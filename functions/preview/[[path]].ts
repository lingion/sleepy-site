// /preview 路径反代 —— 把 qdp.qzz.io 网页预览挂进官网 URL 之下。
// 用户定案(2026-10-27): 地址栏必须保持 sleepy.is-my.app/preview, 全程不许跳转,
// 故采用 Pages Functions 反代而非重定向。契约测试: tests/proxy.preview.test.ts。
//
// 上游形态实测(2026-10-27): Vite SPA, hash 路由, 子路径回退返回同一张 index.html,
// index.html 里只有 /assets/ 一种绝对路径引用 → 只需 HTML/CSS 内改写 /assets/ 前缀,
// 其余(相对 ./、manifest、SW 注册路径)天然跟随 base。

export const UPSTREAM_ORIGIN = 'https://sleepy.qdp.qzz.io';
const PREFIX = '/preview';

interface PagesRequestContext {
  request: Request;
}

function upstreamTarget(pathname: string, search: string): string {
  const rest = pathname.slice(PREFIX.length);
  const upstreamPath = rest === '' || rest === '/' ? '/' : rest;
  return UPSTREAM_ORIGIN + upstreamPath + search;
}

function copyHeaders(source: Headers): Headers {
  const headers = new Headers(source);
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  headers.delete('content-encoding');
  return headers;
}

function forwardHeaders(source: Headers): Headers {
  const headers = new Headers(source);
  // host 交给运行时按目标 URL 生成;原样带 is-my.app 会把上游 Worker 路由打乱。
  headers.delete('host');
  // 上游响应必须拿到未压缩正文才能改写 HTML/CSS。
  headers.delete('accept-encoding');
  return headers;
}

export const onRequest = async (context: PagesRequestContext): Promise<Response> => {
  const url = new URL(context.request.url);
  const target = upstreamTarget(url.pathname, url.search);

  const upstream = await fetch(target, {
    method: context.request.method,
    headers: forwardHeaders(context.request.headers),
    redirect: 'manual',
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html') && !contentType.includes('text/css')) {
    // 非文本资源与 API 响应: 字节透传, 不重编码。
    return upstream;
  }

  let body = await upstream.text();
  if (contentType.includes('text/html')) {
    body = body.replace(/(["'])\/assets\//g, '$1' + PREFIX + '/assets/');
  } else {
    body = body.replace(/url\((['"]?)\/assets\//g, 'url($1' + PREFIX + '/assets/');
    body = body.replace(/(["'])\/assets\//g, '$1' + PREFIX + '/assets/');
  }

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: copyHeaders(upstream.headers),
  });
};
