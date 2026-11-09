// Builds the follow-up message. Used twice: on the server for the default
// preview (so the page is useful without JavaScript) and in the browser as the user types.

export type Ask = 'none' | 'stay' | 'question' | 'resource' | 'offered' | 'suggested';
export type Channel = 'email' | 'linkedin';

export interface FollowUpFields {
  channel: Channel;
  theirName: string;
  event: string;
  detail: string;
  why: string;
  ask: Ask;
  extra: string;
  yourName: string;
}

export const EMPTY: FollowUpFields = {
  channel: 'email',
  theirName: '',
  event: '',
  detail: '',
  why: '',
  ask: 'resource',
  extra: '',
  yourName: '',
};

// Asks that need one more field, with the label and placeholder for it.
export const EXTRA_FIELD: Partial<Record<Ask, { label: string; placeholder: string }>> = {
  question: { label: 'Your question', placeholder: 'e.g., what helped you most in your first year' },
  offered: { label: 'What you would like help with', placeholder: 'e.g., a 15-minute call about how you chose your team' },
  suggested: { label: 'Who they suggested you contact', placeholder: 'e.g., Sam Lee on the strategy team' },
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
  const extra = f.extra.trim() ? stripEnd(f.extra) : '';
  switch (f.ask) {
    case 'stay':
      return 'I would be glad to stay in touch.';
    case 'question':
      return `If you have a moment, I would value your perspective on one question: ${extra ? extra + '?' : '[your question]'}`;
    case 'resource':
      return 'If there is anyone or anything you would recommend I look into as I learn more about this area, I would be grateful for the suggestion.';
    case 'offered':
      return `You kindly offered to help as I learn more about this area. If you are open to it, I would appreciate ${extra || '[what you would like help with]'}.`;
    case 'suggested':
      return `Thank you also for suggesting I reach out to ${extra || '[name]'}. I will contact them and let you know how it goes.`;
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
