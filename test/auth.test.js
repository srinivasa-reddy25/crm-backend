const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(file, deps) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
    module, exports: module.exports, require: name => deps[name], console: { error() {} },
  });
  return module.exports;
}
const identity = { uid: 'firebase-user', email: 'test@example.invalid', emailVerified: true, name: 'Test User' };
function accountService(User, activity = async () => {}) {
  return load('services/authAccount.js', { '../models/User': User, '../models/Activities': { Activity: { create: activity } } });
}
test('unverified identities cannot create or relink CRM accounts', async () => {
  const service = accountService({ findOne: () => { throw new Error('must not query'); } });
  await assert.rejects(service.syncAuthAccount({ ...identity, emailVerified: false }), e => e.status === 403);
});
test('verified account creation retries return the same CRM account', async () => {
  let user, creations = 0;
  const service = accountService({ findOne: async () => user, create: async data => { creations++; return user = { _id: 'crm-user', ...data }; } });
  assert.equal((await service.syncAuthAccount(identity)).isNewUser, true);
  assert.equal((await service.syncAuthAccount(identity)).isNewUser, false);
  assert.equal(creations, 1);
});
test('verified users recover a previous CRM account without losing its identity', async () => {
  let saved = false;
  const existing = { _id: 'existing-crm-user', email: identity.email, firebaseUID: 'old-project-uid', save: async () => { saved = true; } };
  const service = accountService({ findOne: async query => query.email ? existing : null });
  const result = await service.syncAuthAccount(identity);
  assert.equal(result.user._id, 'existing-crm-user');
  assert.equal(result.user.firebaseUID, identity.uid);
  assert.equal(saved, true);
});
test('activity logging failure does not fail a valid login', async () => {
  const service = accountService({ findOne: async () => ({ _id: 'crm-user' }) }, async () => { throw new Error('activity unavailable'); });
  assert.equal((await service.syncAuthAccount(identity)).user._id, 'crm-user');
});
for (const [name, token, expected] of [
  ['unverified token', { uid: 'u', email: identity.email, email_verified: false }, 403],
  ['verified token', { uid: 'u', email: identity.email, email_verified: true }, 200],
]) {
  test(`HTTP access handles ${name}`, async () => {
    let status;
    const middleware = load('middleware/auth.js', { '../config/firebase': { auth: () => ({ verifyIdToken: async (value, revoked) => { assert.equal(revoked, true); return token; } }) } });
    await middleware({ headers: { authorization: 'Bearer test' } }, { status: value => { status = value; return { json() {} }; } }, () => { status = 200; });
    assert.equal(status, expected);
  });
}
test('expired or revoked tokens return a session error', async () => {
  let status;
  const middleware = load('middleware/auth.js', { '../config/firebase': { auth: () => ({ verifyIdToken: async () => { throw new Error('revoked'); } }) } });
  await middleware({ headers: { authorization: 'Bearer test' } }, { status: value => { status = value; return { json() {} }; } }, () => assert.fail('must reject'));
  assert.equal(status, 401);
});
test('chat rejects unverified email tokens before loading CRM data', async () => {
  const middleware = load('middleware/socketAuth.js', { 'firebase-admin': { auth: () => ({ verifyIdToken: async () => ({ email_verified: false }) }) }, '../models/User': { findOne: () => assert.fail('must reject before querying') } });
  await middleware({ handshake: { auth: { token: 'test' } } }, error => assert.match(error.message, /Verify your email/));
});
test('restoring a session does not inflate login activity counts', async () => {
  const service = accountService({ findOne: async () => ({ _id: 'crm-user' }) }, async () => assert.fail('no login event on restore'));
  await service.syncAuthAccount(identity, {}, { recordLogin: false });
});
