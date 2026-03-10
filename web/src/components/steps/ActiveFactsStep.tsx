'use client';

import { AnswerMap } from '@/types/wizard';

export default function ActiveFactsStep({
    data,
    updateData
}: {
    data: AnswerMap;
    updateData: (update: Record<string, unknown>) => void;
}) {
    const { activeFacts } = data;

    const handleChange = (field: keyof typeof activeFacts, value: string | number | boolean | null | string[]) => {
        updateData({ activeFacts: { [field]: value } });
    };

    const states = [
        'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
        'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
        'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
        'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
        'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Other'
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-4 text-sm">
                <p className="text-gray-600">
                    Let&apos;s start with the basics. We don&apos;t save this information anywhere.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GPA */}
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">
                            Unweighted GPA <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="4.0"
                            value={activeFacts.gpa || ''}
                            onChange={e => handleChange('gpa', e.target.value ? parseFloat(e.target.value) : null)}
                            className="w-full text-black border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                            placeholder="e.g. 3.5"
                        />
                    </div>

                    {/* STATE */}
                    <div>
                        <label className="block font-medium text-gray-700 mb-1">
                            State of Residence <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={activeFacts.state}
                            onChange={e => handleChange('state', e.target.value)}
                            className="w-full text-black border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                        >
                            <option value="">Select a state...</option>
                            {states.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* EDUCATIONAL STATUS */}
                    <div className="md:col-span-2">
                        <label className="block font-medium text-gray-700 mb-1">
                            Current Educational Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={activeFacts.educational_status}
                            onChange={e => handleChange('educational_status', e.target.value)}
                            className="w-full text-black border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border"
                        >
                            <option value="">Select status...</option>
                            <option value="High school senior">High school senior</option>
                            <option value="Homeschool senior">Homeschool senior</option>
                            <option value="Current college student">Current college student</option>
                            <option value="Gap year">Gap year</option>
                            <option value="GED">GED</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* TARGET SCHOOL TYPE */}
                    <div className="md:col-span-2">
                        <label className="block font-medium text-gray-700 mb-2">
                            Target School Type (Select all that apply) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {['Two year', 'Four year', 'Trade', 'Undecided'].map(type => {
                                const isSelected = activeFacts.target_school_types.includes(type);
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => {
                                            const newTypes = isSelected
                                                ? activeFacts.target_school_types.filter(t => t !== type)
                                                : [...activeFacts.target_school_types, type];
                                            handleChange('target_school_types', newTypes);
                                        }}
                                        className={`px-4 py-2 rounded-full border text-sm transition-colors ${isSelected
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* BINARY QUESTIONS */}
                    <div className="space-y-4 md:col-span-2 pt-4 border-t">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700 text-sm">Have you been accepted to a college yet?</span>
                            <div className="flex gap-2 text-black">
                                <button
                                    onClick={() => handleChange('college_accepted', true)}
                                    className={`px-4 py-1.5 rounded-md border text-sm ${activeFacts.college_accepted === true ? 'bg-blue-100 border-blue-600 text-blue-800' : 'border-gray-300'}`}
                                >Yes</button>
                                <button
                                    onClick={() => handleChange('college_accepted', false)}
                                    className={`px-4 py-1.5 rounded-md border text-sm ${activeFacts.college_accepted === false ? 'bg-blue-100 border-blue-600 text-blue-800' : 'border-gray-300'}`}
                                >No</button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-700 text-sm">Are you planning to take a gap year?</span>
                            <div className="flex gap-2 text-black">
                                <button
                                    onClick={() => handleChange('gap_year', true)}
                                    className={`px-4 py-1.5 rounded-md border text-sm ${activeFacts.gap_year === true ? 'bg-blue-100 border-blue-600 text-blue-800' : 'border-gray-300'}`}
                                >Yes</button>
                                <button
                                    onClick={() => handleChange('gap_year', false)}
                                    className={`px-4 py-1.5 rounded-md border text-sm ${activeFacts.gap_year === false ? 'bg-blue-100 border-blue-600 text-blue-800' : 'border-gray-300'}`}
                                >No</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
