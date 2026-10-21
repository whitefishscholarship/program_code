"""Group011-only PDF-heading bindings; historical engine/checks remain unchanged."""
from pathlib import Path
import hashlib,importlib.util,json,re,sys
G=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('saved_engine',G.parent/'engine.py')
engine=importlib.util.module_from_spec(spec);spec.loader.exec_module(engine)
assert engine.sha((G.parent/'engine.py').read_bytes())=='112b05a7a3d837bff16f3557d543197ca983049c00799f15fff26c9491a87c47'
original_bind=engine.bind
# The historical HTML-specific amount branch cannot address retained PDF headings.
# This exact candidate-only adapter verifies whole original record/evidence hashes,
# heading lines, unique exact excerpt and source-registry affinity before binding.
def pdf_bind(ev,row,field,regs,packetpath):
 if ev['sourceId']!='wai' or field!='amount':return original_bind(ev,row,field,regs,packetpath)
 table=engine.load(G/'amount-heading-bindings.json');hits=[b for b in table['bindings'] if b['savedInputKey']==row['inputKey'] and b['originalEvidenceSha256']==engine.sha(engine.canon(ev))]
 assert len(hits)==1,(row['inputKey'],'exact original PDF evidence binding missing')
 b=hits[0];assert engine.sha(engine.canon(row))==b['originalRecordCanonicalSha256']
 assert ev['artifactSha256']==b['artifactSha256']
 matches=[(p,i,s) for p,i,s in regs if s.get('sourceId')==ev['sourceId'] and s.get('artifactSha256')==ev['artifactSha256'] and s.get('artifactPath')]
 assert matches
 paths={s['artifactPath'] for p,i,s in matches};assert paths=={b['artifactPath']}
 path=engine.R/b['artifactPath'];assert path.is_relative_to(engine.B) and path.suffix in ['.md','.txt','.json'];assert engine.sha(path.read_bytes())==ev['artifactSha256']
 text=path.read_text();quote=ev['excerpt'];assert text.count(quote)==1;assert quote.startswith('## ')
 assert re.findall(r'^## .+$',quote,re.M)==b['excerptHeadings'];assert b['excerptHeadings'] and b['excerptHeadings'][0].startswith('## ')
 assert b['minimumProofRoute']=='Retain original source/identity holds; no current-child identity acceptance or profile allocation.'
 expected=engine.load(G/'author-decisions.json')['records'][b['recordIndex']]
 if not b['namedHeadingMatchesSavedName']:
  assert row['inputKey'] in ['saved-405588227-row-228','saved-405588227-row-235','saved-405588227-row-236']
  assert field not in expected['consistentFields'] and row['identityAcceptance']=='held'
  if row['inputKey']=='saved-405588227-row-228':assert '<PRIVATE_PERSON>' in b['excerptHeadings'][0]
  elif row['inputKey']=='saved-405588227-row-235':assert b['excerptHeadings'][0]=='## WAI | United Aviate Academy Full Flight Training Scholarship'
  else:assert b['excerptHeadings'][0]=='## WAI | United Aviate Academy Partial Scholarships TBD value'
 else:
  heading=' '.join(x.removeprefix('## ') for x in b['excerptHeadings'])
  assert row['recordedName'] in heading
 start=text.index(quote)
 return dict(artifactReference=engine.ref(path),registryReferences=[engine.ref(p,f'/sourceRegistry/{i}') for p,i,s in matches],sourceId=ev['sourceId'],originalEvidenceSha256=engine.sha(engine.canon(ev)),startCharacter=start,endCharacter=start+len(quote),locatorConvention='Zero-based Unicode codepoints in exact saved UTF8 text',bindingMode='Group011 exact full PDF child excerpt and heading binding; unresolved Ted title and UAA separators remain held, not named-child identity proof')
engine.bind=pdf_bind
if __name__=='__main__':
 assert len(sys.argv) in [2,3] and sys.argv[1] in ['build','verify']
 if len(sys.argv)==3:assert sys.argv[2]=='--review-bound'
 if sys.argv[1]=='build':engine.build(11)
 else:engine.verify(11,'--review-bound' in sys.argv)
