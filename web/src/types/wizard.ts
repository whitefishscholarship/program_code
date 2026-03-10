// This represents the entirely in-memory Answer Map as defined in the spec
export interface ActiveFacts {
    gpa: number | null;
    sat: number | null;
    act: number | null;
    state: string;
    educational_status: 'High school senior' | 'Homeschool senior' | 'Current college student' | 'Gap year' | 'GED' | 'Other' | '';
    target_school_types: string[]; // Two year, Four year, Trade, Undecided
    college_accepted: boolean | null;
    gap_year: boolean | null;
    fafsa_complete: boolean | null;
}

export interface PassiveSignals {
    leadership: boolean;
    work_experience: boolean;
    caregiving: boolean;
    service: boolean;
    volunteer_hours_bucket: '0' | '1 to 19' | '20 to 49' | '50 to 99' | '100 plus' | '';
    skills: string[];
    creative_skills: string[];
    financial_need: string; // boolean or intensity enum based on UI selection
    background_optional: Record<string, unknown>;
    constraints: string[];
    career_interests: string[];
    special_criteria: string[];
}

export interface AnswerMap {
    activeFacts: ActiveFacts;
    passiveSignals: PassiveSignals;
}

export const initialActiveFacts: ActiveFacts = {
    gpa: null,
    sat: null,
    act: null,
    state: '',
    educational_status: '',
    target_school_types: [],
    college_accepted: null,
    gap_year: null,
    fafsa_complete: null,
};

export const initialPassiveSignals: PassiveSignals = {
    leadership: false,
    work_experience: false,
    caregiving: false,
    service: false,
    volunteer_hours_bucket: '',
    skills: [],
    creative_skills: [],
    financial_need: '',
    background_optional: {},
    constraints: [],
    career_interests: [],
    special_criteria: [],
};
