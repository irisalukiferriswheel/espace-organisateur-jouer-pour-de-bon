const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCauseSubmission, hasConfirmedCauseSubmission, toMinorUnits, validate } = require('./cause-form');

test('parses exact currency amounts without floating point rounding', () => {
  assert.equal(toMinorUnits('10.02'), 1002);
  assert.equal(toMinorUnits('10.001'), null);
});

test('requires an exact-cent 50/50 event fee split', () => {
  const result = validate({
    causeName: 'Community kitchen', causeDescriptionEn: 'A community kitchen serving local families.',
    fee: '10.01', currency: 'CAD', causeGoalAmount: '5000', causeGoalCurrency: 'CAD'
  });
  assert.equal(result.valid, false);
  assert.equal(result.errors.fee, 'feeEvenSplit');
});

test('accepts either localized description and preserves its locale', () => {
  const values = {
    causeName: 'Community kitchen', causeDescriptionEn: 'A community kitchen serving local families.',
    fee: '10.00', currency: 'CAD', causeGoalAmount: '5000', causeGoalCurrency: 'CAD'
  };
  assert.equal(validate(values).valid, true);
  assert.deepEqual(buildCauseSubmission(values, 'fr'), {
    causeName: 'Community kitchen',
    causeDescription: 'A community kitchen serving local families.',
    causeDescriptionLocale: 'en',
    causeDescriptions: { en: 'A community kitchen serving local families.' },
    causeGoalAmount: '5000.00',
    causeGoalCurrency: 'CAD',
    causeApprovalStatus: 'pending'
  });
});

test('only treats an explicit cause acknowledgement as success', () => {
  assert.equal(hasConfirmedCauseSubmission({ event: { id: 'event-1' } }), false);
  assert.equal(hasConfirmedCauseSubmission({ causeSubmission: { status: 'pending' } }), true);
  assert.equal(hasConfirmedCauseSubmission({ causeSubmission: { status: 'approved' } }), true);
});

test('rejects ambiguous cross-currency contribution accounting', () => {
  const result = validate({
    causeName: 'Community kitchen', causeDescriptionEn: 'A community kitchen serving local families.',
    fee: '10.00', currency: 'USD', causeGoalAmount: '5000', causeGoalCurrency: 'CAD'
  });
  assert.equal(result.errors.causeGoalCurrency, 'currencyMismatch');
});
