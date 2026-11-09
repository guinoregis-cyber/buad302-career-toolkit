// Message builder templates. Each playbook's builder is described here as data:
// its fields, how the message is composed, and which warnings to show.
// The same code renders the default preview on the server (works without JavaScript)
// and updates it live in the browser.

export type Values = Record<string, string>;

export interface Option {
  value: string;
  label: string;
}

export interface Field {
  name: string;
  label: string;
  type: 'text' | 'select' | 'radio';
  options?: Option[];
  placeholder?: string;
  hint?: string;
  tag?: 'required' | 'optional';
  /** For fields that only apply in some cases. Return null to hide the field. */
  dynamic?: (v: Values) => { label: string; placeholder: string } | null;
  /** Clear this field when the named field changes (stale text never carries over). */
  resetWhen?: string;
}

export interface Template {
  fields: Field[];
  defaults: Values;
  compose: (v: Values) => string;
  warnings: (v: Values) => string[];
}

/* ---------- helpers ---------- */

const val = (v: Values, k: string) => (v[k] ?? '').trim();
const ph = (value: string, label: string) => value || `[${label}]`;
const stripEnd = (s: string) => s.trim().replace(/[.!?\s]+$/, '');
const sentence = (s: string) => {
  const t = s.trim();
  if (!t) return '';
  const capped = t.charAt(0).toUpperCase() + t.slice(1);
  return /[.!?]$/.test(capped) ? capped : `${capped}.`;
};
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const hasBrackets = (text: string) => /\[[^\]]+\]/.test(text);

export function wordCount(text: string): number {
  return words(
    text
      .split('\n')
      .filter((l) => !l.startsWith('Subject:'))
      .join(' '),
  );
}

const CHANNEL: Field = {
  name: 'channel',
  label: 'Sending by',
  type: 'radio',
  options: [
    { value: 'email', label: 'Email' },
    { value: 'linkedin', label: 'LinkedIn message' },
  ],
};

/** Warning for a dynamic field that is showing but still empty. */
function dynamicWarnings(t: Template, v: Values): string[] {
  return t.fields
    .filter((f) => f.dynamic)
    .map((f) => ({ f, spec: f.dynamic!(v) }))
    .filter(({ f, spec }) => spec && !val(v, f.name))
    .map(({ spec }) => `Fill in "${spec!.label}", or pick a different option.`);
}

/* ---------- After a Recruiting Event ---------- */

const FOLLOWUP_EXTRA: Record<string, { label: string; placeholder: string }> = {
  question: { label: 'Your question', placeholder: 'e.g., what helped you most in your first year' },
  offered: { label: 'What you would like help with', placeholder: 'e.g., a 15-minute call about how you chose your team' },
  suggested: { label: 'Who they suggested you contact', placeholder: 'e.g., Sam Lee on the strategy team' },
};

const followup: Template = {
  defaults: { channel: 'email', ask: 'resource' },
  fields: [
    CHANNEL,
    { name: 'theirName', label: 'Their first name', type: 'text', placeholder: 'e.g., Jordan' },
    { name: 'event', label: 'Where you met', type: 'text', placeholder: 'e.g., the Marshall finance panel' },
    {
      name: 'detail',
      label: 'One specific thing they said that stuck with you',
      type: 'text',
      tag: 'required',
      hint: 'Write it so it finishes the sentence "I especially appreciated…"',
      placeholder: 'e.g., your advice to talk to people on more than one team',
    },
    {
      name: 'why',
      label: 'Why it mattered to you',
      type: 'text',
      tag: 'optional',
      placeholder: "e.g., I had only been looking at one team, so I'm widening my search",
    },
    {
      name: 'ask',
      label: 'Next step',
      type: 'select',
      options: [
        { value: 'resource', label: "Ask if they'd recommend a person or resource" },
        { value: 'question', label: 'Ask one specific question' },
        { value: 'offered', label: 'They offered to help: take them up on it' },
        { value: 'suggested', label: 'They suggested someone to contact' },
        { value: 'stay', label: "Say you'd like to stay in touch" },
        { value: 'none', label: 'No ask, just thanks' },
      ],
    },
    { name: 'extra', label: 'Details', type: 'text', dynamic: (v) => FOLLOWUP_EXTRA[v.ask] ?? null, resetWhen: 'ask' },
    { name: 'yourName', label: 'Your name', type: 'text' },
  ],
  compose(v) {
    const event = ph(stripEnd(val(v, 'event')), 'event');
    const extra = stripEnd(val(v, 'extra'));
    const lines: string[] = [];
    if (v.channel !== 'linkedin') lines.push(`Subject: Thank you for the conversation at ${event}`, '');
    lines.push(`Hi ${ph(val(v, 'theirName'), 'their first name')},`, '');

    const detail = val(v, 'detail') ? stripEnd(val(v, 'detail')) : '[the specific thing they said]';
    let opening = `Thank you for taking the time to talk with me at ${event}. I especially appreciated ${detail}.`;
    const why = sentence(val(v, 'why'));
    if (why) opening += ` ${why}`;
    lines.push(opening);

    const asks: Record<string, string> = {
      stay: 'I would be glad to stay in touch.',
      question: `If you have a moment, I would value your perspective on one question: ${extra ? extra + '?' : '[your question]'}`,
      resource:
        'If there is anyone or anything you would recommend I look into as I learn more about this area, I would be grateful for the suggestion.',
      offered: `You kindly offered to help as I learn more about this area. If you are open to it, I would appreciate ${extra || '[what you would like help with]'}.`,
      suggested: `Thank you also for suggesting I reach out to ${extra || '[name]'}. I will contact them and let you know how it goes.`,
    };
    const ask = asks[v.ask] ?? '';
    if (ask) lines.push('', ask);

    lines.push('', v.channel === 'linkedin' ? 'Thanks again,' : 'Best,', ph(val(v, 'yourName'), 'your name'));
    return lines.join('\n');
  },
  warnings(v) {
    const msgs: string[] = [];
    if (!val(v, 'detail')) msgs.push('Add one specific detail. Without it, this reads like a message sent to everyone.');
    msgs.push(...dynamicWarnings(followup, v));
    if (hasBrackets(this.compose(v))) msgs.push('Fill in the [brackets] before sending.');
    return msgs;
  },
};

