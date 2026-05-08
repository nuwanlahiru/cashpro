import { useState, FormEvent, useEffect } from 'react';
import { Task } from '../types';
import { ArrowLeft, Briefcase, Pencil } from 'lucide-react';

interface TaskFormProps {
  onSave: (task: Task) => void;
  onCancel: () => void;
  initialData?: Task;
}

export default function TaskForm({ onSave, onCancel, initialData }: TaskFormProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [allowance, setAllowance] = useState(initialData?.initialAllowance?.toString() || '');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setAllowance(initialData.initialAllowance.toString());
    }
  }, [initialData]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !allowance.trim()) return;

    if (initialData) {
      onSave({
        ...initialData,
        title: title.trim(),
        initialAllowance: parseFloat(allowance),
      });
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        title: title.trim(),
        initialAllowance: parseFloat(allowance),
        startDate: new Date().toISOString(),
        status: 'active',
        expenses: []
      };
      onSave(newTask);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-[var(--th-white)] p-6 sm:p-10 rounded-[32px] sm:rounded-[40px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-500 mb-10">
      <button 
        onClick={onCancel}
        className="flex items-center text-[15px] font-semibold text-indigo-500 hover:text-indigo-600 active:text-indigo-400 mb-8 transition-colors min-h-[48px] min-w-[48px] px-4 -ml-4 rounded-xl"
        aria-label="Cancel and go back"
      >
        <ArrowLeft size={20} className="mr-1.5" /> Back
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
          {initialData ? <Pencil size={28} /> : <Briefcase size={28} />}
        </div>
        <div>
          <span className="text-[13px] font-semibold text-indigo-600 block mb-1">{initialData ? 'Edit Entry' : 'New Entry'}</span>
          <h2 className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-none tracking-tight">{initialData ? 'Edit Task' : 'Start New Task'}</h2>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-[14px] font-semibold text-slate-500 mb-1.5 ml-1">
            Task / Project Name
          </label>
          <input
            type="text"
            id="title"
            required
            placeholder="e.g. Site Visit, Event..."
            className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-4 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all text-[17px] font-semibold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div>
          <label htmlFor="allowance" className="block text-[14px] font-semibold text-slate-500 mb-1.5 ml-1">
            Budget Allowance {(() => {
              try {
                const code = JSON.parse(localStorage.getItem('app_settings') || '{}').currencyCode || 'LKR';
                return `(${code === 'LKR' ? 'Rs.' : code})`;
              } catch(e) { return '(Rs.)'; }
            })()}
          </label>
          <input
            type="number"
            id="allowance"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-4 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all text-xl font-bold text-slate-900 placeholder:font-normal placeholder:text-slate-400"
            value={allowance}
            onChange={(e) => setAllowance(e.target.value)}
          />
          <p className="text-[13px] text-slate-500 mt-2 font-medium ml-1">
            The initial fund given for this trip.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            type="submit"
            className="w-full sm:flex-[2] py-4 bg-indigo-600 text-white font-semibold rounded-[16px] hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-[0_4px_12px_rgba(79,70,229,0.3)] text-[17px] order-1 sm:order-2"
          >
            {initialData ? 'Save Changes' : 'Start Task'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:flex-1 py-4 bg-[var(--bg-app)] active:bg-[#e5e5ea] text-slate-900 font-semibold rounded-[16px] transition-colors text-[17px] order-2 sm:order-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
