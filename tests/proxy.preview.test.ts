// 预览反代契约测试: functions/preview/[[path]].ts
// 不变量(对应 2026-10-27 用户定案, 方案三):
// 1. /preview 前缀剥掉后逐字转发到上游 qdp.qzz.io, 地址栏不跳转(3xx 不许由我方注入);
// 2. 上游 HTML 里的绝对路径 /assets/ 引用改写为 /preview/assets/, 让资源请求留在前缀内;
// 3. CSS 同理(url() 绝对路径);
// 4. 非 HTML/CSS 响应字节透传, 不重编码;
// 5. /preview(无斜杠)等价 /preview/;
// 6. 上游状态码原样透传。
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { onRequest, UPSTREAM_ORIGIN } from '../functions/preview/[[path]].ts';

function makeCtx(pathname: string, upstream: Response) {
  const fetchMock = vi.fn(async (url: string) => {
    expect(url.startsWith(UPSTREAM_ORIGIN)).toBe(true);
    return upstream;
  });
  vi.stubGlobal('fetch', fetchMock);
  return {
    ctx: {
      request: new Request('https://sleepy.is-my.app' + pathname),
      params: {},
    },
    fetchMock,
  };
}

describe('preview path reverse proxy', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('strips the /preview prefix before forwarding upstream', async () => {
    const html = new Response('<!doctype html><title>x</title>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const { ctx, fetchMock } = makeCtx('/preview/', html);
    const res = await onRequest(ctx as never);
    const forwarded = String(fetchMock.mock.calls[0][0]);
    expect(forwarded).toBe(UPSTREAM_ORIGIN + '/');
    expect(res.status).toBe(200);
  });

  it('forwards subpaths and queries verbatim after the prefix', async () => {
    const res0 = new Response('ok', { headers: { 'content-type': 'text/plain' } });
    const { ctx, fetchMock } = makeCtx('/preview/assets/index-oH7rK2ry.js', res0);
    await onRequest(ctx as never);
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      UPSTREAM_ORIGIN + '/assets/index-oH7rK2ry.js'
    );
  });

  it('rewrites absolute /assets/ references inside proxied HTML to stay under /preview', async () => {
    const upstreamHtml =
      '<!doctype html><html><head>' +
      '<script type="module" crossorigin src="/assets/index-oH7rK2ry.js"></script>' +
      '<link rel="stylesheet" crossorigin href="/assets/index-C7QG1u3K.css">' +
      '</head><body><div id="root"></div></body></html>';
    const html = new Response(upstreamHtml, {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
    const { ctx } = makeCtx('/preview/', html);
    const res = await onRequest(ctx as never);
    const body = await res.text();
    expect(body).toContain('src="/preview/assets/index-oH7rK2ry.js"');
    expect(body).toContain('href="/preview/assets/index-C7QG1u3K.css"');
    expect(body).not.toMatch(/"(?!\/preview)\/assets\//);
  });

  it('rewrites absolute url(/assets/) inside proxied CSS', async () => {
    const css = new Response('@font-face{src:url(/assets/font.woff2) format("woff2")}', {
      headers: { 'content-type': 'text/css; charset=utf-8' },
    });
    const { ctx } = makeCtx('/preview/assets/index-C7QG1u3K.css', css);
    const res = await onRequest(ctx as never);
    const body = await res.text();
    expect(body).toContain('url(/preview/assets/font.woff2)');
  });

  it('passes binary responses through without rewriting', async () => {
    const png = new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
      headers: { 'content-type': 'image/png' },
    });
    const { ctx } = makeCtx('/preview/assets/sleepy-logo.png', png);
    const res = await onRequest(ctx as never);
    expect(res.headers.get('content-type')).toBe('image/png');
    const buf = new Uint8Array(await res.arrayBuffer());
    expect(Array.from(buf)).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });

  it('treats bare /preview as /preview/', async () => {
    const html = new Response('<!doctype html>', {
      headers: { 'content-type': 'text/html' },
    });
    const { ctx, fetchMock } = makeCtx('/preview', html);
    await onRequest(ctx as never);
    expect(String(fetchMock.mock.calls[0][0])).toBe(UPSTREAM_ORIGIN + '/');
  });

  it('preserves upstream status codes', async () => {
    const nf = new Response('nope', { status: 404, headers: { 'content-type': 'text/plain' } });
    const { ctx } = makeCtx('/preview/definitely-missing', nf);
    const res = await onRequest(ctx as never);
    expect(res.status).toBe(404);
  });

  it('never injects a redirect of its own', async () => {
    const html = new Response('<!doctype html>', {
      headers: { 'content-type': 'text/html' },
    });
    const { ctx } = makeCtx('/preview/', html);
    const res = await onRequest(ctx as never);
    expect(res.status).toBeLessThan(300);
    expect(res.headers.get('location')).toBeNull();
  });
});