/* ---------- Cold Outreach ---------- */

const OUTREACH_LINK: Record<string, { label: string; placeholder: string }> = {
  mutual: { label: 'Who suggested you contact them', placeholder: 'e.g., Professor Lee' },
  recruiter: { label: 'The role or program you are interested in', placeholder: 'e.g., the summer analyst program' },
};

const OUTREACH_ASK_EXTRA: Record<string, { label: string; placeholder: string }> = {
  question: { label: 'Your question', placeholder: 'e.g., what skills mattered most when you switched into strategy' },
};

const outreach: Template = {
  defaults: { channel: 'email', link: 'none', ask: 'call' },
  fields: [
    CHANNEL,
    { name: 'theirName', label: 'Their first name', type: 'text', placeholder: 'e.g., Alex' },
    {
      name: 'link',
      label: 'Who you are contacting',
      type: 'select',
      options: [
        { value: 'none', label: 'No connection yet' },
        { value: 'alum', label: 'A USC alum' },
        { value: 'mutual', label: 'Suggested by a mutual contact' },
        { value: 'recruiter', label: 'A recruiter, about a role' },
      ],
    },
    { name: 'linkExtra', label: 'Details', type: 'text', dynamic: (v) => OUTREACH_LINK[v.link] ?? null, resetWhen: 'link' },
    {
      name: 'you',
      label: 'One line about you',
      type: 'text',
      hint: 'Finishes the sentence "My name is [your name], …"',
      placeholder: 'e.g., a sophomore at USC studying business administration',
    },
    {
      name: 'why',
      label: 'Why this person',
      type: 'text',
      tag: 'required',
      hint: 'Finishes the sentence "I\'m reaching out because…" Make it about them, not just their employer.',
      placeholder: 'e.g., you moved from audit into strategy consulting, and I am trying to understand how people make that switch',
    },
    {
      name: 'ask',
      label: 'What you are asking for',
      type: 'select',
      options: [
        { value: 'call', label: 'A short call' },
        { value: 'question', label: 'One question, answered by message' },
        { value: 'process', label: 'What they look for (recruiters)' },
      ],
    },
    { name: 'askExtra', label: 'Details', type: 'text', dynamic: (v) => OUTREACH_ASK_EXTRA[v.ask] ?? null, resetWhen: 'ask' },
    { name: 'yourName', label: 'Your name', type: 'text' },
  ],
  compose(v) {
    const name = ph(val(v, 'yourName'), 'your name');
    const linkExtra = stripEnd(val(v, 'linkExtra'));
    const lines: string[] = [];

    if (v.channel !== 'linkedin') {
      const subjects: Record<string, string> = {
        none: 'Student interested in your path',
        alum: 'USC student reaching out',
        mutual: `${linkExtra || '[name]'} suggested I reach out`,
        recruiter: `Interest in ${linkExtra || '[role]'}`,
      };
      lines.push(`Subject: ${subjects[v.link] ?? subjects.none}`, '');
    }

    lines.push(`Hi ${ph(val(v, 'theirName'), 'their first name')},`, '');

    const you = val(v, 'you') ? stripEnd(val(v, 'you')) : '[one line about you]';
    const intro: string[] = [`My name is ${name}, ${you}.`];
    if (v.link === 'alum') intro.push('As a fellow Trojan, I hoped you might be open to hearing from a current student.');
    if (v.link === 'mutual') intro.push(`${linkExtra || '[name]'} suggested I reach out to you.`);
    if (v.link === 'recruiter') intro.push(`I am very interested in ${linkExtra || '[the role]'}.`);
    lines.push(intro.join(' '), '');

    const why = val(v, 'why') ? stripEnd(val(v, 'why')) : '[why this person, specifically]';
    lines.push(`I'm reaching out because ${why}.`, '');

    const q = stripEnd(val(v, 'askExtra'));
    const asks: Record<string, string> = {
      call: 'Would you be open to a 15 to 20 minute call in the coming weeks? I am happy to work around your schedule.',
      question: `Would you be willing to share your perspective on one question: ${q ? q + '?' : '[your question]'}`,
      process: 'Could you share what you look for in candidates for this role, or the best way for me to be considered?',
    };
    lines.push(`${asks[v.ask] ?? asks.call} If now is not a good time, I completely understand.`, '');
    lines.push('Thank you for considering it.');

    lines.push('', 'Best,', name);
    return lines.join('\n');
  },
  warnings(v) {
    const msgs: string[] = [];
    const why = val(v, 'why');
    if (!why) msgs.push("Add why you're contacting this person specifically. This is what earns a reply.");
    else if (words(why) < 8) msgs.push('Make "Why this person" more specific: what about their path or work connects to your question?');
    msgs.push(...dynamicWarnings(outreach, v));
    const text = this.compose(v);
    if (hasBrackets(text)) msgs.push('Fill in the [brackets] before sending.');
    if (wordCount(text) > 150) msgs.push('This is getting long. Cut it so it reads in under a minute.');
    return msgs;
  },
};

export const TEMPLATES: Record<string, Template> = { followup, outreach };
