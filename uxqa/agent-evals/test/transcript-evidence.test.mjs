import assert from 'node:assert/strict';
import {test} from 'node:test';
import {captureToolData} from '../transcript-evidence.mjs';

test('the model-visible bound retains trailing queue totals that the old preview lost',()=>{
 const data={items:[{title:'Queue item',body:'x'.repeat(5000)}],count:26};
 const captured=captureToolData(data);
 assert.deepEqual(captured,data);
 assert.equal(captured.count,26);
});

test('overflow preserves safe typed totals and bounded record context',()=>{
 const data={body:'x'.repeat(9000),count:26,title:'t'.repeat(1000),ecosystem:'Garden',private_field:'not copied into facts'};
 const captured=captureToolData(data);
 assert.equal(captured.preview.length,6000);
 assert.equal(captured.retainedFacts.count,26);
 assert.equal(captured.retainedFacts.title.length,180);
 assert.equal(captured.retainedFacts.ecosystem,'Garden');
 assert.equal(captured.retainedFacts.private_field,undefined);
 assert.equal(captured.overflow.modelDataChars,JSON.stringify(data).length);
});
