import { readFileSync } from 'node:fs';
import { parse as parseAstro } from '@astrojs/compiler-rs';
import postcss from 'postcss';
import { describe, expect, it } from 'vitest';

// Source contracts run before a site build. Browser geometry remains a visual check.
const source = readFileSync(new URL('../src/components/sections/Reminders.astro', import.meta.url), 'utf8');
const { ast } = parseAstro(source);
type Node = Record<string, any>;
function nodes(value: unknown): Node[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(nodes);
  const node = value as Node;
  return [node, ...Object.values(node).flatMap(nodes)];
}
const all = nodes(ast);
const attribute = (node: Node, name: string) =>
  node.openingElement?.attributes.find((a: Node) => a.name?.name === name)?.value;
const hasClass = (node: Node, name: string) =>
  String(attribute(node, 'class')?.value ?? '').split(/\s+/).includes(name);
const element = (name: string) => all.find((node) => hasClass(node, name))!;
const css = postcss.parse(source.match(/<style>([\s\S]*?)<\/style>/)![1]);
const keys = ['weekgrid', 'today', 'twodays', 'weekview', 'weeklist'];

function wallAt(width: number): Record<string, string> {
  const declarations: Record<string, string> = {};
  css.walkRules('.reminders__wall', (rule) => {
    const parent = rule.parent;
    if (parent?.type === 'atrule') {
      const minimum = parent.params.match(/^\(min-width:\s*(\d+)px\)$/);
      if (!minimum) throw new Error(`Unsupported layout condition: ${parent.params}`);
      if (width < Number(minimum[1])) return;
    }
    rule.walkDecls((decl) => { declarations[decl.prop] = decl.value; });
  });
  return declarations;
}
const rowsAt = (width: number) =>
  [...(wallAt(width)['grid-template-areas'] ?? '').matchAll(/["']([^"']+)["']/g)]
    .map((match) => match[1].trim().split(/\s+/));

describe('reminder widget responsive layout contract', () => {
  it('places the widget area beside the overview in the full content container', () => {
    const content = element('reminders__content');
    expect(content, 'full-width content container').toBeDefined();
    const children = content.children.filter((node: Node) => node.type === 'JSXElement');
    expect(children.map((node: Node) => attribute(node, 'class')?.value))
      .toEqual(['reminders__overview', 'reminders__widgets']);
    expect(nodes(element('reminders__widgets'))).toContain(element('reminders__wall'));
  });

  it('keeps five siblings in the required DOM reading order without a nested strip stack', () => {
    const declaration = all.find((node) => node.type === 'VariableDeclarator' && node.id?.name === 'widgets');
    expect(declaration, 'one ordered collection for the five widgets').toBeDefined();
    const items = declaration!.init.expression.elements;
    expect(items.map((item: Node) => item.properties.find((p: Node) => p.key.name === 'key').value.value))
      .toEqual(keys);
    const wallNodes = nodes(element('reminders__wall'));
    expect(wallNodes.filter((node) => node.openingElement?.name.name === 'div')).toHaveLength(1);
    expect(wallNodes.some((node) => node.type === 'CallExpression' && node.callee.object?.name === 'widgets'))
      .toBe(true);
  });

  it.each([320, 390, 599])('uses a single column in reading order at %ipx', (width) => {
    expect(rowsAt(width)).toEqual(keys.map((key) => [key]));
    expect(wallAt(width).display).toBe('grid');
  });

  it.each([600, 768, 959])('uses two columns with a two-row portrait at %ipx', (width) => {
    expect(rowsAt(width)).toEqual([
      ['weekgrid', 'today'], ['weekgrid', 'twodays'], ['weekview', 'weeklist'],
    ]);
  });

  it.each([960, 1024, 1440])('uses the portrait and right-hand 2 by 2 at %ipx', (width) => {
    expect(rowsAt(width)).toEqual([
      ['weekgrid', 'today', 'twodays'], ['weekgrid', 'weekview', 'weeklist'],
    ]);
  });

  it('does not introduce scrolling, cropping, stretching or image visibility overrides', () => {
    css.walkDecls((decl) => {
      expect(decl.prop).not.toMatch(/^(?:order|grid-auto-flow|overflow(?:-[xy])?|scroll-snap-.*)$/);
    });
    const imageRules: string[] = [];
    css.walkRules((rule) => {
      if (!rule.selector.includes(' img')) return;
      const values = Object.fromEntries(rule.nodes.filter((node) => node.type === 'decl')
        .map((decl) => [decl.prop, decl.value]));
      expect(values['block-size']).toBe('auto');
      expect(values['object-fit']).toBe('contain');
      expect(values.display).toBeUndefined();
      imageRules.push(rule.selector);
    });
    expect(imageRules.length).toBeGreaterThan(0);
  });
});
