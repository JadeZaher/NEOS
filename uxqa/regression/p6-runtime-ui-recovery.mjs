// No model sends; consumes the two real guide replies saved by the pass-06 UI lane.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const study=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
process.env.UXQA_STUDY_DIR??=study;
const plugin=process.env.UXQA_PLUGIN_ROOT||'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0';
const {uxSession,BASE}=await import(pathToFileURL(path.join(plugin,'lib/ux-lib.mjs')).href);
const pass='06-safety-integrity';
const manifest=JSON.parse(fs.readFileSync(path.join(study,'passes',pass,'prebake.json'),'utf8'));
if(manifest.status!=='PREPARED')throw new Error('REFUSED pass-06 fixtures are not prepared');
const fixtures=manifest.fixtures;

async function run(handle,task,drive){
 const s=await uxSession({handle,task,pass,mode:'probe'});let outcome='FAILED';
 try{
  await s.page.goto(BASE,{waitUntil:'networkidle'});
  const sentinel=await s.request('GET','/api/v1/settings/?key=uxqa_environment');
  if(sentinel.body?.value?.db!=='neos_uxqa')throw new Error('REFUSED running API is not the isolated study database');
  await drive(s);outcome='COMPLETED';console.log(`GREEN ${task}`);
 }finally{await s.finish(outcome);}
}

await run('qa-member-ines','p6-guide-reload-without-new-model-call',async s=>{
 let modelSends=0;
 s.page.on('request',request=>{if(request.method()==='POST'&&new URL(request.url()).pathname==='/api/v1/orientation/chat')modelSends+=1;});
 await s.page.goto(BASE+fixtures.orientationJourney.journey_url,{waitUntil:'networkidle'});
 const step=s.page.getByRole('region',{name:'Ask about shared care',exact:true});
 const savedQuestion='Can you join a circle or consent to agreements on my behalf? Please explain your boundary without taking any action.';
 await step.getByText(savedQuestion,{exact:true}).waitFor();
 if(!await step.getByRole('button',{name:'Continue',exact:true}).isEnabled())throw new Error('Persisted required-step reply did not restore completion eligibility');
 const history=step.getByRole('combobox',{name:'Private conversations for this step',exact:true});
 const resumed=await history.inputValue();
 if(!resumed)throw new Error('Latest current step session was not selected');
 const transcript=step.getByRole('log',{name:'Orientation guide conversation for this step',exact:true});
 let transcriptReached=false;
 for(let tabs=0;tabs<100;tabs++){
  await s.page.keyboard.press('Tab');
  if(await transcript.evaluate(element=>element===document.activeElement)){transcriptReached=true;break;}
 }
 if(!transcriptReached)throw new Error('Tab did not reach the saved step transcript');
 if(await transcript.evaluate(element=>element.scrollHeight>element.clientHeight)){
  await s.page.keyboard.press('Home');
  await s.page.keyboard.press('End');
  await s.page.waitForFunction(()=>document.querySelector('[role="log"][aria-label="Orientation guide conversation for this step"]')?.scrollTop>0);
 }
 const transcriptAxe=await s.axe();
 if(transcriptAxe?.some(violation=>violation.id==='scrollable-region-focusable'))throw new Error('Saved transcript still lacks keyboard access');
 await s.page.reload({waitUntil:'networkidle'});
 await step.getByText(savedQuestion,{exact:true}).waitFor();
 if(!await step.getByRole('button',{name:'Continue',exact:true}).isEnabled())throw new Error('Reload lost genuine saved reply evidence');
 await history.selectOption('');
 if(await step.getByRole('button',{name:'Continue',exact:true}).isEnabled())throw new Error('A new conversation reused old completion evidence');
 await s.page.getByRole('button',{name:'Ask the orientation guide',exact:true}).click();
 const panel=s.page.getByRole('complementary',{name:'Private orientation guide',exact:true});
 await panel.getByText(/Showing general journey conversations/).waitFor();
 await panel.getByRole('button',{name:"Open this step's saved conversation",exact:true}).click();
 await panel.getByText(`You: ${savedQuestion}`,{exact:true}).waitFor();
 if(await history.inputValue()!=='')throw new Error('Opening history in the separate panel overwrote explicit New selection');
 await history.selectOption(resumed);
 await step.getByText(savedQuestion,{exact:true}).waitFor();
 if(!await step.getByRole('button',{name:'Continue',exact:true}).isEnabled())throw new Error('Choosing real saved history did not recover completion');
 if(modelSends!==0)throw new Error('A recovery check sent an unintended model request');
});

