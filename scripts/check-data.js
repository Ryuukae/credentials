// Fails when certificate data would break filtering or leave a modal section
// empty: unknown or repeated topics, a missing provider, duplicate ids, or a
// missing About text or Key Concepts list.
import { certificates, TOPIC } from '../src/scripts/data/certificates.js';

const known = new Set(Object.values(TOPIC));
const ids = new Set();
const errors = [];

for (const record of certificates) {
  const where = record.id ?? '(no id)';
  if (!record.id) errors.push('record without id');
  else if (ids.has(record.id)) errors.push(`${where}: duplicate id`);
  ids.add(record.id);

  if (!record.provider) errors.push(`${where}: missing provider`);
  if (!record.details?.description?.trim()) errors.push(`${where}: missing details.description`);
  if (!Array.isArray(record.details?.concepts) || record.details.concepts.length === 0) {
    errors.push(`${where}: details.concepts must be a non-empty array`);
  }
  if (!Array.isArray(record.topics) || record.topics.length === 0) {
    errors.push(`${where}: topics must be a non-empty array`);
    continue;
  }
  const seen = new Set();
  for (const topic of record.topics) {
    if (!known.has(topic)) errors.push(`${where}: unknown topic "${topic}"`);
    if (seen.has(topic)) errors.push(`${where}: repeated topic "${topic}"`);
    seen.add(topic);
  }
}

if (errors.length) {
  console.error(`Data check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Data check passed: ${certificates.length} records.`);
