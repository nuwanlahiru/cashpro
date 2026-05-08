import { useState } from 'react';
import { Task } from '../types';
import { format, differenceInDays } from 'date-fns';
import { Trash2, RotateCcw } from 'lucide-react';
import { useModalBack } from '../hooks/useModalBack';

interface TrashBinViewProps {
  tasks: Task[];
  onBack: () => void;
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export default function TrashBinView({ tasks, onBack, onRestore, onPermanentDelete }: TrashBinViewProps) {
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const deletedTasks = tasks.filter(t => t.deletedAt);

  useModalBack(!!taskToDelete, () => setTaskToDelete(null), 'deleteForever');

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 sm:pb-0">
      <div className="flex flex-col gap-2">
        <button 
          onClick={onBack}
          className="text-[15px] font-semibold text-indigo-500 hover:text-indigo-600 active:text-indigo-400 transition-colors mb-2 w-fit flex items-center gap-1 min-h-[48px] min-w-[48px] px-4 -ml-4 rounded-xl"
          aria-label="Go back to Dashboard"
        >
           ← Back
        </button>
        <h1 className="text-[28px] sm:text-[32px] font-bold text-slate-900 leading-none flex items-center gap-2">
          <Trash2 size={26} className="text-slate-700" /> Trash
        </h1>
        <p className="text-slate-500 text-[15px] mt-1 font-medium">Items are permanently deleted after 30 days.</p>
      </div>

      <div className="bg-[var(--th-white)] rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
        {deletedTasks.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <div className="w-14 h-14 bg-[var(--bg-app)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 size={24} className="text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 text-[15px] mb-1">Trash is empty</p>
            <p className="text-[13px]">No deleted tasks found.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--bg-app)]">
            {deletedTasks.map(task => {
              const daysLeft = Math.max(0, 30 - differenceInDays(new Date(), new Date(task.deletedAt!)));
              
              return (
                <div key={task.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="font-semibold text-[17px] text-slate-900 leading-tight">{task.title}</h3>
                      <span className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-[var(--bg-app)] text-slate-500">
                        {task.status === 'completed' ? 'Completed' : 'Active'}
                      </span>
                    </div>
                    <p className="text-[13px] text-slate-500 font-medium">Deleted on {format(new Date(task.deletedAt!), 'MMM d, yyyy')}</p>
                    <p className="text-[12px] text-red-500 font-medium mt-1">{daysLeft} days until deletion</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <button 
                      onClick={() => onRestore(task.id)}
                      className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-indigo-50 text-indigo-600 active:bg-indigo-100 rounded-full font-semibold flex items-center gap-2 text-[14px] transition-colors"
                      aria-label={`Restore task: ${task.title}`}
                    >
                      <RotateCcw size={16}/> Restore
                    </button>
                    <button 
                      onClick={() => setTaskToDelete(task.id)}
                      className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-red-50 text-red-600 active:bg-red-100 rounded-full font-semibold flex items-center gap-2 text-[14px] transition-colors"
                      aria-label={`Permanently delete task: ${task.title}`}
                    >
                      <Trash2 size={16}/> Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setTaskToDelete(null)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <h3 className="text-[20px] font-bold text-slate-900 mb-1">Delete Forever?</h3>
            <p className="text-slate-500 text-[15px] mb-6">Are you sure you want to permanently delete this task? This action cannot be undone.</p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button 
                onClick={() => setTaskToDelete(null)} 
                className="w-full sm:flex-1 py-3.5 bg-[var(--bg-app)] active:bg-[#e5e5ea] transition-colors text-slate-900 font-semibold rounded-[14px] text-[17px] order-2 sm:order-1"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onPermanentDelete(taskToDelete);
                  setTaskToDelete(null);
                }} 
                className="w-full sm:flex-1 py-3.5 bg-red-500 active:bg-red-600 transition-colors text-white font-semibold rounded-[14px] text-[17px] order-1 sm:order-2"
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
