#!/usr/bin/env node
const fs = require('fs');

const ALLOWED_ICONS = new Set([
  'heart', 'shield-check', 'sparkles', 'chat', 'users', 'lock', 'check', 'star',
  'search', 'lightbulb', 'user-plus', 'calendar', 'question-mark', 'envelope',
]);
const ALLOWED_ROLES = new Set(['user', 'assistant']);

function fail(message) {
  throw new Error(message);
}

function validateIcon(icon, label, required = false) {
  if (icon === undefined) {
    if (required) fail(`${label} is required`);
    return;
  }
  if (!ALLOWED_ICONS.has(icon)) {
    fail(`${label} "${icon}" is not one of: ${[...ALLOWED_ICONS].join(', ')}`);
  }
}

function assertNoEmoji(value, path = 'landingPage') {
  if (typeof value === 'string') {
    if (/\p{Extended_Pictographic}/u.test(value)) {
      fail(`${path} must not contain emoji; use a supported icon key instead`);
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoEmoji(item, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      if (key === 'emoji') fail(`${path}.emoji is no longer supported; use ${path}.icon`);
      assertNoEmoji(item, `${path}.${key}`);
    });
  }
}

function validate(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (parsed.schemaVersion !== 2) fail('schemaVersion must be 2');
  if (!parsed.resourceKey || !String(parsed.resourceKey).trim()) fail('resourceKey is required');
  if (parsed.runtimeDataPolicy !== 'definitions_only') fail('runtimeDataPolicy must be "definitions_only"');

  const landingPage = parsed.landingPage;
  if (!landingPage || typeof landingPage !== 'object') fail('landingPage object is required');
  if (!landingPage.headline || !String(landingPage.headline).trim()) fail('landingPage.headline is required');
  assertNoEmoji(landingPage);

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
      validateIcon(feature.icon, `${label}.icon`);
    });
  }

  if (landingPage.gallery !== undefined) {
    const gallery = landingPage.gallery;
    if (!gallery || typeof gallery !== 'object') fail('landingPage.gallery must be an object');
    validateIcon(gallery.icon, 'landingPage.gallery.icon');
    if (!gallery.heading || !String(gallery.heading).trim()) fail('landingPage.gallery.heading is required');
    if (gallery.headingAccent !== undefined && typeof gallery.headingAccent !== 'string') {
      fail('landingPage.gallery.headingAccent must be a string');
    }
    if (gallery.headingAccent && !gallery.heading.includes(gallery.headingAccent)) {
      fail('landingPage.gallery.headingAccent must be a substring of landingPage.gallery.heading');
    }
    if (gallery.body !== undefined && typeof gallery.body !== 'string') fail('landingPage.gallery.body must be a string');
    if (!Array.isArray(gallery.items) || gallery.items.length === 0) fail('landingPage.gallery.items must be a non-empty array');
    gallery.items.forEach((item, index) => {
      const label = `landingPage.gallery.items[${index}]`;
      if (!item || typeof item !== 'object') fail(`${label} must be an object`);
      for (const key of ['image', 'alt', 'caption']) {
        if (!item[key] || !String(item[key]).trim()) fail(`${label}.${key} is required`);
      }
    });
  }

  if (landingPage.bento !== undefined) {
    const bento = landingPage.bento;
    if (!bento || typeof bento !== 'object') fail('landingPage.bento must be an object');
    for (const key of ['photoTall', 'photoWide']) {
      const photo = bento[key];
      if (!photo || typeof photo !== 'object') fail(`landingPage.bento.${key} must be an object`);
      for (const field of ['image', 'alt', 'name', 'meta']) {
        if (!photo[field] || !String(photo[field]).trim()) fail(`landingPage.bento.${key}.${field} is required`);
      }
    }
    for (const key of ['mainCard', 'ctaCard', 'smallCardA', 'smallCardB']) {
      const card = bento[key];
      if (!card || typeof card !== 'object') fail(`landingPage.bento.${key} must be an object`);
      validateIcon(card.icon, `landingPage.bento.${key}.icon`, true);
      for (const field of ['title', 'body']) {
        if (!card[field] || !String(card[field]).trim()) fail(`landingPage.bento.${key}.${field} is required`);
      }
    }
    if (!bento.ctaCard.ctaLabel || !String(bento.ctaCard.ctaLabel).trim()) {
      fail('landingPage.bento.ctaCard.ctaLabel is required');
    }
    if (bento.mainCard.tags !== undefined) {
      if (!Array.isArray(bento.mainCard.tags)) fail('landingPage.bento.mainCard.tags must be an array');
      bento.mainCard.tags.forEach((tag, index) => {
        if (typeof tag !== 'string' || !tag.trim()) fail(`landingPage.bento.mainCard.tags[${index}] must be a non-empty string`);
      });
    }
  }

  if (landingPage.howItWorks !== undefined) {
    const howItWorks = landingPage.howItWorks;
    if (!howItWorks || typeof howItWorks !== 'object') fail('landingPage.howItWorks must be an object');
    validateIcon(howItWorks.icon, 'landingPage.howItWorks.icon');
    for (const key of ['kicker', 'heading']) {
      if (!howItWorks[key] || !String(howItWorks[key]).trim()) fail(`landingPage.howItWorks.${key} is required`);
    }
    if (howItWorks.headingAccent !== undefined && typeof howItWorks.headingAccent !== 'string') {
      fail('landingPage.howItWorks.headingAccent must be a string');
    }
    if (howItWorks.headingAccent && !howItWorks.heading.includes(howItWorks.headingAccent)) {
      fail('landingPage.howItWorks.headingAccent must be a substring of landingPage.howItWorks.heading');
    }
    if (!Array.isArray(howItWorks.steps) || howItWorks.steps.length === 0) {
      fail('landingPage.howItWorks.steps must be a non-empty array');
    }
    howItWorks.steps.forEach((step, index) => {
      const label = `landingPage.howItWorks.steps[${index}]`;
      if (!step || typeof step !== 'object') fail(`${label} must be an object`);
      validateIcon(step.icon, `${label}.icon`, true);
      for (const key of ['title', 'body']) {
        if (!step[key] || !String(step[key]).trim()) fail(`${label}.${key} is required`);
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

  if (landingPage.stories !== undefined) {
    const stories = landingPage.stories;
    if (!stories || typeof stories !== 'object') fail('landingPage.stories must be an object');
    validateIcon(stories.icon, 'landingPage.stories.icon');
    for (const key of ['heading', 'quote', 'attribution']) {
      if (!stories[key] || !String(stories[key]).trim()) fail(`landingPage.stories.${key} is required`);
    }
    for (const key of ['kicker', 'meta']) {
      if (stories[key] !== undefined && typeof stories[key] !== 'string') {
        fail(`landingPage.stories.${key} must be a string`);
      }
    }
    if (stories.people !== undefined) {
      if (!Array.isArray(stories.people)) fail('landingPage.stories.people must be an array');
      stories.people.forEach((person, index) => {
        const label = `landingPage.stories.people[${index}]`;
        if (!person || typeof person !== 'object') fail(`${label} must be an object`);
        if (!person.image || !String(person.image).trim()) fail(`${label}.image is required`);
        if (!person.alt || !String(person.alt).trim()) fail(`${label}.alt is required`);
      });
    }
    if (stories.stats !== undefined) {
      if (!Array.isArray(stories.stats)) fail('landingPage.stories.stats must be an array');
      stories.stats.forEach((stat, index) => {
        const label = `landingPage.stories.stats[${index}]`;
        if (!stat || typeof stat !== 'object') fail(`${label} must be an object`);
        if (!stat.value || !String(stat.value).trim()) fail(`${label}.value is required`);
        if (!stat.label || !String(stat.label).trim()) fail(`${label}.label is required`);
        validateIcon(stat.icon, `${label}.icon`);
      });
    }
  }

  if (landingPage.faqIntro !== undefined) {
    const faqIntro = landingPage.faqIntro;
    if (!faqIntro || typeof faqIntro !== 'object') fail('landingPage.faqIntro must be an object');
    validateIcon(faqIntro.icon, 'landingPage.faqIntro.icon');
    if (!faqIntro.heading || !String(faqIntro.heading).trim()) fail('landingPage.faqIntro.heading is required');
    if (faqIntro.kicker !== undefined && typeof faqIntro.kicker !== 'string') {
      fail('landingPage.faqIntro.kicker must be a string');
    }
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

  if (landingPage.backgroundVideo !== undefined) {
    const backgroundVideo = landingPage.backgroundVideo;
    if (!backgroundVideo || typeof backgroundVideo !== 'object') fail('landingPage.backgroundVideo must be an object');
    if (!backgroundVideo.src || !String(backgroundVideo.src).trim()) fail('landingPage.backgroundVideo.src is required');
    if (backgroundVideo.poster !== undefined && typeof backgroundVideo.poster !== 'string') {
      fail('landingPage.backgroundVideo.poster must be a string');
    }
  }

  if (landingPage.backgroundImage !== undefined) {
    const backgroundImage = landingPage.backgroundImage;
    if (!backgroundImage || typeof backgroundImage !== 'object') fail('landingPage.backgroundImage must be an object');
    if (!backgroundImage.src || !String(backgroundImage.src).trim()) fail('landingPage.backgroundImage.src is required');
    if (backgroundImage.alt !== undefined && typeof backgroundImage.alt !== 'string') {
      fail('landingPage.backgroundImage.alt must be a string');
    }
  }

  if (landingPage.backgroundVideo !== undefined && landingPage.backgroundImage !== undefined) {
    fail('landingPage must use either backgroundVideo or backgroundImage, not both');
  }

  if (landingPage.closing !== undefined) {
    const closing = landingPage.closing;
    if (!closing || typeof closing !== 'object') fail('landingPage.closing must be an object');
    if (!closing.heading || !String(closing.heading).trim()) fail('landingPage.closing.heading is required');
    for (const key of ['kicker', 'body', 'ctaLabel']) {
      if (closing[key] !== undefined && typeof closing[key] !== 'string') {
        fail(`landingPage.closing.${key} must be a string`);
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
