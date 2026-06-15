export const RulesPack = {
    version: '1.1.0',

    requirements: {
        // Hard exclude if required but student has < 50 hours
        service_hours: {
            high_tier: [/\bminimum 50\b/i, /\bat least 50\b/i, /\bsignificant community service\b/i],
            medium_tier: [/\bminimum 20\b/i, /\bat least 20\b/i]
        },

        // Hard eligibility GATES only — membership / affiliation / employer requirements.
        // If a scholarship text matches one of these and the student did NOT select the matching
        // ID, the scholarship is excluded (you genuinely have to be a member/dependent to apply).
        // Identity, demographic, health, and hardship criteria are deliberately NOT here — they
        // live under boosts.identity_criteria and only affect ranking, never exclusion, so a
        // passing mention in boilerplate can never hide an otherwise-eligible scholarship.
        eligibility_gates: {
            military_veteran: [/\bveterans?\b/i, /\bmilitary\b/i, /\bair force\b/i, /\bnavy\b/i, /\bmarines\b/i, /\barmy\b/i],
            first_responder: [/\bfirst responder/i, /\bpolice\b/i, /\bfirefighter/i, /\blaw enforcement\b/i, /\bemt\b/i],
            farmers_union: [/\bfarmers union\b/i],
            electric_coop: [/\belectric co-?op/i, /\belectric cooperative/i, /\bflathead electric\b/i],
            credit_union: [/\bcredit union\b/i, /\bwhitefish credit union\b/i],
            elks_lodge: [/\belks\b/i, /\blodge\b/i],
            company_employee: [/\bdependent/i, /\bemployee/i, /\bdon k\b/i, /\bwhitefish mountain resort\b/i],
        }
    },

    // Ranking & sorting features (low confidence / fuzzy). These ONLY add score points to surface
    // relevant matches — they NEVER exclude a non-match.
    boosts: {
        // Identity / demographic / health / hardship — formerly hard-excludes, now rank-only.
        identity_criteria: {
            dyslexia: [/\bdyslexia\b/i],
            adhd: [/\badhd\b/i],
            autism: [/\bautism\b/i, /\bneurodiver/i],
            learning_other: [/\blearning disabilit/i, /\blearning difference/i],

            mental_health: [/\bmental health\b/i, /\bdepression\b/i, /\banxiety\b/i, /\bsuicide\b/i],
            chronic_health: [/\bchronic\b/i, /\bdiabetes\b/i, /\bhealth challenge/i, /\bcancer\b/i, /\billness\b/i],
            foster_care: [/\bfoster\b/i, /\borphan\b/i, /\bward of the state\b/i],
            loss_of_parent: [/\bloss of (a )?parent\b/i, /\bdeceased parent\b/i, /\bfallen\b/i, /\bline of duty\b/i],
            overcoming_adversity: [/\badversity\b/i, /\bhardship\b/i, /\bobstacles?\b/i, /\bovercom(e|ing)\b/i, /\bresilience\b/i],

            first_generation: [/\bfirst[- ]generation\b/i, /\bfirst in (their|his|her|your) family\b/i],
            black_african_american: [/\bblack\b/i, /\bafrican[- ]american\b/i],
            hispanic_latino: [/\bhispanic\b/i, /\blatin[oax]\b/i],
            native_american: [/\bindigenous\b/i, /\bnative american\b/i, /\btribal\b/i, /\btribe\b/i],
            asian_pacific_islander: [/\basian\b/i, /\bpacific islander\b/i],
            lgbtqia: [/\blgbtq/i, /\btransgender\b/i, /\bgay\b/i, /\blesbian\b/i, /\bqueer\b/i],
            female: [/\bwomen\b/i, /\bwoman\b/i, /\bfemale\b/i, /\bgirls?\b/i],
            nonbinary: [/\bnon[- ]?binary\b/i],
            single_parent: [/\bsingle parent\b/i],
            mensa: [/\bmensa\b/i],
        },

        // Career / field interests (rank-only).
        special_criteria: {
            aviation_pilot: [/\bpilot\b/i, /\bflight\b/i],
            aviation_maintenance: [/\baircraft maintenance\b/i, /\bmechanic/i, /\ba&p\b/i],
            aviation_management: [/\baviation management\b/i, /\bair traffic\b/i, /\bdispatcher\b/i],
            stem: [/\bstem\b/i, /\bscience\b/i, /\btechnolog/i, /\bengineering\b/i, /\bmath\b/i, /\bcomputer\b/i],
            healthcare: [/\bhealth\b/i, /\bnursing\b/i, /\bmedical\b/i, /\bmedicine\b/i, /\btherapy\b/i],
            trades: [/\btrade\b/i, /\bconstruction\b/i, /\bhvac\b/i, /\bplumbing\b/i, /\bwelding\b/i, /\bautomotive\b/i, /\bvocational\b/i],
            business_finance: [/\bbusiness\b/i, /\bfinance\b/i, /\baccounting\b/i, /\bmarketing\b/i, /\bbanking\b/i, /\bentrepreneur/i],
            public_service: [/\bpublic service\b/i, /\bsocial work\b/i, /\bcommunity service\b/i, /\beducation\b/i],
            law: [/\blaw\b/i, /\blegal\b/i, /\bcriminal justice\b/i, /\bparalegal\b/i],
            arts_humanities: [/\barts?\b/i, /\bmusic\b/i, /\bhumanities\b/i, /\bgraphic design\b/i, /\bcreative\b/i],
            agriculture_conservation: [/\bagricultur/i, /\bforestry\b/i, /\bconservation\b/i, /\bfloricultur/i, /\bnatural resources\b/i, /\benvironmental\b/i],
            athletics_sports: [/\bathlete\b/i, /\bsports\b/i, /\breferee\b/i, /\bgolf\b/i, /\bathletics\b/i]
        },
        financial_need: [/\bfinancial need\b/i, /\bpell\b/i, /\blow[- ]income\b/i, /\bhardship\b/i],
        portal: [/\bportal\b/i, /\bfoundation\b/i, /\bcommon application\b/i]
    },

    penalties: {
        essay: [/\bessay\b/i, /\bpersonal statement\b/i, /\bwrite an? (essay|statement)\b/i],
        creative: [/\bportfolio\b/i, /\baudition\b/i, /\bvideo submission\b/i]
    },

    // Date Parsing Helpers
    dates: {
        expired_keywords: [/\bclosed\b/i, /\bexpired\b/i, /\bpast due\b/i],
        rolling_keywords: [/\brolling\b/i, /\byear[- ]round\b/i]
    }
};
