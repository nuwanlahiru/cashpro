import { useState, useEffect } from 'react';
import { Task, ViewState } from './types';
import Dashboard from './components/Dashboard';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';
import ReportView from './components/ReportView';
import TrashBinView from './components/TrashBinView';
import SettingsView from './components/SettingsView';
import { Sun, Moon, Palette, Settings, Cloud, CloudOff, RefreshCw, DownloadCloud, UploadCloud, Infinity, AlertTriangle } from 'lucide-react';
import { useSettings } from './hooks/useSettings';
import { useSync } from './hooks/useSync';
import { useModalBack } from './hooks/useModalBack';

type Theme = 'light' | 'dark' | 'colorful';

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('app_theme') as Theme) || 'light';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('expense_tasks');
    if (!saved) return [];
    
    try {
      const parsedTasks: Task[] = JSON.parse(saved);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Filter out tasks deleted more than 30 days ago
      return parsedTasks.filter(t => {
        if (!t.deletedAt) return true;
        return new Date(t.deletedAt) > thirtyDaysAgo;
      });
    } catch (e) {
      return [];
    }
  });

  const { settings } = useSettings();
  const { syncStatus, isOnline, lastSyncTime, pushData, pullData } = useSync(tasks, setTasks);
  const [showSyncMenu, setShowSyncMenu] = useState(false);
  useModalBack(showSyncMenu, () => setShowSyncMenu(false), 'syncMenu');
  
  const [view, setViewState] = useState<ViewState>('dashboard');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize history state on load
    if (!window.history.state || !window.history.state.view) {
      window.history.replaceState({ view: 'dashboard', activeTaskId: null }, '', '');
    } else {
      setViewState(window.history.state.view);
      setActiveTaskId(window.history.state.activeTaskId || null);
    }

    const handlePopState = (e: PopStateEvent) => {
      if (e.state && e.state.view) {
        setViewState(e.state.view);
        setActiveTaskId(e.state.activeTaskId || null);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setView = (newView: ViewState) => {
    setViewState(newView);
    window.history.pushState({ view: newView, activeTaskId }, '', '');
  };

  const navigateToTask = (id: string | null, newView: ViewState) => {
    setActiveTaskId(id);
    setViewState(newView);
    window.history.pushState({ view: newView, activeTaskId: id }, '', '');
  };

  useEffect(() => {
    localStorage.setItem('expense_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleCreateTask = (newTask: Task) => {
    setTasks([newTask, ...tasks]);
    navigateToTask(newTask.id, 'task_detail');
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, deletedAt: new Date().toISOString() } : t));
    if(activeTaskId === id) {
      navigateToTask(null, 'dashboard');
    }
  };

  const handleRestoreTask = (id: string) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const { deletedAt, ...rest } = t;
        return rest as Task;
      }
      return t;
    }));
  };

  const handlePermanentDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const activeTask = tasks.find(t => t.id === activeTaskId) || null;

  return (
    <>
      {theme === 'colorful' && <div className="fixed inset-0 -z-10 colorful-bg"></div>}
      <div className="h-full overflow-hidden bg-[var(--bg-app)] flex flex-col font-sans">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-md focus:font-semibold">
          Skip to main content
        </a>
      <header className="shrink-0 z-40 safe-pt bg-[var(--th-header-bg)] bg-blur-lg backdrop-blur-xl border-b border-[var(--th-slate-200)] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-800 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Infinity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-[var(--th-slate-900)] whitespace-nowrap">Petty Cash</h1>
        </div>
        
        <div className="flex items-center gap-2">
          
          <div className="relative flex items-center">
            <button 
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className={`flex items-center justify-center p-2 rounded-full transition-colors ${!isOnline ? 'text-red-500 bg-red-50 hover:bg-red-100' : syncStatus === 'error' ? 'text-orange-500 bg-orange-50 hover:bg-orange-100' : syncStatus === 'pending' ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : syncStatus === 'synced' ? 'text-emerald-500 bg-emerald-50 hover:bg-emerald-100' : 'text-indigo-500 bg-indigo-50 hover:bg-indigo-100'}`}
              title="Sync Status"
              aria-label="Sync Status"
            >
              {!isOnline ? <CloudOff size={18} /> : 
                syncStatus === 'syncing' ? <RefreshCw size={18} className="animate-spin" /> : 
                syncStatus === 'error' ? <AlertTriangle size={18} /> :
                syncStatus === 'pending' ? <UploadCloud size={18} /> :
                <Cloud size={18} />}
            </button>

            {showSyncMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSyncMenu(false)}></div>
                <div className="absolute top-12 right-0 mt-2 w-48 bg-[var(--th-white)] backdrop-blur-xl rounded-[16px] shadow-sm border border-[var(--th-slate-200)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-[var(--th-slate-200)]/50">
                    <p className="text-sm font-semibold text-[var(--th-slate-800)]">Sync Status</p>
                    <p className="text-xs text-[var(--th-slate-500)] mt-1">{!isOnline ? 'Offline' : syncStatus.charAt(0).toUpperCase() + syncStatus.slice(1)}</p>
                  </div>
                  <button 
                    onClick={() => { 
                      if (!settings.syncUrl) {
                        alert("Please configure the Sync URL in Settings first.");
                      } else {
                        pushData(); 
                      }
                      setShowSyncMenu(false); 
                    }}
                    disabled={!isOnline || syncStatus === 'syncing'}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--th-slate-700)] hover:bg-[var(--th-slate-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Cloud size={16} className="text-emerald-500" /> Push Data
                  </button>
                  <button 
                    onClick={() => { 
                      if (!settings.syncUrl) {
                        alert("Please configure the Sync URL in Settings first.");
                      } else {
                        pullData(); 
                      }
                      setShowSyncMenu(false); 
                    }}
                    disabled={!isOnline || syncStatus === 'syncing' || syncStatus === 'pending'}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-[var(--th-slate-700)] hover:bg-[var(--th-slate-50)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-t border-[var(--th-slate-200)]/50"
                  >
                    <DownloadCloud size={16} className="text-indigo-500" /> Pull Data
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="flex bg-[var(--bg-app)] rounded-full p-1 border border-[var(--th-slate-200)]/50">
            <button 
              onClick={() => setTheme(t => t === 'light' ? 'dark' : t === 'dark' ? 'colorful' : 'light')}
              className="p-1.5 rounded-full transition-colors text-[var(--th-slate-600)] hover:bg-[var(--th-white)] hover:shadow-sm"
              title="Toggle Theme"
              aria-label="Toggle Theme"
            >
              {theme === 'light' && <Sun size={18} />}
              {theme === 'dark' && <Moon size={18} />}
              {theme === 'colorful' && <Palette size={18} />}
            </button>
          </div>

          <div className="flex bg-[var(--bg-app)] rounded-full p-1 border border-[var(--th-slate-200)]/50">
            <button 
              onClick={() => setView('settings')}
              className={`p-1.5 rounded-full transition-colors ${view === 'settings' ? 'bg-[var(--th-white)] text-[var(--th-indigo-600)] shadow-sm' : 'text-[var(--th-slate-400)] hover:text-[var(--th-slate-600)]'}`}
              title="Settings"
              aria-label="Open Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>
      <main id="main-content" className="flex-1 w-full overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6 safe-pb pb-12 min-h-full">
        {view === 'dashboard' && (
          <Dashboard 
            tasks={tasks} 
            onStartNew={() => setView('new_task')} 
            onViewTask={(id) => {
              const t = tasks.find(x => x.id === id);
              if (t?.status === 'completed' && !t?.isUnlocked) {
                navigateToTask(id, 'report');
              } else {
                navigateToTask(id, 'task_detail');
              }
            }} 
            onDeleteTask={handleDeleteTask}
            onViewBin={() => setView('bin')}
          />
        )}
        
        {view === 'new_task' && (
          <TaskForm 
            onSave={handleCreateTask} 
            onCancel={() => setView('dashboard')} 
          />
        )}

        {view === 'edit_task' && activeTask && (
          <TaskForm 
            initialData={activeTask}
            onSave={(updated) => {
              handleUpdateTask(updated);
              setView('task_detail');
            }} 
            onCancel={() => setView('task_detail')} 
          />
        )}
        
        {view === 'task_detail' && activeTask && (
          <TaskDetail 
            task={activeTask} 
            onUpdate={handleUpdateTask} 
            onBack={() => setView('dashboard')}
            onViewReport={() => setView('report')}
            onEditTask={() => setView('edit_task')}
            onComplete={() => {
              if (activeTask.isUnlocked) {
                handleUpdateTask({ ...activeTask, isUnlocked: false });
                setView('report');
              } else {
                handleUpdateTask({ ...activeTask, status: 'completed', endDate: new Date().toISOString() });
                setView('report');
              }
            }}
          />
        )}

        {view === 'report' && activeTask && (
          <ReportView 
            task={activeTask} 
            onBack={() => setView('dashboard')} 
            onUnlock={() => handleUpdateTask({...activeTask, isUnlocked: true})}
            onEdit={() => setView('task_detail')}
          />
        )}

        {view === 'bin' && (
          <TrashBinView
            tasks={tasks}
            onBack={() => setView('dashboard')}
            onRestore={handleRestoreTask}
            onPermanentDelete={handlePermanentDelete}
          />
        )}

        {view === 'settings' && (
          <SettingsView
            onBack={() => setView('dashboard')}
            tasks={tasks}
            setTasks={setTasks}
            isOnline={isOnline}
            syncStatus={syncStatus}
            lastSyncTime={lastSyncTime}
          />
        )}
        </div>
      </main>
      <footer className="shrink-0 text-center text-xs font-medium text-[var(--th-slate-400)] pt-3 pb-6 safe-pb bg-[var(--bg-app)] border-t border-[var(--th-slate-200)]/30">
        © {new Date().getFullYear()} by <a href="https://scrollloop.com" target="_blank" rel="noopener noreferrer" className="text-[var(--th-indigo-500)] hover:underline">scrollloop.com</a>
      </footer>
    </div>
    </>
  );
}
