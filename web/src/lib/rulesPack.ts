export const RulesPack = {
    version: '1.0.0',

    // High confidence keywords that drive hard excludes
    requirements: {
        // Deprecated: Shifted entirely into strict_exclude_criteria
        organizations: {},

        // Hard exclude if required but student has < 50 hours
        service_hours: {
            high_tier: [/minimum 50/i, /at least 50/i, /significant community service/i],
            medium_tier: [/minimum 20/i, /at least 20/i]
        },

        // Tier 1 Special Criteria (Strict Exclusion)
        // If a scholarship text matches these, and the student DID NOT select the matching ID, 
        // the scholarship is strictly hidden to prevent false positives for highly specific identities/hardships.
        strict_exclude_criteria: {
            // Neurodiversity & Learning
            dyslexia: [/dyslexia/i],
            adhd: [/adhd/i],
            autism: [/autism/i, /neurodiver/i],
            learning_other: [/learning disability/i, /learning difference/i],

            // Health & Hardships
            mental_health: [/mental health/i, /depression/i, /anxiety/i, /suicide/i],
            chronic_health: [/chronic/i, /diabetes/i, /health challenge/i, /cancer/i, /illness/i],
            foster_care: [/foster/i, /foster care/i, /orphan/i, /ward of the state/i],
            loss_of_parent: [/loss of parent/i, /deceased parent/i, /fallen/i, /line of duty/i],
            overcoming_adversity: [/adversity/i, /hardship/i, /obstacles/i, /overcome/i, /resilience/i],

            // Demographics & Identity
            first_generation: [/first generation/i, /first-generation/i, /first in family/i],
            black_african_american: [/black/i, /african american/i],
            hispanic_latino: [/hispanic/i, /latinx/i, /latino/i, /latina/i],
            native_american: [/indigenous/i, /native american/i, /tribal/i, /tribe/i],
            asian_pacific_islander: [/asian/i, /pacific islander/i],
            lgbtqia: [/lgbtq/i, /transgender/i, /gay/i, /lesbian/i, /queer/i],
            female: [/women/i, /female/i, /girls/i],
            nonbinary: [/non-binary/i, /nonbinary/i],
            single_parent: [/single parent/i],
            mensa: [/mensa/i],

            // Family, Employee & Org Affiliations
            military_veteran: [/veteran/i, /military/i, /air force/i, /navy/i, /marines/i, /army/i],
            first_responder: [/first responder/i, /police/i, /firefighter/i, /law enforcement/i, /emt/i],
            farmers_union: [/farmers union/i],
            electric_coop: [/electric co-op/i, /electric cooperative/i, /flathead electric/i],
            credit_union: [/credit union/i, /whitefish credit union/i],
            elks_lodge: [/elks/i, /lodge/i],
            company_employee: [/dependent/i, /employee/i, /don k/i, /whitefish mountain resort/i],
        }
    },

    // Tier 2 Ranking & Sorting Features (Low confidence / Fuzzy matching)
    // These will ONLY add score points to bring items to the top; they will NOT exclude non-matches.
    boosts: {
        special_criteria: {
            // Career Interests (Expanded)
            aviation_pilot: [/pilot/i, /flight/i, /pilot certificate/i],
            aviation_maintenance: [/aircraft maintenance/i, /mechanic/i, /a&p/i],
            aviation_management: [/aviation management/i, /air traffic/i, /dispatcher/i],
            stem: [/stem/i, /science/i, /technology/i, /engineering/i, /math/i, /computer/i],
            healthcare: [/health/i, /nursing/i, /medical/i, /medicine/i, /therapy/i],
            trades: [/trade/i, /construction/i, /hvac/i, /plumbing/i, /welding/i, /automotive/i, /vocational/i],
            business_finance: [/business/i, /finance/i, /accounting/i, /marketing/i, /banking/i, /entrepreneur/i],
            public_service: [/public service/i, /social work/i, /community service/i, /education/i],
            law: [/law/i, /legal/i, /criminal justice/i, /paralegal/i],
            arts_humanities: [/art/i, /music/i, /humanities/i, /graphic design/i, /creative/i],
            agriculture_conservation: [/agriculture/i, /forestry/i, /conservation/i, /floriculture/i, /natural resources/i, /environmental/i],
            athletics_sports: [/athlete/i, /sports/i, /referee/i, /golf/i, /athletics/i]
        },
        financial_need: [/financial need/i, /pell/i, /low income/i, /hardship/i],
        portal: [/portal/i, /foundation/i, /common application/i]
    },

    penalties: {
        essay: [/essay required/i, /personal statement/i, /write a/i],
        creative: [/portfolio/i, /audition/i, /video submission/i, /art/i]
    },

    // Date Parsing Helpers
    dates: {
        expired_keywords: [/closed/i, /expired/i, /past/i],
        rolling_keywords: [/rolling/i, /open/i, /year round/i, /year-round/i]
    }
};
