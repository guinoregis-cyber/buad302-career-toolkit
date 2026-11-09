export const STAGES = {
  explore: 'Explore',
  discover: 'Discover',
  network: 'Network',
  apply: 'Apply',
  interview: 'Interview',
  'follow-up': 'Follow up',
} as const;

export type Stage = keyof typeof STAGES;

// Home page: each stage written as a need, in journey order.
export const STAGE_NEEDS: { id: Stage; need: string; blurb: string }[] = [
  { id: 'explore', need: 'Figure out which careers fit you', blurb: 'Compare roles and industries before you commit.' },
  { id: 'discover', need: 'Find opportunities', blurb: 'Look beyond one job board for employers and openings.' },
  { id: 'network', need: 'Reach out and build connections', blurb: 'Contact people, prepare for conversations, make them count.' },
  { id: 'apply', need: 'Apply strategically', blurb: 'Tailor your materials and choose where to spend your effort.' },
  { id: 'interview', need: 'Prepare for interviews', blurb: 'Research the employer and practice your stories.' },
  { id: 'follow-up', need: 'Follow up and keep in touch', blurb: 'Turn conversations into relationships that last.' },
];

export const PILLARS = {
  apply: 'Applies BUAD 302 skills',
  expand: 'Beyond BUAD 302',
} as const;
