
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  FileText,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  Lock,
  Copy,
  RotateCcw,
  Flame,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Users as UsersIcon,
  Printer,
  Filter,
  X,
  Zap
} from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

const expenseTypeColors = {
  "شوێن کڕینی گەورە": "bg-purple-100 text-purple-800 border-purple-300",
  "شۆفێر بچووک": "bg-blue-100 text-blue-800 border-blue-300",
  "حەقان بچووک": "bg-cyan-100 text-cyan-800 border-cyan-300",
  "حەقان گەورە": "bg-indigo-100 text-indigo-800 border-indigo-300",
  "کڕینەوە": "bg-green-100 text-green-800 border-green-300",
  "حانیینە سنبل": "bg-orange-100 text-orange-800 border-orange-300",
  "حانیینە زاڵاق": "bg-red-100 text-red-800 border-red-300",
  "تێنکەر تاو": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "خۆی کێشی": "bg-pink-100 text-pink-800 border-pink-300"
};

const ADMIN_EMAIL = 'hershufo23@gmail.com';
const ITEMS_PER_PAGE = 20;

export default function Reports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const filterParam = searchParams.get('filter');

  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedExpenseType, setSelectedExpenseType] = useState('all');
  const [selectedCurrency, setSelectedCurrency] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState(filterParam || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpense, setEditingExpense] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showEditEmployeeDialog, setShowEditEmployeeDialog] = useState(false);
  const [showAmounts, setShowAmounts] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showDuplicates, setShowDuplicates] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [recordTypeFilter, setRecordTypeFilter] = useState('all');
  const [printColumns, setPrintColumns] = useState({
    type: true,
    record_date: true,
    name: true,
    number: true,
    category: true,
    hours: true,
    hourly_rate: true,
    amount: true,
    currency: true,
    is_paid: true,
    description: true
  });

  const [exportColumns, setExportColumns] = useState({
    type: true,
    record_date: true,
    name: true,
    number: true,
    category: true,
    hours: true,
    hourly_rate: true,
    amount: true,
    currency: true,
    is_paid: true,
    is_overtime: true,
    description: true
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (err) {
        console.error('Failed to fetch user:', err);
      }
    };
    fetchUser();

    const savedPin = localStorage.getItem('deletePin');
    if (savedPin) {
      setDeletePin(savedPin);
    }
  }, []);

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date'),
    initialData: [],
  });

  const { data: allDrivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
    initialData: [],
  });

  const { data: allExpenseTypes = [] } = useQuery({
    queryKey: ['expenseTypes'],
    queryFn: () => base44.entities.ExpenseType.list(),
    initialData: [],
  });

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const { data: printTemplates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['printTemplates'],
    queryFn: () => base44.entities.PrintTemplate.list(),
    initialData: [],
    staleTime: 0, // Always consider data stale
    cacheTime: 0,  // Do not cache data for this query
  });

  const { data: appSettings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSetting.list(),
    initialData: [],
  });

  const expenses = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') return allExpenses;
    return allExpenses.filter(exp => exp.created_by === currentUser.email);
  }, [allExpenses, currentUser]);

  const drivers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') return allDrivers;
    return allDrivers.filter(d => d.created_by === currentUser.email);
  }, [allDrivers, currentUser]);

  const expenseTypes = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') return allExpenseTypes;
    return allExpenseTypes.filter(t => t.created_by === currentUser.email);
  }, [allExpenseTypes, currentUser]);

  const employees = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') return allEmployees;
    return allEmployees.filter(emp => emp.created_by === currentUser.email);
  }, [allEmployees, currentUser]);

  // Get all available months from both expenses and employees
  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    
    // Add months from expenses
    expenses.forEach(exp => {
      const date = new Date(exp.expense_date);
      monthsSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    
    // Add months from employees
    employees.forEach(emp => {
      if (emp.assigned_months && Array.isArray(emp.assigned_months)) {
        emp.assigned_months.forEach(month => monthsSet.add(month));
      }
    });
    
    return Array.from(monthsSet).sort().reverse();
  }, [expenses, employees]);

  // Get months with data indicators
  const monthsWithData = useMemo(() => {
    return availableMonths.map(month => {
      const hasExpenses = expenses.some(exp => {
        const expDate = new Date(exp.expense_date);
        const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
        return expMonth === month;
      });
      
      const hasEmployees = employees.some(emp => {
        return emp.assigned_months && emp.assigned_months.includes(month);
      });
      
      return {
        value: month,
        hasExpenses,
        hasEmployees
      };
    });
  }, [availableMonths, expenses, employees]);

  const activeExpenses = useMemo(() => {
    return expenses.filter(exp => !exp.is_deleted);
  }, [expenses]);

  const deletedExpenses = useMemo(() => {
    return expenses.filter(exp => exp.is_deleted);
  }, [expenses]);

  const activeEmployees = useMemo(() => {
    return employees.filter(emp => !emp.is_deleted);
  }, [employees]);

  const deletedEmployees = useMemo(() => {
    return employees.filter(emp => emp.is_deleted);
  }, [employees]);

  const duplicateGroups = useMemo(() => {
    const groups = {};
    activeExpenses.forEach(exp => {
      const key = `${exp.expense_date}-${exp.driver_name}-${exp.amount}-${exp.expense_type}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(exp);
    });
    return Object.values(groups).filter(group => group.length > 1);
  }, [activeExpenses]);

  const filteredRecords = useMemo(() => {
    const baseExpenseList = showDeleted ? deletedExpenses : activeExpenses;
    const baseEmployeeList = showDeleted ? deletedEmployees : activeEmployees;
    
    let filteredExpenses = baseExpenseList.filter(exp => {
      // Month filter
      if (selectedMonth !== 'all') {
        const expDate = new Date(exp.expense_date);
        const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
        if (expMonth !== selectedMonth) return false;
      }

      // Currency filter - when USD/IQD selected, ignore driver and expense type filters
      if (selectedCurrency !== 'all') {
        const expCurrency = (exp.currency || 'IQD').toUpperCase();
        const selectedCur = selectedCurrency.toUpperCase();
        if (expCurrency !== selectedCur) return false;
      } else {
        // Only apply driver and expense type filters when currency is 'all'
        if (selectedDriver !== 'all' && exp.driver_id !== selectedDriver) return false;
        if (selectedExpenseType !== 'all' && exp.expense_type !== selectedExpenseType) return false;
      }

      // Payment status filter
      if (paymentFilter === 'paid' && !exp.is_paid) return false;
      if (paymentFilter === 'unpaid' && exp.is_paid) return false;

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDriver = exp.driver_name?.toLowerCase().includes(query);
        const matchesNumber = exp.driver_number?.toString().includes(query);
        const matchesType = exp.expense_type?.toLowerCase().includes(query);
        const matchesDescription = exp.description?.toLowerCase().includes(query);
        if (!matchesDriver && !matchesNumber && !matchesType && !matchesDescription) return false;
      }

      return true;
    });

    let filteredEmployees = baseEmployeeList;

    // IMPORTANT: If driver or expense type filter is active, HIDE ALL employees
    // Because employees don't have drivers or expense types!
    if (selectedDriver !== 'all' || selectedExpenseType !== 'all') {
      filteredEmployees = []; // Hide all employees when driver/expense type filter is active
    } else {
      // Only filter employees when driver/expense type filters are NOT active
      
      // Filter employees by month
      if (selectedMonth !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => {
          const assignedMonths = emp.assigned_months;
          if (!assignedMonths || !Array.isArray(assignedMonths) || assignedMonths.length === 0) {
            return false;
          }
          return assignedMonths.includes(selectedMonth);
        });
      }

      // Filter employees by currency
      if (selectedCurrency !== 'all') {
        filteredEmployees = filteredEmployees.filter(emp => {
          const empCurrency = (emp.currency || 'IQD').toUpperCase();
          const selectedCur = selectedCurrency.toUpperCase();
          return empCurrency === selectedCur;
        });
      }

      // Payment status filter for employees
      if (paymentFilter === 'paid') {
        filteredEmployees = filteredEmployees.filter(emp => emp.is_paid);
      }
      if (paymentFilter === 'unpaid') {
        filteredEmployees = filteredEmployees.filter(emp => !emp.is_paid);
      }

      // Search filter for employees
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredEmployees = filteredEmployees.filter(emp => {
          const matchesName = emp.employee_name?.toLowerCase().includes(query);
          const matchesNumber = emp.employee_number?.toString().includes(query);
          const matchesDescription = emp.description?.toLowerCase().includes(query);
          return matchesName || matchesNumber || matchesDescription;
        });
      }
    }

    return { filteredExpenses, filteredEmployees };
  }, [activeExpenses, deletedExpenses, activeEmployees, deletedEmployees, showDeleted, selectedMonth, selectedDriver, selectedExpenseType, selectedCurrency, paymentFilter, searchQuery]);

  // Merge expenses and employees into one unified list for display
  const displayRecords = useMemo(() => {
    let records = [];
    
    // Add ALL filtered expenses (don't filter by selection)
    records = filteredRecords.filteredExpenses.map(exp => ({
      ...exp,
      type: 'expense',
      record_date: exp.expense_date,
      name: exp.driver_name || '-',
      number: exp.driver_number || '-',
      category: exp.expense_type,
      hours: exp.hours || '-',
      hourly_rate: exp.hourly_rate || '-',
      amount: exp.amount || 0,
      currency: exp.currency || 'IQD',
      is_paid: exp.is_paid,
      is_overtime: exp.is_overtime || false, // Add is_overtime here
      description: exp.description || '-'
    }));
    
    // Add ALL filtered employees (don't filter by selection)
    const employeeRecords = filteredRecords.filteredEmployees.map(emp => ({
      ...emp,
      type: 'employee',
      record_date: emp.payment_date || '-',
      name: emp.employee_name,
      number: emp.employee_number,
      category: 'مووچەی کارمەند',
      hours: '-',
      hourly_rate: '-',
      amount: emp.salary || 0,
      currency: emp.currency || 'IQD',
      is_paid: emp.is_paid || false,
      is_overtime: false, // Employees don't have overtime
      description: 'مووچە'
    }));
    records = [...records, ...employeeRecords];
    
    // Filter by record type
    if (recordTypeFilter !== 'all') {
      records = records.filter(rec => rec.type === recordTypeFilter);
    }
    
    // Sort by date
    return records.sort((a, b) => {
      const dateA = new Date(a.record_date);
      const dateB = new Date(b.record_date);
      return dateB - dateA;
    });
  }, [filteredRecords.filteredExpenses, filteredRecords.filteredEmployees, recordTypeFilter]);

  // Paginate merged records
  const totalPages = Math.ceil(displayRecords.length / itemsPerPage);
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return displayRecords.slice(startIndex, endIndex);
  }, [displayRecords, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedDriver, selectedExpenseType, selectedCurrency, paymentFilter, searchQuery, showDeleted, recordTypeFilter]);

  // Update totals to use displayRecords
  const totalExpensesIQD = useMemo(() => {
    return displayRecords.filter(rec => (rec.currency || 'IQD').toUpperCase() === 'IQD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const totalExpensesUSD = useMemo(() => {
    return displayRecords.filter(rec => (rec.currency || 'IQD').toUpperCase() === 'USD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const paidExpensesIQD = useMemo(() => {
    return displayRecords.filter(rec => rec.is_paid && ((rec.currency || 'IQD').toUpperCase() === 'IQD')).reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const paidExpensesUSD = useMemo(() => {
    return displayRecords.filter(rec => rec.is_paid && ((rec.currency || 'IQD').toUpperCase() === 'USD')).reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const unpaidExpensesIQD = useMemo(() => {
    return displayRecords.filter(rec => !rec.is_paid && ((rec.currency || 'IQD').toUpperCase() === 'IQD')).reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const unpaidExpensesUSD = useMemo(() => {
    return displayRecords.filter(rec => !rec.is_paid && ((rec.currency || 'IQD').toUpperCase() === 'USD')).reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const totalHours = useMemo(() => {
    return displayRecords.filter(rec => rec.type === 'expense').reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0);
  }, [displayRecords]);

  const overtimeHours = useMemo(() => {
    return displayRecords.filter(rec => rec.type === 'expense' && rec.is_overtime).reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0);
  }, [displayRecords]);

  const overtimeExpensesCount = useMemo(() => {
    return displayRecords.filter(rec => rec.type === 'expense' && rec.is_overtime).length;
  }, [displayRecords]);

  const overtimeAmountIQD = useMemo(() => {
    return displayRecords.filter(rec => rec.type === 'expense' && rec.is_overtime && (rec.currency || 'IQD').toUpperCase() === 'IQD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const overtimeAmountUSD = useMemo(() => {
    return displayRecords.filter(rec => rec.type === 'expense' && rec.is_overtime && (rec.currency || 'IQD').toUpperCase() === 'USD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
  }, [displayRecords]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 'all') return;
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex < availableMonths.length - 1) {
      setSelectedMonth(availableMonths[currentIndex + 1]);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 'all') return;
    const currentIndex = availableMonths.indexOf(selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(availableMonths[currentIndex - 1]);
    }
  };

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Expense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setShowEditDialog(false);
      setEditingExpense(null);
      setSelectedExpenses([]);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.Expense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSelectedExpenses([]);
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setShowEditEmployeeDialog(false);
      setEditingEmployee(null);
      setSelectedEmployees([]);
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSelectedEmployees([]);
    },
  });

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees(prev => {
      if (prev.includes(employeeId)) {
        return prev.filter(id => id !== employeeId);
      } else {
        return [...prev, employeeId];
      }
    });
  };

  const handleSelectAll = () => {
    // Get only the records currently visible (after filters, before pagination)
    const expensesOnDisplay = displayRecords.filter(rec => rec.type === 'expense').map(rec => rec.id);
    const employeesOnDisplay = displayRecords.filter(rec => rec.type === 'employee').map(rec => rec.id);

    // Check if all visible records are already selected
    const allVisibleExpensesSelected = expensesOnDisplay.length > 0 && expensesOnDisplay.every(id => selectedExpenses.includes(id));
    const allVisibleEmployeesSelected = employeesOnDisplay.length > 0 && employeesOnDisplay.every(id => selectedEmployees.includes(id));

    if (allVisibleExpensesSelected && allVisibleEmployeesSelected && (expensesOnDisplay.length > 0 || employeesOnDisplay.length > 0)) {
      // All visible are selected -> Unselect all
      setSelectedExpenses([]);
      setSelectedEmployees([]);
    } else {
      // Select all visible (only what's filtered/displayed, not all in database)
      setSelectedExpenses(expensesOnDisplay);
      setSelectedEmployees(employeesOnDisplay);
    }
  };

  const areAllDisplayedRecordsSelected = useMemo(() => {
    if (displayRecords.length === 0) return false;

    const expensesOnDisplay = displayRecords.filter(rec => rec.type === 'expense').map(rec => rec.id);
    const employeesOnDisplay = displayRecords.filter(rec => rec.type === 'employee').map(rec => rec.id);

    const allExpensesSelected = expensesOnDisplay.length > 0 && expensesOnDisplay.every(id => selectedExpenses.includes(id));
    const allEmployeesSelected = employeesOnDisplay.length > 0 && employeesOnDisplay.every(id => selectedEmployees.includes(id));

    // If there are no expenses, only check employees
    if (expensesOnDisplay.length === 0) return allEmployeesSelected;
    // If there are no employees, only check expenses
    if (employeesOnDisplay.length === 0) return allExpensesSelected;
    // If both exist, both must be selected
    return allExpensesSelected && allEmployeesSelected;
  }, [displayRecords, selectedExpenses, selectedEmployees]);


  const handleBulkSoftDelete = () => {
    if (selectedExpenses.length > 0 && window.confirm(`دڵنیایت لە سڕینەوەی ${selectedExpenses.length} خەرجی؟`)) {
      selectedExpenses.forEach(id => {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
          updateExpenseMutation.mutate({
            id,
            data: { ...expense, is_deleted: true }
          });
        }
      });
    }
    if (selectedEmployees.length > 0 && window.confirm(`دڵنیایت لە سڕینەوەی ${selectedEmployees.length} کارمەند؟`)) {
      selectedEmployees.forEach(id => {
        const employee = employees.find(e => e.id === id);
        if (employee) {
          updateEmployeeMutation.mutate({
            id,
            data: { ...employee, is_deleted: true }
          });
        }
      });
    }
  };

  const handleBulkRecover = () => {
    if (selectedExpenses.length > 0) {
      selectedExpenses.forEach(id => {
        const expense = expenses.find(e => e.id === id);
        if (expense) {
          updateExpenseMutation.mutate({
            id,
            data: { ...expense, is_deleted: false }
          });
        }
      });
    }
    if (selectedEmployees.length > 0) {
      selectedEmployees.forEach(id => {
        const employee = employees.find(e => e.id === id);
        if (employee) {
          updateEmployeeMutation.mutate({
            id,
            data: { ...employee, is_deleted: false }
          });
        }
      });
    }
  };

  const handleBulkPermanentDelete = () => {
    const savedPin = localStorage.getItem('deletePin');
    if (!savedPin) {
      alert('تکایە یەکەم جار پینکۆد دابنێ لە ڕێکخستنەکان');
      return;
    }

    const enteredPin = prompt('تکایە پینکۆد بنووسە بۆ سڕینەوەی هەمیشەیی:');
    if (enteredPin === savedPin) {
      if (selectedExpenses.length > 0 && window.confirm(`دڵنیایت لە سڕینەوەی هەمیشەیی ${selectedExpenses.length} خەرجی؟ ئەم کردارە ناگەڕێتەوە!`)) {
        selectedExpenses.forEach(id => {
          deleteExpenseMutation.mutate(id);
        });
      }
      if (selectedEmployees.length > 0 && window.confirm(`دڵنیایت لە سڕینەوەی هەمیشەیی ${selectedEmployees.length} کارمەند؟ ئەم کردارە ناگەڕێتەوە!`)) {
        selectedEmployees.forEach(id => {
          deleteEmployeeMutation.mutate(id);
        });
      }
    } else {
      alert('پینکۆد هەڵەیە!');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense({
      ...expense,
      hours: expense.hours || '',
      hourly_rate: expense.hourly_rate || '',
      amount: expense.amount || 0,
      description: expense.description || '',
      is_overtime: expense.is_overtime || false // Initialize is_overtime
    });
    setShowEditDialog(true);
  };

  const handleDelete = (id) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      updateExpenseMutation.mutate({
        id,
        data: { ...expense, is_deleted: true }
      });
    }
  };

  const handleRecover = (id) => {
    const expense = expenses.find(e => e.id === id);
    if (expense) {
      updateExpenseMutation.mutate({
        id,
        data: { ...expense, is_deleted: false }
      });
    }
  };

  const handlePermanentDelete = (id) => {
    const savedPin = localStorage.getItem('deletePin');
    if (!savedPin) {
      alert('تکایە یەکەم جار پینکۆد دابنێ لە ڕێکخستنەکان');
      return;
    }

    const enteredPin = prompt('تکایە پینکۆد بنووسە بۆ سڕینەوەی هەمیشەیی:');
    if (enteredPin === savedPin) {
      if (window.confirm('دڵنیایت؟ ئەم کردارە ناگەڕێتەوە!')) {
        deleteExpenseMutation.mutate(id);
      }
    } else {
      alert('پینکۆد هەڵەیە!');
    }
  };

  const handleTogglePaid = (expense) => {
    updateExpenseMutation.mutate({
      id: expense.id,
      data: {
        ...expense,
        is_paid: !expense.is_paid
      }
    });
  };

  const handleEditEmployee = (employee) => {
    setEditingEmployee({
      ...employee,
      salary: employee.salary || 0,
      payment_date: employee.payment_date || format(new Date(), 'yyyy-MM-dd'),
      is_paid: employee.is_paid || false
    });
    setShowEditEmployeeDialog(true);
  };

  const handleSaveEmployeeEdit = () => {
    if (!editingEmployee) return;

    updateEmployeeMutation.mutate({
      id: editingEmployee.id,
      data: {
        employee_name: editingEmployee.employee_name,
        employee_number: editingEmployee.employee_number,
        salary: parseFloat(editingEmployee.salary),
        currency: editingEmployee.currency || 'IQD',
        payment_date: editingEmployee.payment_date,
        is_paid: editingEmployee.is_paid,
        assigned_months: editingEmployee.assigned_months || []
      }
    });
  };

  const handleDeleteEmployee = (id) => {
    const employee = employees.find(e => e.id === id);
    if (employee) {
      updateEmployeeMutation.mutate({
        id,
        data: { ...employee, is_deleted: true }
      });
    }
  };

  const handleRecoverEmployee = (id) => {
    const employee = employees.find(e => e.id === id);
    if (employee) {
      updateEmployeeMutation.mutate({
        id,
        data: { ...employee, is_deleted: false }
      });
    }
  };

  const handlePermanentDeleteEmployee = (id) => {
    const savedPin = localStorage.getItem('deletePin');
    if (!savedPin) {
      alert('تکایە یەکەم جار پینکۆد دابنێ لە ڕێکخستنەکان');
      return;
    }

    const enteredPin = prompt('تکایە پینکۆد بنووسە بۆ سڕینەوەی هەمیشەیی:');
    if (enteredPin === savedPin) {
      if (window.confirm('دڵنیایت؟ ئەم کردارە ناگەڕێتەوە!')) {
        deleteEmployeeMutation.mutate(id);
      }
    } else {
      alert('پینکۆد هەڵەیە!');
    }
  };

  const handleTogglePaidEmployee = (employee) => {
    updateEmployeeMutation.mutate({
      id: employee.id,
      data: {
        ...employee,
        is_paid: !employee.is_paid
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editingExpense) return;

    const originalExpense = expenses.find(e => e.id === editingExpense.id);
    const driverNameChanged = originalExpense.driver_name !== editingExpense.driver_name;

    await updateExpenseMutation.mutateAsync({
      id: editingExpense.id,
      data: {
        expense_date: editingExpense.expense_date,
        driver_id: editingExpense.driver_id || undefined,
        driver_name: editingExpense.driver_name || undefined,
        driver_number: editingExpense.driver_number || undefined,
        expense_type: editingExpense.expense_type,
        hours: editingExpense.hours ? parseFloat(editingExpense.hours) : undefined,
        hourly_rate: editingExpense.hourly_rate ? parseFloat(editingExpense.hourly_rate) : undefined,
        amount: parseFloat(editingExpense.amount),
        currency: editingExpense.currency || 'IQD',
        is_paid: editingExpense.is_paid,
        is_overtime: editingExpense.is_overtime, // Include is_overtime
        description: editingExpense.description || undefined
      }
    });

    if (driverNameChanged && editingExpense.driver_id) {
      const expensesWithSameDriver = expenses.filter(
        exp => exp.driver_id === editingExpense.driver_id && exp.id !== editingExpense.id
      );

      for (const exp of expensesWithSameDriver) {
        await updateExpenseMutation.mutateAsync({
          id: exp.id,
          data: {
            ...exp,
            driver_name: editingExpense.driver_name
          }
        });
      }
    }
  };

  const handleSaveDeletePin = () => {
    if (deletePin.length >= 4) {
      localStorage.setItem('deletePin', deletePin);
      alert('پینکۆد بە سەرکەوتوویی هەڵگیرا!');
    } else {
      alert('پینکۆد دەبێت لانیکەم 4 ژمارە بێت');
    }
  };

  const formatCurrency = (amount) => {
    if (!showAmounts) return '***';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getSettingValue = (key, defaultValue = '') => {
    const setting = appSettings.find(s => s.setting_key === key);
    return setting ? setting.setting_value : defaultValue;
  };

  const getPrintSettingValue = (key, defaultValue = '') => {
    const setting = appSettings.find(s => s.setting_key === `print_${key}`);
    return setting ? setting.setting_value : defaultValue;
  };

  const handlePrintExpense = async (expense) => {
    // Refetch templates to ensure we have the latest default
    await refetchTemplates();
    
    // Use bulk report template for consistency
    const defaultTemplate = printTemplates.find(t => t.template_type === 'bulk_report' && t.is_default);
    
    if (!defaultTemplate) {
      alert('هیچ تێمپلەیتێکی بنەڕەتی نەدۆزرایەوە بۆ ڕاپۆرتی گشتی');
      return;
    }

    const companyName = getPrintSettingValue('header_company_name', 'نەسرەدین رۆژبەیانی');
    const companyTagline = getPrintSettingValue('header_tagline', 'کۆمپانیای کرێی ئامێرەکان');
    const logoUrl = getPrintSettingValue('header_logo_url', '');
    const logoSize = getPrintSettingValue('header_logo_size', '60');
    const logoPosition = getPrintSettingValue('header_logo_position', 'top');

    // Convert single expense to record format
    const record = {
      ...expense,
      type: 'expense',
      record_date: expense.expense_date,
      name: expense.driver_name || '-',
      number: expense.driver_number || '-',
      category: expense.expense_type,
      hours: expense.hours || '-',
      hourly_rate: expense.hourly_rate || '-',
      amount: expense.amount || 0,
      currency: expense.currency || 'IQD',
      is_paid: expense.is_paid,
      is_overtime: expense.is_overtime || false, // Pass is_overtime
      description: expense.description || '-'
    };

    const columnMap = {
      type: 'جۆر',
      record_date: 'بەروار',
      name: 'ناو',
      number: 'ژمارە',
      category: 'جۆری خەرجی',
      hours: 'کاتژمێر',
      hourly_rate: 'کرێی کاتژمێر',
      amount: 'بڕی پارە',
      currency: 'دراو',
      is_paid: 'پارەدراوە',
      description: 'تێبینی'
    };

    const selectedColumnKeys = ['type', 'record_date', 'name', 'number', 'category', 'hours', 'hourly_rate', 'amount', 'currency', 'is_paid', 'description'];
    const headers = selectedColumnKeys.map(key => columnMap[key]);

    // Build single row
    const cells = selectedColumnKeys.map(key => {
      if (key === 'type') return record.is_overtime ? 'خەرجی زیادە' : 'خەرجی';
      if (key === 'record_date') return record.record_date;
      if (key === 'name') return record.name;
      if (key === 'number') return record.number;
      if (key === 'category') return record.category;
      if (key === 'hours') return record.hours === '-' ? '-' : record.hours;
      if (key === 'hourly_rate') return record.hourly_rate === '-' ? '-' : formatCurrency(record.hourly_rate);
      if (key === 'amount') return formatCurrency(record.amount);
      if (key === 'currency') return record.currency;
      if (key === 'is_paid') return record.is_paid ? '✓ دراوە' : '✗ نەدراوە';
      if (key === 'description') return record.description;
      return '';
    });

    let headerHtml = `<div class="company-name">${companyName}</div><div class="report-title">وەسڵ ${expense.expense_type}</div><div class="report-period">${expense.expense_date}</div>`;
    
    if (logoUrl) {
      if (logoPosition === 'top') {
        headerHtml = `<div style="text-align: center; margin-bottom: 15px;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 200px; object-fit: contain;" /></div>${headerHtml}`;
      } else if (logoPosition === 'right') {
        headerHtml = `<div style="display: flex; align-items: center; justify-content: space-between;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 150px; object-fit: contain;" /><div style="flex: 1; text-align: center;">${headerHtml}</div></div>`;
      } else if (logoPosition === 'left') {
        headerHtml = `<div style="display: flex; align-items: center; justify-content: space-between; flex-direction: row-reverse;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 150px; object-fit: contain;" /><div style="flex: 1; text-align: center;">${headerHtml}</div></div>`;
      }
    }

    let html = defaultTemplate.html_content
      .replace(/<div class="header">[\s\S]*?<\/div>/, `<div class="header">${headerHtml}</div>`)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{company_tagline\}\}/g, companyTagline)
      .replace(/\{\{report_period\}\}/g, expense.expense_date)
      .replace(/\{\{print_date\}\}/g, format(new Date(), 'yyyy-MM-dd • HH:mm'))
      .replace(/\{\{total_records\}\}/g, '1')
      .replace(/\{\{total_iqd\}\}/g, record.currency === 'IQD' ? formatCurrency(record.amount) : '0')
      .replace(/\{\{total_usd\}\}/g, record.currency === 'USD' ? formatCurrency(record.amount) : '0')
      .replace(/\{\{total_hours\}\}/g, record.hours === '-' ? '0.0' : parseFloat(record.hours).toFixed(1));

    // Replace table headers
    const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
    html = html.replace(/\{\{table_headers\}\}/g, headersHtml);

    // Replace table row
    const rowHtml = `
      <tr>
        ${cells.map((cell, idx) => {
          const key = selectedColumnKeys[idx];
          if (key === 'record_date') return `<td><strong>${cell}</strong></td>`;
          if (key === 'amount') return `<td><strong style="color: ${record.is_overtime ? '#f59e0b' : '#059669'};">${cell}</strong></td>`;
          if (key === 'is_paid') return `<td><span class="status-badge ${record.is_paid ? 'status-paid' : 'status-unpaid'}">${cell}</span></td>`;
          return `<td>${cell}</td>`;
        }).join('')}
      </tr>
    `;
    html = html.replace(/\{\{table_rows\}\}/g, rowHtml);

    // Add total row
    const totalCells = selectedColumnKeys.map(key => {
      if (key === 'type') return 'کۆی گشتی';
      if (key === 'hours') return record.hours === '-' ? '-' : record.hours;
      if (key === 'amount') return formatCurrency(record.amount);
      if (key === 'currency') return record.currency;
      return '';
    });
    
    const totalRowHtml = `
      <tr class="total-row">
        ${totalCells.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `;
    html = html.replace(/\{\{total_rows\}\}/g, totalRowHtml);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>وەسڵ - ${expense.expense_type}</title>
        <style>
          ${defaultTemplate.css_content || ''}
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintEmployee = async (employee) => {
    // Refetch templates to ensure we have the latest default
    await refetchTemplates();
    
    // Use bulk report template for consistency
    const defaultTemplate = printTemplates.find(t => t.template_type === 'bulk_report' && t.is_default);
    
    if (!defaultTemplate) {
      alert('هیچ تێمپلەیتێکی بنەڕەتی نەدۆزرایەوە بۆ ڕاپۆرتی گشتی');
      return;
    }

    const companyName = getPrintSettingValue('header_company_name', 'نەسرەدین رۆژبەیانی');
    const companyTagline = getPrintSettingValue('header_tagline', 'کۆمپانیای کرێی ئامێرەکان');
    const logoUrl = getPrintSettingValue('header_logo_url', '');
    const logoSize = getPrintSettingValue('header_logo_size', '60');
    const logoPosition = getPrintSettingValue('header_logo_position', 'top');

    // Convert single employee to record format
    const record = {
      ...employee,
      type: 'employee',
      record_date: employee.payment_date,
      name: employee.employee_name,
      number: employee.employee_number,
      category: 'مووچەی کارمەند',
      hours: '-',
      hourly_rate: '-',
      amount: employee.salary || 0,
      currency: employee.currency || 'IQD',
      is_paid: employee.is_paid || false,
      description: 'مووچە'
    };

    const columnMap = {
      type: 'جۆر',
      record_date: 'بەروار',
      name: 'ناو',
      number: 'ژمارە',
      category: 'جۆری خەرجی/مووچە',
      hours: 'کاتژمێر',
      hourly_rate: 'کرێی کاتژمێر',
      amount: 'بڕی پارە',
      currency: 'دراو',
      is_paid: 'پارەدراوە',
      description: 'تێبینی'
    };

    const selectedColumnKeys = ['type', 'record_date', 'name', 'number', 'category', 'hours', 'hourly_rate', 'amount', 'currency', 'is_paid', 'description'];
    const headers = selectedColumnKeys.map(key => columnMap[key]);

    // Build single row
    const cells = selectedColumnKeys.map(key => {
      if (key === 'type') return 'کارمەند';
      if (key === 'record_date') return record.record_date;
      if (key === 'name') return record.name;
      if (key === 'number') return record.number;
      if (key === 'category') return record.category;
      if (key === 'hours') return '-';
      if (key === 'hourly_rate') return '-';
      if (key === 'amount') return formatCurrency(record.amount);
      if (key === 'currency') return record.currency;
      if (key === 'is_paid') return record.is_paid ? '✓ دراوە' : '✗ نەدراوە';
      if (key === 'description') return record.description;
      return '';
    });

    let headerHtml = `<div class="company-name">${companyName}</div><div class="report-title">وەسڵ مووچەی کارمەند</div><div class="report-period">${employee.payment_date}</div>`;
    
    if (logoUrl) {
      if (logoPosition === 'top') {
        headerHtml = `<div style="text-align: center; margin-bottom: 15px;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 200px; object-fit: contain;" /></div>${headerHtml}`;
      } else if (logoPosition === 'right') {
        headerHtml = `<div style="display: flex; align-items: center; justify-content: space-between;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 150px; object-fit: contain;" /><div style="flex: 1; text-align: center;">${headerHtml}</div></div>`;
      } else if (logoPosition === 'left') {
        headerHtml = `<div style="display: flex; align-items: center; justify-content: space-between; flex-direction: row-reverse;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 150px; object-fit: contain;" /><div style="flex: 1; text-align: center;">${headerHtml}</div></div>`;
      }
    }

    let html = defaultTemplate.html_content
      .replace(/<div class="header">[\s\S]*?<\/div>/, `<div class="header">${headerHtml}</div>`)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{company_tagline\}\}/g, companyTagline)
      .replace(/\{\{report_period\}\}/g, employee.payment_date)
      .replace(/\{\{print_date\}\}/g, format(new Date(), 'yyyy-MM-dd • HH:mm'))
      .replace(/\{\{total_records\}\}/g, '1')
      .replace(/\{\{total_iqd\}\}/g, record.currency === 'IQD' ? formatCurrency(record.amount) : '0')
      .replace(/\{\{total_usd\}\}/g, record.currency === 'USD' ? formatCurrency(record.amount) : '0')
      .replace(/\{\{total_hours\}\}/g, '0.0');

    // Replace table headers
    const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
    html = html.replace(/\{\{table_headers\}\}/g, headersHtml);

    // Replace table row
    const rowHtml = `
      <tr class="employee-row">
        ${cells.map((cell, idx) => {
          const key = selectedColumnKeys[idx];
          if (key === 'record_date') return `<td><strong>${cell}</strong></td>`;
          if (key === 'amount') return `<td><strong style="color: #6366f1;">${cell}</strong></td>`;
          if (key === 'is_paid') return `<td><span class="status-badge ${record.is_paid ? 'status-paid' : 'status-unpaid'}">${cell}</span></td>`;
          return `<td>${cell}</td>`;
        }).join('')}
      </tr>
    `;
    html = html.replace(/\{\{table_rows\}\}/g, rowHtml);

    // Add total row
    const totalCells = selectedColumnKeys.map(key => {
      if (key === 'type') return 'کۆی گشتی';
      if (key === 'amount') return formatCurrency(record.amount);
      if (key === 'currency') return record.currency;
      return '';
    });
    
    const totalRowHtml = `
      <tr class="total-row">
        ${totalCells.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `;
    html = html.replace(/\{\{total_rows\}\}/g, totalRowHtml);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>وەسڵ - مووچەی کارمەند</title>
        <style>
          ${defaultTemplate.css_content || ''}
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const exportToExcel = () => {
    const recordsToExport = selectedExpenses.length > 0 || selectedEmployees.length > 0
      ? displayRecords.filter(rec => (rec.type === 'expense' && selectedExpenses.includes(rec.id)) || (rec.type === 'employee' && selectedEmployees.includes(rec.id)))
      : displayRecords;

    const columnMap = {
      type: 'جۆر',
      record_date: 'بەروار',
      name: 'ناو',
      number: 'ژمارە',
      category: 'جۆری خەرجی/مووچە',
      hours: 'کاتژمێر',
      hourly_rate: 'کرێی کاتژمێر',
      amount: 'بڕی پارە',
      currency: 'دراو',
      is_paid: 'پارەدراوە',
      is_overtime: 'کاتژمێری زیادە', // Add to map
      description: 'تێبینی'
    };

    const selectedColumnKeys = Object.keys(exportColumns)
      .filter(key => exportColumns[key])
      .reverse();

    const headers = selectedColumnKeys.map(key => columnMap[key]);

    const rows = recordsToExport.map(rec => {
      const row = [];
      selectedColumnKeys.forEach(key => {
        if (key === 'record_date') row.push(rec.record_date);
        else if (key === 'type') row.push(rec.type === 'expense' ? 'خەرجی' : 'کارمەند');
        else if (key === 'name') row.push(rec.name || '');
        else if (key === 'number') row.push(rec.number || '');
        else if (key === 'category') row.push(rec.category || '');
        else if (key === 'hours') row.push(rec.hours === '-' ? '' : rec.hours || '');
        else if (key === 'hourly_rate') row.push(rec.hourly_rate === '-' ? '' : rec.hourly_rate || '');
        else if (key === 'amount') row.push(rec.amount || 0);
        else if (key === 'currency') row.push(rec.currency || 'IQD');
        else if (key === 'is_paid') row.push(rec.is_paid ? 'بەڵێ' : 'نەخێر');
        else if (key === 'is_overtime') row.push(rec.is_overtime ? 'بەڵێ' : 'نەخێر'); // Add to export
        else if (key === 'description') row.push(rec.description || '');
      });
      return row;
    });

    if (exportColumns.amount) {
      const totalIQD = recordsToExport.filter(rec => (rec.currency || 'IQD').toUpperCase() === 'IQD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
      const totalUSD = recordsToExport.filter(rec => (rec.currency || 'IQD').toUpperCase() === 'USD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
      const totalHoursExport = recordsToExport.filter(rec => rec.type === 'expense').reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0);
      const totalOvertimeHoursExport = recordsToExport.filter(rec => rec.type === 'expense' && rec.is_overtime).reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0);
      const totalOvertimeAmountIQD = recordsToExport.filter(rec => rec.type === 'expense' && rec.is_overtime && (rec.currency || 'IQD').toUpperCase() === 'IQD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
      const totalOvertimeAmountUSD = recordsToExport.filter(rec => rec.type === 'expense' && rec.is_overtime && (rec.currency || 'IQD').toUpperCase() === 'USD').reduce((sum, rec) => sum + (rec.amount || 0), 0);


      rows.push([]); // Empty row for separation

      const amountIndex = selectedColumnKeys.indexOf('amount');
      const currencyIndex = selectedColumnKeys.indexOf('currency');
      const hoursIndex = selectedColumnKeys.indexOf('hours');
      const labelIndex = selectedColumnKeys.indexOf('type') > -1 ? selectedColumnKeys.indexOf('type') : 0;

      // IQD total row
      const totalRowIQD = Array(selectedColumnKeys.length).fill('');
      if (amountIndex !== -1) totalRowIQD[amountIndex] = totalIQD;
      if (currencyIndex !== -1) totalRowIQD[currencyIndex] = 'IQD';
      if (hoursIndex !== -1) totalRowIQD[hoursIndex] = totalHoursExport.toFixed(1);
      totalRowIQD[labelIndex] = 'کۆی گشتی';
      rows.push(totalRowIQD);

      // USD total row
      if (totalUSD > 0) {
        const totalRowUSD = Array(selectedColumnKeys.length).fill('');
        if (amountIndex !== -1) totalRowUSD[amountIndex] = totalUSD;
        if (currencyIndex !== -1) totalRowUSD[currencyIndex] = 'USD';
        totalRowUSD[labelIndex] = 'کۆی گشتی';
        rows.push(totalRowUSD);
      }

      // Overtime Total Hours
      if (totalOvertimeHoursExport > 0) {
        const overtimeHoursRow = Array(selectedColumnKeys.length).fill('');
        if (hoursIndex !== -1) overtimeHoursRow[hoursIndex] = totalOvertimeHoursExport.toFixed(1);
        overtimeHoursRow[labelIndex] = 'کۆی کاتژمێری زیادە';
        rows.push(overtimeHoursRow);
      }

      // Overtime Total IQD
      if (totalOvertimeAmountIQD > 0) {
        const overtimeIQDrow = Array(selectedColumnKeys.length).fill('');
        if (amountIndex !== -1) overtimeIQDrow[amountIndex] = totalOvertimeAmountIQD;
        if (currencyIndex !== -1) overtimeIQDrow[currencyIndex] = 'IQD';
        overtimeIQDrow[labelIndex] = 'کۆی زیادە (IQD)';
        rows.push(overtimeIQDrow);
      }

      // Overtime Total USD
      if (totalOvertimeAmountUSD > 0) {
        const overtimeUSDrow = Array(selectedColumnKeys.length).fill('');
        if (amountIndex !== -1) overtimeUSDrow[amountIndex] = totalOvertimeAmountUSD;
        if (currencyIndex !== -1) overtimeUSDrow[currencyIndex] = 'USD';
        overtimeUSDrow[labelIndex] = 'کۆی زیادە (USD)';
        rows.push(overtimeUSDrow);
      }
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const RTL_MARK = '\u200F';
    const blob = new Blob([BOM + RTL_MARK + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `expenses_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    setShowExportDialog(false);
  };

  const handleBulkPrint = async () => {
    // Refetch templates to ensure we have the latest default
    await refetchTemplates();
    
    const defaultTemplate = printTemplates.find(t => t.template_type === 'bulk_report' && t.is_default);
    
    if (!defaultTemplate) {
      alert('هیچ تێمپلەیتێکی بنەڕەتی نەدۆزرایەوە بۆ ڕاپۆرتی گشتی');
      return;
    }

    // Only filter by selection when printing (not in display)
    const recordsToPrint = selectedExpenses.length > 0 || selectedEmployees.length > 0
      ? displayRecords.filter(rec => (rec.type === 'expense' && selectedExpenses.includes(rec.id)) || (rec.type === 'employee' && selectedEmployees.includes(rec.id)))
      : displayRecords;
      
    const printTotalIQD = recordsToPrint.filter(rec => (rec.currency || 'IQD').toUpperCase() === 'IQD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const printTotalUSD = recordsToPrint.filter(rec => (rec.currency || 'IQD').toUpperCase() === 'USD').reduce((sum, rec) => sum + (rec.amount || 0), 0);
    const printTotalHours = recordsToPrint.filter(rec => rec.type === 'expense').reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0);
    
    const companyName = getPrintSettingValue('header_company_name', 'نەسرەدین رۆژبەیانی');
    const companyTagline = getPrintSettingValue('header_tagline', 'کۆمپانیای کرێی ئامێرەکان');
    const logoUrl = getPrintSettingValue('header_logo_url', '');
    const logoSize = getPrintSettingValue('header_logo_size', '60');
    const logoPosition = getPrintSettingValue('header_logo_position', 'top');

    const columnMap = {
      type: 'جۆر',
      record_date: 'بەروار',
      name: 'ناو',
      number: 'ژمارە',
      category: 'جۆری خەرجی/مووچە',
      hours: 'کاتژمێر',
      hourly_rate: 'کرێی کاتژمێر',
      amount: 'بڕی پارە',
      currency: 'دراو',
      is_paid: 'پارەدراوە',
      description: 'تێبینی'
    };

    const selectedColumnKeys = Object.keys(printColumns).filter(key => printColumns[key]);
    const headers = selectedColumnKeys.map(key => columnMap[key]);

    // Build table rows
    const tableRows = recordsToPrint.map(rec => {
      const cells = selectedColumnKeys.map(key => {
        if (key === 'type') return rec.type === 'expense' ? (rec.is_overtime ? 'خەرجی زیادە' : 'خەرجی') : 'کارمەند';
        if (key === 'record_date') return rec.record_date;
        if (key === 'name') return rec.name || '-';
        if (key === 'number') return rec.number || '-';
        if (key === 'category') return rec.category;
        if (key === 'hours') return rec.hours === '-' ? '-' : rec.hours;
        if (key === 'hourly_rate') return rec.hourly_rate === '-' ? '-' : (rec.hourly_rate ? formatCurrency(rec.hourly_rate) : '-');
        if (key === 'amount') return formatCurrency(rec.amount || 0);
        if (key === 'currency') return rec.currency || 'IQD';
        if (key === 'is_paid') return rec.is_paid ? '✓ دراوە' : '✗ نەدراوە';
        if (key === 'description') return rec.description || '-';
        return '';
      });
      
      return {
        cells,
        type: rec.type,
        is_paid: rec.is_paid,
        is_overtime: rec.is_overtime,
        amount_color: rec.type === 'expense' ? (rec.is_overtime ? '#f59e0b' : '#059669') : '#6366f1'
      };
    });

    // Build total rows
    const totalRowsData = [];
    if (printColumns.amount) {
      // IQD Total
      const iqdCells = selectedColumnKeys.map((key, index) => {
        if (key === 'type') return 'کۆی گشتی (IQD)';
        if (key === 'amount') return formatCurrency(printTotalIQD);
        if (key === 'currency') return 'IQD';
        return '';
      });
      totalRowsData.push({ cells: iqdCells });

      // USD Total (if exists)
      if (printTotalUSD > 0) {
        const usdCells = selectedColumnKeys.map((key, index) => {
          if (key === 'type') return 'کۆی گشتی (USD)';
          if (key === 'amount') return formatCurrency(printTotalUSD);
          if (key === 'currency') return 'USD';
          return '';
        });
        totalRowsData.push({ cells: usdCells });
      }
    }

    // Add Total Hours Row (if hours column is visible)
    if (printColumns.hours && printTotalHours > 0) {
      const hoursCells = selectedColumnKeys.map((key) => {
        if (key === 'type') return 'کۆی کاتژمێرەکان';
        if (key === 'hours') return printTotalHours.toFixed(1);
        return '';
      });
      totalRowsData.push({ cells: hoursCells });
    }

    let headerHtml = `<div class="company-name">${companyName}</div><div class="report-title">ڕاپۆرتی گشتی</div><div class="report-period">${selectedMonth !== 'all' ? `مانگی ${selectedMonth.split('-')[1]}/${selectedMonth.split('-')[0]}` : 'هەموو مانگەکان'}</div>`;
    
    if (logoUrl) {
      if (logoPosition === 'top') {
        headerHtml = `<div style="text-align: center; margin-bottom: 15px;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 200px; object-fit: contain;" /></div>${headerHtml}`;
      } else if (logoPosition === 'right') {
        headerHtml = `<div style="display: flex; align-items: center; justify-content: space-between;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 150px; object-fit: contain;" /><div style="flex: 1; text-align: center;">${headerHtml}</div></div>`;
      } else if (logoPosition === 'left') {
        headerHtml = `<div style="display: flex; align-items: center; justify-content: space-between; flex-direction: row-reverse;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto; max-width: 150px; object-fit: contain;" /><div style="flex: 1; text-align: center;">${headerHtml}</div></div>`;
      }
    }

    let html = defaultTemplate.html_content
      .replace(/<div class="header">[\s\S]*?<\/div>/, `<div class="header">${headerHtml}</div>`)
      .replace(/\{\{company_name\}\}/g, companyName)
      .replace(/\{\{company_tagline\}\}/g, companyTagline)
      .replace(/\{\{report_period\}\}/g, selectedMonth !== 'all' ? `مانگی ${selectedMonth.split('-')[1]}/${selectedMonth.split('-')[0]}` : 'هەموو مانگەکان')
      .replace(/\{\{print_date\}\}/g, format(new Date(), 'yyyy-MM-dd • HH:mm'))
      .replace(/\{\{total_records\}\}/g, recordsToPrint.length.toString())
      .replace(/\{\{total_iqd\}\}/g, formatCurrency(printTotalIQD))
      .replace(/\{\{total_usd\}\}/g, formatCurrency(printTotalUSD))
      .replace(/\{\{total_hours\}\}/g, printTotalHours.toFixed(1));

    // Replace table headers
    const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
    html = html.replace(/\{\{table_headers\}\}/g, headersHtml);

    // Replace table rows
    const rowsHtml = tableRows.map(row => `
      <tr class="${row.type === 'employee' ? 'employee-row' : ''} ${row.is_overtime ? 'overtime-row' : ''}">
        ${row.cells.map((cell, idx) => {
          const key = selectedColumnKeys[idx];
          if (key === 'record_date') return `<td><strong>${cell}</strong></td>`;
          if (key === 'amount') return `<td><strong style="color: ${row.amount_color};">${cell}</strong></td>`;
          if (key === 'is_paid') return `<td><span class="status-badge ${row.is_paid ? 'status-paid' : 'status-unpaid'}">${cell}</span></td>`;
          return `<td>${cell}</td>`;
        }).join('')}
      </tr>
    `).join('');
    html = html.replace(/\{\{table_rows\}\}/g, rowsHtml);

    // Replace total rows
    const totalsHtml = totalRowsData.map(row => `
      <tr class="total-row">
        ${row.cells.map(cell => `<td>${cell}</td>`).join('')}
      </tr>
    `).join('');
    html = html.replace(/\{\{total_rows\}\}/g, totalsHtml);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>ڕاپۆرتی خەرجییەکان</title>
        <style>
          ${defaultTemplate.css_content || ''}
        </style>
      </head>
      <body>
        ${html}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    setShowPrintDialog(false);
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {startPage > 1 && (
          <>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)}>
              1
            </Button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}

        {pages.map(page => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => setCurrentPage(page)}
            className={currentPage === page ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)}>
              {totalPages}
            </Button>
          </>
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm text-gray-600 mr-4 whitespace-nowrap">
          لاپەڕەی {currentPage} لە {totalPages} ({displayRecords.length} تۆمار)
        </span>

        <Select value={itemsPerPage.toString()} onValueChange={(value) => {
          setItemsPerPage(parseInt(value));
          setCurrentPage(1);
        }}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="20">20</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const clearAllFilters = () => {
    setSelectedMonth('all');
    setSelectedDriver('all');
    setSelectedExpenseType('all');
    setSelectedCurrency('all');
    setPaymentFilter('all');
    setSearchQuery('');
    setRecordTypeFilter('all');
  };

  const activeFiltersCount = [
    selectedMonth !== 'all',
    selectedDriver !== 'all',
    selectedExpenseType !== 'all',
    selectedCurrency !== 'all',
    paymentFilter !== 'all',
    searchQuery !== '',
    recordTypeFilter !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">ڕاپۆرتەکان</h1>
            <p className="text-gray-600 mt-1">پێداچوونەوە و شیکاریکردنی خەرجییەکان</p>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAmounts(!showAmounts)}
              className="hover:bg-gray-100"
            >
              {showAmounts ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>
            <Button
              onClick={() => setShowExportDialog(true)}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Excel {selectedExpenses.length > 0 || selectedEmployees.length > 0 ? `(${selectedExpenses.length + selectedEmployees.length})` : `(${displayRecords.length})`}
            </Button>
            <Button
              onClick={() => setShowPrintDialog(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Printer className="w-4 h-4" />
              چاپکردن {selectedExpenses.length > 0 || selectedEmployees.length > 0 ? `(${selectedExpenses.length + selectedEmployees.length})` : `(${displayRecords.length})`}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowDuplicates(true)}
              className="gap-2"
            >
              <Copy className="w-4 h-4" />
              دووبارەکان ({duplicateGroups.length})
            </Button>
            <Button
              variant={showDeleted ? "default" : "outline"}
              onClick={() => setShowDeleted(!showDeleted)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              سڕاوەکان ({deletedExpenses.length + deletedEmployees.length})
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSettings(true)}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              ڕێکخستنەکان
            </Button>
          </div>
        </div>

        {(selectedExpenses.length > 0 || selectedEmployees.length > 0) && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-blue-800 font-semibold">
                {selectedExpenses.length + selectedEmployees.length} تۆمار هەڵبژێردراوە
                ({selectedExpenses.length} خەرجی + {selectedEmployees.length} کارمەند)
              </span>
              <div className="flex gap-2 flex-wrap">
                {!showDeleted ? (
                  <>
                    {selectedExpenses.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkSoftDelete}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        سڕینەوەی خەرجی ({selectedExpenses.length})
                      </Button>
                    )}
                    {selectedEmployees.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkSoftDelete}
                      >
                        <Trash2 className="w-4 h-4 ml-2" />
                        سڕینەوەی کارمەند ({selectedEmployees.length})
                      </Button>
                    )}
                  </>
                ) : (
                  <>
                    {(selectedExpenses.length > 0 || selectedEmployees.length > 0) && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={handleBulkRecover}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <RotateCcw className="w-4 h-4 ml-2" />
                        گەڕاندنەوە
                      </Button>
                    )}
                    {(selectedExpenses.length > 0 || selectedEmployees.length > 0) && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkPermanentDelete}
                      >
                        <Flame className="w-4 h-4 ml-2" />
                        سڕینەوەی هەمیشەیی
                      </Button>
                    )}
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedExpenses([]);
                    setSelectedEmployees([]);
                  }}
                >
                  پاشگەزبوونەوە
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی گشتی (IQD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalExpensesIQD)}</div>
              <p className="text-xs opacity-80 mt-1">
                {displayRecords.filter(e => (e.currency || 'IQD').toUpperCase() === 'IQD').length} تۆمار
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی گشتی (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalExpensesUSD)}</div>
              <p className="text-xs opacity-80 mt-1">
                {displayRecords.filter(e => (e.currency || 'IQD').toUpperCase() === 'USD').length} تۆمار
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                کۆی کاتژمێرەکان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs opacity-80 mt-1">کاتژمێر</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                کاتژمێری زیادە
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overtimeHours.toFixed(1)} کاتژمێر</div>
              {overtimeAmountIQD > 0 && (
                <div className="text-xl font-bold mt-1">{formatCurrency(overtimeAmountIQD)} IQD</div>
              )}
              {overtimeAmountUSD > 0 && (
                <div className="text-xl font-bold">{formatCurrency(overtimeAmountUSD)} USD</div>
              )}
              <p className="text-xs opacity-80 mt-1">{overtimeExpensesCount} خەرجی زیادە</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                پارەدراوە
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(paidExpensesIQD)} IQD</div>
              <div className="text-xl font-bold mt-1">{formatCurrency(paidExpensesUSD)} USD</div>
              <p className="text-xs opacity-80 mt-1">
                {displayRecords.filter(e => e.is_paid).length} تۆمار
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-blue-600" />
                <CardTitle>فلتەرەکان</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    {activeFiltersCount} فلتەری چالاک
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={areAllDisplayedRecordsSelected}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <Label htmlFor="select-all" className="cursor-pointer">
                  هەڵبژاردنی هەموو ({displayRecords.length})
                </Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <CalendarIcon className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-sm text-purple-800 font-semibold">مانگی هەڵبژێردراو:</div>
                    <div className="text-xl font-bold text-purple-900">
                      {selectedMonth === 'all' ? 'هەموو مانگەکان' : selectedMonth}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousMonth}
                    disabled={selectedMonth === 'all' || availableMonths.indexOf(selectedMonth) === availableMonths.length - 1}
                    className="hover:bg-purple-100"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedMonth('all')}
                    className="hover:bg-purple-100 px-4"
                  >
                    هەموو
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextMonth}
                    disabled={selectedMonth === 'all' || availableMonths.indexOf(selectedMonth) === 0}
                    className="hover:bg-purple-100"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-2">
                {monthsWithData.slice(0, 12).map(({ value, hasExpenses, hasEmployees }) => (
                  <button
                    key={value}
                    onClick={() => setSelectedMonth(value)}
                    className={`
                      relative p-2 rounded-lg text-xs font-bold transition-all duration-200
                      ${selectedMonth === value
                        ? 'bg-purple-600 text-white shadow-lg ring-2 ring-purple-400'
                        : 'bg-white hover:bg-purple-100 text-gray-700'
                      }
                    `}
                  >
                    <div>{format(new Date(value + '-01'), 'MM/yy')}</div>
                    <div className="flex gap-1 justify-center mt-1">
                      {hasExpenses && (
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="خەرجی هەیە" />
                      )}
                      {hasEmployees && (
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" title="کارمەند هەیە" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span>خەرجی</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>کارمەند</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="space-y-2">
                <Label>جۆری تۆمار</Label>
                <Select value={recordTypeFilter} onValueChange={setRecordTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">هەموویان</SelectItem>
                    <SelectItem value="expense">تەنها خەرجی</SelectItem>
                    <SelectItem value="employee">تەنها کارمەند</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>شۆفێر</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver} disabled={selectedCurrency !== 'all'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">هەموو شۆفێرەکان</SelectItem>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.driver_name} (#{driver.driver_number})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>جۆری خەرجی</Label>
                <Select value={selectedExpenseType} onValueChange={setSelectedExpenseType} disabled={selectedCurrency !== 'all'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                    <SelectContent>
                    <SelectItem value="all">هەموو جۆرەکان</SelectItem>
                    {expenseTypes.map(type => (
                      <SelectItem key={type.id} value={type.type_name}>
                          {type.type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>جۆری دراو</Label>
                <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">هەموویان</SelectItem>
                    <SelectItem value="IQD">دینار (IQD)</SelectItem>
                    <SelectItem value="USD">دۆلار (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>دۆخی پارەدان</Label>
                <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">هەموویان</SelectItem>
                    <SelectItem value="paid">پارەدراوە</SelectItem>
                    <SelectItem value="unpaid">پارە نەدراوە</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>گەڕان</Label>
                <Input
                  placeholder="گەڕان بە ناو، ژمارە، جۆر..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={clearAllFilters}
                disabled={activeFiltersCount === 0}
                className="gap-2"
              >
                <X className="w-4 h-4" />
                سڕینەوەی هەموو فلتەرەکان
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Excel-like Table */}
        <Card className="border-none shadow-lg">
          <div className="overflow-x-auto">
            {paginatedRecords.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">هیچ تۆمارێک نەدۆزرایەوە</h3>
                <p className="text-gray-600">تکایە فلتەرەکان بگۆڕە یان خەرجیی نوێ زیادبکە</p>
              </div>
            ) : (
              <>
                <table className="w-full" style={{borderCollapse: 'separate', borderSpacing: 0}}>
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 w-12">
                        <Checkbox
                          checked={areAllDisplayedRecordsSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">جۆر</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">بەروار</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">ناو</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">ژمارە</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">جۆری خەرجی</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">کاتژمێر</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">کرێ</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">بڕی پارە</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">دراو</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">باری پارە</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 whitespace-nowrap">تێبینی</th>
                      <th className="p-3 text-right text-xs font-bold text-gray-700 border-b-2 border-gray-300 w-32">کردارەکان</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((record, index) => (
                      <tr 
                        key={`${record.type}-${record.id}`}
                        className={`
                          border-b border-gray-200 hover:bg-blue-50 transition-colors
                          ${record.type === 'employee' ? 'bg-purple-50/30' : ''}
                          ${record.is_overtime ? 'bg-amber-50/30' : ''}
                          ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        `}
                      >
                        <td className="p-3 border-r border-gray-200">
                          {record.type === 'expense' ? (
                            <Checkbox
                              checked={selectedExpenses.includes(record.id)}
                              onCheckedChange={() => handleSelectExpense(record.id)}
                            />
                          ) : (
                            <Checkbox
                              checked={selectedEmployees.includes(record.id)}
                              onCheckedChange={() => handleSelectEmployee(record.id)}
                            />
                          )}
                        </td>
                        <td className="p-3 border-r border-gray-200">
                          <div className="flex flex-col gap-1">
                            <Badge className={record.type === 'employee' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}>
                              {record.type === 'employee' ? 'کارمەند' : 'خەرجی'}
                            </Badge>
                            {record.is_overtime && (
                              <Badge className="bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1 justify-center">
                                <Zap className="w-3 h-3" />
                                زیادە
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-sm border-r border-gray-200 whitespace-nowrap font-medium">{record.record_date}</td>
                        <td className="p-3 text-sm border-r border-gray-200 whitespace-nowrap font-semibold">{record.name}</td>
                        <td className="p-3 text-sm border-r border-gray-200 whitespace-nowrap text-gray-600">{record.number}</td>
                        <td className="p-3 text-sm border-r border-gray-200 whitespace-nowrap">
                          <Badge className={expenseTypeColors[record.category] || "bg-gray-100 text-gray-800"}>
                            {record.category}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm border-r border-gray-200 text-center">
                          {record.hours !== '-' && record.is_overtime ? (
                            <span className="flex items-center justify-center gap-1 text-amber-700 font-bold">
                              <Zap className="w-3 h-3 inline-block" />
                              {record.hours}
                            </span>
                          ) : (
                            record.hours
                          )}
                        </td>
                        <td className="p-3 text-sm border-r border-gray-200 text-right">{record.hourly_rate !== '-' ? formatCurrency(record.hourly_rate) : '-'}</td>
                        <td className="p-3 text-sm border-r border-gray-200 text-right">
                          <span className={`font-bold ${record.type === 'expense' ? (record.is_overtime ? 'text-amber-600' : 'text-emerald-600') : 'text-purple-600'}`}>
                            {record.is_overtime && <Zap className="w-3 h-3 inline mr-1" />}
                            {formatCurrency(record.amount)}
                          </span>
                        </td>
                        <td className="p-3 text-sm border-r border-gray-200 text-center">
                          <Badge variant="outline" className={record.currency === 'USD' ? 'border-blue-300 text-blue-700' : 'border-gray-300'}>
                            {record.currency}
                          </Badge>
                        </td>
                        <td className="p-3 border-r border-gray-200">
                          {!showDeleted ? (
                            <Checkbox
                              checked={record.is_paid}
                              onCheckedChange={() => {
                                if (record.type === 'expense') {
                                  handleTogglePaid(record);
                                } else {
                                  handleTogglePaidEmployee(record);
                                }
                              }}
                              id={`paid-${record.type}-${record.id}`}
                              className="data-[state=checked]:bg-green-600"
                            />
                          ) : (
                            <Badge className={record.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {record.is_paid ? '✓' : '✗'}
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm border-r border-gray-200 max-w-xs truncate" title={record.description}>
                          {record.description}
                        </td>
                        {!showDeleted ? (
                          <td className="p-3 border-r border-gray-200">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (record.type === 'expense') {
                                    handlePrintExpense(record);
                                  } else {
                                    handlePrintEmployee(record);
                                  }
                                }}
                                className="h-7 w-7"
                                title="چاپکردن"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (record.type === 'expense') {
                                    handleEdit(record);
                                  } else {
                                    handleEditEmployee(record);
                                  }
                                }}
                                className="h-7 w-7"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (record.type === 'expense') {
                                    handleDelete(record.id);
                                  } else {
                                    handleDeleteEmployee(record.id);
                                  }
                                }}
                                className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        ) : (
                          <td className="p-3 border-r border-gray-200">
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                onClick={() => {
                                  if (record.type === 'expense') {
                                    handleRecover(record.id);
                                  } else {
                                    handleRecoverEmployee(record.id);
                                  }
                                }}
                                className="h-7 w-7 bg-green-600 hover:bg-green-700"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => {
                                  if (record.type === 'expense') {
                                    handlePermanentDelete(record.id);
                                  } else {
                                    handlePermanentDeleteEmployee(record.id);
                                  }
                                }}
                                className="h-7 w-7"
                              >
                                <Flame className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  
                  {/* Table Footer with Totals */}
                  <tfoot>
                    <tr className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                      <td colSpan="3" className="p-4 text-right text-lg border-t-2 border-emerald-800">
                        کۆی گشتی (IQD)
                      </td>
                      <td colSpan="4" className="p-4 border-t-2 border-emerald-800"></td>
                      <td className="p-4 text-center border-t-2 border-emerald-800 text-lg">
                        {displayRecords.filter(rec => rec.type === 'expense' && (rec.currency || 'IQD').toUpperCase() === 'IQD').reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0).toFixed(1)}
                      </td>
                      <td className="p-4 border-t-2 border-emerald-800"></td>
                      <td className="p-4 text-right text-xl border-t-2 border-emerald-800">
                        {formatCurrency(totalExpensesIQD)}
                      </td>
                      <td className="p-4 text-center border-t-2 border-emerald-800">IQD</td>
                      <td colSpan={!showDeleted ? 2 : 1} className="p-4 border-t-2 border-emerald-800"></td>
                    </tr>

                    {totalExpensesUSD > 0 && (
                      <tr className="bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold">
                        <td colSpan="3" className="p-4 text-right text-lg">
                          کۆی گشتی (USD)
                        </td>
                        <td colSpan="4" className="p-4"></td>
                        <td className="p-4 text-center text-lg">
                          {displayRecords.filter(rec => rec.type === 'expense' && (rec.currency || 'IQD').toUpperCase() === 'USD').reduce((sum, rec) => sum + (typeof rec.hours === 'number' ? rec.hours : 0), 0).toFixed(1)}
                        </td>
                        <td className="p-4"></td>
                        <td className="p-4 text-right text-xl">
                          {formatCurrency(totalExpensesUSD)}
                        </td>
                        <td className="p-4 text-center">USD</td>
                        <td colSpan={!showDeleted ? 2 : 1} className="p-4"></td>
                      </tr>
                    )}

                    <tr className="bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold">
                      <td colSpan="3" className="p-4 text-right text-lg border-t-2 border-purple-800">
                        کۆی کاتژمێرەکان
                      </td>
                      <td colSpan="3" className="p-4 border-t-2 border-purple-800"></td>
                      <td className="p-4 text-center text-xl border-t-2 border-purple-800" colSpan="2">
                        {totalHours.toFixed(1)} کاتژمێر
                      </td>
                      <td colSpan={!showDeleted ? 5 : 4} className="p-4 border-t-2 border-purple-800"></td>
                    </tr>
                  </tfoot>
                </table>

                {totalPages > 1 && renderPagination()}
              </>
            )}
          </div>
        </Card>

        {/* Edit Expense Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl">دەستکاریکردنی خەرجی</DialogTitle>
            </DialogHeader>

            {editingExpense && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>بەروار</Label>
                  <Input
                    type="date"
                    value={editingExpense.expense_date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, expense_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>شۆفێر</Label>
                  <Select
                    value={editingExpense.driver_id || ''}
                    onValueChange={(value) => {
                      const selectedDriver = drivers.find(d => d.id === value);
                      setEditingExpense({
                        ...editingExpense,
                        driver_id: value,
                        driver_name: selectedDriver ? selectedDriver.driver_name : '',
                        driver_number: selectedDriver ? selectedDriver.driver_number : ''
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="شۆفێر هەڵبژێرە" />
                    </SelectTrigger>
                    <SelectContent>
                      {drivers.map(driver => (
                        <SelectItem key={driver.id} value={driver.id}>
                          {driver.driver_name} (#{driver.driver_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>جۆری خەرجی</Label>
                  <Select
                    value={editingExpense.expense_type}
                    onValueChange={(value) => setEditingExpense({ ...editingExpense, expense_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="جۆری خەرجی هەڵبژێرە" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseTypes.map(type => (
                        <SelectItem key={type.id} value={type.type_name}>
                          {type.type_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>کاتژمێرەکان</Label>
                    <Input
                      type="number"
                      value={editingExpense.hours}
                      onChange={(e) => setEditingExpense({ ...editingExpense, hours: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>نرخی کاتژمێر</Label>
                    <Input
                      type="number"
                      value={editingExpense.hourly_rate}
                      onChange={(e) => setEditingExpense({ ...editingExpense, hourly_rate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>بڕی پارە</Label>
                    <Input
                      type="number"
                      value={editingExpense.amount}
                      onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>دراو</Label>
                    <Select
                      value={editingExpense.currency}
                      onValueChange={(value) => setEditingExpense({ ...editingExpense, currency: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IQD">IQD</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_paid_edit"
                    checked={editingExpense.is_paid}
                    onCheckedChange={(checked) => setEditingExpense({ ...editingExpense, is_paid: checked })}
                  />
                  <label
                    htmlFor="is_paid_edit"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    پارەدراوە
                  </label>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse bg-amber-50 p-4 rounded-lg">
                  <Checkbox
                    id="is_overtime_edit"
                    checked={editingExpense.is_overtime || false}
                    onCheckedChange={(checked) => setEditingExpense({ ...editingExpense, is_overtime: checked })}
                  />
                  <label
                    htmlFor="is_overtime_edit"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-amber-600" />
                    کاتژمێری زیادە (Overtime)
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>تێبینی</Label>
                  <Input
                    value={editingExpense.description}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(false)}
                    className="flex-1"
                  >
                    پاشگەزبوونەوە
                  </Button>
                  <Button
                    onClick={handleSaveEdit}
                    disabled={updateExpenseMutation.isPending}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    {updateExpenseMutation.isPending ? 'چاوەڕێ بە...' : 'نوێکردنەوە'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Employee Dialog */}
        <Dialog open={showEditEmployeeDialog} onOpenChange={setShowEditEmployeeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl">دەستکاریکردنی کارمەند</DialogTitle>
            </DialogHeader>

            {editingEmployee && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>ناوی کارمەند</Label>
                  <Input
                    value={editingEmployee.employee_name}
                    onChange={(e) => setEditingEmployee({...editingEmployee, employee_name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>ژمارەی کارمەند</Label>
                  <Input
                    value={editingEmployee.employee_number}
                    onChange={(e) => setEditingEmployee({...editingEmployee, employee_number: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>مووچە</Label>
                  <Input
                    type="number"
                    value={editingEmployee.salary}
                    onChange={(e) => setEditingEmployee({...editingEmployee, salary: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div className="space-y-2">
                  <Label>جۆری دراو</Label>
                  <Select value={editingEmployee.currency} onValueChange={(value) => setEditingEmployee({...editingEmployee, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">دینار (IQD)</SelectItem>
                      <SelectItem value="USD">دۆلار (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>بەرواری پارەدان</Label>
                  <Input
                    type="date"
                    value={editingEmployee.payment_date}
                    onChange={(e) => setEditingEmployee({...editingEmployee, payment_date: e.target.value})}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="employee_is_paid_edit"
                    checked={editingEmployee.is_paid}
                    onCheckedChange={(checked) => setEditingEmployee({ ...editingEmployee, is_paid: checked })}
                  />
                  <label
                    htmlFor="employee_is_paid_edit"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    پارەدراوە
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditEmployeeDialog(false)}
                    className="flex-1"
                  >
                    پاشگەزبوونەوە
                  </Button>
                  <Button
                    onClick={handleSaveEmployeeEdit}
                    disabled={updateEmployeeMutation.isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {updateEmployeeMutation.isPending ? 'چاوەڕێ بە...' : 'نوێکردنەوە'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>


        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>هەڵبژاردنی ستوونەکان بۆ Excel</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(exportColumns).map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`export-col-${key}`}
                    checked={exportColumns[key]}
                    onCheckedChange={(checked) => setExportColumns(prev => ({ ...prev, [key]: checked }))}
                  />
                  <Label htmlFor={`export-col-${key}`}>
                    {key === 'type' && 'جۆر'}
                    {key === 'record_date' && 'بەروار'}
                    {key === 'name' && 'ناو'}
                    {key === 'number' && 'ژمارە'}
                    {key === 'category' && 'جۆری خەرجی/مووچە'}
                    {key === 'hours' && 'کاتژمێر'}
                    {key === 'hourly_rate' && 'کرێی کاتژمێر'}
                    {key === 'amount' && 'بڕی پارە'}
                    {key === 'currency' && 'دراو'}
                    {key === 'is_paid' && 'پارەدراوە'}
                    {key === 'is_overtime' && 'کاتژمێری زیادە'}
                    {key === 'description' && 'تێبینی'}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>پاشگەزبوونەوە</Button>
              <Button onClick={exportToExcel}>داگرتن</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Print Dialog */}
        <Dialog open={showPrintDialog} onOpenChange={setShowPrintDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>هەڵبژاردنی ستوونەکان بۆ چاپکردن</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              {Object.keys(printColumns).map(key => (
                <div key={key} className="flex items-center space-x-2">
                  <Checkbox
                    id={`print-col-${key}`}
                    checked={printColumns[key]}
                    onCheckedChange={(checked) => setPrintColumns(prev => ({ ...prev, [key]: checked }))}
                  />
                  <Label htmlFor={`print-col-${key}`}>
                    {key === 'type' && 'جۆر'}
                    {key === 'record_date' && 'بەروار'}
                    {key === 'name' && 'ناو'}
                    {key === 'number' && 'ژمارە'}
                    {key === 'category' && 'جۆری خەرجی/مووچە'}
                    {key === 'hours' && 'کاتژمێر'}
                    {key === 'hourly_rate' && 'کرێی کاتژمێر'}
                    {key === 'amount' && 'بڕی پارە'}
                    {key === 'currency' && 'دراو'}
                    {key === 'is_paid' && 'پارەدراوە'}
                    {key === 'description' && 'تێبینی'}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPrintDialog(false)}>پاشگەزبوونەوە</Button>
              <Button onClick={handleBulkPrint}>چاپکردن</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ڕێکخستنەکان</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-pin">پینکۆدی سڕینەوەی هەمیشەیی</Label>
                <Input
                  id="delete-pin"
                  type="password"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="لانی کەم 4 ژمارە"
                />
              </div>
              <Button onClick={handleSaveDeletePin}>پاشەکەوتکردنی پینکۆد</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Duplicate Expenses Dialog */}
        <Dialog open={showDuplicates} onOpenChange={setShowDuplicates}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>خەرجییە دووبارەکان</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {duplicateGroups.length === 0 ? (
                <p>هیچ خەرجییەکی دووبارە نەدۆزرایەوە.</p>
              ) : (
                duplicateGroups.map((group, index) => (
                  <Card key={index} className="border-l-4 border-orange-500">
                    <CardHeader className="py-2 px-4 bg-orange-50 text-orange-800">
                      <CardTitle className="text-sm">
                        {group[0].expense_date} | {group[0].driver_name} | {formatCurrency(group[0].amount)} {group[0].currency}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      {group.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{exp.expense_type}</p>
                            <p className="text-xs text-gray-500">{exp.description}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(exp)}
                              className="h-7 w-7"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(exp.id)}
                              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setShowDuplicates(false)}>داخستن</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
