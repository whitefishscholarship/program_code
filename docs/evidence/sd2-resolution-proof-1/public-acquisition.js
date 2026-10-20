async function acquirePublic(target) {
  const sha = function (input) {
    const s=unescape(encodeURIComponent(input)),k=[],h=[],pw=Math.pow;let pc=0;
    const comp={};for(let c=2;pc<64;c++){if(!comp[c]){for(let i=c;i<313;i+=c)comp[i]=1;h[pc]=(pw(c,.5)*4294967296)|0;k[pc++]=(pw(c,1/3)*4294967296)|0;}}
    const hh=h.slice(0,8),words=[],len=s.length;for(let i=0;i<len;i++)words[i>>2]|=s.charCodeAt(i)<<(24-i%4*8);
    words[len>>2]|=128<<(24-len%4*8);words[((len+8>>6)+1)*16-1]=len*8;
    const rr=(x,n)=>(x>>>n)|(x<<(32-n));
    for(let j=0;j<words.length;j+=16){const w=Array.from({length:16},(_,i)=>words[j+i]||0),v=hh.slice();for(let i=0;i<64;i++){
      const a=w[i-15],b=w[i-2];if(i>=16)w[i]=((rr(a,7)^rr(a,18)^(a>>>3))+w[i-16]+(rr(b,17)^rr(b,19)^(b>>>10))+w[i-7])|0;
      const t=(v[7]+(rr(v[4],6)^rr(v[4],11)^rr(v[4],25))+((v[4]&v[5])^(~v[4]&v[6]))+k[i]+w[i])|0;
      const t2=((rr(v[0],2)^rr(v[0],13)^rr(v[0],22))+((v[0]&v[1])^(v[0]&v[2])^(v[1]&v[2])))|0;
      v.unshift((t+t2)|0);v[4]=(v[4]+t)|0;v.pop();}
      for(let i=0;i<8;i++)hh[i]=(hh[i]+v[i])|0;}
    return hh.map(x=>(x>>>0).toString(16).padStart(8,"0")).join("");
  };
  const start=new Date().toISOString();
  const out={schemaVersion:1,targetId:target.targetId,order:target.order,exactLocatorSha256:target.exactLocatorSha256,host:target.host,affectedSavedInputs:target.affectedSavedInputs,materialProofGaps:target.materialProofGaps,startedAt:start,explicitRemoteCalls:1,attempts:1,allOriginalHoldsRetained:true,factsAccepted:0,mappingsAccepted:0,excerpts:[],rejectedQuoteCounts:{},currentOfferingEstablished:false,completeNativeOrVisualInspection:false,underlyingHttpRequests:"UNMEASURED"};
  const prompt="Inspect ONLY public program information for these exact saved program names: "+JSON.stringify(target.names)+". Do not include applicants/recipients/winners, biographies, personal stories, contacts, mailing addresses, phone/email values, filled forms/responses, birthdate examples, credentials or token links. Return at most 4 short exact plain-text quotations per named program, only for material identity, current cycle/deadline, eligibility or application-route criteria. Each quotation must occur verbatim in page markdown and be at most 900 characters. Do not summarize as a quotation. Preserve all qualifiers; mark parent/common scope separately and never transfer parent criteria to an individual child. Return no quotation if named-program identity or safe content is unclear. Unknown/unstated remains unknown. Do not follow links or interact with forms. Include flags suspectedApplicantData, programIdentityClear, contentScope. JSON schema: {suspectedApplicantData:boolean,programIdentityClear:boolean,contentScope:string,quotes:[{program:string,purpose:'identity'|'cycle_deadline'|'eligibility'|'application_route',scope:'named_program'|'parent_common'|'unclear',exactQuote:string}]}. This is selected-excerpt evidence, not full-source or factual acceptance.";
  let raw;
  try {
    raw=await tools.mcp__codex_apps__firecrawl_firecrawl_scrape({url:target.exactLocator,formats:["markdown","json"],jsonOptions:{prompt},onlyMainContent:true,excludeTags:["nav","footer","header","form","input","textarea","script","style"],maxAge:0,redactPII:true,removeBase64Images:true,domainTools:false,lockdown:false,timeout:45000,storeInCache:false});
  } catch(e) {out.outcome="held_provider_transport_error";out.errorSha256=sha(String(e));out.completedAt=new Date().toISOString();return out;}
  const serialized=JSON.stringify(raw);out.returnedEnvelopeSha256=sha(serialized);out.returnedEnvelopeBytes=unescape(encodeURIComponent(serialized)).length;
  if(out.returnedEnvelopeBytes>16777216){out.outcome="held_over_limit";out.completedAt=new Date().toISOString();return out;}
  if(raw.isError){out.outcome="held_provider_error";out.providerErrorCode=raw.structuredContent?.error_code||null;out.completedAt=new Date().toISOString();return out;}
  const candidates=[];const scan=(v,depth=0)=>{if(!v||typeof v!=="object"||depth>5)return;if(v.markdown!==undefined||v.metadata||v.json)candidates.push(v);if(Array.isArray(v)){for(const x of v)scan(x,depth+1);}else for(const [k,x]of Object.entries(v)){if(k==="text"&&typeof x==="string"){try{scan(JSON.parse(x),depth+1);}catch{}}else if(x&&typeof x==="object")scan(x,depth+1);}};
  scan(raw);const d=candidates.find(x=>typeof x.markdown==="string")||candidates.find(x=>x.json)||{};
  const md=typeof d.markdown==="string"?d.markdown:"";const meta=d.metadata||{};let json=d.json;
  if(typeof json==="string"){try{json=JSON.parse(json);}catch{json=null;}}
  out.sourceMarkdownSha256=sha(md);out.sourceMarkdownBytes=unescape(encodeURIComponent(md)).length;
  out.httpStatus=Number.isInteger(meta.statusCode)?meta.statusCode:null;
  const finalUrl=typeof meta.url==="string"?meta.url:typeof meta.sourceURL==="string"?meta.sourceURL:null;
  out.returnedUrlSha256=finalUrl?sha(finalUrl):null;
  const hostOf=u=>{const m=/^https?:\/\/([^\/?#:]+)/i.exec(u||"");return m?m[1].toLowerCase():null;};
  out.returnedHost=hostOf(finalUrl);
  if(out.returnedHost&&out.returnedHost!==target.host){out.outcome="held_unexpected_redirect";out.completedAt=new Date().toISOString();return out;}
  if(out.httpStatus&&out.httpStatus>=400){out.outcome="held_http_"+out.httpStatus;out.completedAt=new Date().toISOString();return out;}
  if(!md||!json){out.outcome="held_incomplete_or_no_structured_program_proof";out.completedAt=new Date().toISOString();return out;}
  if(json.suspectedApplicantData===true){out.outcome="held_suspected_applicant_content";out.completedAt=new Date().toISOString();return out;}
  if(json.programIdentityClear!==true){out.outcome="held_named_program_identity_unclear";out.completedAt=new Date().toISOString();return out;}
  const rejected=code=>{out.rejectedQuoteCounts[code]=(out.rejectedQuoteCounts[code]||0)+1;};const per={};
  for(const q of (Array.isArray(json.quotes)?json.quotes:[])){
    if(!target.names.includes(q.program)||!["identity","cycle_deadline","eligibility","application_route"].includes(q.purpose)||!["named_program","parent_common"].includes(q.scope)){rejected("identity_or_scope");continue;}
    const s=q.exactQuote;
    if(typeof s!=="string"||s.length<8||s.length>900||!md.includes(s)){rejected("not_exact_bounded_quote");continue;}
    if((per[q.program]||0)>=4){rejected("quote_cap_no_completeness_claim");continue;}
    if(/@|https?:\/\/|www\.|data:|base64|bearer|access.token|api.key|recipient|winner|awardee|born\b|biograph|personal story|our story|privacy policy|mailing address|phone:|contact:|\b\d{3}[-. )]\s*\d{3}[-. ]\s*\d{4}\b/i.test(s)){rejected("excluded_or_uninspected_content");continue;}
    if(!/scholar|award|eligible|eligibility|applica|deadline|admission|student|program|funding|GPA|renew|must|require|education|training|grant|nomina/i.test(s)){rejected("not_material_program_clause");continue;}
    per[q.program]=(per[q.program]||0)+1;
    out.excerpts.push({program:q.program,purpose:q.purpose,scope:q.scope,exactQuote:s,exactQuoteSha256:sha(s),matchOffset:md.indexOf(s),proposedEvidenceOnly:true,completeRuleEstablished:false});
  }
  out.outcome=out.excerpts.length?"held_with_new_selected_program_excerpts":"held_no_safe_exact_material_excerpt";
  out.completenessLimit="Selected main-content excerpts only; no source-silence, full-page/native/visual/current/public-origin or fact-acceptance claim. Unlisted links remain outside scope.";
  out.completedAt=new Date().toISOString();return out;
}
