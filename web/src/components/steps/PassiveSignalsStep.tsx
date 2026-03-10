'use client';

import { AnswerMap } from '@/types/wizard';

export default function PassiveSignalsStep({
    data,
    updateData
}: {
    data: AnswerMap;
    updateData: (update: Record<string, unknown>) => void;
}) {
    const { passiveSignals } = data;

    const handleChange = (field: keyof typeof passiveSignals, value: string | boolean | string[]) => {
        updateData({ passiveSignals: { [field]: value } });
    };

    const toggleArrayItem = (field: 'skills' | 'creative_skills' | 'organization_affiliations' | 'constraints' | 'career_interests' | 'special_criteria', item: string) => {
        const arr = passiveSignals[field] as string[];
        const isSelected = arr.includes(item);
        if (isSelected) {
            handleChange(field, arr.filter(i => i !== item));
        } else {
            handleChange(field, [...arr, item]);
        }
    };

    const InfoTooltip = ({ text }: { text: string }) => (
        <div className="relative flex items-center group/tooltip ml-1">
            <svg className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-56 p-2 bg-gray-900 border border-gray-700 text-white text-xs rounded-md shadow-xl z-50 pointer-events-none">
                {text}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 w-0 h-0"></div>
            </div>
        </div>
    );

    const specialCriteria = [
        { id: 'dyslexia', category: 'Neurodiversity & Learning', label: 'Dyslexia', tooltip: 'Diagnosed with Dyslexia.' },
        { id: 'adhd', category: 'Neurodiversity & Learning', label: 'ADHD', tooltip: 'Diagnosed with Attention-Deficit/Hyperactivity Disorder.' },
        { id: 'autism', category: 'Neurodiversity & Learning', label: 'Autism Spectrum', tooltip: 'Autism or related neurodivergent identities.' },
        { id: 'learning_other', category: 'Neurodiversity & Learning', label: 'Other Learning Disability', tooltip: 'Processing disorders or other learning differences.' },

        { id: 'mental_health', category: 'Health & Hardships', label: 'Mental Health Challenges', tooltip: 'Personal struggle with mental health or impacted by a family member.' },
        { id: 'chronic_health', category: 'Health & Hardships', label: 'Chronic Disease / Physical Health', tooltip: 'Long-term health issues like diabetes or significant physical challenges.' },
        { id: 'foster_care', category: 'Health & Hardships', label: 'Foster Care Experience', tooltip: 'Current or former youth in the foster care system.' },
        { id: 'loss_of_parent', category: 'Health & Hardships', label: 'Loss of Parent or Guardian', tooltip: 'Especially in the line of duty.' },
        { id: 'overcoming_adversity', category: 'Health & Hardships', label: 'Overcoming Significant Adversity', tooltip: 'Demonstrated tenacity in overcoming profound obstacles or personal hardships.' },

        { id: 'first_generation', category: 'Demographics & Identity', label: 'First-Generation College', tooltip: 'First in your immediate family to attend college.' },
        { id: 'black_african_american', category: 'Demographics & Identity', label: 'Black or African American', tooltip: '' },
        { id: 'hispanic_latino', category: 'Demographics & Identity', label: 'Hispanic or Latino/a', tooltip: '' },
        { id: 'native_american', category: 'Demographics & Identity', label: 'Native American or Indigenous', tooltip: '' },
        { id: 'asian_pacific_islander', category: 'Demographics & Identity', label: 'Asian or Pacific Islander', tooltip: '' },

        { id: 'lgbtqia', category: 'Demographics & Identity', label: 'LGBTQIA+', tooltip: 'Lesbian, Gay, Bisexual, Transgender, Queer, Intersex, or Asexual identity.' },
        { id: 'female', category: 'Demographics & Identity', label: 'Female', tooltip: 'Often strongly considered for underrepresented fields like STEM or Aviation.' },
        { id: 'nonbinary', category: 'Demographics & Identity', label: 'Non-Binary', tooltip: '' },
        { id: 'military_veteran', category: 'Demographics & Identity', label: 'Military or Veteran Affiliation', tooltip: 'Self or family member who is a veteran or active-duty military.' },
        { id: 'mensa', category: 'Demographics & Identity', label: 'Mensa Member', tooltip: 'You or a family member are a current member of Mensa.' },

        { id: 'aviation_pilot', category: 'Career Interests', label: 'Aviation - Pilot Training', tooltip: 'Flight training, commercial pilot, etc.' },
        { id: 'aviation_maintenance', category: 'Career Interests', label: 'Aviation - Maintenance', tooltip: 'A&P Mechanics, aviation maintenance technology.' },
        { id: 'aviation_management', category: 'Career Interests', label: 'Aviation - Management', tooltip: 'Air traffic control, airport management.' },

        { id: 'stem', category: 'Career Interests', label: 'STEM', tooltip: 'Science, Technology, Engineering, or Mathematics fields.' },
        { id: 'healthcare', category: 'Career Interests', label: 'Healthcare & Nursing', tooltip: 'Nursing, Pre-Med, therapy, or related medical careers.' },
        { id: 'trades', category: 'Career Interests', label: 'Skilled Trades & Construction', tooltip: 'Construction management, HVAC, plumbing, welding, or automotive.' },
        { id: 'business_finance', category: 'Career Interests', label: 'Business & Finance', tooltip: 'Accounting, marketing, entrepreneurship, or banking.' },
        { id: 'public_service', category: 'Career Interests', label: 'Public Service & Social Impact', tooltip: 'Social work, early education, first responder, or community improvement.' },
        { id: 'law', category: 'Career Interests', label: 'Law & Legal Studies', tooltip: 'Pre-Law, Paralegal studies, or criminal justice.' },
        { id: 'arts_humanities', category: 'Career Interests', label: 'Arts & Humanities', tooltip: 'Music education, graphic design, or fine arts.' },
    ];

    // Group criteria by category for accordion UI
    const groupedCriteria = specialCriteria.reduce((acc, curr) => {
        if (!acc[curr.category]) acc[curr.category] = [];
        acc[curr.category].push(curr);
        return acc;
    }, {} as Record<string, typeof specialCriteria>);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">

            {/* EXTRACURRICULARS */}
            <section>
                <h3 className="font-semibold text-gray-800 text-lg mb-3">Activities & Responsibilities</h3>
                <p className="text-gray-500 text-sm mb-4">Select all that apply to you. This helps uncover hidden matches.</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-black">
                    {[
                        { id: 'leadership', label: 'Hold a leadership position (Captain, President, Manager)' },
                        { id: 'work_experience', label: 'Have a part-time job or work experience' },
                        { id: 'caregiving', label: 'Have significant caregiving responsibilities at home' },
                        { id: 'service', label: 'Participate in community service or volunteering' },
                    ].map(item => (
                        <label key={item.id} className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                            <input
                                type="checkbox"
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={passiveSignals[item.id as keyof typeof passiveSignals] as boolean}
                                onChange={e => handleChange(item.id as keyof typeof passiveSignals, e.target.checked)}
                            />
                            <span className="ml-3 text-gray-700">{item.label}</span>
                        </label>
                    ))}
                </div>
            </section>

            {/* VOLUNTEER HOURS CONDITIONAL */}
            {passiveSignals.service && (
                <section className="bg-blue-50 p-4 rounded-lg border border-blue-100 ml-4 animate-in slide-in-from-top-2">
                    <label className="block font-medium text-gray-800 mb-2 text-sm">
                        Approximately how many volunteer hours have you completed?
                    </label>
                    <select
                        value={passiveSignals.volunteer_hours_bucket}
                        onChange={e => handleChange('volunteer_hours_bucket', e.target.value)}
                        className="w-full md:w-1/2 text-black border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border text-sm"
                    >
                        <option value="">Select hours...</option>
                        <option value="1 to 19">1 to 19 hours</option>
                        <option value="20 to 49">20 to 49 hours</option>
                        <option value="50 to 99">50 to 99 hours</option>
                        <option value="100 plus">100+ hours</option>
                    </select>
                </section>
            )}

            {/* FINANCIAL NEED */}
            <section>
                <h3 className="font-semibold text-gray-800 text-lg mb-3">Financial Circumstances</h3>
                <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        checked={passiveSignals.financial_need === 'Yes'}
                        onChange={e => handleChange('financial_need', e.target.checked ? 'Yes' : '')}
                    />
                    <span className="ml-3 text-gray-700 text-sm">
                        I have acute financial need (e.g., qualify for free/reduced lunch, Pell grant eligible, etc.)
                    </span>
                </label>
            </section>

            {/* AFFILIATIONS */}
            <section>
                <h3 className="font-semibold text-gray-800 text-lg mb-3">Family & Organization Affiliations</h3>
                <p className="text-gray-500 text-sm mb-4">Are you or your family affiliated with any of the following?</p>
                <div className="flex flex-wrap gap-2">
                    {['Military', 'First Responder', 'Farmers Union', 'Electric Co-op', 'Credit Union', 'Elks Lodge'].map(org => {
                        const isSelected = passiveSignals.organization_affiliations.includes(org);
                        return (
                            <button
                                key={org}
                                type="button"
                                onClick={() => toggleArrayItem('organization_affiliations', org)}
                                className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${isSelected
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                + {org}
                            </button>
                        )
                    })}
                </div>
            </section>

            {/* SPECIAL CIRCUMSTANCES / CHARACTERISTICS ACCORDIONS */}
            <section>
                <h3 className="font-semibold text-gray-800 text-lg mb-3">Special Circumstances & Characteristics</h3>
                <p className="text-gray-500 text-sm mb-4">Click below to expand categories and select specific qualities that apply to you. This unlocks niche algorithms.</p>

                <div className="space-y-3">
                    {Object.entries(groupedCriteria).map(([category, items]) => (
                        <details key={category} className="bg-white border border-gray-200 rounded-lg group overflow-hidden">
                            <summary className="font-medium text-gray-800 text-sm px-4 py-3 cursor-pointer bg-gray-50 hover:bg-gray-100 flex justify-between items-center select-none group-open:border-b group-open:border-gray-200">
                                {category}
                                <span className="transition duration-300 group-open:-rotate-180">
                                    <svg fill="none" height="20" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                                </span>
                            </summary>
                            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-black bg-white">
                                {items.map(item => {
                                    const isSelected = passiveSignals.special_criteria.includes(item.id);
                                    return (
                                        <label key={item.id} className={`flex items-start p-2.5 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'}`}>
                                            <input
                                                type="checkbox"
                                                className="mt-0.5 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded shrink-0"
                                                checked={isSelected}
                                                onChange={() => toggleArrayItem('special_criteria', item.id)}
                                            />
                                            <div className="ml-3 flex-1 flex flex-col justify-center">
                                                <div className="flex items-center">
                                                    <span className={`text-sm ${isSelected ? 'font-semibold text-blue-900' : 'font-medium text-gray-800'}`}>{item.label}</span>
                                                    {item.tooltip && <InfoTooltip text={item.tooltip} />}
                                                </div>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        </details>
                    ))}
                </div>
            </section>

        </div>
    );
}
