// web-search 落盘契约守卫。
//
// 两个真实缺陷都曾让 UI 看似正常而后端拒绝或丢数据，且既有的三方对账
// 守不到：parity 测试从 DEFAULT_VISUAL_VALUES 派生叶值，而
// WEB_SEARCH_LEAF_KEYS 是保存路径真正读取的清单，两者可以各说各话。
//
//   ① 后端把 timeout-seconds 等声明为 int。UI 是字符串输入框，若经字符串
//      setter 写回，yaml 会输出 "45"，而 PutConfigYAML 在落盘前先
//      unmarshal 整个配置 → 保存整体失败（连无关的 provider key 一起）。
//   ② 叶值清单漏一个键，字段能渲染、能搜索、能输入，却永远不会落盘。

import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_VISUAL_VALUES } from '@/types/visualConfig';

const SOURCE = readFileSync(join(import.meta.dir, '..', 'src', 'hooks', 'useVisualConfig.ts'), 'utf8');

/** 取出源码里导出的三个 web-search 清单，保持与实现同源。 */
function readList(name: string): string[] {
  const start = SOURCE.indexOf(`const ${name}`);
  expect(start, `${name} not found in useVisualConfig.ts`).toBeGreaterThan(-1);
  const open = SOURCE.indexOf('[', start);
  const close = SOURCE.indexOf(']', open);
  return [...SOURCE.slice(open, close).matchAll(/'([^']+)'/g)].map((m) => m[1]!);
}

const LEAF_KEYS = readList('WEB_SEARCH_LEAF_KEYS');
const INT_YAML_KEYS = Object.keys(
  Object.fromEntries(
    [...SOURCE.slice(SOURCE.indexOf('const WEB_SEARCH_INT_YAML_KEYS')).matchAll(/'([^']+)': true/g)].map(
      (m) => [m[1]!, true],
    ),
  ),
);

describe('web-search save contract', () => {
  test('every modeled field is reachable by the save path', () => {
    // 叶值清单必须覆盖 WebSearchConfig 的全部字段：漏一个，该字段就能
    // 渲染和输入，但永远不会写进 YAML，且不报任何错。
    const modeled = Object.keys(DEFAULT_VISUAL_VALUES.webSearch);
    const missing = modeled.filter((key) => !LEAF_KEYS.includes(key));
    expect(missing).toEqual([]);
  });

  test('the save path carries no leaf the type does not declare', () => {
    const modeled = new Set(Object.keys(DEFAULT_VISUAL_VALUES.webSearch));
    const extra = LEAF_KEYS.filter((key) => !modeled.has(key));
    expect(extra).toEqual([]);
  });

  test('int-backed yaml keys are routed through the int setter', () => {
    // 这些键在后端是 int。缺任一个都会让 yaml 输出带引号的数字，
    // 而后端在写入前解析整个配置，保存会整体 400。
    for (const key of [
      'timeout-seconds',
      'limit',
      'max-searches',
      'public-fanout-soft-seconds',
      'public-fanout-hard-seconds',
    ]) {
      expect(INT_YAML_KEYS).toContain(key);
    }
  });

  test('int keys branch to the int setter before the string fallback', () => {
    const branch = SOURCE.slice(SOURCE.indexOf('for (const leaf of webSearchLeaves)'));
    const intAt = branch.indexOf('WEB_SEARCH_INT_YAML_KEYS[yamlKey]');
    const stringAt = branch.indexOf('setStringInDoc(doc, [\'web-search\', yamlKey], next)');
    expect(intAt, 'web-search write path has no int branch').toBeGreaterThan(-1);
    expect(stringAt, 'web-search write path has no string fallback').toBeGreaterThan(-1);
    // 顺序颠倒会让 int 字段落到字符串分支上。
    expect(intAt).toBeLessThan(stringAt);
  });
  test('the int branch is a real positive test, not an inverted one', () => {
    // 断言条件本身的方向：写成 === undefined 时 int 字段会全部落到
    // 字符串分支，而上面的顺序断言仍然通过。这个守卫钉住比较方向。
    const branch = SOURCE.slice(SOURCE.indexOf('for (const leaf of webSearchLeaves)'));
    expect(branch).toContain('WEB_SEARCH_INT_YAML_KEYS[yamlKey] !== undefined');
    expect(branch).not.toContain('WEB_SEARCH_INT_YAML_KEYS[yamlKey] === undefined');
  });
});
