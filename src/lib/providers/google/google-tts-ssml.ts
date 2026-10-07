export type NarrationWordToken = {
  text: string;
  charStart: number;
  charEnd: number;
};

/** Escapes text for SSML per Google Cloud TTS reserved characters. */
export function escapeSsmlText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Tokenizes narration text the same way the player splits words (`/\S+/g`). */
export function tokenizeNarrationWords(text: string): NarrationWordToken[] {
  const words: NarrationWordToken[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    words.push({
      text: match[0],
      charStart: match.index,
      charEnd: match.index + match[0].length,
    });
  }

  return words;
}

export function buildSsmlWithWordMarks(text: string): {
  ssml: string;
  words: NarrationWordToken[];
} {
  const words = tokenizeNarrationWords(text);

  if (words.length === 0) {
    return { ssml: '<speak><mark name="end"/></speak>', words: [] };
  }

  const parts: string[] = ['<speak>'];

  for (let index = 0; index < words.length; index++) {
    parts.push(`<mark name="w${index}"/>`);
    parts.push(escapeSsmlText(words[index].text));
    if (index < words.length - 1) {
      parts.push(' ');
    }
  }

  parts.push('<mark name="end"/>', '</speak>');

  return { ssml: parts.join(''), words };
}
