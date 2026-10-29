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

export function deriveAwardTags(award: TaggableAward, linkAnswerIds: readonly string[] = []): DeriveResult {
  const blocked = blockReason(award);
  const evidence = blocked ? '' : evidenceText(award);
  const notes: string[] = [];
  if (blocked === 'past') notes.push('The page only shows an old example, so the current rules were not tagged.');
  if (blocked === 'unread') notes.push('The page does not say who can apply.');
  if (!blocked && evidence === '' && !/^(any student|in-state)$/i.test(award.eligibility.audience.trim())) {
    notes.push('The page does not say who can apply.');
  }
  if (/^in-state$/i.test(award.eligibility.audience.trim())) {
    notes.push('The page only says In-State and does not name the state.');
  }

  const bags = collect(evidence, blocked);
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

  const place = blocked || splitPaths ? null : findPlace(evidence);
  if (!place && !blocked && !splitPaths && evidence !== '') notes.push('The page does not say the place.');
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
    essayRequired: blocked ? null : essayFlag(award),
    renewable: blocked ? null : renewableFlag(award),
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
  if (/\bservice area\b/.test(text)) bags.ruralRule = 'service-area';
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
      hits = hits.filter((hit) => hit !== 'STEM' && hit !== 'healthcare');
      bags.fieldMenu = true;
    }
    if (hits.includes('business') && hits.includes('STEM') && /\bbusiness\b.{0,12}\bor\b.{0,12}\bstem\b|\bstem\b.{0,12}\bor\b.{0,12}\bbusiness\b/.test(sentence)) {
      bags.fieldMenu = true;
      continue;
    }
    if (hits.includes('skilled trades') && hits.includes('agriculture') && /\btrades?\b.{0,24}\bor\b.{0,40}\bagricultur|\bagricultur\w*.{0,24}\bor\b.{0,40}\btrades?\b/.test(sentence)) {
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
  add('skilled trades', /\bskilled trades?\b|\bvocational\b|\btrade program\b|\btrade school\b|\bhvac\b|\bweld(?:er|ing)\b|\blineman\b|\bconstruction\b|\bcertificate program\b|\bcraft\b|\btechnical programs?\b|\btrades\b/.test(sentence));
  add('two-year college', /\btwo years or less\b|\btwo-year\b|\b2-year\b|\bassociate degree\b|\bassociate program\b/.test(sentence));
  add('teaching', /\beducation career\b|\bmajor in education\b|\bplanning to teach\b|\bearly childhood\b|\beducation teacher\b|\bwork with children\b/.test(sentence));
  add('agriculture', /\bagricultur|\bfarming\b|\bnatural resources\b|\bforestry\b|\bconservation\b/.test(sentence));
  add('business', /\bbusiness\b|\bfinance\b|\baccounting\b/.test(businessText));
  add('law', /\bpre-law\b|\blaw school\b|\blegal studies\b|\bcriminal justice\b/.test(sentence));
  add('arts', /\bart or music\b|\bfine arts?\b|\btheatre\b|\btheater\b|\bmajor in art\b|\bin music\b|\bmusic degree\b/.test(sentence));
  add('public service', /\blaw enforcement\b|\bsocial work\b|\bpublic service\b/.test(sentence));
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
}

