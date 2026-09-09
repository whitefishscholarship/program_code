export const RESIDENCE_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
  ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
  ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'],
  ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'],
  ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'],
  ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'],
  ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'],
  ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'],
  ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'],
  ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'], ['WY', 'Wyoming'], ['OTHER', 'Other'],
] as const;

export const EDUCATIONAL_STATUSES = [
  ['high_school_senior', 'High school senior'],
  ['homeschool_senior', 'Homeschool senior'],
  ['undergraduate', 'Current college student'],
  ['gap_year', 'Gap year'],
  ['ged', 'GED'],
  ['other', 'Other'],
] as const;

export const TARGET_SCHOOL_TYPES = [
  ['two_year', 'Two year'],
  ['four_year', 'Four year'],
  ['trade_vocational', 'Trade'],
  ['undecided', 'Undecided'],
] as const;

export const ACTIVITY_QUESTIONS = [
  { id: 'leadership', controlId: 'student-leadership', label: 'Hold a leadership position (Captain, President, Manager)', criterionId: 'responsibility.leadership', sensitive: false },
  { id: 'work_experience', controlId: 'student-work-experience', label: 'Have a part-time job or work experience', criterionId: 'responsibility.work_experience', sensitive: false },
  { id: 'caregiving', controlId: 'student-caregiving', label: 'Have significant caregiving responsibilities at home', criterionId: 'responsibility.caregiving', sensitive: true },
  { id: 'service', controlId: 'student-community-service', label: 'Participate in community service or volunteering', criterionId: 'service.community_service', sensitive: false },
] as const;

export const VOLUNTEER_HOURS = [
  ['1 to 19', '1 to 19'],
  ['20 to 49', '20 to 49'],
  ['50 to 99', '50 to 99'],
  ['100 plus', '100+ hours'],
] as const;

