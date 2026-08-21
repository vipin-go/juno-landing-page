#!/usr/bin/env node
const fs = require('fs');

const ALLOWED_ICONS = new Set([
  'heart', 'shield-check', 'sparkles', 'chat', 'users', 'lock', 'check', 'star',
]);

function fail(message) {
  throw new Error(message);
}

function validate(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (parsed.schemaVersion !== 2) fail('schemaVersion must be 2');
  if (!parsed.resourceKey || !String(parsed.resourceKey).trim()) fail('resourceKey is required');
  if (parsed.runtimeDataPolicy !== 'definitions_only') fail('runtimeDataPolicy must be "definitions_only"');

  const landingPage = parsed.landingPage;
  if (!landingPage || typeof landingPage !== 'object') fail('landingPage object is required');
  if (!landingPage.headline || !String(landingPage.headline).trim()) fail('landingPage.headline is required');

  if (landingPage.subheadline !== undefined && typeof landingPage.subheadline !== 'string') {
    fail('landingPage.subheadline must be a string');
  }
  if (landingPage.ctaLabel !== undefined && typeof landingPage.ctaLabel !== 'string') {
    fail('landingPage.ctaLabel must be a string');
  }

  const features = landingPage.features;
  if (features !== undefined) {
    if (!Array.isArray(features)) fail('landingPage.features must be an array');
    features.forEach((feature, index) => {
      const label = `landingPage.features[${index}]`;
      if (!feature || typeof feature !== 'object') fail(`${label} must be an object`);
      if (!feature.title || !String(feature.title).trim()) fail(`${label}.title is required`);
      if (!feature.body || !String(feature.body).trim()) fail(`${label}.body is required`);
      if (feature.icon !== undefined && !ALLOWED_ICONS.has(feature.icon)) {
        fail(`${label}.icon "${feature.icon}" is not one of: ${[...ALLOWED_ICONS].join(', ')}`);
      }
    });
  }
}

const filePath = process.argv[2] || 'assets/landing-page.json';
try {
  validate(filePath);
  console.log(`Valid landing page definition: ${filePath}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
