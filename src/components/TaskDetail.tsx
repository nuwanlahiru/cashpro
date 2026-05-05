import { useState, FormEvent, useRef, useEffect } from 'react';
import { Task, Expense, AllowanceTopUp } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { CheckCircle, Plus, Receipt, Trash2, Wallet, X, FileText, Lock, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES, getCategoryInfo } from '../lib/categories';

interface TaskDetailProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onBack: () => void;
  onViewReport: () => void;
  onComplete: () => void;
}

const COMMON_EXPENSES = [
  { label: 'Lunch', category: 'Food' },
  { label: 'Dinner', category: 'Food' },
  { label: 'Fuel (Auto)', category: 'Fuel' },
  { label: 'Highway Toll', category: 'Transport' },
  { label: 'Tea/Coffee', category: 'Food' },
];

export default function TaskDetail({ task, onUpdate, onBack, onViewReport, onComplete }: TaskDetailProps) {
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [description, setDescription] = useState('');

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDesc, setTopUpDesc] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleUpdateTitle = () => {
    if (editedTitle.trim() && editedTitle.trim() !== task.title) {
      onUpdate({ ...task, title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const totalSpent = task.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAllowance = task.initialAllowance + (task.topUps || []).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalAllowance - totalSpent;
  const isOverBudget = balance < 0;
  const canEdit = task.status === 'active' || !!task.isUnlocked;

  const handleAddExpense = (e: FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    let finalCategory = category;
    if (isCustomCategory) {
      if (!customCategoryName.trim()) return;
      finalCategory = customCategoryName.trim();
    }

    const newExpense: Expense = {
      id: crypto.randomUUID(),
      taskId: task.id,
      amount: parseFloat(amount),
      category: finalCategory,
      description,
      date: new Date().toISOString(),
    };

    onUpdate({
      ...task,
      expenses: [newExpense, ...task.expenses],
    });

    setAmount('');
    setDescription('');
    setIsCustomCategory(false);
    setCategory(DEFAULT_CATEGORIES[0].id);
    setCustomCategoryName('');
    setIsExpenseOpen(false);
  };

  const handleDeleteExpense = (id: string) => {
    onUpdate({
      ...task,
      expenses: task.expenses.filter(e => e.id !== id),
    });
  };

  const handleAddTopUp = (e: FormEvent) => {
    e.preventDefault();
    if (!topUpAmount || isNaN(Number(topUpAmount))) return;

    const newTopUp: AllowanceTopUp = {
      id: crypto.randomUUID(),
      amount: parseFloat(topUpAmount),
      date: new Date().toISOString(),
      description: topUpDesc,
    };

    onUpdate({
      ...task,
      topUps: [newTopUp, ...(task.topUps || [])]
    });

    setTopUpAmount('');
    setTopUpDesc('');
    setIsTopUpOpen(false);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button 
            onClick={onBack}
            className="text-[13px] font-semibold text-indigo-500 hover:text-indigo-600 active:text-indigo-400 transition-colors mb-2 sm:mb-3 flex items-center gap-1"
            aria-label="Go back to Dashboard"
          >
            ← Back
          </button>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleUpdateTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleUpdateTitle();
                  if (e.key === 'Escape') {
                    setEditedTitle(task.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-none bg-transparent border-b-2 border-indigo-500 focus:outline-none w-full max-w-xs sm:max-w-sm"
              />
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 
                  className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-none cursor-pointer"
                  onDoubleClick={() => canEdit && setIsEditingTitle(true)}
                  title={canEdit ? "Double click to edit" : undefined}
                >
                  {task.title}
                </h1>
                {canEdit && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                    aria-label="Edit title"
                  >
                    <Pencil size={18} />
                  </button>
                )}
              </div>
            )}
            <span className={cn("px-2.5 py-1 text-[11px] font-bold rounded-full tracking-wide", task.status === 'active' ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
              {task.isUnlocked ? 'Unlocked' : task.status.toUpperCase()}
            </span>
          </div>
          <p className="text-slate-500 text-[13px] sm:text-sm mt-1.5 font-medium">Started: {format(new Date(task.startDate), 'MMMM d, yyyy')}</p>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap justify-start sm:justify-end">
          <button
            onClick={onViewReport}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-[var(--th-white)] shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-700 rounded-full sm:rounded-[20px] font-semibold text-[15px] sm:text-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <FileText size={18} />
            View Report
          </button>
          {canEdit && (
            <button
              onClick={() => {
                if (task.isUnlocked) {
                  onComplete();
                } else {
                  setIsCompleteOpen(true);
                }
              }}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-5 py-3 sm:py-2.5 bg-[var(--th-inverted-bg)] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-[var(--th-inverted-text)] rounded-full sm:rounded-[20px] font-semibold text-[15px] sm:text-sm active:scale-[0.98] transition-all"
            >
              {task.isUnlocked ? <Lock size={18} /> : <CheckCircle size={18} />}
              {task.isUnlocked ? 'Lock Task' : 'Complete Task'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-[var(--th-white)] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[12px] sm:text-[13px] font-semibold tracking-wide text-slate-500">Allowance</span>
            {canEdit && (
              <button 
                onClick={() => setIsTopUpOpen(true)}
                className="text-indigo-600 bg-indigo-50 active:bg-indigo-100 p-1.5 rounded-full transition-colors flex-shrink-0"
                title="Add more funds"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
          <p className="text-[26px] sm:text-[24px] lg:text-[32px] font-bold text-slate-900 tracking-tighter leading-none mt-1" title={formatCurrency(totalAllowance)}>{formatCurrency(totalAllowance)}</p>
          {task.topUps && task.topUps.length > 0 && (
            <div className="mt-3 text-[13px]">
              <p className="text-slate-500">{formatCurrency(task.initialAllowance)} Base</p>
              <p className="text-indigo-600 font-medium">
                +{formatCurrency(task.topUps.reduce((s,t) => s+t.amount, 0))} ({task.topUps.length} Top-ups)
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-[var(--th-white)] rounded-[24px] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="block mb-2 text-[12px] sm:text-[13px] font-semibold tracking-wide text-slate-500">Spent</span>
          <p className="text-[26px] sm:text-[24px] lg:text-[32px] font-bold text-slate-900 tracking-tighter leading-none mt-1" title={formatCurrency(totalSpent)}>{formatCurrency(totalSpent)}</p>
          <div className="w-full bg-[var(--bg-app)] h-2 rounded-full mt-4 sm:mt-5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min((totalSpent / totalAllowance) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className={`rounded-[24px] p-5 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] sm:col-span-1 md:col-span-2 lg:col-span-1 ${isOverBudget ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Wallet size={16} className={`flex-shrink-0 ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`} />
            <span className={`text-[12px] sm:text-[13px] font-semibold tracking-wide ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>
              Balance
            </span>
          </div>
          <p className={`text-[26px] sm:text-[24px] lg:text-[32px] font-bold tracking-tighter leading-none mt-1 ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`} title={formatCurrency(balance)}>
            {formatCurrency(balance)}
          </p>
          <p className={`text-[13px] mt-2 font-medium ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
            {isOverBudget ? 'Over Budget' : 'On Track'}
          </p>
        </div>
      </div>

      <div className="bg-[var(--th-white)] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="p-4 sm:p-5 sm:px-6 bg-[var(--bg-app)]/50 flex justify-between items-center">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-[15px]">
            <Receipt size={18} className="text-slate-500" />
            Expenses
          </h3>
          {canEdit && (
            <button 
              onClick={() => setIsExpenseOpen(true)} 
              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white active:bg-indigo-700 rounded-full font-semibold text-[13px] transition-all shadow-[0_2px_8px_rgba(79,70,229,0.3)]"
            >
              <Plus size={16} /> <span className="hidden sm:inline">Add</span>
            </button>
          )}
        </div>
        
        <div className="divide-y divide-[var(--bg-app)]">
          {task.expenses.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <div className="w-14 h-14 bg-[var(--bg-app)] rounded-full flex items-center justify-center mx-auto mb-3">
                <Receipt size={24} className="text-slate-400" />
              </div>
              <p className="font-semibold text-slate-700 mb-1 text-[15px]">No expenses yet</p>
              <p className="text-[13px]">Record an expense to see it here.</p>
            </div>
          ) : (
            task.expenses.map((expense) => {
              const info = getCategoryInfo(expense.category);
              return (
                <div key={expense.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 group">
                  <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
                    <div className={cn("w-11 h-11 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0", info.bgColor, info.textColor)}>
                      <info.icon size={20} />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2 sm:gap-2 mb-0.5">
                        <p className="font-semibold text-slate-900 text-[15px] truncate">{info.label}</p>
                        <span className="hidden sm:inline-block text-[11px] text-slate-500 font-medium px-2 py-0.5 rounded-md bg-[var(--bg-app)]">
                          {format(new Date(expense.date), 'h:mm a')}
                        </span>
                      </div>
                      <p className="text-[13px] text-slate-500 truncate">
                        <span className="sm:hidden inline-block mr-2">{format(new Date(expense.date), 'h:mm a')}</span>
                        {expense.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-6 flex-shrink-0">
                    <p className="text-[17px] sm:text-lg font-semibold text-slate-900 tracking-tight">{formatCurrency(expense.amount)}</p>
                    {canEdit && (
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-slate-300 hover:text-red-500 active:bg-slate-100 p-2 rounded-full transition-colors hidden sm:block opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete Expense"
                        aria-label={`Delete expense: ${expense.description}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsTopUpOpen(false)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[22px] font-bold text-slate-900 leading-none">Add Top-up</h3>
              <button onClick={() => setIsTopUpOpen(false)} aria-label="Close add top-up modal" className="text-slate-400 active:bg-slate-100 p-1.5 rounded-full"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleAddTopUp} className="flex flex-col gap-4">
              <div>
                <label htmlFor="topUpAmount" className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">Amount</label>
                <input id="topUpAmount" type="number" required min="0" step="0.01" className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all text-lg font-semibold" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} />
              </div>
              <div>
                <label htmlFor="topUpDesc" className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">Note (Optional)</label>
                <input id="topUpDesc" type="text" className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all text-[15px]" value={topUpDesc} onChange={(e) => setTopUpDesc(e.target.value)} />
              </div>
              <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-[16px] active:bg-indigo-700 transition-colors text-[17px] mt-2 shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                Save Top-up
              </button>
            </form>
          </div>
        </div>
      )}

      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsExpenseOpen(false)}></div>
          <div className="bg-[var(--th-white)] rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 w-full max-w-xl shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden"></div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[22px] font-bold text-slate-900 leading-none">Add Expense</h3>
              <button 
                onClick={() => setIsExpenseOpen(false)} 
                className="text-slate-400 active:bg-slate-100 p-1.5 rounded-full"
                type="button"
                aria-label="Close add expense modal"
              >
                <X size={24}/>
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-[13px] font-semibold text-slate-500 mb-2 ml-1">Common Expenses</label>
              <div className="flex flex-wrap gap-2">
                {COMMON_EXPENSES.map(ce => (
                  <button 
                    key={ce.label} 
                    type="button" 
                    onClick={() => { setCategory(ce.category); setDescription(ce.label); setIsCustomCategory(false); }} 
                    className="px-3.5 py-2 bg-[var(--bg-app)] active:bg-[#e5e5ea] text-slate-700 rounded-full text-[13px] sm:text-[14px] font-medium transition-colors border border-transparent hover:border-slate-300"
                  >
                    + {ce.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddExpense} className="flex flex-col gap-4">
              <div>
                <label htmlFor="expenseAmount" className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">
                  Amount {(() => {
                    try {
                      return `(${JSON.parse(localStorage.getItem('app_settings') || '{}').currencyCode || 'LKR'})`;
                    } catch(e) { return '(LKR)'; }
                  })()}
                </label>
                <input 
                  id="expenseAmount"
                  type="number" 
                  required 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all text-xl font-bold text-slate-900" 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">Category</label>
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                  {DEFAULT_CATEGORIES.map(c => (
                    <button 
                      key={c.id} 
                      type="button" 
                      onClick={() => { setCategory(c.id); setIsCustomCategory(false); }} 
                      className={cn("flex flex-col items-center justify-center py-3 rounded-[16px] transition-all", category === c.id && !isCustomCategory ? "bg-indigo-50 border-indigo-200 border" : "bg-[var(--bg-app)] border-transparent border")}
                    >
                      <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-1.5", c.bgColor, c.textColor)}>
                        <c.icon size={18} />
                      </div>
                      <span className="text-[12px] font-semibold text-slate-700">{c.label}</span>
                    </button>
                  ))}
                  <button 
                    type="button" 
                    onClick={() => setIsCustomCategory(true)} 
                    className={cn("flex flex-col items-center justify-center p-3 rounded-[16px] border transition-all", isCustomCategory ? "bg-indigo-50 border-indigo-200" : "bg-[var(--bg-app)] border-transparent")}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-1.5"><Plus size={18} /></div>
                    <span className="text-[12px] font-semibold text-slate-700">Custom</span>
                  </button>
                </div>
                {isCustomCategory && (
                  <div className="mt-3 animate-in slide-in-from-top-2 duration-200">
                    <input 
                      type="text" 
                      required 
                      aria-label="Custom category name"
                      placeholder="Enter custom category name..." 
                      className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3.5 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all text-[15px]" 
                      value={customCategoryName} 
                      onChange={(e) => setCustomCategoryName(e.target.value)} 
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="expenseDescription" className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">Description (Optional)</label>
                <textarea 
                  id="expenseDescription"
                  placeholder="e.g. Note about this expense" 
                  rows={2} 
                  className="w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-3 focus:border-indigo-500 focus:bg-[var(--th-white)] outline-none transition-all resize-none text-[15px]" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-[16px] active:bg-indigo-700 transition-all text-[17px] shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsCompleteOpen(false)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <h3 className="text-[20px] font-bold text-slate-900 mb-1">Complete Task?</h3>
            <p className="text-slate-500 text-[15px] mb-6">Are you sure you want to complete this task? You will not be able to add more expenses later.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={() => setIsCompleteOpen(false)} 
                className="w-full sm:flex-1 py-3.5 bg-[var(--bg-app)] active:bg-[#e5e5ea] transition-colors text-slate-900 font-semibold rounded-[14px] text-[17px]"
              >
                Cancel
              </button>
              <button 
                onClick={() => { setIsCompleteOpen(false); onComplete(); }} 
                className="w-full sm:flex-1 py-3.5 bg-indigo-600 active:bg-indigo-700 transition-colors text-white font-semibold rounded-[14px] text-[17px]"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
