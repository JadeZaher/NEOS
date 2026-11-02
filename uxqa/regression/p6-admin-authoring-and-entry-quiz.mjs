// Guarded completion checks; see uxqa/regression/AGENTS.md, Platform completion.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';

const study=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.UXQA_STUDY_DIR??=study;
const plugin=process.env.UXQA_PLUGIN_ROOT||'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0';
const {uxSession,BASE}=await import(pathToFileURL(path.join(plugin,'lib/ux-lib.mjs')).href);
const pass=process.env.UXQA_PASS||'06-safety-integrity';
const manifest=JSON.parse(fs.readFileSync(path.join(study,'passes',pass,'prebake.json'),'utf8'));
if(manifest.status!=='PREPARED')throw new Error('REFUSED completion fixtures are not prepared');
const fixtures=manifest.fixtures;
async function run(handle,task,drive){
 const s=await uxSession({handle,task,pass,mode:'probe'});let outcome='FAILED';
 try{
  await s.page.goto(BASE,{waitUntil:'networkidle'});
  const reader=handle==='qa-node-support'?await uxSession({handle:'qa-member-oren',task:task+'-sentinel',pass,mode:'probe'}):s;
  let sentinel;
  try{if(reader!==s)await reader.page.goto(BASE,{waitUntil:'networkidle'});sentinel=await reader.request('GET','/api/v1/settings/?key=uxqa_environment');}
  finally{if(reader!==s)await reader.finish('COMPLETED','Read-only isolated database sentinel for memberless support lane.');}
  if(sentinel.body?.value?.db!=='neos_uxqa')throw new Error('REFUSED running API is not the isolated study database');
  await drive(s);outcome='COMPLETED';console.log(`GREEN ${task}`);
 }finally{await s.finish(outcome);}
}

