export type ExpenseCategory = string;

export interface AllowanceTopUp {
  id: string;
  amount: number;
  date: string; // ISO string
  description?: string;
}

export interface Expense {
  id: string;
  taskId: string;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO string
}

export interface Task {
  id: string;
  title: string;
  initialAllowance: number;
  topUps?: AllowanceTopUp[];
  startDate: string; // ISO string
  endDate?: string;  // ISO string
  status: 'active' | 'completed';
  isUnlocked?: boolean;
  expenses: Expense[];
  deletedAt?: string; // ISO string
}

export type ViewState = 'dashboard' | 'new_task' | 'edit_task' | 'task_detail' | 'report' | 'bin' | 'settings';