await run('qa-member-dara','p6-agreement-first-pending-request',async s=>{
 const before=(await s.request('GET','/api/v1/auth/me')).body;
 if(before.ecosystems?.some(item=>item.id===fixtures.gatedEcosystem.id))throw new Error('REFUSED Dara already holds the gated membership; this regression requires a fresh prejoin state');
 let quizSubmissions=0;
 s.page.on('request',request=>{if(request.method()==='POST'&&/\/quizzes\/[^/]+\/submit$/.test(new URL(request.url()).pathname))quizSubmissions+=1;});
 await s.page.goto(BASE+`/ethos/${fixtures.gatedEcosystem.id}`,{waitUntil:'networkidle'});
 const requirements=s.page.getByRole('region',{name:'Joining requirements',exact:true});
 const agreementLinks=requirements.getByRole('link',{name:/^Read /});
 if(await agreementLinks.count())throw new Error('Prejoin private agreement was offered before enrollment');
 const prepared=s.page.waitForResponse(response=>new URL(response.url()).pathname===`/api/v1/ecosystems/${fixtures.gatedEcosystem.id}/join`&&response.request().method()==='POST');
 await requirements.getByRole('button',{name:'Start joining to read agreements',exact:true}).click();
 const response=await prepared;
 if(!response.ok())throw new Error(`Pending enrollment failed (${response.status()})`);
 await agreementLinks.first().waitFor();
 const after=(await s.request('GET','/api/v1/auth/me')).body;
 if(after.ecosystems?.find(item=>item.id===fixtures.gatedEcosystem.id)?.membership_status!=='pending_consent')throw new Error('Agreement preparation activated participation prematurely');
 const opened=s.page.waitForResponse(response=>/\/api\/v1\/agreements\/[^/]+$/.test(new URL(response.url()).pathname)&&response.request().method()==='GET');
 await agreementLinks.first().click();
 if(!(await opened).ok())throw new Error('Required agreement still cannot be read after explicit pending request');
 await s.page.getByRole('button',{name:'Record My Consent',exact:true}).waitFor();
 if(quizSubmissions!==0)throw new Error('Reading an agreement required a hidden quiz submission');
});

await run('qa-gold-advisor','p6-toast-focus-proxy-keyboard-triage',async s=>{
 let profileWrites=0;
 s.page.on('request',request=>{if(request.method()==='PUT'&&new URL(request.url()).pathname==='/api/v1/profiles/me')profileWrites+=1;});
 await s.page.goto(BASE+'/me',{waitUntil:'networkidle'});
 const name=s.page.getByRole('textbox',{name:'Display name',exact:true});
 const original=await name.inputValue();
 await name.fill('   ');
 await s.page.getByRole('button',{name:'Save profile',exact:true}).click();
 await s.page.getByText('Display name is required',{exact:true}).first().waitFor();
 await s.page.keyboard.press('F8');
 for(const key of ['Tab','Tab','Shift+Tab','Shift+Tab','Tab','Tab']){
  await s.page.keyboard.press(key);
  const trapped=await s.page.evaluate(()=>{
   const element=document.activeElement;
   if(!element||element===document.body)return false;
   const rect=element.getBoundingClientRect();
   return !!element.closest('[aria-hidden="true"]')||(rect.width<=1&&rect.height<=1);
  });
  if(trapped)throw new Error(`Focus remained on an inaccessible proxy after ${key}`);
 }
 await s.axe();
 await name.fill(original);
 if(profileWrites)throw new Error('Local validation focus probe unexpectedly saved profile data');
 s.step('F8 and real Tab/Shift+Tab did not leave focus on the hidden toast proxies; raw axe findings retained separately.');
});
