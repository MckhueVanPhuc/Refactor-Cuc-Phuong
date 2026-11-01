import { describe, expect, it } from 'vitest';
import { MESSAGE_CATALOG } from '../messages/catalogText';
import { DISPLAY_NAMES } from '../messages/displayNames';
import { FIELD_LABELS } from '../messages/fieldLabels';

// Bản sao danh mục thông báo, nhãn trường và tên hiển thị trong SQL (app.message_template, app.field_label_base,
// app.display_name) phải trùng từng chữ với nguồn TypeScript (T170, T183; BR-M03-L04, L13). Lấy định nghĩa mới nhất qua mọi migration.
const migrations = import.meta.glob<string>('../../../../supabase/migrations/*.sql', {
  query: '?raw',
  import: 'default',
  eager: true,
});

function latestBody(functionName: string): string {
  const header = new RegExp(`create (?:or replace )?function app\\.${functionName}\\(`);
  const file = Object.entries(migrations)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([, sql]) => sql)
    .find((sql) => header.test(sql));
  if (!file) throw new Error(`app.${functionName} không có trong migration`);
  const start = file.search(header);
  return file.slice(start, file.indexOf('$$;', start));
}

const literal = "'((?:[^']|'')*)'";
const unescape = (value = '') => value.replace(/''/g, "'");

describe('Danh mục SQL khớp TypeScript (T170)', () => {
  it('app.message_template có đúng mọi khóa và câu chữ của MESSAGE_CATALOG', () => {
    const rows = [...latestBody('message_template').matchAll(new RegExp(`\\(${literal}, ${literal}\\)`, 'g'))];
    const sql = Object.fromEntries(rows.map(([, key, text]) => [unescape(key), unescape(text)]));
    expect(sql).toEqual(MESSAGE_CATALOG);
  });

  it('app.field_label_base có đúng mọi nhãn của FIELD_LABELS', () => {
    const rows = [...latestBody('field_label_base').matchAll(new RegExp(`\\(${literal}, ${literal}, ${literal}\\)`, 'g'))];
    const sql: Record<string, Record<string, string>> = {};
    for (const [, itemType, fieldKey, label] of rows) {
      (sql[unescape(itemType)] ??= {})[unescape(fieldKey)] = unescape(label);
    }
    expect(sql).toEqual(FIELD_LABELS);
  });

  it('app.display_name có đúng tên hiển thị của các nhóm nó chứa (DISPLAY_NAMES)', () => {
    const rows = [...latestBody('display_name').matchAll(new RegExp(`\\(${literal}, ${literal}, ${literal}\\)`, 'g'))];
    const sql: Record<string, Record<string, string>> = {};
    for (const [, kind, code, name] of rows) {
      (sql[unescape(kind)] ??= {})[unescape(code)] = unescape(name);
    }
    expect(Object.keys(sql).sort()).toEqual(['connectivityMode', 'difficulty', 'experienceTag', 'groupTag']);
    for (const [kind, names] of Object.entries(sql)) {
      expect(names).toEqual(DISPLAY_NAMES[kind as keyof typeof DISPLAY_NAMES]);
    }
  });
});
