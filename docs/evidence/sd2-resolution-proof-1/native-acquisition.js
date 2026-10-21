async function acquireNative(target, existing=null) {
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

  if(!target.savedPreflight||target.savedPreflight.outcome!=="PASS_FOR_NATIVE_BLANK_DOCUMENT_RETRIEVAL_ONLY"||!target.savedPreflight.independentSavedInspection||!target.savedPreflight.exactReferenceHashesVerified){return {schemaVersion:1,targetId:target.targetId,order:target.order,outcome:"held_before_read_no_native_public_blank_preflight",attempts:0,explicitRemoteCalls:0,excerpts:[],allOriginalHoldsRetained:true,factsAccepted:0,mappingsAccepted:0};}
  const out={schemaVersion:1,targetId:target.targetId,order:target.order,host:target.host,exactLocatorSha256:target.exactLocatorSha256,affectedSavedInputs:target.affectedSavedInputs,materialProofGaps:target.materialProofGaps,startedAt:new Date().toISOString(),explicitRemoteCalls:0,attempts:1,excerpts:[],allOriginalHoldsRetained:true,factsAccepted:0,mappingsAccepted:0,currentOfferingEstablished:false,publicOriginEstablished:false,completeNativeOrVisualInspection:false,underlyingHttpRequests:"UNMEASURED"};
  const finish=why=>{out.outcome=why;out.completedAt=new Date().toISOString();return out;};
  const match=target.exactLocator.match(/\/(?:document|file)\/d\/([A-Za-z0-9_-]+)/)||target.exactLocator.match(/[?&]id=([A-Za-z0-9_-]+)/);
  if(!match)return finish("held_exact_native_id_unavailable");
  const fileId=match[1];let meta;
  try{out.explicitRemoteCalls++;meta=existing?existing.metadata:await tools.mcp__codex_apps__google_drive_get_file_metadata({fileId,fields:"id,name,mimeType,size,modifiedTime,version,md5Checksum,webViewLink"});}catch(e){out.errorSha256=sha(String(e));return finish("held_native_metadata_transport");}
  const metaSerialized=JSON.stringify(meta);out.metadataEnvelopeBytes=unescape(encodeURIComponent(metaSerialized)).length;out.metadataEnvelopeSha256=sha(metaSerialized);if(out.metadataEnvelopeBytes>16777216)return finish("held_native_metadata_envelope_over_limit");
  if(meta.isError){out.providerErrorCode="NATIVE_METADATA_PROVIDER_ERROR";return finish("held_native_metadata_access");}
  let d=meta.structuredContent||{};if(!d.id){for(const x of(meta.content||[])){if(x.type==="text"){try{const a=JSON.parse(x.text);if(a.id)d=a;}catch{}}}}
  const name=d.name||d.title||"",mime=d.mimeType||d.mime_type||"";
  out.nativeIdentityMatched=d.id===fileId;out.nativeMimeType=["application/vnd.google-apps.document","application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword"].includes(mime)?mime:"unexpected_type";out.nativeSize=Number(d.size)||null;out.modifiedTime=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(d.modifiedTime||d.modified_time||"")?(d.modifiedTime||d.modified_time):null;out.version=/^\d{1,20}$/.test(String(d.version||""))?String(d.version):null;out.metadataNameSha256=sha(name);out.unrequestedProviderMetadataExcluded=true;
  if(!out.nativeIdentityMatched)return finish("held_native_identity_mismatch");
  if(out.nativeSize>16777216)return finish("held_native_over_limit");
  if(!["application/vnd.google-apps.document","application/pdf","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/msword"].includes(mime))return finish("held_unexpected_native_type");
  const generic=new Set(["scholarship","scholarships","application","award","awards","foundation","program","student","students","the","and","for"]);
  const tokens=s=>(s.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(x=>x.length>=4&&!generic.has(x));
  const nt=new Set(tokens(name));out.metadataProgramNameOverlap=target.names.some(n=>tokens(n).some(t=>nt.has(t)));
  if(!out.metadataProgramNameOverlap)return finish("held_native_program_title_unclear");
  let raw;
  try{out.explicitRemoteCalls++;raw=existing?existing.content:await tools.mcp__codex_apps__google_drive_fetch({url:target.exactLocator});}catch(e){out.errorSha256=sha(String(e));return finish("held_native_content_transport");}
  const contentSerialized=JSON.stringify(raw);out.contentEnvelopeBytes=unescape(encodeURIComponent(contentSerialized)).length;out.contentEnvelopeSha256=sha(contentSerialized);if(out.contentEnvelopeBytes>16777216)return finish("held_native_content_envelope_over_limit");if(raw.isError){out.providerErrorCode="NATIVE_CONTENT_PROVIDER_ERROR";return finish("held_native_content_access");}
  const c=raw.structuredContent||{};const text=typeof c.content==="string"?c.content:typeof c.structuredContent?.content==="string"?c.structuredContent.content:"";
  out.sourceTextSha256=sha(text);out.sourceTextBytes=unescape(encodeURIComponent(text)).length;
  if(c.id&&c.id!==fileId)return finish("held_native_content_identity_mismatch");
  if(!text)return finish("held_native_no_readable_text");
  if(out.sourceTextBytes>16777216)return finish("held_native_text_over_limit");
  if(/(?:student|applicant)(?:'s)?\s+name\s*:\s*[A-Z][a-z]+\s+[A-Z][a-z]+|(?:date of birth|DOB)\s*:\s*\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4}/.test(text))return finish("held_suspected_applicant_content");
  const seen=new Set();let rejected=0;
  for(const rawLine of text.split(/\r?\n/)){
    const line=rawLine.trim();
    if(line.length<15||line.length>900||seen.has(line))continue;
    if(!/eligib|scholarship|deadline|\bGPA\b|must|require|graduat|postmark|enroll|resident|citizen|submit|nomina|renewal/i.test(line))continue;
    if(/@|https?:\/\/|www\.|data:|base64|bearer|access.token|api.key|recipient|winner|awardee|born\b|biograph|address|phone|e-?mail|contact|signature|name\s*:|\b\d{3}[-. )]\s*\d{3}[-. ]\s*\d{4}\b/i.test(line)){rejected++;continue;}
    if(!text.includes(line)){rejected++;continue;}
    seen.add(line);out.excerpts.push({programs:target.names,purpose:"selected_native_material_clause",scope:"named_document_identity_still_held",exactQuoteSha256:sha(line),quoteCharacters:line.length,hashOnlyEvidence:true,matchOffset:text.indexOf(line),proposedEvidenceOnly:true,completeRuleEstablished:false});
    if(out.excerpts.length===10)break;
  }
  out.excludedLineCount=rejected;
  out.completenessLimit="Best-effort selected readable native text only, not complete text/page/table/visual inspection or public-official origin/current-offering proof. Metadata name overlap is preflight only; all identities/facts remain held.";
  return finish(out.excerpts.length?"held_with_new_selected_native_excerpts":"held_no_safe_native_material_excerpt");
}
