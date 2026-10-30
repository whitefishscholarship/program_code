import { ACTIVITY_QUESTIONS, SPECIAL_CRITERIA } from './interviewQuestions';
import { COVERAGE_INTERESTS, STUDENT_ORGANIZATIONS } from './coverageQuestions';
import {
  AWARD_TAG_KEYS,
  type AwardTags,
  type PoolLevel,
  type ResidencyScope,
} from './awardTagSchema';

export type TaggableAward = {
  publicId: string;
  name: string;
  summary: string | null;
  eligibility: {
    audience: string;
    minimumGpa: number | null;
    schoolTypes: readonly string[];
    focus: string | null;
  };
};

export type Step3Category = { id: string; label: string; group: string };

export type DeriveResult = {
  tags: AwardTags;
  notes: string[];
  step3Ids: string[];
  unsupportedLinks: string[];
};

export type PageRead = { loaded: boolean; text: string };

type Place = { scope: ResidencyScope; level: PoolLevel; phrase: string };

const SCORE_BANDS: Record<PoolLevel, [number, number]> = {
  1: [8, 16],
  2: [22, 30],
  3: [36, 44],
  4: [50, 58],
  5: [64, 76],
  6: [86, 94],
};

const CLUB_STEP3: Record<string, string> = {
  FFA: 'org_ffa',
  NTHS: 'org_nths',
  DECA: 'org_deca',
  FBLA: 'org_fbla',
  BPA: 'org_bpa',
  FCCLA: 'org_fccla',
  HOSA: 'org_hosa',
  SkillsUSA: 'org_skillsusa',
  TSA: 'org_tsa',
};

export function step3Categories(): Step3Category[] {
  return [
    ...SPECIAL_CRITERIA.map((item) => ({ id: item.id, label: item.label, group: item.category })),
    ...ACTIVITY_QUESTIONS.map((item) => ({ id: item.id, label: item.label, group: 'Activities' })),
    ...STUDENT_ORGANIZATIONS.map((item) => ({ id: `org_${item.id}`, label: item.label, group: 'Clubs' })),
    ...COVERAGE_INTERESTS.map((item) => ({ id: item.id, label: item.label, group: 'Plans' })),
    { id: 'financial_need', label: 'Financial need', group: 'Need' },
  ];
}

export function pickAwardTags(award: Record<string, unknown>): AwardTags {
  const tags = {} as Record<string, unknown>;
  for (const key of AWARD_TAG_KEYS) tags[key] = award[key];
  return tags as AwardTags;
}

export function deriveAwardTags(
  award: TaggableAward,
  linkAnswerIds: readonly string[] = [],
  page: PageRead | null = null,
): DeriveResult {
  const catalogBlock = blockReason(award);
  const pageBits = page?.loaded ? usableSentences(page.text.replace(/reach higher montana/gi, ' ')).join(' ') : '';
  const pageUsable = Boolean(page?.loaded && pageBits.length >= 40);
  // A fresh page read replaces an old catalog example. The old text stays out.
  const blocked = pageUsable ? null : catalogBlock;
  const catalogEvidence = catalogBlock ? '' : evidenceText(award);
  const evidence = [catalogEvidence, pageBits].filter(Boolean).join(' ');
  const pageFailed = page?.loaded === false;
  const pageEmpty = page?.loaded === true && !pageUsable;
  const notes: string[] = [];
  if (blocked === 'past') notes.push('The page only shows an old example, so the current rules were not tagged.');
  if (blocked === 'unread') notes.push('The page does not say who can apply.');
  if (!blocked && evidence === '' && !/^(any student|in-state)$/i.test(award.eligibility.audience.trim())) {
    notes.push('The page does not say who can apply.');
  }
  if (/^in-state$/i.test(award.eligibility.audience.trim()) && !pageUsable) {
    notes.push('The page only says In-State and does not name the state.');
  }
  if (pageFailed) notes.push('The page did not load.');
  if (pageEmpty) notes.push('The page loaded but this award\'s rules were not on it.');

  const bags = collect(evidence, blocked);
  if (!blocked && bags.ruralRule === null) bags.ruralRule = 'none';
  if (/first generation/i.test(award.name) && /considered automatically/i.test(evidence)) {
    bags.firstGen = null;
    notes.push('The name says first generation, but the page says these students are considered automatically.');
  }
  if (bags.fieldMenu) notes.push('The page lists more than one field of study, so a single field was not tagged.');
  if (!blocked) notes.push(...nameHints(award.name, evidence));

  const splitPaths = !blocked && separateAwardPaths(evidence);
  if (splitPaths) {
    bags.familyTies = bags.familyTies.filter((item) => item !== 'employer');
    bags.employerKind = null;
    notes.push('The page lists two ways to qualify, so those paths were not combined into one rule.');
  }

  const foundPlace = blocked || splitPaths ? null : findPlace(evidence);
  const unnamedState = /^in-state$/i.test(award.eligibility.audience.trim()) && !foundPlace;
  const place = foundPlace ?? (
    pageUsable && !blocked && !splitPaths && !unnamedState
      ? { scope: 'national' as const, level: 6 as const, phrase: 'Students across the United States' }
      : null
  );
  if (place && !foundPlace) notes.push('no location limit listed');
  if (unnamedState && pageUsable) notes.push('The page only says In-State and does not name the state.');
  if (!place && !unnamedState && !blocked && !splitPaths && evidence !== '' && !pageFailed && !pageEmpty) notes.push('The page does not say the place.');
  const niche = hasNiche(bags);
  const level: PoolLevel | null = place ? (place.scope === 'national' && niche ? 5 : place.level) : null;
  const score = level === null ? null : competitionScore(level, bags, award.eligibility.minimumGpa);
  const tags: AwardTags = {
    residencyScope: place?.scope ?? null,
    poolLevel: level,
    competitionScore: score,
    poolReason: splitPaths
      ? 'The page lists two ways to qualify, so one shared rule was not set.'
      : poolReason(place, level, bags, blocked, evidence),
    ruralRule: bags.ruralRule,
    sports: listOrNull(bags.sports),
    clubs: listOrNull(bags.clubs),
    heritage: listOrNull(bags.heritage),
    faith: listOrNull(bags.faith),
    familyTies: listOrNull(bags.familyTies),
    plans: listOrNull(bags.plans),
    health: listOrNull(bags.health),
    lifeSituation: listOrNull(bags.lifeSituation),
    gender: listOrNull(bags.gender),
    firstGen: bags.firstGen,
    needBased: bags.needBased,
    essayRequired: blocked ? null : essayFlag(award, pageBits),
    renewable: blocked ? null : renewableFlag(award, pageBits),
    tagConfirmedBy: 'derived',
  };
  const step3Ids = matchedStep3Ids(tags, evidence);
  const supported = new Set(step3Ids);
  const unsupportedLinks = [...new Set(linkAnswerIds)].filter((id) => !supported.has(id)).sort();
  return { tags, notes, step3Ids, unsupportedLinks };
}

