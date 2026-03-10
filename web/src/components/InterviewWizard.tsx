'use client';

import { useState } from 'react';
import { AnswerMap, initialActiveFacts, initialPassiveSignals } from '@/types/wizard';
import ActiveFactsStep from './steps/ActiveFactsStep';
import PassiveSignalsStep from './steps/PassiveSignalsStep';

export default function InterviewWizard({ onComplete }: { onComplete: (answers: AnswerMap) => void }) {
    const [currentStep, setCurrentStep] = useState(0);

    // The Answer Map. Exists strictly in memory per privacy specs.
    const [answers, setAnswers] = useState<AnswerMap>({
        activeFacts: { ...initialActiveFacts },
        passiveSignals: { ...initialPassiveSignals }
    });

    const steps = [
        { title: "Academic Background", component: ActiveFactsStep },
        { title: "Experience & Activities", component: PassiveSignalsStep }
        // Add more granular step components as needed
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(answers);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const updateAnswers = (category: keyof AnswerMap, newData: Record<string, unknown>) => {
        setAnswers(prev => ({
            ...prev,
            [category]: {
                ...prev[category],
                ...newData
            }
        }));
    };

    const CurrentComponent = steps[currentStep].component;

    return (
        <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 tracking-tight">
                    {steps[currentStep].title}
                </h2>
                <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
                    <div
                        className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>

            <div className="py-4">
                <CurrentComponent
                    data={answers}
                    updateData={(data: Record<string, unknown>) => updateAnswers(Object.keys(data)[0] as keyof AnswerMap, data[Object.keys(data)[0]] as Record<string, unknown>)}
                />
            </div>

            <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-100">
                <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${currentStep === 0
                        ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
                        : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                >
                    Previous
                </button>

                <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {currentStep === steps.length - 1 ? 'Find Scholarships' : 'Continue'}
                </button>
            </div>
        </div>
    );
}
