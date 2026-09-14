const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Contact } = require('../models/Contact');
const { withContactCounts } = require('../services/tagCounts');

test('tag counts use current owner assignments, replace stale counters and include unused tags', async t => {
    t.mock.method(Contact, 'aggregate', async pipeline => {
        assert.deepEqual(pipeline[0], { $match: { createdBy: 'owner-id' } });
        assert.deepEqual(pipeline[1].$project.tags, { $setUnion: [{ $ifNull: ['$tags', []] }, []] });
        return [{ _id: 'used', count: 3 }];
    });
    const tags = [{ _id: 'used', usageCount: 99 }, { _id: 'unused', usageCount: 8 }];
    const result = await withContactCounts(tags, 'owner-id');
    assert.deepEqual(result.map(tag => tag.usageCount), [3, 0]);
    assert.equal(tags[0].usageCount, 99);
});

test('no contacts produces zero counts for every tag', async t => {
    t.mock.method(Contact, 'aggregate', async () => []);
    assert.deepEqual(await withContactCounts([{ _id: 'tag', usageCount: 5 }], 'owner'), [{ _id: 'tag', usageCount: 0 }]);
});