type Bags = {
  sports: string[];
  clubs: string[];
  heritage: string[];
  faith: string[];
  familyTies: string[];
  plans: string[];
  health: string[];
  lifeSituation: string[];
  gender: string[];
  firstGen: boolean | null;
  needBased: boolean | null;
  ruralRule: AwardTags['ruralRule'];
  employerKind: 'self' | 'parent' | 'either' | null;
  fieldMenu: boolean;
};

function emptyBags(): Bags {
  return {
    sports: [], clubs: [], heritage: [], faith: [], familyTies: [], plans: [], health: [],
    lifeSituation: [], gender: [], firstGen: null, needBased: null, ruralRule: null, employerKind: null, fieldMenu: false,
  };
}

function collect(evidence: string, blocked: 'past' | 'unread' | null): Bags {
  const bags = emptyBags();
  if (!evidence || blocked) return bags;
  const text = evidence.toLowerCase();

  addClubs(text, bags);
  addPlans(text.replace(/future business leaders of america|business professionals of america/g, ' '), bags);
  addSports(text, bags);
  addHeritage(text, bags);
  addFaith(text, bags);
  addFamily(text, bags);
  addHealth(text, bags);
  addLife(text, bags);
  addGender(text, bags);
  if (/\bfirst[- ]generation\b|\bfirst in (?:your|their|the) (?:immediate )?family\b/.test(text)) bags.firstGen = true;
  if (/\bfinancial need\b|\bneed-based\b|\bpell-eligible\b|\bpell eligible\b|\blow-income\b|\bcannot rely on family to pay\b|\bdemonstrated need\b/.test(text)) bags.needBased = true;
  if (/\bservice area\b|\bservice territory\b|\bmember of flathead electric\b|\bserved by the co-op\b|\bserved by flathead electric\b/.test(text)) bags.ruralRule = 'service-area';
  if (/\bnces\b[^.]{0,40}\brural\b|\brural\b[^.]{0,40}\bnces\b/.test(text) && /\btown\b/.test(text)) bags.ruralRule = 'nces-town-or-rural';
  else if (/\bnces\b[^.]{0,40}\brural\b|\brural locale\b/.test(text)) bags.ruralRule = 'nces-rural';
  if (/\bnon-?metro(?:politan)? county\b/.test(text)) bags.ruralRule = 'nonmetro-county';
  if (/\bclass b\b|\bclass c\b/.test(text) && /\bschool\b/.test(text)) bags.ruralRule = 'class-bc';
  return bags;
}

function addPlans(text: string, bags: Bags) {
  const narrowed = withoutSchoolMenus(text);
  for (const sentence of narrowed.split(/(?<=[.!?])\s+/)) {
    if (/\b(is excluded|are excluded|not eligible|ineligible|does not include|not included)\b/.test(sentence)) continue;
    if (/\bany\b/.test(sentence) && /\bsuch as\b|\betc\b/.test(sentence)) continue;
    let hits = planHits(sentence);
    if (hits.length >= 3 || (hits.length >= 2 && /\bsuch as\b|\bcareers include\b/.test(sentence))) {
      bags.fieldMenu = true;
      continue;
    }
    if (/\bpilot applicant\b/.test(sentence)) hits = hits.filter((hit) => hit !== 'pilot training');
    if (hits.includes('aviation maintenance') && hits.includes('skilled trades')) {
      hits = hits.filter((hit) => hit !== 'skilled trades');
    }
    if (hits.includes('skilled trades') && hits.includes('two-year college') && /\bor\b/.test(sentence)) {
      hits = hits.filter((hit) => hit !== 'two-year college');
    }
    if (/stem\/healthcare|stem or healthcare|healthcare or stem/.test(sentence)) {
      push(bags.plans, 'STEM');
      push(bags.plans, 'healthcare');
      hits = hits.filter((hit) => hit !== 'STEM' && hit !== 'healthcare');
    }
    if (hits.includes('business') && hits.includes('STEM') && /\bbusiness\b.{0,12}\bor\b.{0,12}\bstem\b|\bstem\b.{0,12}\bor\b.{0,12}\bbusiness\b/.test(sentence)) {
      if (hits.length === 2) {
        push(bags.plans, 'business');
        push(bags.plans, 'STEM');
      } else bags.fieldMenu = true;
      continue;
    }
    if (hits.includes('skilled trades') && hits.includes('agriculture') && /\btrades?\b.{0,24}\bor\b.{0,40}\bagricultur|\bagricultur\w*.{0,24}\bor\b.{0,40}\btrades?\b/.test(sentence)) {
      bags.fieldMenu = true;
      continue;
    }
    if (/\bother fields\b/.test(sentence) && hits.length >= 1) {
      bags.fieldMenu = true;
      continue;
    }
    for (const hit of hits) push(bags.plans, hit);
  }
}

