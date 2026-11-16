/** Release dates use Beijing time in Chinese and an explicit UTC date in English. */
export function releaseDateLabel(iso, lang) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid release date');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: lang === 'zh' ? 'Asia/Shanghai' : 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}${lang === 'zh' ? '（北京时间）' : ' UTC'}`;
}
