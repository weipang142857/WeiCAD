// Parse the ISO-10303-21 HEADER section (text prefix is enough).
export function parseStepHeader(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  const fileName = /FILE_NAME\s*\(([\s\S]*?)\)\s*;/i.exec(text);
  if (fileName) {
    // ISO 10303-21 FILE_NAME args: 0 name, 1 time_stamp, 2 (author),
    // 3 (organization), 4 preprocessor_version, 5 originating_system, 6 authorization
    const args = splitTopLevel(fileName[1]);
    const author = firstString(args[2]);
    if (author) out.author = author;
    const preprocessor = unquote(args[4]);
    if (preprocessor) out.preprocessor = preprocessor;
    const originating = unquote(args[5]);
    if (originating) out.originatingSystem = originating;
    const time = unquote(args[1]);
    if (time) out.timestamp = time;
  }
  const schema = /FILE_SCHEMA\s*\(\s*\(\s*'([^']*)'/i.exec(text);
  if (schema) out.schema = schema[1];
  return out;
}

function splitTopLevel(s: string): string[] {
  const parts: string[] = [];
  let depth = 0, cur = '', inStr = false;
  for (const ch of s) {
    if (ch === "'") inStr = !inStr;
    if (!inStr && ch === '(') depth++;
    if (!inStr && ch === ')') depth--;
    if (!inStr && ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
    cur += ch;
  }
  parts.push(cur);
  return parts;
}

function unquote(s: string | undefined): string {
  const m = s && /'([^']*)'/.exec(s);
  return m ? m[1] : '';
}

function firstString(s: string | undefined): string {
  return unquote(s); // first quoted token inside an (...) list
}