function planHits(sentence: string): string[] {
  const hits: string[] = [];
  const add = (plan: string, ok: boolean) => {
    if (ok && !hits.includes(plan)) hits.push(plan);
  };
  const businessText = sentence.replace(/business aviation|aviation business/g, ' ');
  add('pilot training', /\bpilot\b|\bflight training\b|\bflight ratings?\b|\bflight school\b|\bstudent pilot\b|\bcfi\b|\bcommercial pilot\b|\batp\b|\bpilot certificate\b/.test(sentence));
  add('drone training', /\bunmanned aircraft\b|\buas\b|\bdrone\b/.test(sentence) && !hits.includes('pilot training'));
  add('aviation maintenance', /\baviation maintenance\b|\baircraft maintenance\b|\ba&p\b|\bavionics\b|\baircraft mechanic\b|\bmaintenance technician\b|\bpart 147\b/.test(sentence));
  add('aviation management', /\baviation management\b|\bdispatch/.test(sentence));
  add('STEM', /\bstem\b|\bengineering\b/.test(sentence));
  add('healthcare', /\bhealthcare career\b|\bhealth care career\b|\bnursing\b|\bhealth sciences?\b|\bpre-med\b|\bmedical career\b/.test(sentence));
  add('skilled trades', /\bskilled trades?\b|\bvocational\b|\btrade program\b|\btrade school\b|\bhvac\b|\bweld(?:er|ing)\b|\blineman\b|\bconstruction\b|\bcertificate program\b|\bcraft\b|\btechnical programs?\b|\btrades\b|\bautomotive\b|\bdiesel\b/.test(sentence));
  add('two-year college', /\btwo years or less\b|\btwo-year\b|\b2-year\b|\bassociate degree\b|\bassociate program\b/.test(sentence));
  add('teaching', /\beducation career\b|\bmajor in education\b|\bplanning to teach\b|\bearly childhood\b|\beducation teacher\b|\bwork with children\b|\bag ed\b|\bagricultural education\b/.test(sentence));
  add('agriculture', /\bagricultur|\bag ed\b|\bfarming\b|\bnatural resources\b|\bforestry\b|\bconservation\b/.test(sentence));
  add('business', /\bbusiness\b|\bfinance\b|\baccounting\b/.test(businessText));
  add('law', /\bpre-law\b|\blaw school\b|\blegal studies\b|\bcriminal justice\b|\blaw & public safety\b|\blaw and public safety\b/.test(sentence));
  add('arts', /\bart or music\b|\bfine arts?\b|\btheatre\b|\btheater\b|\bmajor in art\b|\bin music\b|\bmusic degree\b/.test(sentence));
  add('public service', /\blaw enforcement\b|\bsocial work\b|\bpublic service\b|\bpublic safety\b/.test(sentence));
  add('transportation', /\bdegree in (?:a |an )?(?:[\w-]+ ){0,3}transportation\b|\btransportation(?:-related)? (?:industry|field|degree|major|career)\b/.test(sentence));
  return hits;
}

function addClubs(text: string, bags: Bags) {
  if (/\bffa\b/.test(text)) push(bags.clubs, 'FFA');
  if (/\bnths\b|national technical honor society/.test(text)) push(bags.clubs, 'NTHS');
  if (/\bdeca\b/.test(text)) push(bags.clubs, 'DECA');
  if (/\bfbla\b|future business leaders/.test(text)) push(bags.clubs, 'FBLA');
  if (/\bbpa\b|business professionals of america/.test(text)) push(bags.clubs, 'BPA');
  if (/\bfccla\b/.test(text)) push(bags.clubs, 'FCCLA');
  if (/\bhosa\b/.test(text)) push(bags.clubs, 'HOSA');
  if (/skillsusa/.test(text)) push(bags.clubs, 'SkillsUSA');
  if (/technology student association|member of both tsa|tsa and nths|nths and tsa/.test(text)) push(bags.clubs, 'TSA');
  if (/national honor society|\bnhs member\b/.test(text)) push(bags.clubs, 'National Honor Society');
  if (/eagle scout|\bnesa\b/.test(text)) push(bags.clubs, 'Eagle Scout');
  if (/wai member|wai membership|current wai/.test(text)) push(bags.clubs, 'WAI');
  if (/ngpa member|active ngpa|be an active ngpa/.test(text)) push(bags.clubs, 'NGPA');
  if (/aopa member/.test(text)) push(bags.clubs, 'AOPA');
  if (/\blpa member\b|active lpa/.test(text)) push(bags.clubs, 'LPA');
  if (/aea member(?! compan)/.test(text)) push(bags.clubs, 'AEA');
  if (/national gay pilots association/.test(text) && !bags.clubs.includes('NGPA')) push(bags.clubs, 'NGPA');
  if (/\bspeech and debate\b|\bdebate\b|\bspeech contest\b|\boratorical\b/.test(text)) push(bags.clubs, 'speech and debate');
  if (/\bdrama\b|\btheatre\b|\btheater\b|\bthespian\b/.test(text)) push(bags.clubs, 'drama');
  const bandText = text.replace(/\bbandwidth\b|\bbandage\b|\bband-aid\b/g, ' ');
  if (/\bband\b/.test(bandText)) push(bags.clubs, 'band');
  if (/\borchestra\b/.test(text)) push(bags.clubs, 'orchestra');
  if (/\bchoir\b|\bchorus\b/.test(text)) push(bags.clubs, 'choir');
  if (/\bchess\b/.test(text)) push(bags.clubs, 'chess');
  if (/\bstudent council\b|\bclass officer\b/.test(text)) push(bags.clubs, 'student council');
  if (/\byearbook\b/.test(text)) push(bags.clubs, 'yearbook');
}

