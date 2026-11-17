import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  convertCents, countryFromAcceptLanguage, detectCurrency, displayPrice, parseUsd, splitSale,
} from '../src/lib/market/price.ts';

const rates = { USD: 1, AZN: 1.7, EUR: 0.92, TRY: 34.5, UZS: 12800 };

test('Azerbaijan visitors get AZN, others their own currency', () => {
  assert.equal(detectCurrency('AZ'), 'AZN');
  assert.equal(detectCurrency('az'), 'AZN');
  assert.equal(detectCurrency('DE'), 'EUR');
  assert.equal(detectCurrency('TR'), 'TRY');
  assert.equal(detectCurrency('US'), 'USD');
});

test('unknown country falls back to Accept-Language, then USD', () => {
  assert.equal(detectCurrency('', 'tr-TR,tr;q=0.9'), 'TRY');
  assert.equal(detectCurrency('XX', 'az'), 'AZN');
  assert.equal(detectCurrency(null, 'en-GB,en;q=0.8'), 'GBP');
  assert.equal(detectCurrency('ZZ', 'xx'), 'USD');
  assert.equal(detectCurrency(undefined, undefined), 'USD');
});

test('Accept-Language: region wins over language', () => {
  assert.equal(countryFromAcceptLanguage('ru-KZ,ru;q=0.9'), 'KZ');
  assert.equal(countryFromAcceptLanguage('ru,en;q=0.5'), 'RU');
  assert.equal(countryFromAcceptLanguage(''), null);
});

test('conversion uses the rate, null when missing', () => {
  assert.equal(convertCents(500, 'USD', rates), 5);
  assert.equal(convertCents(500, 'AZN', rates), 8.5);
  assert.equal(convertCents(500, 'GEL', rates), null);
});

test('display: exact USD, ≈ local, USD fallback', () => {
  assert.equal(displayPrice(500, 'USD', rates).text, '$5');
  const azn = displayPrice(500, 'AZN', rates, 'az');
  assert.equal(azn.approx, true);
  assert.match(azn.text, /^≈ /);
  assert.match(azn.text, /8,50|8\.50/);
  const missing = displayPrice(499, 'GEL', rates);
  assert.equal(missing.currency, 'USD');
  assert.equal(missing.text, '$4.99');
  assert.match(displayPrice(500, 'UZS', rates).text, /64[,.   ]?000/);
});

test('20% platform fee split, whole cents', () => {
  assert.deepEqual(splitSale(500), { gross: 500, fee: 100, net: 400 });
  assert.deepEqual(splitSale(499), { gross: 499, fee: 100, net: 399 });
  assert.deepEqual(splitSale(1, 20), { gross: 1, fee: 0, net: 1 });
  assert.deepEqual(splitSale(1000, 0), { gross: 1000, fee: 0, net: 1000 });
});

test('creator price input', () => {
  assert.equal(parseUsd('4.99'), 499);
  assert.equal(parseUsd('4,99'), 499);
  assert.equal(parseUsd('$5'), 500);
  assert.equal(parseUsd('0.50'), null); // below $1
  assert.equal(parseUsd('600'), null); // above $500
  assert.equal(parseUsd('abc'), null);
});
