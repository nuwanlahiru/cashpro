import { useState } from 'react';
import { Task } from '../types';
import { formatCurrency } from '../lib/utils';
import { format } from 'date-fns';
import { PlusCircle, Wallet, CheckCircle2, Navigation, Trash2 } from 'lucide-react';
import { useModalBack } from '../hooks/useModalBack';

interface DashboardProps {
  tasks: Task[];
  onStartNew: () => void;
  onViewTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onViewBin: () => void;
}

export default function Dashboard({ tasks, onStartNew, onViewTask, onDeleteTask, onViewBin }: DashboardProps) {
  const activeTasks = tasks.filter(t => t.status === 'active' && !t.deletedAt);
  const completedTasks = tasks.filter(t => t.status === 'completed' && !t.deletedAt);
  const deletedCount = tasks.filter(t => t.deletedAt).length;
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);

  useModalBack(!!taskToDelete, () => setTaskToDelete(null), 'deleteConfirm');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">Overview</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage tasks and expenses</p>
        </div>
        <button
          onClick={onStartNew}
          className="w-10 h-10 sm:w-auto sm:h-auto sm:px-5 sm:py-2.5 bg-indigo-600 text-white rounded-full sm:rounded-[20px] font-semibold flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all shadow-[0_4px_12px_rgba(79,70,229,0.3)] text-sm"
        >
          <PlusCircle size={22} className="sm:mr-1.5" />
          <span className="hidden sm:inline">New Task</span>
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 items-start">
        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider ml-2">
            Active
          </h2>
          
          {activeTasks.length === 0 ? (
            <div className="bg-[var(--th-white)] rounded-[24px] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-slate-500 text-sm">No active tasks right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTasks.map(task => {
                const totalSpent = task.expenses.reduce((sum, e) => sum + e.amount, 0);
                const totalAllowance = task.initialAllowance + (task.topUps || []).reduce((sum, t) => sum + t.amount, 0);
                const isOverBudget = totalSpent > totalAllowance;
                return (
                  <div 
                    key={task.id} 
                    onClick={() => onViewTask(task.id)}
                    onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewTask(task.id); } }}
                    role="button"
                    tabIndex={0}
                    aria-label={`View active task: ${task.title}`}
                    className="bg-[var(--th-white)] p-5 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  >
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <div className="pr-2">
                        <h3 className="text-[19px] font-semibold text-slate-900 leading-tight break-all sm:break-normal">{task.title}</h3>
                        <p className="text-slate-500 text-[13px] mt-1">{format(new Date(task.startDate), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="text-right pr-8 shrink-0">
                        <p className={`text-[20px] sm:text-[22px] font-bold tracking-tight ${isOverBudget ? 'text-red-500' : 'text-slate-900'}`}>
                          {formatCurrency(totalSpent)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span className="text-slate-500">Allowance: <span className="font-medium text-slate-900">{formatCurrency(totalAllowance)}</span></span>
                      <span className={`font-medium ${isOverBudget ? 'text-red-500' : 'text-slate-500'}`}>
                        {((totalSpent / totalAllowance) * 100).toFixed(0)}% Used
                      </span>
                    </div>
                    
                    <div className="w-full bg-[var(--bg-app)] h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
                        style={{ width: `${Math.min((totalSpent / totalAllowance) * 100, 100)}%` }}
                      ></div>
                    </div>

                    <button
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        setTaskToDelete(task.id); 
                      }}
                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 active:bg-slate-100 rounded-full p-1.5 transition-colors"
                      aria-label={`Delete task: ${task.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wider ml-2">
            Completed
          </h2>
          
          {completedTasks.length === 0 ? (
            <div className="bg-[var(--th-white)] rounded-[24px] p-8 text-center shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <p className="text-slate-500 text-sm">No completed tasks yet.</p>
            </div>
          ) : (
            <div className="bg-[var(--th-white)] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
              <div className="divide-y divide-[var(--bg-app)]">
                {completedTasks.map((task, idx) => {
                  const totalSpent = task.expenses.reduce((sum, e) => sum + e.amount, 0);
                  const totalAllowance = task.initialAllowance + (task.topUps || []).reduce((sum, t) => sum + t.amount, 0);
                  const balance = totalAllowance - totalSpent;
                  const balanceIsPositive = balance >= 0;

                  return (
                    <div 
                      key={task.id}
                      onClick={() => onViewTask(task.id)}
                      onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onViewTask(task.id); } }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View completed task: ${task.title}`}
                      className="p-4 sm:p-5 active:bg-slate-50 transition-colors cursor-pointer flex justify-between items-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:bg-slate-50"
                    >
                      <div className="pr-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          {task.isUnlocked && (
                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          )}
                          <h3 className="font-semibold text-[17px] text-slate-900 leading-tight">{task.title}</h3>
                        </div>
                        <p className="text-[13px] text-slate-500">
                          {task.endDate ? format(new Date(task.endDate), 'MMM d, yyyy') : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className={`block font-semibold text-[17px] ${balanceIsPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                            {balanceIsPositive ? '+' : ''}{formatCurrency(balance)}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setTaskToDelete(task.id); 
                          }}
                          className="text-slate-300 hover:text-red-500 active:bg-slate-100 rounded-full p-2"
                          aria-label={`Delete completed task: ${task.title}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      <div className="flex justify-center mt-8 mb-4">
        <button
          onClick={onViewBin}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-slate-400 hover:text-slate-600 active:bg-[var(--th-white)] rounded-full font-medium text-[13px] transition-all"
        >
          <Trash2 size={16} />
          Recently Deleted ({deletedCount})
        </button>
      </div>

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setTaskToDelete(null)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <h3 className="text-[20px] font-bold text-slate-900 mb-1">Delete Task?</h3>
            <p className="text-slate-500 text-[15px] mb-6">Are you sure you want to delete this task? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setTaskToDelete(null); }} 
                className="w-full sm:flex-1 py-3.5 bg-[var(--bg-app)] active:bg-[#e5e5ea] transition-colors text-slate-900 font-semibold rounded-[14px] text-[17px]"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  onDeleteTask(taskToDelete); 
                  setTaskToDelete(null); 
                }} 
                className="w-full sm:flex-1 py-3.5 bg-red-500 active:bg-red-600 transition-colors text-white font-semibold rounded-[14px] text-[17px]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
