const { getSchoolYear } = require('./schoolYear');

let passed = 0;
let failed = 0;

function assert(label, actual, expected) {
  if (actual === expected) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label} — attendu "${expected}", reçu "${actual}"`);
    failed++;
  }
}

console.log('Tests getSchoolYear()\n');

// Septembre → début d'année scolaire
assert('1er sept 2025', getSchoolYear(new Date(2025, 8, 1)), '2025/2026');
assert('15 oct 2025',   getSchoolYear(new Date(2025, 9, 15)), '2025/2026');
assert('31 déc 2025',   getSchoolYear(new Date(2025, 11, 31)), '2025/2026');

// Janvier-Août → même année scolaire que le sept précédent
assert('1er jan 2026',  getSchoolYear(new Date(2026, 0, 1)), '2025/2026');
assert('15 mars 2026',  getSchoolYear(new Date(2026, 2, 15)), '2025/2026');
assert('30 juin 2026',  getSchoolYear(new Date(2026, 5, 30)), '2025/2026');
assert('31 août 2026',  getSchoolYear(new Date(2026, 7, 31)), '2025/2026');

// Cas limites
assert('1er sept 2026', getSchoolYear(new Date(2026, 8, 1)), '2026/2027');
assert('Sans argument (aujourd\'hui 23 mars 2026)', getSchoolYear(), '2025/2026');

console.log(`\nRésultat: ${passed} passés, ${failed} échoués`);
process.exit(failed > 0 ? 1 : 0);
