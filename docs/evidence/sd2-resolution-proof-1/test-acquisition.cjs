// Synthetic safety regressions only; no remote tools or actual personal data.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=__dirname;
const load=(n,tools)=>new Function('tools','return '+fs.readFileSync(path.join(base,n),'utf8'))(tools);
const target={targetId:'synthetic-target',order:1,exactLocator:'https://example.edu/program',exactLocatorSha256:'0'.repeat(64),host:'example.edu',names:['Test Scholarship'],affectedSavedInputs:['synthetic-input'],materialProofGaps:['synthetic-input#eligibility']};
const preflight={outcome:'PASS_FOR_PUBLIC_PAGE_RETRIEVAL_ONLY',independentSavedInspection:true,exactReferenceHashesVerified:true};
(async()=>{
 let calls=0;const no=async()=>{calls++;throw Error('Unexpected tool call');};
 let r=await load('public-acquisition.js',{mcp__codex_apps__firecrawl_firecrawl_scrape:no})(target);
 assert.equal(calls,0);assert.equal(r.outcome,'held_before_read_no_independent_saved_preflight');
 r=await load('native-acquisition.js',{mcp__codex_apps__google_drive_get_file_metadata:no})({...target,exactLocator:'https://drive.google.com/file/d/synthetic-id/view'});
 assert.equal(calls,0);assert.equal(r.outcome,'held_before_read_no_native_public_blank_preflight');
 const probes=['Applicants must enroll in eligible training.','This scholarship is awarded to [EXCLUDED_RECIPIENT_SENTINEL].','Applicants must mail [EXCLUDED_POSTAL_SENTINEL].','Students must provide DOB: [EXCLUDED_BIRTHDATE_SENTINEL].'];
 for(const line of probes){
  const raw={structuredContent:{markdown:line,metadata:{statusCode:200,url:target.exactLocator},json:{suspectedApplicantData:false,programIdentityClear:true,contentScope:'test',quotes:[{program:'Test Scholarship',purpose:'eligibility',scope:'named_program',exactQuote:line}]}}};
  const f=load('public-acquisition.js',{mcp__codex_apps__firecrawl_firecrawl_scrape:async()=>raw});
  r=await f({...target,savedPreflight:preflight});
  assert(!JSON.stringify(r).includes(line));assert(!JSON.stringify(r).includes('exactQuote"'));assert(!JSON.stringify(r).includes('EXCLUDED_'));
 }
 r=await load('public-acquisition.js',{mcp__codex_apps__firecrawl_firecrawl_scrape:async()=>({isError:true,structuredContent:{error_code:'INVALID_ARGUMENT'},content:[{type:'text',text:'[EXCLUDED_ERROR_BODY_SENTINEL]'}]})})({...target,savedPreflight:preflight});
 assert(!JSON.stringify(r).includes('EXCLUDED_'));assert(!('providerErrorReason'in r));
 const nt={...target,exactLocator:'https://drive.google.com/file/d/synthetic-id/view',savedPreflight:{...preflight,outcome:'PASS_FOR_NATIVE_BLANK_DOCUMENT_RETRIEVAL_ONLY'}};
 const meta={structuredContent:{id:'synthetic-id',title:'Test Scholarship',mime_type:'application/vnd.google-apps.document',size:'100'}};
 for(const line of probes){
  r=await load('native-acquisition.js',{})(nt,{metadata:meta,content:{structuredContent:{id:'synthetic-id',content:line}}});
  assert(!JSON.stringify(r).includes(line));assert(!JSON.stringify(r).includes('exactQuote"'));assert(!JSON.stringify(r).includes('EXCLUDED_'));
 }
 r=await load('native-acquisition.js',{})(nt,{metadata:{...meta,padding:'x'.repeat(16777217)},content:{}});
 assert.equal(r.outcome,'held_native_metadata_envelope_over_limit');assert.equal(r.explicitRemoteCalls,1);
 r=await load('native-acquisition.js',{})(nt,{metadata:meta,content:{structuredContent:{id:'synthetic-id',content:'Applicants must enroll in training.'},padding:'x'.repeat(16777217)}});
 assert.equal(r.outcome,'held_native_content_envelope_over_limit');assert.equal(r.explicitRemoteCalls,2);
 process.stdout.write(JSON.stringify({outcome:'PASS',remoteCalls:0,checks:['public/native missing-preflight no-call','public/native hash-only benign/excluded clauses','error-body hash-only','full native metadata/content envelope caps']})+'\n');
})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1;});
