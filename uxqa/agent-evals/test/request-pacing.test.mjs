import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequestPacer,evalOutputNames} from '../request-pacing.mjs';
import {createClient} from '../neos-api.mjs';

test('pacing waits after completed requests and preserves the measured minimum without replay',async()=>{
 let clock=0;const waits=[];
 const pacer=createRequestPacer(2000,{now:()=>clock,wait:async ms=>{waits.push(ms);clock+=ms;}});
 assert.equal(await pacer.before(),0);
 clock=100;pacer.complete();clock=600;
 assert.equal(await pacer.before(),1500);
 assert.equal(clock,2100);
 pacer.complete();clock=5000;
 assert.equal(await pacer.before(),0);
 assert.deepEqual(waits,[1500]);
 for(const value of [-1,30001,1.5,NaN])assert.throws(()=>createRequestPacer(value));
});

test('attempt output names separate results and judges and cannot escape the pass directory',()=>{
 assert.deepEqual(evalOutputNames({runLabel:'retry-01'}),{result:'agent-eval-retry-01.json',judge:'agent-eval-retry-01-judge.json'});
 assert.deepEqual(evalOutputNames({resultFile:'new-attempt.json'}),{result:'new-attempt.json',judge:'new-attempt-judge.json'});
 assert.deepEqual(evalOutputNames(),{result:'agent-eval.json',judge:'agent-eval-judge.json'});
 for(const resultFile of ['../agent-eval.json','sub/attempt.json','C:\\secret.json','a..json','attempt.txt'])assert.throws(()=>evalOutputNames({resultFile}));
 for(const runLabel of ['../x','with space','', 'x'.repeat(65)])assert.throws(()=>evalOutputNames({runLabel}));
});

test('the harness never retries a failed whole chat request',async t=>{
 const fetch=t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({error:'Temporarily unavailable'}),{status:429,headers:{'content-type':'application/json'}}));
 const client=createClient('http://localhost:5173',new Map([['qa-agent-ana','private-test-cookie']]),{chatPaceMs:0});
 await assert.rejects(client.chat('qa-agent-ana',{message:'Record my advice'}),/chat HTTP 429/);
 assert.equal(fetch.mock.calls.length,1);
 assert.equal(client.stats.requests,1);
});
