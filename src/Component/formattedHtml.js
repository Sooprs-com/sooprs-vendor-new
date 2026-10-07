const HTML_TAG_RE = /<\/?[a-z][a-z0-9]*\b[^<>]*>/i;
const ENTITY_RE = /&(?:lt|gt|amp|quot|nbsp|#\d+|#x[0-9a-f]+);/i;
const TOKEN_RE = /<!--[\s\S]*?-->|<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^<>]*)\/?>|([^<]+)/g;

function decodeEntities(input) {
  return String(input || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (full, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : full;
    })
    .replace(/&#x([0-9a-f]+);/gi, (full, n) => {
      const code = parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : full;
    });
}

function hasHtmlTags(value) {
  return HTML_TAG_RE.test(value);
}

function styleMarks(attrs) {
  const style = /style\s*=\s*["']([^"']*)["']/i.exec(attrs || '')?.[1] || '';
  return {
    bold: /font-weight\s*:\s*(bold|[6-9]00)/i.test(style),
    italic: /font-style\s*:\s*italic/i.test(style),
    underline: /text-decoration[^;]*underline/i.test(style),
  };
}

function currentMark(marks) {
  const top = marks[marks.length - 1] || {};
  return {
    bold: !!top.bold,
    italic: !!top.italic,
    underline: !!top.underline,
  };
}

function trimInlines(nodes) {
  if (!nodes.length) {
    return [];
  }
  const copy = nodes.map(node => ({...node}));
  copy[0] = {...copy[0], text: copy[0].text.replace(/^[ \t\n]+/, '')};
  const lastIndex = copy.length - 1;
  copy[lastIndex] = {
    ...copy[lastIndex],
    text: copy[lastIndex].text.replace(/[ \t\n]+$/, ''),
  };
  return copy.filter(node => node.text.length > 0);
}

