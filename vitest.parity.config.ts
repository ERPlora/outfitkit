/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
// @ts-expect-error The suite splitter is JavaScript: CI scripts consume it too.
import { splitTestFiles } from './scripts/test-suites.mjs';

// PARITY suite (outfitkit#66).
//
// These tests compare each showcase demo against the REAL code it reproduces, which lives in a
// sibling repo of the monorepo (`hub/`, `saas/`, `modules-workspace/modules/<id>`). They are the
// only ones that leave this repo, so they stay out of the hermetic gate and get their own CI job,
// which clones what they compare against first.
//
// House rule: a suite must be AUDIBLE. If it cannot run, it says so and fails — no silent
// self-skipping, which is precisely the hole outfitkit#66 came to close. Hence `globalSetup`
// checks the checkouts BEFORE importing anything and spells out what is missing.
export default defineConfig({
  plugins: [Icons({ compiler: 'raw' })],
  test: {
    include: splitTestFiles(__dirname).parity,
    globalSetup: ['./scripts/assert-parity-checkouts.mjs'],
    environment: 'node',
  },
});