function addSports(text: string, bags: Bags) {
  if (/\bstudent athlete\b|\bathlete\b/.test(text)) push(bags.sports, 'student athlete');
  for (const sport of ['golf', 'wrestling', 'rodeo', 'football', 'basketball', 'soccer', 'hockey', 'skiing', 'ski', 'tennis', 'volleyball', 'softball', 'baseball', 'swimming', 'track']) {
    if (sport === 'rodeo' && /rodeo association|lineman's rodeo/.test(text)) continue;
    if (new RegExp(`\\b${sport}\\b`).test(text)) push(bags.sports, sport === 'ski' ? 'skiing' : sport);
  }
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
  if (/\bunion\b/.test(text.replace(/credit unions?/g, ' '))) push(bags.familyTies, 'union');
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
  if (/journeyman lineman/.test(text)) push(bags.familyTies, 'lineman family');
}

function addHealth(text: string, bags: Bags) {
  if (/dyslexia/.test(text)) push(bags.health, 'dyslexia');
  if (/\badhd\b/.test(text)) push(bags.health, 'ADHD');
  if (/autism/.test(text)) push(bags.health, 'autism');
  if (/learning disability|learning difference|processing disorder/.test(text)) push(bags.health, 'learning disability');
  if (/mental health/.test(text)) push(bags.health, 'mental health');
  if (/chronic (?:disease|illness|condition)|diabetes/.test(text)) push(bags.health, 'chronic illness');
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
}

function addGender(text: string, bags: Bags) {
  if (/\bnon-?binary\b/.test(text)) push(bags.gender, 'nonbinary');
  if (/\btransgender\b/.test(text)) push(bags.gender, 'transgender');
  if (/gender-diverse/.test(text)) push(bags.gender, 'gender-diverse');
  if (/\bwomen\b|\bwoman\b|\bfemale\b|\bgirls\b|\bgirl\b/.test(text)) push(bags.gender, 'woman');
  if (/\bmen only\b|\bmale students?\b|\bboy[s]?\b/.test(text) && !/\bwomen\b|\bwoman\b|\bfemale\b|\bgirl/.test(text)) push(bags.gender, 'man');
}

function findPlace(raw: string): Place | null {
  const text = raw.toLowerCase();
  if (!text.trim()) return null;
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
  if (/flathead electric/.test(text) && /service area|flathead electric member|be a flathead electric/.test(text) && !/regional co-op/.test(text)) {
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
  if (/bozeman/.test(text)) return { scope: 'regional', level: 3, phrase: 'Only students in Bozeman' };
  if (/montana tech/.test(text) && !/flathead electric/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only Montana Tech students' };
  }
  if (/montana state university|accepted to msu\b/.test(text)) {
    return { scope: 'regional', level: 3, phrase: 'Only Montana State University students' };
  }
  if (/university of montana/.test(text)) {
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
      ? 'Open to students in the United States and Canada.'
      : 'Open to students across the United States.';
    return `${place.phrase} can apply.`;
  }
  return clip(`${place.phrase} who ${joinAnd(limits)} can apply.`);
}

function limitClauses(bags: Bags): string[] {
  const clauses: string[] = [];
  for (const club of bags.clubs) {
    if (club === 'Eagle Scout') clauses.push('are Eagle Scouts');
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
  for (const sport of bags.sports) clauses.push(sport === 'student athlete' ? 'play a sport' : `play ${sport}`);
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
  return `have a ${tag}`;
}

function competitionScore(level: PoolLevel, bags: Bags, gpa: number | null): number {
  const [low, high] = SCORE_BANDS[level];
  const groups = [bags.sports, bags.clubs, bags.heritage, bags.faith, bags.familyTies, bags.plans, bags.health, bags.lifeSituation, bags.gender]
    .filter((list) => list.length > 0).length
    + (bags.firstGen ? 1 : 0) + (bags.needBased ? 1 : 0) + (bags.ruralRule ? 1 : 0);
  let gpaCut = 0;
  if (gpa !== null && gpa >= 3.5) gpaCut = 2;
  else if (gpa !== null && gpa >= 3) gpaCut = 1;
  return Math.max(low, Math.min(high, high - groups * 3 - gpaCut));
}

function hasNiche(bags: Bags): boolean {
  return Boolean(
    bags.sports.length || bags.clubs.length || bags.heritage.length || bags.faith.length || bags.familyTies.length
    || bags.plans.length || bags.health.length || bags.lifeSituation.length || bags.gender.length
    || bags.firstGen || bags.needBased || bags.ruralRule,
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
    .filter((sentence) => !/does not (state|name|give|list|post|say)|could not be read|examples of past|past scholarships|preference|preferred|priority goes to|not stated|not named|next window|does not have to|do not have to|not have to be/i.test(sentence));
}

function stripName(text: string, name: string): string {
  if (name.trim().length < 8) return text;
  return text.split(name).join(' ');
}

function essayFlag(award: TaggableAward): boolean | null {
  const text = `${award.name} ${award.summary ?? ''} ${award.eligibility.audience}`;
  if (/\bno[ -]?essay\b/i.test(text)) return false;
  if (/\b(essay|personal statement)\b/i.test(text)) return true;
  return null;
}

function renewableFlag(award: TaggableAward): boolean | null {
  const text = `${award.name} ${award.summary ?? ''} ${award.eligibility.audience}`;
  if (/\b(non-renewable|nonrenewable|not renewable)\b/i.test(text)) return false;
  if (/\brenewable\b|\bcan renew\b|\brenew for\b|\brenewed\b|reapply each year|reapply annually|option to reapply/i.test(text)) return true;
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
