import { useState } from 'react';
import { Task } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { format } from 'date-fns';
import { ArrowLeft, Printer, AlertTriangle, FileText, ArrowRight, Lock, Unlock, X, Download, ChevronDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getCategoryInfo } from '../lib/categories';

interface ReportViewProps {
  task: Task;
  onBack: () => void;
  onUnlock: () => void;
  onEdit: () => void;
}

const COLORS = ['#4f46e5', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#64748b'];

export default function ReportView({ task, onBack, onUnlock, onEdit }: ReportViewProps) {
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [pwd, setPwd] = useState('');
  const [pwdError, setPwdError] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const totalSpent = task.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalAllowance = task.initialAllowance + (task.topUps || []).reduce((sum, t) => sum + t.amount, 0);
  const balance = totalAllowance - totalSpent;
  const isOverBudget = balance < 0;

  // Group expenses by category
  const expenseSummary = task.expenses.reduce((acc, expense) => {
    const info = getCategoryInfo(expense.category);
    acc[info.label] = (acc[info.label] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expenseSummary)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const exportJSON = () => {
    const dataStr = JSON.stringify(task, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${task.title.replace(/\s+/g, '_')}_Report.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const exportCSV = () => {
    let csvContent = "";
    csvContent += `Task,${task.title}\n`;
    csvContent += `Start Date,${format(new Date(task.startDate), 'yyyy-MM-dd')}\n`;
    csvContent += `End Date,${task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : 'Ongoing'}\n`;
    csvContent += `Status,${task.status}\n`;
    csvContent += `Initial Allowance,${task.initialAllowance}\n\n`;

    csvContent += `--- Top Ups ---\n`;
    csvContent += `Date,Amount,Description\n`;
    if (task.topUps) {
      task.topUps.forEach(t => {
        csvContent += `"${format(new Date(t.date), 'yyyy-MM-dd HH:mm:ss')}",${t.amount},"${(t.description || '').replace(/"/g, '""')}"\n`;
      });
    }
    csvContent += `\n`;

    csvContent += `--- Expenses ---\n`;
    csvContent += `Date,Category,Amount,Description\n`;
    task.expenses.forEach(e => {
      csvContent += `"${format(new Date(e.date), 'yyyy-MM-dd HH:mm:ss')}","${getCategoryInfo(e.category).label}",${e.amount},"${(e.description || '').replace(/"/g, '""')}"\n`;
    });
    csvContent += `\n`;

    csvContent += `--- Summary ---\n`;
    csvContent += `Total Allowance,${totalAllowance}\n`;
    csvContent += `Total Spent,${totalSpent}\n`;
    csvContent += `Final Balance,${balance}\n`;

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `${task.title.replace(/\s+/g, '_')}_Report.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`space-y-6 sm:space-y-8 animate-in zoom-in-95 duration-500 pb-20 sm:pb-0 ${isGeneratingPDF ? 'overflow-visible w-[800px] max-w-none' : ''}`}>
      {/* Header - Not printed */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-center justify-between sm:gap-4">
        <button 
          onClick={onBack}
          className="text-[15px] font-semibold text-indigo-500 hover:text-indigo-600 active:text-indigo-400 transition-colors mb-2 sm:mb-0 w-fit flex items-center gap-1"
          aria-label="Go back to Dashboard"
        >
          ← Dashboard
        </button>
        <div className="flex flex-wrap items-center gap-2.5">
          {task.status === 'completed' && (
            <>
              {task.isUnlocked ? (
                <button
                  onClick={onEdit}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-emerald-50 text-emerald-600 rounded-full sm:rounded-[20px] font-semibold text-[15px] sm:text-sm hover:bg-emerald-100 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98]"
                >
                  <Unlock size={18} />
                  Edit Data
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsUnlockOpen(true);
                    setPwd('');
                    setPwdError(false);
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-red-50 text-red-500 rounded-full sm:rounded-[20px] font-semibold text-[15px] sm:text-sm hover:bg-red-100 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98]"
                >
                  <Lock size={18} />
                  Unlock
                </button>
              )}
            </>
          )}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="w-full sm:w-auto inline-flex items-center justify-between sm:justify-center gap-2 px-5 py-3 sm:py-2.5 bg-[var(--th-white)] text-slate-700 rounded-full sm:rounded-[20px] font-semibold text-[15px] sm:text-sm shadow-[0_2px_8px_rgba(0,0,0,0.04)] active:scale-[0.98] transition-all"
              aria-expanded={isExportOpen}
              aria-haspopup="true"
            >
              <div className="flex items-center gap-2">
                <Download size={18} />
                <span>Export Option</span>
              </div>
              <ChevronDown size={18} className={`transition-transform duration-200 ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>

            {isExportOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40 sm:hidden" 
                  onClick={() => setIsExportOpen(false)}
                />
                <div className="absolute right-0 sm:right-auto sm:left-0 top-[calc(100%+8px)] w-full sm:w-48 bg-[var(--th-white)] rounded-[20px] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-[var(--th-slate-100)] z-50 overflow-hidden animate-in slide-in-from-top-2 sm:zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      exportCSV();
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-5 py-4 sm:py-3 hover:bg-[var(--th-slate-50)] transition-colors flex items-center gap-3 font-medium text-[15px] sm:text-sm text-slate-700 border-b border-[var(--th-slate-100)] active:bg-[var(--th-slate-100)]"
                  >
                    <FileText size={18} className="text-emerald-500" />
                    CSV Format
                  </button>
                  <button
                    onClick={() => {
                      exportJSON();
                      setIsExportOpen(false);
                    }}
                    className="w-full text-left px-5 py-4 sm:py-3 hover:bg-[var(--th-slate-50)] transition-colors flex items-center gap-3 font-medium text-[15px] sm:text-sm text-slate-700 border-b border-[var(--th-slate-100)] active:bg-[var(--th-slate-100)]"
                  >
                    <FileText size={18} className="text-blue-500" />
                    JSON Format
                  </button>
                  <button
                    onClick={async () => {
                      setIsExportOpen(false);
                      setIsGeneratingPDF(true);
                      
                      setTimeout(async () => {
                        const element = document.getElementById('report-content');
                        if (!element) {
                          setIsGeneratingPDF(false);
                          return;
                        }
                        
                        try {
                          const { toPng } = await import('html-to-image');
                          const { jsPDF } = await import('jspdf');

                          // Add a small delay to ensure charts are rendered completely
                          await new Promise(r => setTimeout(r, 150));

                          const originalScrollTop = window.scrollY;
                          window.scrollTo(0, 0);

                          const dataUrl = await toPng(element, { 
                            quality: 0.95, 
                            backgroundColor: '#ffffff',
                            pixelRatio: 2, // For better quality
                            width: 800,
                            height: element.scrollHeight, // capture full height
                            style: {
                              transform: 'scale(1)',
                              transformOrigin: 'top left',
                            }
                          });
                          
                          window.scrollTo(0, originalScrollTop);
                          
                          const pdfWidth = 210; // A4 width in mm
                          const pageHeight = 297; // A4 height in mm
                          // Calculate proportional height of the full image
                          const pdfHeight = (element.scrollHeight * pdfWidth) / 800;
                          
                          // Initialize jsPDF with standard A4
                          const pdf = new jsPDF({
                            orientation: 'portrait',
                            unit: 'mm',
                            format: 'a4'
                          });
                          
                          let heightLeft = pdfHeight;
                          let position = 0;
                          
                          // Draw first page
                          pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
                          heightLeft -= pageHeight;
                          
                          // Slicing into multiple pages
                          while (heightLeft > 0) {
                            position -= pageHeight;
                            pdf.addPage();
                            pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
                            heightLeft -= pageHeight;
                          }
                          
                          pdf.save(`${task.title.replace(/\s+/g, '_')}_Report.pdf`);
                        } catch (err) {
                          console.error('Failed to generate PDF:', err);
                          // Fallback to native print
                          window.print();
                        } finally {
                          setIsGeneratingPDF(false);
                        }
                      }, 150);
                    }}
                    className="w-full text-left px-5 py-4 sm:py-3 hover:bg-[var(--th-slate-50)] transition-colors flex items-center gap-3 font-medium text-[15px] sm:text-sm text-slate-700 active:bg-[var(--th-slate-100)]"
                  >
                    <Printer size={18} className="text-indigo-500" />
                    {isGeneratingPDF ? 'Generating PDF...' : 'PDF Format'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actual Report Content (Will be printed) */}
      <div id="report-content" className={`bg-[var(--th-white)] rounded-[2rem] border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] print:shadow-none print:border-none ${isGeneratingPDF ? 'w-[800px] max-w-none p-12 !border-none' : 'w-full p-6 sm:p-12 border'}`}>
        {/* Report Top Matter */}

        <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-indigo-600 rounded-[14px] flex items-center justify-center shadow-[0_2px_8px_rgba(79,70,229,0.3)]">
                <FileText className="text-white" size={20} />
              </div>
              <h2 className="text-[13px] font-semibold tracking-wide text-slate-500 uppercase">Expense Report</h2>
            </div>
            <h1 className={`font-bold text-slate-900 mb-2 leading-none tracking-tight ${isGeneratingPDF ? 'text-4xl' : 'text-[32px] sm:text-4xl'}`}>{task.title}</h1>
            <p className="text-[15px] text-slate-500 font-medium">
              Period: {format(new Date(task.startDate), 'MMM d, yyyy')} — {task.endDate ? format(new Date(task.endDate), 'MMM d, yyyy') : 'Ongoing'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-medium text-slate-400 mb-1 leading-tight">Generated On</p>
            <p className="text-slate-900 text-[15px] font-semibold">{format(new Date(), 'MMM d, yyyy')}</p>
            <p className="text-slate-500 text-[13px]">{format(new Date(), 'h:mm a')}</p>
          </div>
        </div>

        {/* Financial Summary */}
        <div className={`gap-4 sm:gap-6 mb-12 ${isGeneratingPDF ? 'grid grid-cols-3' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          <div className="p-5 sm:p-6 rounded-[24px] bg-[var(--bg-app)] border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-w-0">
            <p className="text-[13px] font-semibold text-slate-500 mb-2">Total Allowance</p>
            <p className={`font-bold text-slate-900 tracking-tight ${isGeneratingPDF ? 'text-[22px]' : 'text-[24px] lg:text-[32px]'}`} title={formatCurrency(totalAllowance)}>{formatCurrency(totalAllowance)}</p>
            {task.topUps && task.topUps.length > 0 && (
              <p className="text-[13px] text-slate-500 mt-2 font-medium">
                Initial: {formatCurrency(task.initialAllowance)}<br/>
                Top-ups: {formatCurrency(task.topUps.reduce((s,t) => s+t.amount, 0))}
              </p>
            )}
          </div>
          <div className="p-5 sm:p-6 rounded-[24px] bg-[var(--bg-app)] border border-transparent shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-w-0">
            <p className="text-[13px] font-semibold text-slate-500 mb-2">Total Expenses</p>
            <p className={`font-bold text-slate-900 tracking-tight ${isGeneratingPDF ? 'text-[22px]' : 'text-[24px] lg:text-[32px]'}`} title={formatCurrency(totalSpent)}>{formatCurrency(totalSpent)}</p>
          </div>
          <div className={`p-5 sm:p-6 rounded-[24px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-w-0 md:col-span-2 lg:col-span-1 ${isOverBudget ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
            <p className={`text-[13px] font-semibold mb-2 ${isOverBudget ? 'text-red-700' : 'text-emerald-700'}`}>Final Balance</p>
            <p className={`font-bold tracking-tight ${isOverBudget ? 'text-red-700' : 'text-emerald-700'} ${isGeneratingPDF ? 'text-[22px]' : 'text-[24px] lg:text-[32px]'}`} title={formatCurrency(balance)}>
              {formatCurrency(balance)}
            </p>
            {isOverBudget && (
              <div className="flex items-center text-[13px] mt-2 text-red-600 font-semibold">
                <AlertTriangle size={15} className="mr-1.5 flex-shrink-0" />
                <span>Overspending must be reimbursed.</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Section */}
        {task.expenses.length > 0 && (
          <div className={`items-center mb-12 print-break-inside-avoid ${isGeneratingPDF ? 'grid grid-cols-2 gap-12' : 'grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12'}`}>
            <div className={isGeneratingPDF ? 'order-1' : 'order-2 md:order-1'}>
              <h3 className="text-[17px] font-bold text-slate-900 mb-6 tracking-tight">Spend by Category</h3>
              <div className="space-y-4">
                {chartData.map((data, index) => (
                  <div key={data.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-slate-800 font-semibold text-[15px] truncate">{data.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-900 text-[15px] font-semibold tracking-tight">{formatCurrency(data.value)}</span>
                      <span className="text-[12px] text-slate-500 block mt-0.5 font-medium">
                        {((data.value / totalSpent) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            </div>
            <div className={`h-64 sm:h-72 w-full flex justify-center ${isGeneratingPDF ? 'order-2' : 'order-1 md:order-2 no-print'}`}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    isAnimationActive={!isGeneratingPDF}
                  >
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Ups */}
        {task.topUps && task.topUps.length > 0 && (
          <div className="mb-12 print-break-inside-avoid">
            <h3 className="text-[17px] font-bold text-slate-900 mb-6 tracking-tight">Allowance Top-ups</h3>
            
            {/* Desktop & PDF View */}
            <div className={`rounded-[24px] ${isGeneratingPDF ? 'block' : 'overflow-x-auto hidden lg:block'}`}>
              <table className="w-full text-left text-[15px] whitespace-nowrap min-w-[600px]">
                <thead className="bg-[var(--bg-app)] text-slate-500 text-[13px] font-semibold">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-[16px] rounded-bl-[16px]">Date & Time</th>
                    <th className="px-6 py-4 w-full">Note</th>
                    <th className="px-6 py-4 text-right rounded-tr-[16px] rounded-br-[16px]">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--bg-app)]">
                  {task.topUps.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors text-slate-900">
                      <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                        {format(new Date(t.date), 'MMM d, h:mm a')}
                      </td>
                      <td className="px-6 py-4 whitespace-normal">
                        {t.description || '-'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-indigo-600 tracking-tight whitespace-nowrap">
                        <span className="flex items-center justify-end gap-1"><ArrowRight size={14}/> {formatCurrency(t.amount)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className={`flex flex-col gap-3 ${isGeneratingPDF ? 'hidden' : 'lg:hidden'}`}>
              {task.topUps.map((t) => (
                <div key={t.id} className="bg-[var(--bg-app)] p-4 rounded-[20px] flex flex-col gap-2">
                   <div className="flex justify-between items-start gap-4">
                     <span className="font-semibold text-slate-500 text-[13px]">{format(new Date(t.date), 'MMM d, h:mm a')}</span>
                     <span className="font-bold text-indigo-600 tracking-tight flex items-center gap-1 whitespace-nowrap">
                       <ArrowRight size={14}/> {formatCurrency(t.amount)}
                     </span>
                   </div>
                   {t.description && (
                     <div className="text-[14px] font-medium text-slate-700">
                       {t.description}
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detailed Logs */}
        <div className="print-break-inside-avoid">
          <h3 className="text-[17px] font-bold text-slate-900 mb-6 tracking-tight">Detailed Expense Log</h3>
          {task.expenses.length === 0 ? (
            <p className="text-slate-500 text-[15px]">No expenses recorded for this task.</p>
          ) : (
            <>
              {/* Desktop & PDF View */}
              <div className={`rounded-[24px] ${isGeneratingPDF ? 'block' : 'overflow-x-auto hidden lg:block'}`}>
                <table className="w-full text-left text-[15px] whitespace-nowrap min-w-[600px]">
                  <thead className="bg-[var(--bg-app)] text-slate-500 text-[13px] font-semibold">
                    <tr>
                      <th className="px-6 py-4 rounded-tl-[16px] rounded-bl-[16px]">Date & Time</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4 w-full">Description</th>
                      <th className="px-6 py-4 text-right rounded-tr-[16px] rounded-br-[16px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--bg-app)]">
                    {[...task.expenses]
                      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((expense) => {
                        const info = getCategoryInfo(expense.category);
                        return (
                        <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors text-slate-900">
                          <td className="px-6 py-4 text-slate-500 font-medium whitespace-nowrap">
                            {format(new Date(expense.date), 'MMM d, h:mm a')}
                          </td>
                          <td className="px-6 py-4 font-semibold whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold", info.bgColor, info.textColor)}>
                                <info.icon size={14} />
                              </div>
                              {info.label}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-normal min-w-[200px] text-[14px]">
                            {expense.description || '-'}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold tracking-tight whitespace-nowrap">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                        )
                      })}
                    <tr className="bg-[var(--bg-app)]/50 font-bold border-t border-slate-200/60">
                      <td colSpan={3} className="px-6 py-4 text-right text-[13px] font-semibold text-slate-500 rounded-tl-[16px] rounded-bl-[16px]">Total</td>
                      <td className="px-6 py-4 text-right text-[17px] tracking-tight rounded-tr-[16px] rounded-br-[16px] whitespace-nowrap">{formatCurrency(totalSpent)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Mobile View */}
              <div className={`flex flex-col gap-3 ${isGeneratingPDF ? 'hidden' : 'lg:hidden'}`}>
                {[...task.expenses]
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((expense) => {
                    const info = getCategoryInfo(expense.category);
                    return (
                      <div key={expense.id} className="bg-[var(--bg-app)] p-4 rounded-[20px] flex flex-col gap-2">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2">
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center font-bold flex-shrink-0", info.bgColor, info.textColor)}>
                              <info.icon size={14} />
                            </div>
                            <span className="font-semibold text-slate-900">{info.label}</span>
                          </div>
                          <span className="font-bold text-slate-900 tracking-tight whitespace-nowrap">{formatCurrency(expense.amount)}</span>
                        </div>
                        <div className="flex justify-between items-end mt-1 gap-4">
                          <div className="text-[14px] font-medium text-slate-700">
                            {expense.description || 'No description'}
                          </div>
                          <div className="text-[12px] font-semibold text-slate-400 whitespace-nowrap">
                            {format(new Date(expense.date), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>
                    );
                })}
                <div className="mt-2 bg-[var(--bg-app)]/50 p-4 rounded-[16px] flex justify-between items-center">
                  <span className="text-[14px] font-bold text-slate-500 uppercase tracking-wide">Total Spent</span>
                  <span className="text-[18px] font-bold text-slate-900 tracking-tight whitespace-nowrap">{formatCurrency(totalSpent)}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Footer info for print */}
        <div className={`mt-16 pt-8 border-t border-slate-100 ${isGeneratingPDF ? 'block' : 'hidden print:block'}`}>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs text-slate-500">Employee Signature: _______________________</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Manager Approval: _______________________</p>
            </div>
          </div>
        </div>
      </div>

      {isUnlockOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={() => setIsUnlockOpen(false)}></div>
          <div className="bg-[var(--th-white)] rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 w-full max-w-sm shadow-2xl relative animate-in slide-in-from-bottom-full sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[22px] font-bold text-slate-900 leading-none">Unlock Task</h3>
              <button onClick={() => setIsUnlockOpen(false)} aria-label="Close unlock modal" className="text-slate-400 active:bg-slate-100 p-1.5 rounded-full"><X size={24}/></button>
            </div>
            <p className="text-[15px] text-slate-500 mb-6 font-medium">Enter the admin password to unlock this task for editing.</p>
            <input
              type="password"
              placeholder="Password"
              aria-label="Admin password"
              className={`w-full rounded-[16px] bg-[var(--bg-app)] border border-transparent px-4 py-4 focus:bg-[var(--th-white)] focus:border-indigo-500 outline-none transition-all text-lg font-semibold mb-2 ${pwdError ? 'ring-2 ring-red-500' : ''}`}
              value={pwd}
              onChange={(e) => { setPwd(e.target.value); setPwdError(false); }}
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                  const currentAdminPwd = (() => {
                    try {
                      const s = JSON.parse(localStorage.getItem('app_settings') || '{}');
                      return s.adminPassword || '2745';
                    } catch(e) { return '2745'; }
                  })();
                  if (pwd === currentAdminPwd) { setIsUnlockOpen(false); onUnlock(); }
                  else { setPwdError(true); }
                }
              }}
            />
            {pwdError && <p className="text-[13px] text-red-500 mb-2 font-medium ml-1">Incorrect password.</p>}
            {!pwdError && <div className="mb-2"></div>}
            
            <button
              onClick={() => {
                  const currentAdminPwd = (() => {
                    try {
                      const s = JSON.parse(localStorage.getItem('app_settings') || '{}');
                      return s.adminPassword || '2745';
                    } catch(e) { return '2745'; }
                  })();
                  if (pwd === currentAdminPwd) { setIsUnlockOpen(false); onUnlock(); }
                  else { setPwdError(true); }
              }}
              className="w-full mt-2 py-4 bg-[var(--th-inverted-bg)] active:opacity-80 text-[var(--th-inverted-text)] font-semibold rounded-[16px] transition-all shadow-[0_4px_12px_rgba(0,0,0,0.15)] text-[17px]"
            >
              Unlock
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
