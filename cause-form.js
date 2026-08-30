(function exposeCauseForm(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.JPDBCauseForm = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCauseFormApi() {
  const SUPPORTED_CURRENCIES = new Set(['CAD', 'USD', 'EUR']);
  const SUPPORTED_LOCALES = new Set(['fr', 'en']);

  function trim(value) {
    return String(value ?? '').trim();
  }

  function toMinorUnits(value) {
    const normalized = trim(value);
    if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
    const [whole, fraction = ''] = normalized.split('.');
    const minorUnits = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
    return Number.isSafeInteger(minorUnits) ? minorUnits : null;
  }

  function validate(values) {
    const errors = {};
    const causeName = trim(values.causeName);
    const descriptionFr = trim(values.causeDescriptionFr);
    const descriptionEn = trim(values.causeDescriptionEn);
    const feeMinor = toMinorUnits(values.fee);
    const goalMinor = toMinorUnits(values.causeGoalAmount);

    if (causeName.length < 3) errors.causeName = 'causeName';
    if (!descriptionFr && !descriptionEn) errors.causeDescriptionFr = 'causeDescription';
    if (descriptionFr && descriptionFr.length < 20) errors.causeDescriptionFr = 'causeDescriptionShort';
    if (descriptionEn && descriptionEn.length < 20) errors.causeDescriptionEn = 'causeDescriptionShort';
    if (feeMinor === null || feeMinor <= 0) errors.fee = 'feePositive';
    else if (feeMinor % 2 !== 0) errors.fee = 'feeEvenSplit';
    if (goalMinor === null || goalMinor <= 0) errors.causeGoalAmount = 'goalPositive';
    if (!SUPPORTED_CURRENCIES.has(trim(values.causeGoalCurrency))) errors.causeGoalCurrency = 'currency';
    if (!SUPPORTED_CURRENCIES.has(trim(values.currency))) errors.currency = 'currency';
    if (SUPPORTED_CURRENCIES.has(trim(values.currency)) && SUPPORTED_CURRENCIES.has(trim(values.causeGoalCurrency)) && trim(values.currency) !== trim(values.causeGoalCurrency)) {
      errors.causeGoalCurrency = 'currencyMismatch';
    }

    if (values.date && values.startTime && values.endTime && values.endTime <= values.startTime) {
      errors.endTime = 'endAfterStart';
    }

    if (values.registrationDeadline && values.date && values.startTime) {
      const deadline = new Date(values.registrationDeadline);
      const start = new Date(`${values.date}T${values.startTime}`);
      if (!Number.isNaN(deadline.getTime()) && !Number.isNaN(start.getTime()) && deadline >= start) {
        errors.registrationDeadline = 'deadlineBeforeStart';
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  function buildCauseSubmission(values, language) {
    const locale = SUPPORTED_LOCALES.has(language) ? language : 'fr';
    const descriptionFr = trim(values.causeDescriptionFr);
    const descriptionEn = trim(values.causeDescriptionEn);
    const descriptions = {};
    if (descriptionFr) descriptions.fr = descriptionFr;
    if (descriptionEn) descriptions.en = descriptionEn;
    const primaryLocale = descriptions[locale] ? locale : (descriptions.fr ? 'fr' : 'en');

    return {
      causeName: trim(values.causeName),
      causeDescription: descriptions[primaryLocale],
      causeDescriptionLocale: primaryLocale,
      causeDescriptions: descriptions,
      causeGoalAmount: (toMinorUnits(values.causeGoalAmount) / 100).toFixed(2),
      causeGoalCurrency: trim(values.causeGoalCurrency),
      causeApprovalStatus: 'pending'
    };
  }

  function hasConfirmedCauseSubmission(payload) {
    const status = trim(payload?.causeSubmission?.status).toLowerCase();
    return status === 'pending' || status === 'approved';
  }

  return { buildCauseSubmission, hasConfirmedCauseSubmission, toMinorUnits, validate };
});
