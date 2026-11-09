import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// One Markdown file per playbook. The fields below are enforced at build time,
// so a playbook missing a required field fails the build instead of shipping broken.
// No "last reviewed" dates: content must be written so it never needs review.
const playbooks = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/playbooks' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    stages: z.array(z.enum(['explore', 'discover', 'network', 'apply', 'interview', 'follow-up'])),
    pillar: z.enum(['apply', 'expand']),
    courseSkills: z.array(z.string()),
    minutes: z.number(),
    order: z.number(),
    next: z.string().optional(),
    // "At a glance" box at the top: what to do, without opening anything.
    whenToUse: z.string().optional(),
    quickSteps: z.array(z.object({ label: z.string(), detail: z.string() })).optional(),
    courseLine: z.string().optional(),
    cta: z.object({ label: z.string(), href: z.string() }).optional(),
  }),
});

export const collections = { playbooks };
