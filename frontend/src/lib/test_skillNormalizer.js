/**
 * test_skillNormalizer.js
 * Run with node to test the frontend skill normalization logic
 */

import assert from 'node:assert';
import { normalizeSingleSkill, normalizeSkills } from './skillNormalizer.ts';

console.log('Running Frontend Skill Normalizer Tests...');

// 1. Manual skills without resume
const manualSkills = [
  { name: 'Python', category: 'prog_tech', proficiency: 'advanced' },
  { name: 'SQL', category: 'prog_tech', proficiency: 'intermediate' },
  { name: 'Data Analysis', category: 'analytics' }
];
assert.deepStrictEqual(normalizeSkills(manualSkills), ['Python', 'SQL', 'Data Analysis']);
console.log('✓ Test 1 Passed: Manual skills without resume');

// 2. Resume skills without manual skills
const resumeSkills = ['TypeScript', 'React', 'Docker', 'AWS'];
assert.deepStrictEqual(normalizeSkills(resumeSkills), ['TypeScript', 'React', 'Docker', 'AWS']);
console.log('✓ Test 2 Passed: Resume skills without manual skills');

// 3. Both manual and resume skills
const combined = normalizeSkills([...resumeSkills, ...manualSkills, { name: 'python' }]);
assert.deepStrictEqual(combined, ['TypeScript', 'React', 'Docker', 'AWS', 'Python', 'SQL', 'Data Analysis']);
console.log('✓ Test 3 Passed: Both manual and resume skills');

// 4. Custom skills container
const seContainer = {
  skills: [
    { name: 'Java', category: 'prog_tech' },
    { name: 'Spring Boot', category: 'backend' }
  ],
  custom_skills: ['Solidity', 'Smart Contracts', 'Web3.js']
};
assert.deepStrictEqual(normalizeSkills(seContainer), ['Java', 'Spring Boot', 'Solidity', 'Smart Contracts', 'Web3.js']);
console.log('✓ Test 4 Passed: Custom skills container');

// 5. Empty skills
assert.deepStrictEqual(normalizeSkills([]), []);
assert.deepStrictEqual(normalizeSkills(null), []);
assert.deepStrictEqual(normalizeSkills(undefined), []);
assert.deepStrictEqual(normalizeSkills(''), []);
assert.deepStrictEqual(normalizeSkills('   '), []);
assert.deepStrictEqual(normalizeSkills({}), []);
assert.deepStrictEqual(normalizeSkills({ skills: [], custom_skills: [] }), []);
console.log('✓ Test 5 Passed: Empty skills');

// 6. Duplicate skills with different capitalization
const duplicates = ['python', 'Python', 'PYTHON', 'PyThon', 'react.js', 'React.JS'];
assert.deepStrictEqual(normalizeSkills(duplicates), ['python', 'react.js']);
console.log('✓ Test 6 Passed: Duplicate skills with different capitalization');

// 7. Structured skill objects
const objects = [
  { name: 'Machine Learning' },
  { skill_name: 'Deep Learning' },
  { skill: 'NLP' },
  { title: 'Computer Vision' },
  { label: 'TensorFlow' }
];
assert.deepStrictEqual(normalizeSkills(objects), ['Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow']);
console.log('✓ Test 7 Passed: Structured skill objects');

// 8. Unexpected or malformed skill values
const malformed = [
  null,
  undefined,
  '',
  '   ',
  {},
  { name: '' },
  101,
  ['Nested Skill', '  Another  '],
  { name: '  Valid Skill With Whitespace  ' }
];
const normMalformed = normalizeSkills(malformed);
assert.ok(normMalformed.includes('101'));
assert.ok(normMalformed.includes('Nested Skill'));
assert.ok(normMalformed.includes('Another'));
assert.ok(normMalformed.includes('Valid Skill With Whitespace'));
assert.ok(!normMalformed.includes(''));
console.log('✓ Test 8 Passed: Unexpected or malformed skill values');

console.log('\nAll 8 Frontend Normalization Tests Passed Successfully! (8/8)');