function parseHtmlBlocks(html) {
  const source = decodeEntities(String(html || '')).replace(/\r\n/g, '\n');
  const blocks = [];
  let inlines = [];
  let currentKind = 'p';
  let list = null;
  let listDepth = 0;
  let inLi = false;
  const marks = [{}];
  const inlineStack = [];
  let skipUntil = null;

  const pushText = raw => {
    if (skipUntil) {
      return;
    }
    const collapsed = String(raw).replace(/\s+/g, ' ');
    if (!collapsed.trim()) {
      if (inlines.length > 0) {
        const last = inlines[inlines.length - 1];
        if (last.text && !/[\s\n]$/.test(last.text)) {
          last.text += ' ';
        }
      }
      return;
    }
    inlines.push({text: collapsed, ...currentMark(marks)});
  };

  const flush = () => {
    const cleaned = trimInlines(inlines);
    inlines = [];
    if (!cleaned.length || !cleaned.some(node => node.text.trim().length > 0)) {
      return;
    }
    if (list && inLi) {
      list.items.push(cleaned);
      return;
    }
    if (/^h[1-6]$/.test(currentKind)) {
      blocks.push({
        type: 'heading',
        level: Number(currentKind.slice(1)),
        inlines: cleaned,
      });
      return;
    }
    blocks.push({type: 'paragraph', inlines: cleaned});
  };

  const openInline = (tag, extra) => {
    const next = {...currentMark(marks), ...extra};
    const pushed = !!(next.bold || next.italic || next.underline);
    if (pushed) {
      marks.push(next);
    }
    inlineStack.push({tag, pushed});
  };

  const closeInline = tag => {
    for (let i = inlineStack.length - 1; i >= 0; i -= 1) {
      if (inlineStack[i].tag !== tag) {
        continue;
      }
      const frame = inlineStack.splice(i, 1)[0];
      if (frame.pushed && marks.length > 1) {
        marks.pop();
      }
      return;
    }
  };

  TOKEN_RE.lastIndex = 0;
  let match = TOKEN_RE.exec(source);
  while (match) {
    const full = match[0];
    const tag = match[1] ? match[1].toLowerCase() : '';
    const attrs = match[2] || '';
    const text = match[3];

    if (text != null) {
      pushText(text);
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!tag) {
      match = TOKEN_RE.exec(source);
      continue;
    }

    const isClose = full.startsWith('</');

    if (skipUntil) {
      if (isClose && tag === skipUntil) {
        skipUntil = null;
      }
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && (tag === 'script' || tag === 'style')) {
      skipUntil = tag;
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && (tag === 'br' || tag === 'hr')) {
      if (inlines.length) {
        inlines.push({text: '\n', ...currentMark(marks)});
      } else {
        inlines.push({text: '\n', ...currentMark(marks)});
      }
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && (tag === 'strong' || tag === 'b')) {
      openInline(tag, {bold: true});
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && (tag === 'strong' || tag === 'b')) {
      closeInline(tag);
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && (tag === 'em' || tag === 'i')) {
      openInline(tag, {italic: true});
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && (tag === 'em' || tag === 'i')) {
      closeInline(tag);
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && tag === 'u') {
      openInline(tag, {underline: true});
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && tag === 'u') {
      closeInline(tag);
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && (tag === 'span' || tag === 'font' || tag === 'a' || tag === 'label')) {
      openInline(tag, styleMarks(attrs));
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && (tag === 'span' || tag === 'font' || tag === 'a' || tag === 'label')) {
      closeInline(tag);
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && (tag === 'ul' || tag === 'ol')) {
      flush();
      if (!list) {
        list = {type: 'list', ordered: tag === 'ol', items: []};
      }
      listDepth += 1;
      inLi = false;
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && (tag === 'ul' || tag === 'ol')) {
      flush();
      listDepth = Math.max(0, listDepth - 1);
      inLi = listDepth > 0;
      if (list && listDepth === 0) {
        if (list.items.length) {
          blocks.push(list);
        }
        list = null;
      }
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && tag === 'li') {
      flush();
      inLi = true;
      currentKind = 'p';
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && tag === 'li') {
      flush();
      inLi = false;
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (!isClose && /^h[1-6]$/.test(tag)) {
      flush();
      currentKind = tag;
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (isClose && /^h[1-6]$/.test(tag)) {
      flush();
      currentKind = 'p';
      match = TOKEN_RE.exec(source);
      continue;
    }

    if (
      !isClose &&
      (tag === 'p' ||
        tag === 'div' ||
        tag === 'blockquote' ||
        tag === 'section' ||
        tag === 'article' ||
        tag === 'tr')
    ) {
      flush();
      if (!inLi) {
        currentKind = 'p';
      }
      match = TOKEN_RE.exec(source);
      continue;
    }
    if (
      isClose &&
      (tag === 'p' ||
        tag === 'div' ||
        tag === 'blockquote' ||
        tag === 'section' ||
        tag === 'article' ||
        tag === 'tr')
    ) {
      flush();
      if (!inLi) {
        currentKind = 'p';
      }
      match = TOKEN_RE.exec(source);
      continue;
    }

    match = TOKEN_RE.exec(source);
  }

  flush();
  if (list && list.items.length) {
    blocks.push(list);
  }
  return blocks;
}

function stripToPlain(html) {
  return decodeEntities(
    String(html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function prepareContent(raw) {
  const original = raw == null ? '' : String(raw);
  let decoded = original;

  for (let i = 0; i < 3; i += 1) {
    if (!ENTITY_RE.test(decoded)) {
      break;
    }
    const next = decodeEntities(decoded);
    if (next === decoded) {
      break;
    }
    decoded = next;
    if (hasHtmlTags(decoded)) {
      const blocks = parseHtmlBlocks(decoded);
      if (!blocks.length) {
        return {isHtml: false, text: stripToPlain(decoded), blocks: []};
      }
      return {isHtml: true, text: decoded, blocks};
    }
  }

  if (hasHtmlTags(original)) {
    const blocks = parseHtmlBlocks(original);
    if (!blocks.length) {
      return {isHtml: false, text: stripToPlain(original), blocks: []};
    }
    return {isHtml: true, text: original, blocks};
  }

  return {isHtml: false, text: original, blocks: []};
}

module.exports = {
  prepareContent,
  parseHtmlBlocks,
};
