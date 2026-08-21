#!/usr/bin/env node
const fs = require('fs');

const ALLOWED_ICONS = new Set([
  'heart', 'shield-check', 'sparkles', 'chat', 'users', 'lock', 'check', 'star',
]);
const ALLOWED_ROLES = new Set(['user', 'assistant']);

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

  for (const key of ['badge', 'headlineAccent', 'headlineLine2', 'subheadline', 'ctaLabel', 'secondaryCtaLabel']) {
    if (landingPage[key] !== undefined && typeof landingPage[key] !== 'string') {
      fail(`landingPage.${key} must be a string`);
    }
  }
  if (landingPage.headlineAccent && !landingPage.headline.includes(landingPage.headlineAccent)) {
    fail('landingPage.headlineAccent must be a substring of landingPage.headline');
  }

  if (landingPage.featureTags !== undefined) {
    if (!Array.isArray(landingPage.featureTags)) fail('landingPage.featureTags must be an array');
    landingPage.featureTags.forEach((tag, index) => {
      if (typeof tag !== 'string' || !tag.trim()) fail(`landingPage.featureTags[${index}] must be a non-empty string`);
    });
  }

  if (landingPage.demoConversation !== undefined) {
    if (!Array.isArray(landingPage.demoConversation)) fail('landingPage.demoConversation must be an array');
    landingPage.demoConversation.forEach((message, index) => {
      const label = `landingPage.demoConversation[${index}]`;
      if (!message || typeof message !== 'object') fail(`${label} must be an object`);
      if (!ALLOWED_ROLES.has(message.role)) fail(`${label}.role must be "user" or "assistant"`);
      if (!message.text || !String(message.text).trim()) fail(`${label}.text is required`);
    });
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

  if (landingPage.faqs !== undefined) {
    if (!Array.isArray(landingPage.faqs)) fail('landingPage.faqs must be an array');
    landingPage.faqs.forEach((faq, index) => {
      const label = `landingPage.faqs[${index}]`;
      if (!faq || typeof faq !== 'object') fail(`${label} must be an object`);
      if (!faq.question || !String(faq.question).trim()) fail(`${label}.question is required`);
      if (!faq.answer || !String(faq.answer).trim()) fail(`${label}.answer is required`);
    });
  }

  if (landingPage.contact !== undefined) {
    const contact = landingPage.contact;
    if (!contact || typeof contact !== 'object') fail('landingPage.contact must be an object');
    for (const key of ['heading', 'body', 'email']) {
      if (contact[key] !== undefined && typeof contact[key] !== 'string') {
        fail(`landingPage.contact.${key} must be a string`);
      }
    }
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
