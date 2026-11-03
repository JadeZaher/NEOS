import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=process.cwd();
process.env.UXQA_STUDY_DIR=path.join(root,'uxqa');
const {uxSession,BASE}=await import(pathToFileURL(path.join(process.env.UXQA_PLUGIN_ROOT || 'C:/Users/atooz/.claude/plugins/cache/local/ux-qa-research/0.1.0', 'lib/ux-lib.mjs')).href);
assert.ok(['localhost','127.0.0.1'].includes(new URL(BASE).hostname));
const pass='08-community-engagement';
const out=path.join(root,'uxqa/passes',pass);
const fixtures=JSON.parse(fs.readFileSync(path.join(root,'uxqa/passes/06-safety-integrity/prebake.json'),'utf8')).fixtures;
const target=fixtures.gatedEcosystem.id;
const username='uxqa_p8_'+Date.now();
const report={username,target,checks:[],outcome:'FAILED',externalSends:0};
async function read(s,url){const r=await s.request('GET',url);assert.equal(r.status,200,url);return r.body;}
const guard=await uxSession({handle:'qa-member-ines',task:'p8-signup-readonly-guard',pass,mode:'probe'});
try{
 await guard.page.goto(BASE,{waitUntil:'networkidle'});
 assert.equal((await read(guard,'/api/v1/settings/?key=uxqa_environment')).value.db,'neos_uxqa');
 assert.equal((await read(guard,'/api/v1/engagement/capabilities')).external_delivery_enabled,false);
 for(const [url,name] of [['/dashboard','engagement-dashboard-desktop.png'],['/updates','engagement-updates-desktop.png']]){
  await guard.page.goto(BASE+url,{waitUntil:'networkidle'});
  await guard.page.screenshot({path:path.join(out,name),fullPage:true});
 }
}finally{await guard.finish('COMPLETED','Read-only guard and desktop capture. No fixture writes.');}
const s=await uxSession({task:'p8-anonymous-target-signup',pass,mode:'probe'});
let failure;
try{
 await s.page.goto(BASE+'/communities',{waitUntil:'networkidle'});
 await s.page.getByRole('heading',{name:'Find a community.',exact:true}).waitFor();
 await s.page.screenshot({path:path.join(out,'engagement-directory-desktop.png'),fullPage:true});
 await s.page.getByLabel('Search communities',{exact:true}).fill(fixtures.gatedEcosystem.title);
 await s.page.getByRole('button',{name:'Search',exact:true}).click();
 await s.page.locator(`a[href="/communities/${target}"]`).click();
 await s.page.getByRole('link',{name:'Join this community',exact:true}).click();
 await s.page.waitForURL(/\/login\?/);
 assert.equal(new URL(s.page.url()).searchParams.get('ecosystem'),target);
 await s.page.getByLabel('Display Name (optional)',{exact:true}).fill('UXQA P8 Signup Probe');
 await s.page.getByLabel('Username',{exact:true}).fill(username);
 const password=randomUUID()+'Aa9!';
 await s.page.getByLabel('Password',{exact:true}).fill(password);
 await s.page.getByLabel('Confirm Password',{exact:true}).fill(password);
 const registration=s.page.waitForResponse(r=>new URL(r.url()).pathname==='/api/v1/auth/register'&&r.request().method()==='POST');
 await s.page.getByRole('button',{name:'Create Account',exact:true}).click();
 const registered=await registration;
 assert.equal(registered.status(),200,'UI registration failed');
 await s.page.waitForURL(/\/welcome\/consent/);
 const me=await read(s,'/api/v1/auth/me');
 report.userId=me.user.id;
 assert.equal(me.ecosystems.length,1,'Signup silently joined another community');
 assert.equal(me.ecosystems[0].id,target);
 assert.equal(me.ecosystems[0].membership_status,'pending_consent');
 assert.equal(me.is_node_admin,false);
 report.initialMembership=me.ecosystems.map(e=>({id:e.id,status:e.membership_status}));
 report.checks.push('Anonymous directory -> chosen preview -> password signup creates only target membership, pending requirements, ordinary user');
 await s.page.getByRole('heading',{name:'Before you take part in '+fixtures.gatedEcosystem.title,exact:true}).waitFor();
 await s.page.getByRole('button',{name:'Start entry quiz',exact:true}).waitFor();
 await s.page.getByRole('link',{name:'Read and consent',exact:true}).waitFor();
 await s.page.screenshot({path:path.join(out,'engagement-signup-gated.png'),fullPage:true});
 report.checks.push('Configured quiz and agreement gates are visibly presented after signup; no automatic admission');
 await s.page.getByRole('button',{name:'Start entry quiz',exact:true}).click();
 await s.page.waitForURL(new RegExp('/quiz/take/'+fixtures.gatedQuiz.id));
 await s.page.getByRole('radio',{name:'Ask the group first',exact:true}).check();
 await s.page.getByRole('button',{name:'Submit Quiz',exact:true}).click();
 await s.page.waitForURL(/\/quiz\/results\//);
 await s.page.getByRole('button',{name:'Continue where I started',exact:true}).click();
 await s.page.waitForURL(/\/welcome\/consent/);
 const afterQuiz=await read(s,'/api/v1/auth/me');
 assert.equal(afterQuiz.ecosystems[0].membership_status,'pending_consent');
 report.checks.push('Real visible quiz answered and submitted; return target preserved; passing does not bypass agreement consent');
 await s.page.getByRole('link',{name:'Read and consent',exact:true}).click();
 await s.page.getByRole('button',{name:'Record My Consent',exact:true}).waitFor();
 await s.page.screenshot({path:path.join(out,'engagement-signup-agreement.png'),fullPage:true});
 await s.page.getByLabel('Your explicit consent',{exact:true}).fill('I have read this synthetic UXQA shared-tool agreement and consent as this test account.');
 await s.page.getByRole('button',{name:'Record My Consent',exact:true}).click();
 await s.page.getByText(/You consented to v/).waitFor();
 await s.page.goto(BASE+'/welcome/consent',{waitUntil:'networkidle'});
 const finish=s.page.getByRole('button',{name:'Check my membership',exact:true});
 if(await finish.count())await finish.click();
 const final=await read(s,'/api/v1/auth/me');
 report.finalMembership=final.ecosystems.map(e=>({id:e.id,status:e.membership_status}));
 assert.equal(final.ecosystems[0].membership_status,'active');
 assert.equal(final.pending_consents.length,0);
 report.checks.push('Actual agreement consent recorded through UI, target membership activated only after both configured requirements');
 await s.page.goto(BASE+'/dashboard',{waitUntil:'networkidle'});
 await s.page.screenshot({path:path.join(out,'engagement-signup-admitted.png'),fullPage:true});
 report.outcome='COMPLETED';
}catch(error){failure=error;report.error=String(error.stack||error);await s.page.screenshot({path:path.join(out,'engagement-signup-failure.png'),fullPage:true}).catch(()=>{});}
finally{
 fs.writeFileSync(path.join(out,'engagement-signup-regression.json'),JSON.stringify(report,null,2));
 await s.finish(report.outcome,'New unique synthetic account via actual password form; only target membership. Local fixture records retained for study reset.');
}
if(failure)throw failure;
console.log('GREEN engagement-selected-community-signup-and-admission');