function addSports(text: string, bags: Bags) {
  if (/\bstudent athlete\b|\bathlete\b/.test(text)) push(bags.sports, 'student athlete');
  for (const sport of ['golf', 'wrestling', 'rodeo', 'football', 'basketball', 'soccer', 'hockey', 'skiing', 'ski', 'tennis', 'volleyball', 'softball', 'baseball', 'swimming', 'track']) {
    if (sport === 'rodeo' && /rodeo association|lineman's rodeo/.test(text)) continue;
    if (new RegExp(`\\b${sport}\\b`).test(text)) push(bags.sports, sport === 'ski' ? 'skiing' : sport);
  }
  if (/\bcross[- ]country\b/.test(text)) push(bags.sports, 'cross country');
  if (/\bcheerleading\b|\bcheerleader\b|\bcheer\b/.test(text)) push(bags.sports, 'cheer');
}

function addHeritage(text: string, bags: Bags) {
  if (/native american|indigenous|enrolled member of the|confederated salish|tribal member/.test(text) && !/tribal, community, or four-year/.test(text)) {
    push(bags.heritage, 'Native American');
  }
  if (/hispanic|latino|latina/.test(text)) push(bags.heritage, 'Hispanic or Latino');
  if (/african american|\bblack students?\b|\bblack or\b/.test(text)) push(bags.heritage, 'Black or African American');
  if (/asian american|pacific islander|\basian\b/.test(text)) push(bags.heritage, 'Asian or Pacific Islander');
}

function addFaith(text: string, bags: Bags) {
  if (/presbyterian/.test(text)) push(bags.faith, 'Presbyterian');
  if (/\bcatholic\b/.test(text)) push(bags.faith, 'Catholic');
  if (/lutheran/.test(text)) push(bags.faith, 'Lutheran');
  if (/\bjewish\b/.test(text)) push(bags.faith, 'Jewish');
  if (/christian church|\bchristian\b/.test(text) && !bags.faith.includes('Presbyterian') && !bags.faith.includes('Catholic') && !bags.faith.includes('Lutheran')) {
    push(bags.faith, 'Christian');
  }
}

function addFamily(text: string, bags: Bags) {
  if (/\bveterans\b|\bveteran,|\bveteran or\b|\bof a veteran\b|\bfor a veteran\b|\bservice member\b|\bmilitary dependent\b|\bmilitary spouse\b|\bmilitary child\b|\bair force\b|\barmed forces\b|\bgold star\b/.test(text)) {
    push(bags.familyTies, 'military');
  }
  if (/first responder|game warden|highway patrol|sheriff|police officer|firefighter/.test(text)) push(bags.familyTies, 'first responder');
  if (/\bunion\b/.test(text.replace(/credit unions?/g, ' ').replace(/union league/g, ' '))) push(bags.familyTies, 'union');
  if (/farm bureau member/.test(text)) push(bags.familyTies, 'farm bureau');
  if (/electric co-op|electric coop|co-op member|regional co-op/.test(text)) push(bags.familyTies, 'electric co-op');
  if (/credit union member|member of .{0,40}credit union/.test(text)) push(bags.familyTies, 'credit union');
  if (/eligible elk|of an elk|elk member|elks member|grandchild of an elk|child of an elk/.test(text)) push(bags.familyTies, 'fraternal');
  if (/order of the rainbow/.test(text)) push(bags.familyTies, 'fraternal');
  if (!/member or employee/.test(text) && /employee of|employees of|employee or (?:the )?child|employee, or the child|child of an employee|child of a .{0,30}employee/.test(text)) {
    push(bags.familyTies, 'employer');
    const child = /child of an employee|employee, or the child|or the child|child or legal dependent|legal dependent of one|child of a .{0,40}employee/.test(text);
    const self = /employee of|employees of|\bemployee or\b|\bemployee, or\b|current eligible employee|current [\w .'-]{0,40}employee/.test(text);
    bags.employerKind = child && self ? 'either' : child ? 'parent' : 'self';
  }
  if (/parent who works at|parent works at/.test(text)) {
    push(bags.familyTies, 'employer');
    if (!bags.employerKind) bags.employerKind = 'parent';
  }
  if (/journeyman lineman/.test(text)) push(bags.familyTies, 'lineman family');
}

function addHealth(text: string, bags: Bags) {
  if (/dyslexia/.test(text)) push(bags.health, 'dyslexia');
  if (/\badhd\b/.test(text)) push(bags.health, 'ADHD');
  if (/autism/.test(text)) push(bags.health, 'autism');
  if (/learning disability|learning difference|processing disorder/.test(text)) push(bags.health, 'learning disability');
  if (/mental health/.test(text)) push(bags.health, 'mental health');
  if (/\bdiabetes\b|\bt1d\b|\bt2d\b|\btype 1\b|\btype 2\b/.test(text) && /diabetes|t1d|t2d/.test(text)) push(bags.health, 'diabetes');
  if (/chronic (?:disease|illness|condition)/.test(text)) push(bags.health, 'chronic illness');
  if (/\bdisability\b/.test(text) && !bags.health.includes('learning disability') && !/hardship, disability|disability, or|or disability/.test(text)) {
    push(bags.health, 'disability');
  }
}

function addLife(text: string, bags: Bags) {
  const childEitherWay = /biological or adopted|adopted or biological/.test(text);
  const adoptedOrFoster = /adopted or (?:in )?foster|foster(?: care)? or adopted/.test(text);
  if ((/foster care|foster-care|aged out of foster/.test(text) || adoptedOrFoster) && !childEitherWay) push(bags.lifeSituation, 'foster care');
  if (/\badopted\b/.test(text) && !childEitherWay) push(bags.lifeSituation, 'adopted');
  if (/gold star|loss of a parent|lost a parent|death of a parent/.test(text) || (/\bfallen\b/.test(text) && !/fallen or/.test(text))) {
    push(bags.lifeSituation, 'loss of a parent');
  }
  if (/experienced hardship|personal hardship|overcame adversity|overcome a personal challenge|overcoming adversity/.test(text)) push(bags.lifeSituation, 'hard times');
  if (/single parent/.test(text)) push(bags.lifeSituation, 'single parent');
  if (/caregiv/.test(text)) push(bags.lifeSituation, 'caregiving');
  if (/lgbtq/.test(text) && !/\bally\b/.test(text)) push(bags.lifeSituation, 'LGBTQ+');
  if (/\btwins must be\b|\bmust be twins\b|\bset of twins\b|\bhonors a set of twins\b/.test(text)) push(bags.lifeSituation, 'twins');
}

function addGender(text: string, bags: Bags) {
  text = text.replace(/women['’]s committee|women in aviation/g, ' ');
  if (/both boys and girls|boys and girls|men and women|women and men|male and female|female and male|any gender|all genders/.test(text)) return;
  if (/\bnon-?binary\b/.test(text)) push(bags.gender, 'nonbinary');
  if (/\btransgender\b/.test(text)) push(bags.gender, 'transgender');
  if (/gender-diverse/.test(text)) push(bags.gender, 'gender-diverse');
  if (/\bwomen\b|\bwoman\b|\bfemale\b|\bgirls\b|\bgirl\b/.test(text)) push(bags.gender, 'woman');
  if (/\bmen only\b|\bmale students?\b|\bboy[s]?\b/.test(text) && !/\bwomen\b|\bwoman\b|\bfemale\b|\bgirl/.test(text)) push(bags.gender, 'man');
}

function findPlace(raw: string): Place | null {
  const text = stripStateLists(raw.toLowerCase())
    .replace(/turn[^.]{0,140}guidance counselor/g, ' ')
    .replace(/on u\.s\. soil/g, ' ');
  if (!text.trim()) return null;
  if (/u\.s\. citizens/.test(text) && /stars institutions/.test(text)) {
    return { scope: 'national', level: 6, phrase: 'Students across the United States' };
  }
  const schools = listedSchools(text);
  if (schools.length > 0) return placeFromSchools(schools);
  if (/whitefish (?:independent )?high|whitefish independent/.test(text)) {
    return { scope: 'whitefish', level: 1, phrase: 'Only Whitefish High School students' };
  }
  const countyList = countiesNamedTogether(text);
  if (countyList.length >= 2) {
    return countyList.every((name) => name === 'flathead')
      ? { scope: 'flathead', level: 2, phrase: 'Only Flathead County students' }
      : { scope: 'regional', level: 3, phrase: 'Only students from a few Montana counties' };
  }
  if ((/flathead electric/.test(text) && /service area|flathead electric member|be a flathead electric/.test(text) && !/regional co-op/.test(text))
    || /member of flathead electric|served by the co-op|served by flathead electric|service territory of flathead electric|flathead electric service area|co-op's service area|co-op service area/.test(text)) {
    return { scope: 'flathead', level: 2, phrase: 'Only students in the Flathead Electric service area' };
  }
  if (/flathead county|flathead valley high|in flathead county|flathead valley/.test(text)) {
    return { scope: 'flathead', level: 2, phrase: 'Only Flathead County students' };
  }
  if (/\bfvcc\b|flathead valley community college/.test(text)) {
    return { scope: 'flathead', level: 2, phrase: 'Only students at Flathead Valley Community College' };
  }
  if (/flathead electric service area/.test(text)) {
    return { scope: 'flathead', level: 2, phrase: 'Only students from the Flathead Electric service area' };
  }
  const counties = montanaCounties(text);
  if (counties.length >= 2) return { scope: 'regional', level: 3, phrase: 'Only students in a few Montana counties' };
  if (/western montana/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students in western Montana' };
  if (/chattanooga state/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students at Chattanooga State Community College' };
  if (/colorado state university/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students at Colorado State University in Fort Collins' };
  if (/ohio resident|ohio college|in ohio\b/.test(text)) return { scope: 'regional', level: 4, phrase: 'Only Ohio students' };
  if (/\bin texas\b|texas high school/.test(text)) return { scope: 'regional', level: 4, phrase: 'Only Texas students' };
  if (/\bfrom maine\b|maine students/.test(text)) return { scope: 'regional', level: 4, phrase: 'Only Maine students' };
  if (/morris county|new jersey/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students in that New Jersey area' };
  if (/helena area high school/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students from Helena area high schools' };
  if (/confederated salish|enrolled member of the confederated salish and kootenai/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only enrolled members of the Confederated Salish and Kootenai Tribes' };
  }
  if (/southeast lineman training center/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only students at the Southeast Lineman Training Center in Georgia' };
  }
  const countyLimit = text.match(/\b(?:residents?|students?|seniors?|graduates?) (?:of|from) ([a-z][a-z' .-]{2,70}? county)\b/);
  if (countyLimit && !/flathead|lake county|lincoln|missoula|ravalli|sanders/.test(countyLimit[1])) {
    const countyName = countyLimit[1].replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
    return { scope: 'regional', level: 3, phrase: `Only students in ${countyName}` };
  }
  const otherState = otherStatePlace(text);
  if (otherState) return otherState;
  if (/bozeman/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students in Bozeman' };
  if (/montana tech/.test(text) && !/flathead electric/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only Montana Tech students' };
  }
  if (/montana state university|accepted to msu\b/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only Montana State University students' };
  }
  if (/university of montana/.test(text) && !/stars institutions/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only University of Montana students' };
  }
  if (/wyoming/.test(text) && /montana|idaho/.test(text)) {
    return { scope: 'regional', level: 5, phrase: 'Students in Montana and nearby states' };
  }
  if (hasMontanaResidency(text)) return { scope: 'montana', level: 4, phrase: 'Montana students' };
  if (/\bcanada\b/.test(text) && /\bu\.s\.|united states/.test(text)) {
    return { scope: 'national', level: 6, phrase: 'Students in the United States and Canada' };
  }
  if (/\bany student\b|\bany state\b|\bunited states\b|\bu\.s\./.test(text)) {
    return { scope: 'national', level: 6, phrase: 'Students across the United States' };
  }
  return null;
}

function stripStateLists(text: string): string {
  const names = 'alabama|alaska|american samoa|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|guam|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|puerto rico|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming';
  return text.replace(new RegExp(`(?:\\b(?:${names})\\b[\\s,]*){6,}`, 'g'), ' ');
}

function otherStatePlace(text: string): Place | null {
  const states: Array<[string, string]> = [
    ['district of columbia', 'the District of Columbia'],
    ['north carolina', 'North Carolina'],
    ['south carolina', 'South Carolina'],
    ['north dakota', 'North Dakota'],
    ['south dakota', 'South Dakota'],
    ['west virginia', 'West Virginia'],
    ['new hampshire', 'New Hampshire'],
    ['new mexico', 'New Mexico'],
    ['new york', 'New York'],
    ['rhode island', 'Rhode Island'],
    ['alaska', 'Alaska'],
    ['alaskan', 'Alaska'],
    ['california', 'California'],
    ['alabama', 'Alabama'],
    ['arizona', 'Arizona'],
    ['arkansas', 'Arkansas'],
    ['colorado', 'Colorado'],
    ['connecticut', 'Connecticut'],
    ['delaware', 'Delaware'],
    ['florida', 'Florida'],
    ['georgia', 'Georgia'],
    ['hawaii', 'Hawaii'],
    ['idaho', 'Idaho'],
    ['illinois', 'Illinois'],
    ['indiana', 'Indiana'],
    ['iowa', 'Iowa'],
    ['kansas', 'Kansas'],
    ['kentucky', 'Kentucky'],
    ['louisiana', 'Louisiana'],
    ['maryland', 'Maryland'],
    ['massachusetts', 'Massachusetts'],
    ['michigan', 'Michigan'],
    ['minnesota', 'Minnesota'],
    ['mississippi', 'Mississippi'],
    ['missouri', 'Missouri'],
    ['nebraska', 'Nebraska'],
    ['nevada', 'Nevada'],
    ['oklahoma', 'Oklahoma'],
    ['oregon', 'Oregon'],
    ['pennsylvania', 'Pennsylvania'],
    ['tennessee', 'Tennessee'],
    ['utah', 'Utah'],
    ['vermont', 'Vermont'],
    ['virginia', 'Virginia'],
    ['washington', 'Washington'],
    ['wisconsin', 'Wisconsin'],
  ];
  for (const [pattern, name] of states) {
    const re = new RegExp(`\\b(?:residents? of(?: the state of)?|high school students? (?:in|from)|must be an?|must be) ${pattern}\\b|\\b${pattern} residents?\\b`);
    if (re.test(text)) return { scope: 'regional', level: 4, phrase: `Only ${name} students` };
  }
  return null;
}

function listedSchools(text: string): string[] {
  const match = text.match(/(?:graduates? of|graduating seniors? (?:at|of)|seniors? at|senior at)\s+([^.]{0,240}?high school)/);
  const slice = match ? match[1] : '';
  const found = new Set<string>();
  const source = slice || text;
  const add = (name: string, pattern: RegExp) => {
    if (pattern.test(source)) found.add(name);
  };
  if (slice) {
    add('whitefish', /whitefish/);
    add('columbia falls', /columbia falls/);
    add('flathead high', /flathead high/);
    add('glacier high', /glacier(?! bank| medical| restaurant)/);
    add('bigfork', /bigfork/);
    add('eureka', /eureka/);
    add('libby', /libby/);
    add('polson', /polson/);
    add('ronan', /ronan/);
  }
  return [...found];
}

function placeFromSchools(schools: string[]): Place {
  const group = (school: string) => (school === 'whitefish' ? 'whitefish' : school === 'eureka' || school === 'libby' ? 'lincoln' : school === 'polson' || school === 'ronan' ? 'lake' : 'flathead');
  const groups = new Set(schools.map(group));
  if (groups.size === 1 && groups.has('whitefish')) {
    return { scope: 'whitefish', level: 1, phrase: 'Only Whitefish High School students' };
  }
  if ([...groups].every((item) => item === 'whitefish' || item === 'flathead')) {
    return { scope: 'flathead', level: 2, phrase: 'Only students from Flathead County high schools' };
  }
  return { scope: 'regional', level: 3, phrase: 'Only students from a few nearby high schools' };
}

function withoutSchoolMenus(text: string): string {
  const broad = /undergraduate|bachelor|four-year|\bcollege\b|\buniversity\b|building-related|life skills|specialized disability/;
  const narrow = /vocational|two-year|2-year|skilled-trade|certificate program|\btrades?\b|technical/;
  const strip = /skilled trades?|certificate programs?|trade schools?|technical schools?|technical programs?|vocational(?:\/skills training)?|two-year|2-year|skilled-trade|\btrades?\b/g;
  return text.split(/(?<=[.!?])\s+/).map((sentence) => {
    const choice = /\bor\b|\//.test(sentence);
    if (!(choice && broad.test(sentence) && narrow.test(sentence))) return sentence;
    return sentence.replace(strip, ' ');
  }).join(' ');
}

function separateAwardPaths(text: string): boolean {
  return /employee[\s\S]{0,100}\bor\b[\s\S]{0,80}\bresident\b/i.test(text)
    || /one for [\s\S]{0,180} and one for [\s\S]{0,80}\bresident\b/i.test(text);
}

function hasMontanaResidency(text: string): boolean {
  const cleaned = text
    .replace(/reach higher montana/g, ' ')
    .replace(/montana ffa foundation/g, ' ')
    .replace(/montana community foundation/g, ' ')
    .replace(/montana residents and nonresidents/g, ' ')
    .replace(/kid's chance of montana/g, ' ');
  if (/\bmontana farm bureau\b/.test(cleaned)) return true;
  if (/\bmontana (?:game warden|highway patrol|sheriff)\b/.test(cleaned)) return true;
  if (/\bmontana[- ]connected\b/.test(cleaned)) return true;
  const who = 'resident|residents|high school|student|students|graduate|graduates|graduating|freshman|freshmen|citizen|senior|seniors|junior|juniors|college|university|school|schools|program|tribe|tribes|campus';
  if (new RegExp(`\\bmontana\\b(?:\\s+\\w+){0,5}\\s+(?:${who})\\b`).test(cleaned)) return true;
  if (new RegExp(`(?:${who})\\b(?:\\s+\\w+){0,6}\\s+montana\\b`).test(cleaned)) return true;
  return /\b(?:in|from|across|throughout)\s+montana\b/.test(cleaned);
}

function countiesNamedTogether(text: string): string[] {
  const match = text.match(/\b(?:from|in)\s+([^.]{0,160}?county)/);
  if (!match) return [];
  const slice = match[1];
  const names = ['flathead', 'lake', 'missoula', 'ravalli', 'lincoln', 'sanders', 'powell', 'lewis and clark', 'jefferson', 'broadwater', 'glacier'];
  return names.filter((name) => slice.includes(name));
}

function montanaCounties(text: string): string[] {
  const names = ['flathead county', 'lincoln county', 'lake county', 'sanders county', 'missoula county', 'ravalli county', 'lewis and clark', 'jefferson county', 'broadwater'];
  return names.filter((name) => text.includes(name));
}

function poolReason(place: Place | null, level: PoolLevel | null, bags: Bags, blocked: 'past' | 'unread' | null, evidence: string): string {
  if (blocked === 'past') return 'The page only shows an old example, so the current rules are not known.';
  const limits = limitClauses(bags);
  if (!place) {
    if (limits.length === 0) return evidence.trim() ? 'The page does not say the place.' : 'The page does not say who can apply.';
    return clip(`The page does not say the place. It is for students who ${joinAnd(limits)}.`);
  }
  if (limits.length === 0) {
    if (level === 6) return place.phrase === 'Students in the United States and Canada'
      ? 'Large pool: open in the United States and Canada.'
      : 'Large pool: open nationwide.';
    return `${place.phrase} can apply.`;
  }
  return clip(`${place.phrase} who ${joinAnd(limits)} can apply.`);
}

function limitClauses(bags: Bags): string[] {
  const clauses: string[] = [];
  const clubPhrase: Record<string, string> = {
    'speech and debate': 'do speech and debate',
    drama: 'do drama or theatre',
    band: 'play in a band',
    orchestra: 'play in an orchestra',
    choir: 'sing in a choir',
    chess: 'play chess',
    'student council': 'are on student council',
    yearbook: 'work on the yearbook',
  };
  const speechAndDrama = bags.clubs.includes('speech and debate') && bags.clubs.includes('drama');
  if (speechAndDrama) clauses.push('do speech, debate, or drama');
  for (const club of bags.clubs) {
    if (speechAndDrama && (club === 'speech and debate' || club === 'drama')) continue;
    if (club === 'Eagle Scout') clauses.push('are Eagle Scouts');
    else if (clubPhrase[club]) clauses.push(clubPhrase[club]);
    else clauses.push(`are ${club} members`);
  }
  const planPhrase: Record<string, string> = {
    'pilot training': 'are training to be pilots',
    'drone training': 'are training to fly drones',
    'aviation maintenance': 'are training to fix airplanes',
    'aviation management': 'are studying aviation management',
    STEM: 'are studying STEM',
    healthcare: 'are studying healthcare',
    'skilled trades': 'are in the skilled trades',
    'two-year college': 'are in a two-year program',
    teaching: 'are planning to teach',
    agriculture: 'are studying agriculture or nature',
    business: 'are studying business',
    law: 'are studying law',
    arts: 'are studying art or music',
    'public service': 'are planning to serve the public',
    transportation: 'are studying transportation',
  };
  for (const plan of bags.plans) clauses.push(planPhrase[plan] ?? `are studying ${plan}`);
  for (const sport of bags.sports) {
    if (sport === 'student athlete') clauses.push('play a sport');
    else if (sport === 'cheer') clauses.push('cheer');
    else if (sport === 'cross country') clauses.push('run cross country');
    else clauses.push(`play ${sport}`);
  }
  for (const item of bags.heritage) clauses.push(`are ${item}`);
  for (const item of bags.faith) clauses.push(`are connected to a ${item} church`);
  const familyPhrase: Record<string, string> = {
    military: 'have a military family tie',
    'first responder': 'have a first responder in the family',
    union: 'have a union family tie',
    employer: bags.employerKind === 'self'
      ? 'work for the sponsor'
      : bags.employerKind === 'either'
        ? 'work for the sponsor or have a parent who does'
        : 'have a parent who works for the sponsor',
    fraternal: 'have a family tie to a lodge',
    'electric co-op': 'have an electric co-op family tie',
    'credit union': 'have a credit union family tie',
    'farm bureau': 'have a Farm Bureau family tie',
    'lineman family': 'have a lineman in the family',
  };
  for (const item of bags.familyTies) clauses.push(familyPhrase[item] ?? `have a ${item} family tie`);
  if (bags.health.length === 1) clauses.push(healthClause(bags.health[0]));
  else if (bags.health.length > 1) clauses.push('have a learning or health need listed on the award');
  const lifePhrase: Record<string, string> = {
    'foster care': 'have been in foster care',
    adopted: 'were adopted',
    'loss of a parent': 'lost a parent',
    'single parent': 'live in a single parent home',
    caregiving: 'care for someone at home',
    'hard times': 'have faced a hard time',
    'LGBTQ+': 'are LGBTQ+',
    twins: 'are twins',
  };
  const life = new Set(bags.lifeSituation);
  if (life.has('adopted') && life.has('foster care')) {
    clauses.push('were adopted or were in foster care');
    life.delete('adopted');
    life.delete('foster care');
  }
  for (const item of life) clauses.push(lifePhrase[item] ?? item);
  for (const item of bags.gender) {
    if (item === 'woman') clauses.push('are women');
    else if (item === 'man') clauses.push('are men');
    else clauses.push(`are ${item}`);
  }
  if (bags.firstGen) clauses.push('would be the first in their family to go to college');
  if (bags.needBased) clauses.push('need help paying for college');
  if (bags.ruralRule === 'service-area' && !bags.familyTies.includes('electric co-op')) clauses.push('live in the sponsor service area');
  if (clauses.length > 4) return [...clauses.slice(0, 4), 'meet other rules on the award'];
  return clauses;
}

function healthClause(tag: string): string {
  if (tag === 'ADHD' || tag === 'autism' || tag === 'dyslexia') return `have ${tag}`;
  if (tag === 'mental health') return 'have a mental health need';
  if (tag === 'diabetes') return 'have diabetes';
  return `have a ${tag}`;
}

function competitionScore(level: PoolLevel, bags: Bags, gpa: number | null): number {
  const [low, high] = SCORE_BANDS[level];
  const ruralNiche = Boolean(bags.ruralRule && bags.ruralRule !== 'none');
  const groups = [bags.sports, bags.clubs, bags.heritage, bags.faith, bags.familyTies, bags.plans, bags.health, bags.lifeSituation, bags.gender]
    .filter((list) => list.length > 0).length
    + (bags.firstGen ? 1 : 0) + (bags.needBased ? 1 : 0) + (ruralNiche ? 1 : 0);
  let gpaCut = 0;
  if (gpa !== null && gpa >= 3.5) gpaCut = 2;
  else if (gpa !== null && gpa >= 3) gpaCut = 1;
  return Math.max(low, Math.min(high, high - groups * 3 - gpaCut));
}

function hasNiche(bags: Bags): boolean {
  return Boolean(
    bags.sports.length || bags.clubs.length || bags.heritage.length || bags.faith.length || bags.familyTies.length
    || bags.plans.length || bags.health.length || bags.lifeSituation.length || bags.gender.length
    || bags.firstGen || bags.needBased || (bags.ruralRule !== null && bags.ruralRule !== 'none'),
  );
}

function matchedStep3Ids(tags: AwardTags, evidence: string): string[] {
  const ids = new Set<string>();
  for (const club of tags.clubs ?? []) {
    const step = CLUB_STEP3[club];
    if (step) ids.add(step);
  }
  if ((tags.sports ?? []).length > 0) ids.add('athletics_sports');
  for (const item of tags.heritage ?? []) {
    if (item === 'Native American') ids.add('native_american');
    if (item === 'Hispanic or Latino') ids.add('hispanic_latino');
    if (item === 'Black or African American') ids.add('black_african_american');
    if (item === 'Asian or Pacific Islander') ids.add('asian_pacific_islander');
  }
  for (const item of tags.familyTies ?? []) {
    if (item === 'military') ids.add('military_veteran');
    if (item === 'first responder') ids.add('first_responder');
    if (item === 'electric co-op') ids.add('electric_coop');
    if (item === 'credit union') ids.add('credit_union');
    if (item === 'employer') ids.add('company_employee');
    if (item === 'fraternal' && /\belk/i.test(evidence)) ids.add('elks_lodge');
    if (item === 'union' && /farmers union/i.test(evidence)) ids.add('farmers_union');
  }
  for (const plan of tags.plans ?? []) {
    if (plan === 'pilot training' || plan === 'drone training') ids.add('aviation_pilot');
    if (plan === 'aviation maintenance') ids.add('aviation_maintenance');
    if (plan === 'aviation management') ids.add('aviation_management');
    if (plan === 'STEM') ids.add('stem');
    if (plan === 'healthcare') ids.add('healthcare');
    if (plan === 'skilled trades' || plan === 'two-year college') ids.add('trades');
    if (plan === 'business') ids.add('business_finance');
    if (plan === 'law') ids.add('law');
    if (plan === 'arts') ids.add('arts_humanities');
    if (plan === 'agriculture') ids.add('agriculture_conservation');
    if (plan === 'teaching') ids.add('education_teaching');
    if (plan === 'public service') ids.add('public_service');
  }
  for (const item of tags.health ?? []) {
    if (item === 'dyslexia') ids.add('dyslexia');
    if (item === 'ADHD') ids.add('adhd');
    if (item === 'autism') ids.add('autism');
    if (item === 'learning disability') ids.add('learning_other');
    if (item === 'mental health') ids.add('mental_health');
    if (item === 'chronic illness') ids.add('chronic_health');
  }
  for (const item of tags.lifeSituation ?? []) {
    if (item === 'foster care') ids.add('foster_care');
    if (item === 'loss of a parent') ids.add('loss_of_parent');
    if (item === 'hard times') ids.add('overcoming_adversity');
    if (item === 'single parent') ids.add('single_parent');
    if (item === 'caregiving') ids.add('caregiving');
    if (item === 'LGBTQ+') ids.add('lgbtqia');
  }
  for (const item of tags.gender ?? []) {
    if (item === 'woman') ids.add('female');
    if (item === 'nonbinary' || item === 'transgender' || item === 'gender-diverse') ids.add('nonbinary');
  }
  if (tags.firstGen) ids.add('first_generation');
  if (tags.needBased) ids.add('financial_need');
  if (/\bmensa\b/i.test(evidence)) ids.add('mensa');
  if (/\bleadership position\b|\bteam captain\b|\bclass president\b/i.test(evidence)) ids.add('leadership');
  if (/\bcommunity service\b|\bvolunteer hours\b/i.test(evidence)) ids.add('service');
  if (/\bwork experience\b|\bpart-time job\b/i.test(evidence)) ids.add('work_experience');
  return [...ids].sort();
}

function blockReason(award: TaggableAward): 'past' | 'unread' | null {
  const audience = award.eligibility.audience || '';
  const summary = award.summary || '';
  if (/^past example\b/i.test(audience) || /examples of past scholarships/i.test(summary)) return 'past';
  return null;
}

function evidenceText(award: TaggableAward): string {
  const audience = award.eligibility.audience || '';
  const summary = stripName(award.summary || '', award.name);
  const focus = focusForEvidence(award.eligibility.focus);
  const unreadAudience = /not stated|not named|could not be read/i.test(audience);
  const parts = unreadAudience ? [summary, focus] : [audience, summary, focus];
  const raw = joinSentences(parts).replace(/reach higher montana/gi, ' ');
  return usableSentences(raw).join(' ');
}

function joinSentences(parts: string[]): string {
  return parts
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => /[.!?]$/.test(part) ? part : `${part}.`)
    .join(' ');
}

function focusForEvidence(focus: string | null): string {
  if (!focus) return '';
  if (focus.trim().split(/\s+/).length <= 3) return '';
  return focus;
}

function usableSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .filter((sentence) => !/does not (state|name|give|list|post|say)|could not be read|examples of past|past scholarships|preference|preferred|priority goes to|not stated|not named|next window|does not have to|do not have to|not have to be|regardless of race|regardless of ethnicity/i.test(sentence))
    .filter((sentence) => !/\b(she|he) (became|bought|earned|joined|worked|was|qualified|went)\b/i.test(sentence));
}

function stripName(text: string, name: string): string {
  if (name.trim().length < 8) return text;
  return text.split(name).join(' ');
}

function essayFlag(award: TaggableAward, extra = ''): boolean | null {
  const text = `${award.name} ${award.summary ?? ''} ${award.eligibility.audience} ${extra}`;
  if (/\bno[ -]?essay\b/i.test(text)) return false;
  if (/\b(essay|personal statement)\b/i.test(text)) return true;
  return null;
}

function renewableFlag(award: TaggableAward, extra = ''): boolean | null {
  const text = `${award.name} ${award.summary ?? ''} ${award.eligibility.audience} ${extra}`;
  if (/\b(non-renewable|nonrenewable|not renewable)\b/i.test(text)) return false;
  if (/\brenewable\b|\bcan renew\b|\brenew for\b|\brenewed\b|reapply each year|reapply annually|reapply yearly|option to reapply/i.test(text)) return true;
  return null;
}

function nameHints(name: string, evidence: string): string[] {
  const hints: Array<{ test: RegExp; unless: RegExp; note: string }> = [
    { test: /\belk/i, unless: /\belk/i, note: 'The name says Elks, but the page does not require an Elks family tie.' },
    { test: /credit union/i, unless: /credit union/i, note: 'The name says credit union, but the page does not say the student must be a member.' },
    { test: /military|veteran|\bvfw\b|amvets/i, unless: /veteran|service member|military dependent|military spouse|air force|armed forces/i, note: 'The name says military or veteran, but the page does not require a military family tie.' },
    { test: /farm bureau/i, unless: /farm bureau/i, note: 'The name says Farm Bureau, but the page does not say membership is required.' },
    { test: /foster/i, unless: /foster/i, note: 'The name says foster, but the page does not say foster care is required.' },
    { test: /first generation|first in the family/i, unless: /first[- ]generation|first in the family|considered automatically/i, note: 'The name says first generation, but the page does not say that.' },
    { test: /\bfor girls\b|\bfor women\b/i, unless: /\bwoman\b|\bwomen\b|\bfemale\b|\bgirl/i, note: 'The name says girls or women, but the page does not say that.' },
    { test: /pilot|flight training/i, unless: /pilot|flight/i, note: 'The name says flight training, but the page does not say that.' },
    { test: /maintenance/i, unless: /maintenance|a&p|avionics/i, note: 'The name says maintenance, but the page does not say that.' },
    { test: /\bmontana\b/i, unless: /montana/i, note: 'The name says Montana, but the page does not say the student must be from Montana.' },
    { test: /whitefish/i, unless: /whitefish/i, note: 'The name says Whitefish, but the page does not say the student must be from Whitefish.' },
  ];
  return hints.filter((hint) => hint.test.test(name) && !hint.unless.test(evidence)).map((hint) => hint.note);
}

function push(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

function listOrNull(list: string[]): string[] | null {
  return list.length ? [...list].sort((a, b) => a.localeCompare(b)) : null;
}

function joinAnd(parts: string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts.slice(0, -1).join(', ')}, and ${parts[parts.length - 1]}`;
}

function clip(text: string): string {
  if (text.length <= 280) return text;
  return `${text.slice(0, 276).replace(/[, ]+$/, '')}.`;
}
