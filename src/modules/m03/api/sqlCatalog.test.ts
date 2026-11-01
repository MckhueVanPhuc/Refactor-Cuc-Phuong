import { describe, expect, it } from 'vitest';
import { MESSAGE_CATALOG } from '../messages/catalogText';
import { FIELD_LABELS } from '../messages/fieldLabels';

// Bản sao danh mục thông báo và nhãn trường trong SQL (app.message_template, app.field_label_base) phải trùng
// từng chữ với nguồn TypeScript (T170; BR-M03-L04, L13). Lấy định nghĩa mới nhất qua mọi migration.
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
});