await run('qa-node-support','p6-memberless-admin-friendly-authoring',async s=>{
 const me=(await s.request('GET','/api/v1/auth/me')).body;
 if(me?.is_node_admin!==true||me.member!==null)throw new Error('Fixture drift: expected explicit memberless NodeAdmin');
 await s.page.goto(BASE+'/admin/learning',{waitUntil:'networkidle'});
 await s.page.getByRole('heading',{name:/Node Administration.*Onboarding/}).waitFor();
 for(const name of ['Users','Ecosystems','Domains','Circles','Teams','Onboarding & quizzes'])if(!await s.page.getByRole('navigation',{name:'Node administration tasks'}).getByRole('link',{name:new RegExp(name.replace('&','&'))}).count())throw new Error(`Missing node task ${name}`);
 await s.page.getByLabel('Support organization',{exact:true}).selectOption(fixtures.workflowsEcosystem.id);
 await s.page.getByLabel('Onboarding & quizzes task',{exact:true}).selectOption('quizzes');
 await s.page.getByRole('button',{name:/^Create .*quiz/i}).click();
 await s.page.getByRole('button',{name:'Add question',exact:true}).click();
 await s.page.getByLabel('Question',{exact:true}).fill('What should a new member do first?');
 if(!await s.page.getByText('Answer choices, one per line',{exact:true}).count())throw new Error('Quiz authoring still requires raw JSON');
 if(!await s.page.getByText('Correct answer (leave empty for an ungraded question)',{exact:true}).count())throw new Error('No friendly answer-key control');
 await s.page.getByRole('button',{name:'Close record',exact:true}).click();
 await s.page.getByLabel('Support organization',{exact:true}).selectOption(fixtures.gatedEcosystem.id);
 await s.page.getByLabel('Onboarding & quizzes task',{exact:true}).selectOption('journey_maps');
 await s.page.getByLabel('Find records',{exact:true}).fill('Named quiz journey');
 await s.page.getByRole('button',{name:/^Create /i}).click();
 const title=`Named quiz journey ${Date.now()}`;
 await s.page.getByLabel('Title (required)',{exact:true}).fill(title);
 await s.page.getByLabel('Slug (required)',{exact:true}).fill(`named-quiz-${Date.now()}`);
 await s.page.getByRole('button',{name:'Add journey step',exact:true}).click();
 await s.page.getByLabel('Step title',{exact:true}).fill('Learn our shared-tool rule');
 await s.page.getByRole('combobox',{name:'What the participant does',exact:true}).selectOption({label:'Take a quiz or survey'});
 await s.page.getByLabel('Find journey quiz by name',{exact:true}).fill('Shared tool entry check');
 const picker=s.page.getByRole('combobox',{name:'Quiz or survey',exact:true});
 await picker.getByRole('option',{name:/Shared tool entry check/}).waitFor({state:'attached'});
 await picker.selectOption(fixtures.gatedQuiz.id);
 if(await picker.getByRole('option',{name:/Shared tool entry check/}).count()!==1)throw new Error('Quiz names are not scoped to selected organization');
 await s.page.getByRole('combobox',{name:'Public support reason category (required)',exact:true}).last().selectOption({label:'Agent testing'});
 await s.page.getByRole('button',{name:'Review support action',exact:true}).click();
 const review=s.page.getByRole('alertdialog',{name:'Confirm public support action',exact:true});
 await review.getByText('Learn our shared-tool rule',{exact:true}).waitFor();
 if(!await review.getByText(/Shared tool entry check/).count())throw new Error('Journey review lost the chosen quiz name');
 const saved=s.page.waitForResponse(response=>response.url().endsWith('/api/v1/node-admin/commands')&&response.request().method()==='POST');
 await s.page.getByRole('button',{name:'Confirm and record action',exact:true}).click();
 const response=await saved,receipt=await response.json();
 if(response.status()!==200||receipt.resource?.content_sequence?.[0]?.quiz_id!==fixtures.gatedQuiz.id)throw new Error('Named quiz selection was not saved through audited support');
 await s.page.getByRole('link',{name:'View public audit receipt',exact:true}).click();
 await s.page.waitForURL(new RegExp(`/node/audit/${receipt.audit_id}`));
 const publicReceipt=(await s.request('GET',`/api/v1/node-admin/audit/${receipt.audit_id}`)).body;
 if(publicReceipt.actor_user_id!==me.user.id||JSON.stringify(publicReceipt).includes(title))throw new Error('Public receipt lost real actor or exposed private journey body');
 let automaticInspections=0;
 s.page.on('request',request=>{if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/v1/node-admin/inspect')automaticInspections+=1;});
 await s.page.goBack({waitUntil:'networkidle'});
 if(await s.page.getByLabel('Support organization',{exact:true}).inputValue()!==fixtures.gatedEcosystem.id||await s.page.getByLabel('Find records',{exact:true}).inputValue()!=='Named quiz journey')throw new Error('Returning from a receipt discarded scoped support navigation');
 if(automaticInspections)throw new Error('Returning from a public receipt inspected private records automatically');
 await s.page.goto(BASE+'/admin/users',{waitUntil:'networkidle'});
 await s.page.getByRole('heading',{name:'Set an ecosystem role',exact:true}).waitFor();
 await s.page.getByRole('button',{name:'Find ecosystem membership and role'}).click();
 if(await s.page.getByLabel('Users task',{exact:true}).inputValue()!=='members')throw new Error('Role task did not select audited membership resources');
});

await run('qa-probe-tess','p6-actual-entry-quiz-and-return',async s=>{
 const me=(await s.request('GET','/api/v1/auth/me')).body;
 if(me?.is_node_admin)throw new Error('Fixture drift: ordinary entrant must not receive NodeAdmin exemption');
 await s.page.goto(BASE+`/ethos/${fixtures.gatedEcosystem.id}`,{waitUntil:'networkidle'});
 await s.page.getByRole('button',{name:'Start entry quiz',exact:true}).first().click();
 await s.page.waitForURL(new RegExp(`/quiz/take/${fixtures.gatedQuiz.id}`));
 await s.page.getByRole('radio',{name:'Ask the group first',exact:true}).check();
 await s.page.getByRole('button',{name:'Submit Quiz',exact:true}).click();
 await s.page.waitForURL(/\/quiz\/results\//);
 const resultUrl=s.page.url();
 await s.page.reload({waitUntil:'networkidle'});
 if(s.page.url()!==resultUrl||await s.page.getByText('Quiz result not found',{exact:true}).count())throw new Error('Exact owned result failed direct reload');
 await s.page.getByRole('button',{name:'Continue where I started',exact:true}).click();
 await s.page.waitForURL(new RegExp(`/ethos/${fixtures.gatedEcosystem.id}`));
 await s.page.getByText('Read and personally consent to the remaining membership agreements before taking part.',{exact:true}).waitFor();
 const after=(await s.request('GET','/api/v1/auth/me')).body;
 if(after.ecosystems?.find(item=>item.id===fixtures.gatedEcosystem.id)?.membership_status!=='pending_consent')throw new Error('Quiz pass bypassed membership agreement consent');
 const missing=new URL(resultUrl);missing.pathname=`/quiz/results/${randomUUID()}`;
 await s.page.goto(missing.href,{waitUntil:'networkidle'});
 await s.page.getByText('Quiz result not found',{exact:true}).waitFor();
 await s.page.getByRole('button',{name:'Back to where I started',exact:true}).click();
 await s.page.waitForURL(new RegExp(`/ethos/${fixtures.gatedEcosystem.id}`));
 await s.page.goto(BASE+`/ethos/${fixtures.unavailableEcosystem.id}`,{waitUntil:'networkidle'});
 await s.page.getByText(/A required entry quiz is not published or available/).waitFor();
 if(await s.page.getByRole('button',{name:'Start entry quiz',exact:true}).count())throw new Error('Unavailable required quiz offered a bypass');
});
