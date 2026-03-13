
import React, { useState } from 'react';
import { ResearchFormData } from '../types';

interface Props {
  onSubmit: (data: ResearchFormData) => void;
  isLoading: boolean;
  selectedName?: { value: string, timestamp: number } | null;
}

const ResearchForm: React.FC<Props> = ({ onSubmit, isLoading, selectedName }) => {
  const [formData, setFormData] = useState<ResearchFormData>({
    name: '',
    geography: '',
    facts: ''
  });

  React.useEffect(() => {
    if (selectedName?.value) {
      setFormData(prev => ({ ...prev, name: selectedName.value }));
    }
  }, [selectedName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSubmit(formData);
  };

  // Explicitly set text to black and background to white for visibility
  const inputClasses = "w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-amber-600 focus:border-transparent outline-none transition-all bg-white text-black placeholder-stone-400 font-medium";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-bold text-stone-800 mb-1.5 uppercase tracking-wide">
          Name / Surname <span className="text-red-600">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            required
            placeholder="e.g. Montgomery, Schmidt, Smith"
            className={`${inputClasses} pr-24`}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <button
            type="button"
            onClick={() => {
              const globalNames = [
                "Okafor", "Tanaka", "García", "Ivanov", "Chatterjee", 
                "Nguyen", "Müller", "Kuznetsov", "Al-Farsi", "Sato", 
                "Muhanji", "Silva", "Zhang", "Kim", "O'Sullivan",
                "Dubois", "Rossi", "Hansen", "Yilmaz", "Abebe",
                "Kaur", "Singh", "Rodriguez", "Popov", "Nowak",
                "Lefebvre", "Smit", "Jensen", "Bakker", "Santos",
                "Ferreira", "Pereira", "Costa", "Oliveira", "Martins",
                "Ali", "Ahmed", "Khan", "Ibrahim", "Hassan",
                "Wong", "Chen", "Li", "Liu", "Yang",
                "Suzuki", "Takahashi", "Watanabe", "Ito", "Yamamoto",
                "Park", "Lee", "Choi", "Jung", "Kang",
                "Diallo", "Traoré", "Koné", "Kamara", "Mensah",
                "Banda", "Phiri", "Moyo", "Dlamini", "Nkosi"
              ];
              const randomName = globalNames[Math.floor(Math.random() * globalNames.length)];
              setFormData({ ...formData, name: randomName });
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-bold rounded-md transition-colors border border-stone-200"
          >
            Random
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-stone-800 mb-1.5 uppercase tracking-wide">
          Geography (Region/Country)
        </label>
        <input
          type="text"
          placeholder="e.g. Yorkshire, England (optional)"
          className={inputClasses}
          value={formData.geography}
          onChange={(e) => setFormData({ ...formData, geography: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-bold text-stone-800 mb-1.5 uppercase tracking-wide">
          Known Facts or Family Legends
        </label>
        <textarea
          rows={4}
          placeholder="e.g. Migration history, family legends (optional)"
          className={inputClasses}
          value={formData.facts}
          onChange={(e) => setFormData({ ...formData, facts: e.target.value })}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
          isLoading 
            ? 'bg-stone-400 cursor-not-allowed' 
            : 'bg-amber-800 hover:bg-amber-900 shadow-xl'
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Consulting Archives...
          </span>
        ) : (
          'Begin Research Report'
        )}
      </button>
    </form>
  );
};

export default ResearchForm;
