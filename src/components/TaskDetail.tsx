import { useState, FormEvent, useRef, useEffect } from 'react';
import { Task, Expense, AllowanceTopUp } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { CheckCircle, Plus, Receipt, Trash2, Wallet, X, FileText, Lock, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { DEFAULT_CATEGORIES, getCategoryInfo } from '../lib/categories';

import { useModalBack } from '../hooks/useModalBack';

interface TaskDetailProps {
  task: Task;
  onUpdate: (task: Task) => void;
  onBack: () => void;
  onViewReport: () => void;
  onComplete: () => void;
  onEditTask?: () => void;
}

const COMMON_EXPENSES = [
  { label: 'Lunch', category: 'Food' },
  { label: 'Dinner', category: 'Food' },
  { label: 'Fuel (Auto)', category: 'Fuel' },
  { label: 'Highway Toll', category: 'Transport' },
  { label: 'Tea/Coffee', category: 'Food' },
];

export default function TaskDetail({ task, onUpdate, onBack, onViewReport, onComplete, onEditTask }: TaskDetailProps) {
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0].id);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [description, setDescription] = useState('');

  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpDesc, setTopUpDesc] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useModalBack(isExpenseOpen, () => handleCloseExpenseModal(), 'expenseModal');
  useModalBack(isTopUpOpen, () => setIsTopUpOpen(false), 'topUpModal');
  useModalBack(isCompleteOpen, () => setIsCompleteOpen(false), 'completeModal');
  useModalBack(isEditingTitle, () => setIsEditingTitle(false), 'editTitleModal');

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

    if (editingExpenseId) {
      const updatedExpenses = task.expenses.map(exp => 
        exp.id === editingExpenseId 
          ? { ...exp, amount: parseFloat(amount), category: finalCategory, description }
          : exp
      );
      onUpdate({ ...task, expenses: updatedExpenses });
    } else {
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
    }

    setAmount('');
    setDescription('');
    setIsCustomCategory(false);
    setCategory(DEFAULT_CATEGORIES[0].id);
    setCustomCategoryName('');
    setIsExpenseOpen(false);
    setEditingExpenseId(null);
  };

  const handleEditExpense = (expense: Expense) => {
    setAmount(expense.amount.toString());
    setDescription(expense.description);
    
    const isDefaultCategory = DEFAULT_CATEGORIES.some(c => c.id === expense.category);
    if (isDefaultCategory) {
      setCategory(expense.category);
      setIsCustomCategory(false);
      setCustomCategoryName('');
    } else {
      setIsCustomCategory(true);
      setCategory('custom');
      setCustomCategoryName(expense.category);
    }
    
    setEditingExpenseId(expense.id);
    setIsExpenseOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseOpen(false);
    setEditingExpenseId(null);
    setAmount('');
    setDescription('');
    setCategory(DEFAULT_CATEGORIES[0].id);
    setIsCustomCategory(false);
    setCustomCategoryName('');
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
            className="text-[15px] font-semibold text-indigo-500 hover:text-indigo-600 active:text-indigo-400 transition-colors mb-2 sm:mb-3 flex items-center gap-1 min-h-[48px] min-w-[48px] px-4 -ml-4 rounded-xl"
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
                    className="p-2 min-h-[48px] min-w-[48px] flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full sm:opacity-0 sm:group-hover:opacity-100 transition-all focus:opacity-100 -ml-2"
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
        
        <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end mt-3 sm:mt-0">
          {canEdit && onEditTask && (
            <button
              onClick={onEditTask}
              className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--th-white)] shadow-sm border border-slate-200 text-[var(--th-slate-700)] rounded-[14px] sm:rounded-full font-medium text-[13px] sm:text-sm hover:bg-[var(--th-slate-50)] active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Pencil size={16} className="text-[var(--th-slate-500)] sm:w-[18px] sm:h-[18px]" />
              Edit
            </button>
          )}
          <button
            onClick={onViewReport}
            className="flex-1 sm:flex-none inline-flex justify-center items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--th-white)] shadow-sm border border-slate-200 text-[var(--th-slate-700)] rounded-[14px] sm:rounded-full font-medium text-[13px] sm:text-sm hover:bg-[var(--th-slate-50)] active:scale-[0.98] transition-all whitespace-nowrap"
          >
            <FileText size={16} className="text-indigo-500 sm:w-[18px] sm:h-[18px]" />
            Report
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
              className="flex-1 md:flex-none inline-flex justify-center items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-2.5 bg-[var(--th-inverted-bg)] shadow-md text-[var(--th-inverted-text)] rounded-[14px] sm:rounded-full font-medium text-[13px] sm:text-sm active:scale-[0.98] transition-all whitespace-nowrap"
            >
              {task.isUnlocked ? <Lock size={16} className="opacity-80 sm:w-[18px] sm:h-[18px]" /> : <CheckCircle size={16} className="opacity-80 sm:w-[18px] sm:h-[18px]" />}
              {task.isUnlocked ? 'Lock' : 'Complete'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-[var(--th-white)] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[var(--bg-app)]">
          <div className="flex justify-between items-start mb-1 sm:mb-2 text-[12px] sm:text-[13px] font-semibold tracking-wide text-slate-500">
            <span>Allowance</span>
            {canEdit && (
              <button 
                onClick={() => setIsTopUpOpen(true)}
                className="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 p-2 sm:p-2.5 min-h-[48px] min-w-[48px] flex items-center justify-center rounded-full transition-colors flex-shrink-0 -mt-2 -mr-2"
                title="Add more funds"
              >
                <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
              </button>
            )}
          </div>
          <p className="text-[20px] sm:text-[24px] lg:text-[32px] font-bold text-slate-900 tracking-tighter leading-none mt-1" title={formatCurrency(totalAllowance)}>{formatCurrency(totalAllowance)}</p>
          {task.topUps && task.topUps.length > 0 && (
            <div className="mt-2 text-[11px] sm:text-[13px]">
              <p className="text-slate-500">{formatCurrency(task.initialAllowance)} Base</p>
              <p className="text-indigo-600 font-medium">
                +{formatCurrency(task.topUps.reduce((s,t) => s+t.amount, 0))} ({task.topUps.length} Top-ups)
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-[var(--th-white)] rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[var(--bg-app)]">
          <span className="block mb-1 sm:mb-2 text-[12px] sm:text-[13px] font-semibold tracking-wide text-slate-500">Spent</span>
          <p className="text-[20px] sm:text-[24px] lg:text-[32px] font-bold text-slate-900 tracking-tighter leading-none mt-1" title={formatCurrency(totalSpent)}>{formatCurrency(totalSpent)}</p>
          <div className="w-full bg-[var(--bg-app)] h-1.5 sm:h-2 rounded-full mt-3 sm:mt-5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
              style={{ width: `${Math.min((totalSpent / totalAllowance) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className={`col-span-2 lg:col-span-1 rounded-[20px] sm:rounded-[24px] p-4 sm:p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border ${isOverBudget ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
          <div className="flex items-center gap-1.5 mb-1 sm:mb-2">
            <Wallet size={14} className={`flex-shrink-0 sm:w-4 sm:h-4 ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`} />
            <span className={`text-[12px] sm:text-[13px] font-semibold tracking-wide ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>
              Balance
            </span>
          </div>
          <p className={`text-[24px] sm:text-[24px] lg:text-[32px] font-bold tracking-tighter leading-none mt-1 ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`} title={formatCurrency(balance)}>
            {formatCurrency(balance)}
          </p>
          <p className={`text-[12px] sm:text-[13px] mt-1.5 font-medium ${isOverBudget ? 'text-red-600' : 'text-emerald-600'}`}>
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
            <div className="p-8 sm:p-12 text-center flex flex-col items-center justify-center min-h-[200px]">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 ring-8 ring-white shadow-sm border border-slate-100">
                <Receipt size={28} className="text-slate-400" strokeWidth={1.5} />
              </div>
              <p className="font-semibold text-slate-900 mb-1.5 text-[16px]">No expenses recorded</p>
              <p className="text-[14px] text-slate-500 max-w-[250px] mx-auto leading-relaxed">Add your first expense to start tracking your budget for this task.</p>
              {canEdit && (
                <button 
                  onClick={() => setIsExpenseOpen(true)} 
                  className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 active:bg-indigo-200 rounded-full font-semibold text-[14px] transition-colors"
                >
                  <Plus size={18} /> Add Expense
                </button>
              )}
            </div>
          ) : (
            task.expenses.map((expense) => {
              const info = getCategoryInfo(expense.category);
              return (
                <div key={expense.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 sm:gap-4 group">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0", info.bgColor, info.textColor)}>
                      <info.icon size={20} className="w-5 h-5" />
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-[15px] sm:text-[16px] truncate mb-0.5">
                        {expense.description || info.label}
                      </p>
                      <p className="text-[12px] sm:text-[13px] text-slate-500 truncate">
                        {expense.description ? info.label : 'Expense'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end flex-shrink-0 pl-2">
                    <span className="text-[11px] sm:text-[12px] text-slate-400 font-medium mb-0.5 pr-2 sm:pr-2.5">
                      {format(new Date(expense.date), 'h:mm a')}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2 -mr-1.5 sm:mr-0">
                      <p className="text-[15px] sm:text-lg font-semibold text-slate-900 tracking-tight whitespace-nowrap">
                        {formatCurrency(expense.amount)}
                      </p>
                      {canEdit && (
                        <div className="flex items-center ml-0.5 sm:ml-0">
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="text-slate-400 hover:text-indigo-500 active:bg-slate-100 p-2 min-h-[48px] min-w-[48px] flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 rounded-full transition-all"
                            title="Edit Expense"
                            aria-label={`Edit expense: ${expense.description}`}
                          >
                            <Pencil size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-slate-400 hover:text-red-500 active:bg-slate-100 p-2 min-h-[48px] min-w-[48px] flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 rounded-full transition-all"
                            title="Delete Expense"
                            aria-label={`Delete expense: ${expense.description}`}
                          >
                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {isTopUpOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsTopUpOpen(false)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-bold text-slate-900 leading-none">Add Top-up</h3>
              <button onClick={() => setIsTopUpOpen(false)} aria-label="Close add top-up modal" className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleAddTopUp} className="flex flex-col gap-5">
              <div>
                <label htmlFor="topUpAmount" className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">
                    {(() => {
                      try {
                        const code = JSON.parse(localStorage.getItem('app_settings') || '{}').currencyCode || 'LKR';
                        return code === 'LKR' ? 'Rs.' : code;
                      } catch(e) { return 'Rs.'; }
                    })()}
                  </span>
                  <input id="topUpAmount" autoFocus type="number" required min="0" step="0.01" className="w-full rounded-[16px] bg-slate-50 border border-slate-200 pl-16 pr-4 py-3.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-lg font-bold text-slate-900" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <label htmlFor="topUpDesc" className="block text-[13px] font-semibold text-slate-500 mb-1.5 ml-1">Note (Optional)</label>
                <input id="topUpDesc" type="text" className="w-full rounded-[16px] bg-slate-50 border border-slate-200 px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-[15px]" value={topUpDesc} onChange={(e) => setTopUpDesc(e.target.value)} placeholder="e.g. Extra fuel allowance" />
              </div>
              <button type="submit" className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-[16px] transition-colors text-[16px] mt-2 shadow-sm shadow-indigo-600/30">
                Add Funds
              </button>
            </form>
          </div>
        </div>
      )}

      {isExpenseOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={handleCloseExpenseModal}></div>
          <div className="bg-[var(--th-white)] rounded-t-[32px] sm:rounded-[32px] w-full max-w-xl shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200 flex flex-col max-h-[92vh] sm:max-h-[85vh]">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-4 mb-1 sm:hidden shrink-0"></div>
            
            <div className="flex justify-between items-center px-6 pt-1 pb-3 sm:p-6 sm:pb-3 shrink-0 border-b border-transparent">
              <h3 className="text-[22px] font-bold text-slate-900 leading-none">{editingExpenseId ? 'Edit Expense' : 'Add Expense'}</h3>
              <button 
                onClick={handleCloseExpenseModal} 
                className="text-slate-400 active:bg-slate-100 p-1.5 rounded-full transition-colors"
                type="button"
                aria-label="Close expense modal"
              >
                <X size={24}/>
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="flex flex-col overflow-hidden min-h-0 relative">
              <div className="flex-1 overflow-y-auto px-6 sm:px-6 pb-2 space-y-4">
                {/* Amount Input Component - Big and Prominent */}
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[12px] font-semibold text-slate-400 mb-0.5">
                    Amount {(() => {
                      try {
                        const code = JSON.parse(localStorage.getItem('app_settings') || '{}').currencyCode || 'LKR';
                        return `(${code === 'LKR' ? 'Rs.' : code})`;
                      } catch(e) { return '(Rs.)'; }
                    })()}
                  </span>
                  <input 
                    id="expenseAmount"
                    type="number" 
                    autoFocus
                    required 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full text-center bg-transparent border-none focus:ring-0 outline-none transition-all text-5xl sm:text-5xl font-bold text-slate-900 placeholder:text-slate-200 py-1" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                  />
                </div>

                {!editingExpenseId && (
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5 ml-1">Quick Select</label>
                    <div 
                      className="flex overflow-x-auto pb-2 -mx-2 px-2 gap-2"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {COMMON_EXPENSES.map(ce => (
                        <button 
                          key={ce.label} 
                          type="button" 
                          onClick={() => { setCategory(ce.category); setDescription(ce.label); setIsCustomCategory(false); }} 
                          className="flex-shrink-0 px-3 py-1.5 bg-[var(--bg-app)] active:bg-slate-200 text-[var(--th-slate-700)] rounded-full text-[12px] font-medium transition-colors border border-transparent hover:border-slate-300 whitespace-nowrap"
                        >
                          {ce.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="bg-[var(--bg-app)] p-3 sm:p-4 rounded-[20px] space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-slate-500 mb-1.5 ml-1">Category</label>
                    <div 
                      className="flex overflow-x-auto pb-1.5 -mx-2 px-2 gap-1.5"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {DEFAULT_CATEGORIES.map(c => (
                        <button 
                          key={c.id} 
                          type="button" 
                          onClick={() => { setCategory(c.id); setIsCustomCategory(false); }} 
                          className={cn("flex flex-shrink-0 flex-col items-center justify-center p-2 w-[70px] rounded-[16px] transition-all", category === c.id && !isCustomCategory ? "bg-[var(--th-white)] shadow-sm border border-slate-200" : "bg-transparent border border-transparent hover:bg-slate-200/50")}
                        >
                          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center mb-1.5", c.bgColor, c.textColor)}>
                            <c.icon size={16} />
                          </div>
                          <span className="text-[10px] font-semibold text-[var(--th-slate-700)] truncate w-full text-center">{c.label}</span>
                        </button>
                      ))}
                      <button 
                        type="button" 
                        onClick={() => setIsCustomCategory(true)} 
                        className={cn("flex flex-shrink-0 flex-col items-center justify-center p-2 w-[70px] rounded-[16px] transition-all", isCustomCategory ? "bg-[var(--th-white)] shadow-sm border border-slate-200" : "bg-transparent border border-transparent hover:bg-slate-200/50")}
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mb-1.5"><Plus size={16} /></div>
                        <span className="text-[10px] font-semibold text-[var(--th-slate-700)] truncate w-full text-center">Custom</span>
                      </button>
                    </div>
                    
                    {isCustomCategory && (
                      <div className="mt-2 animate-in slide-in-from-top-2 duration-200">
                        <input 
                          type="text" 
                          required={isCustomCategory} 
                          autoFocus
                          aria-label="Custom category name"
                          placeholder="Enter custom category name..." 
                          className="w-full rounded-[14px] bg-[var(--th-white)] text-[var(--th-slate-900)] border border-slate-200 px-3 py-2.5 focus:border-indigo-500 outline-none transition-all text-[14px] shadow-sm" 
                          value={customCategoryName} 
                          onChange={(e) => setCustomCategoryName(e.target.value)} 
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="expenseDescription" className="block text-[12px] font-semibold text-slate-500 mb-1 ml-1">Description (Optional)</label>
                    <input 
                      id="expenseDescription"
                      type="text"
                      placeholder="e.g. Note about this expense" 
                      className="w-full rounded-[14px] bg-[var(--th-white)] text-[var(--th-slate-900)] border border-slate-200 px-3 py-2.5 focus:border-indigo-500 outline-none transition-all text-[14px] shadow-sm" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 sm:pt-3 bg-[var(--th-white)] border-t border-slate-100 shrink-0">
                <button type="submit" className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-[16px] active:scale-[0.98] transition-all text-[16px] shadow-[0_4px_12px_rgba(79,70,229,0.3)]">
                  {editingExpenseId ? 'Update Expense' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCompleteOpen(false)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5 mx-auto">
              <CheckCircle size={24} />
            </div>
            <h3 className="text-[20px] font-bold text-slate-900 mb-2 text-center">Complete Task</h3>
            <p className="text-slate-500 text-[14px] mb-8 text-center leading-relaxed">Are you sure you want to complete this task? You will <strong className="text-slate-700">not be able to add more expenses</strong> later.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setIsCompleteOpen(false)} 
                className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors text-slate-700 font-semibold rounded-[16px] text-[15px]"
              >
                Cancel
              </button>
              <button 
                onClick={() => { setIsCompleteOpen(false); onComplete(); }} 
                className="w-full sm:flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors text-white font-semibold rounded-[16px] text-[15px] shadow-sm shadow-indigo-600/30"
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
