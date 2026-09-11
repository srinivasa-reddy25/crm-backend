const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function load(relative, deps) {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', relative), 'utf8'), {
    module, exports: module.exports, require: name => { if (!(name in deps)) throw new Error(name); return deps[name]; },
    process: { env: { OPENAI_API_KEY: 'test-key' } }, console: { log() {}, error() {} }
  });
  return module.exports;
}
function service(post) {
  return load('services/aiService.js', { axios: { post }, './aiContext': { getCrmContextForAi: async () => 'Test context' } });
}
test('successful AI response is returned and request has a timeout', async () => {
  const ai = service(async (url, body, config) => {
    assert.equal(config.timeout, 30000);
    assert.equal(body.messages[1].content, 'hello');
    return { data: { choices: [{ message: { content: ' OK ' } }] } };
  });
  assert.equal(await ai.processWithAI('hello', 'u', 'c'), 'OK');
});
test('quota rejection is surfaced, not saved as a fake assistant reply', async () => {
  const ai = service(async () => { throw { response: { status: 429, data: { error: { code: 'insufficient_quota', message: 'No credits remaining' } } } }; });
  await assert.rejects(ai.processWithAI('hello', 'u', 'c'), error => error.code === 'AI_QUOTA_EXHAUSTED' && /credits/.test(error.message));
});
test('timeouts and empty responses produce retryable errors', async () => {
  await assert.rejects(service(async () => { throw { code: 'ECONNABORTED' }; }).processWithAI('hello', 'u', 'c'), /too long/);
  await assert.rejects(service(async () => ({ data: { choices: [] } })).processWithAI('hello', 'u', 'c'), /could not complete/);
});
function socketHarness(processWithAI) {
  let connect;
  const saved = [];
  class Server { use() {} on(name, callback) { if (name === 'connection') connect = callback; } }
  const setup = load('sockets/chatHandlers.js', {
    'socket.io': { Server },
    '../middleware/socketAuth': () => {},
    '../services/chatService': { saveMessage: async (user, message, sender) => { saved.push({ message, sender }); return { conversationId: 'c1', message, sender }; } },
    '../services/aiService': { processWithAI },
    '../models/chatMessage': { ChatMessage: {} }, '../models/Conversation': { Conversation: {} }
  });
  setup({});
  const handlers = {}, events = [];
  const socket = { user: { uid: 'u1' }, data: {}, on: (name, callback) => { handlers[name] = callback; }, emit: (name, payload) => events.push({ name, payload }) };
  connect(socket);
  return { socket, handlers, events, saved };
}
test('new conversation is acknowledged and a real reply is emitted', async () => {
  const h = socketHarness(async () => 'OK'); let ack;
  await h.handlers['send-message']({ message: 'hello', conversationId: 'new' }, result => { ack = result; });
  assert.equal(ack.conversationId, 'c1');
  assert.equal(ack.ok, true);
  assert.equal(h.events.find(event => event.name === 'new-message').payload.message, 'OK');
  assert.equal(h.events.at(-1).payload, false);
  assert.equal(h.saved.length, 2);
});
test('AI failure always clears waiting state and emits a visible error', async () => {
  const h = socketHarness(async () => { const error = new Error('No API credits'); error.code = 'AI_QUOTA_EXHAUSTED'; throw error; });
  await h.handlers['send-message']({ message: 'hello', conversationId: 'new' });
  assert.equal(h.saved.length, 1);
  assert.equal(h.events.find(event => event.name === 'error-message').payload.code, 'AI_QUOTA_EXHAUSTED');
  assert.equal(h.events.at(-1).payload, false);
  assert.equal(h.socket.data.processing, false);
});
