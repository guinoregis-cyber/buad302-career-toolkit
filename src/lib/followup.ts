// Builds the follow-up message. Used twice: on the server for the default
// preview (so the page is useful without JavaScript) and in the browser as the user types.

export type Ask = 'none' | 'stay' | 'question' | 'resource';
export type Channel = 'email' | 'linkedin';

export interface FollowUpFields {
  channel: Channel;
  theirName: string;
  event: string;
  detail: string;
  why: string;
  ask: Ask;
  question: string;
  yourName: string;
}

export const EMPTY: FollowUpFields = {
  channel: 'email',
  theirName: '',
  event: '',
  detail: '',
  why: '',
  ask: 'resource',
  question: '',
  yourName: '',
};

const ph = (value: string, label: string) => value.trim() || `[${label}]`;
const stripEnd = (s: string) => s.trim().replace(/[.!?\s]+$/, '');
const sentence = (s: string) => {
  const t = s.trim();
  if (!t) return '';
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
};

function askLine(f: FollowUpFields): string {
  switch (f.ask) {
    case 'stay':
      return 'I would be glad to stay in touch.';
    case 'question': {
      const q = f.question.trim() ? stripEnd(f.question) + '?' : '[your question]';
      return `If you have a moment, I would value your perspective on one question: ${q}`;
    }
    case 'resource':
      return 'If there is anyone or anything you would recommend I look into as I learn more about this area, I would be grateful for the suggestion.';
    default:
      return '';
  }
}

export function composeFollowUp(f: FollowUpFields): string {
  const lines: string[] = [];
  const event = ph(stripEnd(f.event), 'event');

  if (f.channel === 'email') {
    lines.push(`Subject: Thank you for the conversation at ${event}`, '');
  }

  lines.push(`Hi ${ph(f.theirName, 'their first name')},`, '');

  const detail = f.detail.trim() ? stripEnd(f.detail) : '[the specific thing they said]';
  let opening = `Thank you for taking the time to talk with me at ${event}. I especially appreciated ${detail}.`;
  const why = sentence(f.why);
  if (why) opening += ` ${why}`;
  lines.push(opening);

  const ask = askLine(f);
  if (ask) lines.push('', ask);

  lines.push('', f.channel === 'email' ? 'Best,' : 'Thanks again,', ph(f.yourName, 'your name'));
  return lines.join('\n');
}

export function wordCount(text: string): number {
  return text
    .split('\n')
    .filter((l) => !l.startsWith('Subject:'))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
}