export const SPECIAL_CRITERIA = [
  { category: 'Neurodiversity & Learning', id: 'dyslexia', controlId: 'criterion-dyslexia', label: 'Dyslexia', detail: 'Diagnosed with Dyslexia.', criterionId: 'learning.dyslexia', sensitive: true, rankOnly: false },
  { category: 'Neurodiversity & Learning', id: 'adhd', controlId: 'criterion-adhd', label: 'ADHD', detail: 'Diagnosed with Attention-Deficit/Hyperactivity Disorder.', criterionId: 'learning.adhd', sensitive: true, rankOnly: false },
  { category: 'Neurodiversity & Learning', id: 'autism', controlId: 'criterion-autism', label: 'Autism Spectrum', detail: 'Autism or related neurodivergent identities.', criterionId: 'learning.autism', sensitive: true, rankOnly: false },
  { category: 'Neurodiversity & Learning', id: 'learning_other', controlId: 'criterion-learning-other', label: 'Other Learning Disability', detail: 'Processing disorders or other learning differences.', criterionId: 'learning.disability_other', sensitive: true, rankOnly: false },
  { category: 'Health & Hardships', id: 'mental_health', controlId: 'criterion-mental-health', label: 'Mental Health Challenges', detail: 'Personal struggle with mental health or impacted by a family member.', criterionId: 'health.mental_health', sensitive: true, rankOnly: false },
  { category: 'Health & Hardships', id: 'chronic_health', controlId: 'criterion-chronic-health', label: 'Chronic Disease / Physical Health', detail: 'Long-term health issues like diabetes or significant physical challenges.', criterionId: 'health.chronic_condition', sensitive: true, rankOnly: false },
  { category: 'Health & Hardships', id: 'foster_care', controlId: 'criterion-foster-care', label: 'Foster Care Experience', detail: 'Current or former youth in the foster care system.', criterionId: 'hardship.foster_care', sensitive: true, rankOnly: false },
  { category: 'Health & Hardships', id: 'loss_of_parent', controlId: 'criterion-loss-of-parent', label: 'Loss of Parent or Guardian', detail: 'Especially in the line of duty.', criterionId: 'hardship.loss_of_parent', sensitive: true, rankOnly: false },
  { category: 'Health & Hardships', id: 'overcoming_adversity', controlId: 'criterion-overcoming-adversity', label: 'Overcoming Significant Adversity', detail: 'Demonstrated tenacity in overcoming profound obstacles or personal hardships.', criterionId: 'hardship.overcoming_adversity', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'first_generation', controlId: 'criterion-first-generation', label: 'First-Generation College', detail: 'First in your immediate family to attend college.', criterionId: 'education.first_generation', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'black_african_american', controlId: 'criterion-black-african-american', label: 'Black or African American', detail: null, criterionId: 'identity.race_ethnicity', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'hispanic_latino', controlId: 'criterion-hispanic-latino', label: 'Hispanic or Latino/a', detail: null, criterionId: 'identity.race_ethnicity', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'native_american', controlId: 'criterion-native-american', label: 'Native American or Indigenous', detail: null, criterionId: 'identity.race_ethnicity', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'asian_pacific_islander', controlId: 'criterion-asian-pacific-islander', label: 'Asian or Pacific Islander', detail: null, criterionId: 'identity.race_ethnicity', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'lgbtqia', controlId: 'criterion-lgbtqia', label: 'LGBTQIA+', detail: 'Lesbian, Gay, Bisexual, Transgender, Queer, Intersex, or Asexual identity.', criterionId: 'identity.lgbtqia', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'female', controlId: 'criterion-female', label: 'Female', detail: 'Often strongly considered for underrepresented fields like STEM or Aviation.', criterionId: 'identity.gender', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'nonbinary', controlId: 'criterion-nonbinary', label: 'Non-Binary', detail: null, criterionId: 'identity.gender', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'single_parent', controlId: 'criterion-single-parent', label: 'Single Parent Household', detail: 'Raised by a single parent, or currently a single parent.', criterionId: 'identity.single_parent_household', sensitive: true, rankOnly: false },
  { category: 'Demographics & Identity', id: 'mensa', controlId: 'criterion-mensa', label: 'Mensa Member', detail: 'You or a family member are a current member of Mensa.', criterionId: 'identity.mensa_member', sensitive: true, rankOnly: false },
  { category: 'Career Interests', id: 'aviation_pilot', controlId: 'criterion-aviation-pilot', label: 'Aviation - Pilot Training', detail: 'Flight training, commercial pilot, etc.', criterionId: 'career.aviation_pilot', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'aviation_maintenance', controlId: 'criterion-aviation-maintenance', label: 'Aviation - Maintenance', detail: 'A&P Mechanics, aviation maintenance technology.', criterionId: 'career.aviation_maintenance', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'aviation_management', controlId: 'criterion-aviation-management', label: 'Aviation - Management', detail: 'Air traffic control, airport management.', criterionId: 'career.aviation_management', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'stem', controlId: 'criterion-stem', label: 'STEM', detail: 'Science, Technology, Engineering, or Mathematics fields.', criterionId: 'career.stem', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'healthcare', controlId: 'criterion-healthcare', label: 'Healthcare & Nursing', detail: 'Nursing, Pre-Med, therapy, or related medical careers.', criterionId: 'career.healthcare', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'trades', controlId: 'criterion-trades', label: 'Skilled Trades & Construction', detail: 'Construction management, HVAC, plumbing, welding, or automotive.', criterionId: 'career.trades', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'business_finance', controlId: 'criterion-business-finance', label: 'Business & Finance', detail: 'Accounting, marketing, entrepreneurship, or banking.', criterionId: 'career.business_finance', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'public_service', controlId: 'criterion-public-service', label: 'Public Service & Social Impact', detail: 'Social work, early education, first responder, or community improvement.', criterionId: 'career.public_service', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'law', controlId: 'criterion-law', label: 'Law & Legal Studies', detail: 'Pre-Law, Paralegal studies, or criminal justice.', criterionId: 'career.law', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'arts_humanities', controlId: 'criterion-arts-humanities', label: 'Arts & Humanities', detail: 'Music education, graphic design, or fine arts.', criterionId: 'career.arts_humanities', sensitive: false, rankOnly: true },
  { category: 'Career Interests', id: 'agriculture_conservation', controlId: 'criterion-agriculture-conservation', label: 'Agriculture & Conservation', detail: 'Forestry, farming, floriculture, or natural resources.', criterionId: 'career.agriculture_conservation', sensitive: false, rankOnly: true },
  { category: 'Extracurriculars & Activities', id: 'athletics_sports', controlId: 'criterion-athletics-sports', label: 'Student Athlete / Sports Background', detail: 'Involved in athletics, refereeing, or specific sports like golf.', criterionId: 'athletics.participation', sensitive: false, rankOnly: true },
  { category: 'Family, Employee, & Org Affiliations', id: 'military_veteran', controlId: 'criterion-military-veteran', label: 'Military or Veteran Affiliation', detail: 'Self or family member who is a veteran or active-duty military.', criterionId: 'affiliation.military_veteran', sensitive: true, rankOnly: false },
  { category: 'Family, Employee, & Org Affiliations', id: 'first_responder', controlId: 'criterion-first-responder', label: 'First Responder Affiliation', detail: 'Self or family member who is a police officer, firefighter, EMT, etc.', criterionId: 'affiliation.first_responder', sensitive: true, rankOnly: false },
  { category: 'Family, Employee, & Org Affiliations', id: 'farmers_union', controlId: 'criterion-farmers-union', label: 'Farmers Union Member', detail: 'Family membership in the Farmers Union.', criterionId: 'affiliation.farmers_union', sensitive: true, rankOnly: false },
  { category: 'Family, Employee, & Org Affiliations', id: 'electric_coop', controlId: 'criterion-electric-coop', label: 'Electric Co-op Member', detail: 'Family utilizes a local Electric Co-op (e.g. Flathead Electric).', criterionId: 'affiliation.electric_coop', sensitive: true, rankOnly: false },
  { category: 'Family, Employee, & Org Affiliations', id: 'credit_union', controlId: 'criterion-credit-union', label: 'Credit Union Member', detail: 'Family utilizes a local Credit Union (e.g. Whitefish Credit Union).', criterionId: 'affiliation.credit_union', sensitive: true, rankOnly: false },
  { category: 'Family, Employee, & Org Affiliations', id: 'elks_lodge', controlId: 'criterion-elks-lodge', label: 'Elks Lodge Affiliation', detail: 'Family involvement with the Elks Lodge.', criterionId: 'affiliation.elks_lodge', sensitive: true, rankOnly: false },
  { category: 'Family, Employee, & Org Affiliations', id: 'company_employee', controlId: 'criterion-company-employee', label: 'Corporate Sponsor Employee / Dependent', detail: 'Parent/Guardian is an employee of a major local sponsor (e.g. Don K, Whitefish Mountain Resort).', criterionId: 'affiliation.company_employee', sensitive: true, rankOnly: false },
] as const;

export const SPECIAL_CRITERIA_CATEGORIES = [...new Set(SPECIAL_CRITERIA.map((item) => item.category))];
