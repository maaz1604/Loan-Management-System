'use client';

interface Step {
  label: string;
  href: string;
}

const steps: Step[] = [
  { label: 'Login', href: '/login' },
  { label: 'Personal Details', href: '/apply/personal' },
  { label: 'Documents', href: '/apply/documents' },
  { label: 'Loan Config', href: '/apply/configure' },
];

export default function Stepper({ currentStep }: { currentStep: number }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  idx < currentStep
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : idx === currentStep
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-500/30 shadow-lg shadow-indigo-500/30'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {idx < currentStep ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                ) : (
                  idx + 1
                )}
              </div>
              <span className={`mt-2 text-xs font-medium ${
                idx <= currentStep ? 'text-indigo-400' : 'text-slate-500'
              }`}>
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                idx < currentStep ? 'bg-indigo-600' : 'bg-slate-700'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
