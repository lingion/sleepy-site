// /faq.json — llms.txt 声称的 FAQ 机读源实物(GEO 批次 2026-10-27)。
// 静态路由构建期序列化 src/data/faq.json(build-faq 管线产物,与页面渲染同源),
// 用户可见页面零改动;AI 引擎按 llms.txt 引址抓取时拿到真 JSON 而非 404 假 200。
import faq from '../data/faq.json';

export const GET = () =>
  new Response(JSON.stringify(faq), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
