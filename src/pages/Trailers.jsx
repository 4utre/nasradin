
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Users,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Truck,
  Filter,
  Eye,
  EyeOff,
  Receipt,
  Settings as SettingsIcon,
  Download,
  Printer,
  RotateCcw,
  Flame,
  Lock
} from "lucide-react";
import { format } from "date-fns";

const ADMIN_EMAIL = 'hershufo23@gmail.com';
const NORMAL_TRAILER_RATE = 50000;
const GHARABIL_TRAILER_RATE = 65000;

export default function Trailers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("add-expense");
  
  // Settings states
  const [normalRate, setNormalRate] = useState(NORMAL_TRAILER_RATE);
  const [gharabilRate, setGharabilRate] = useState(GHARABIL_TRAILER_RATE);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [tempNormalRate, setTempNormalRate] = useState(NORMAL_TRAILER_RATE);
  const [tempGharabilRate, setTempGharabilRate] = useState(GHARABIL_TRAILER_RATE);
  
  // Driver Management States
  const [showDriverDialog, setShowDriverDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverForm, setDriverForm] = useState({
    driver_name: '',
    driver_number: '',
    assigned_months: []
  });

  // Expense Form States
  const [expenseForm, setExpenseForm] = useState({
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    invoice_number: '',
    driver_id: '',
    driver_name: '',
    driver_number: '',
    trailer_type: 'عادی',
    amount: NORMAL_TRAILER_RATE,
    is_paid: false,
    description: ''
  });

  // Edit States
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Filter States
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDriver, setSelectedDriver] = useState('all');
  const [selectedTrailerType, setSelectedTrailerType] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [showAmounts, setShowAmounts] = useState(true);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);

  // Selection States
  const [selectedExpenses, setSelectedExpenses] = useState([]);

  // Export/Print States
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [exportColumns, setExportColumns] = useState({
    expense_date: true,
    invoice_number: true,
    driver_name: true,
    driver_number: true,
    trailer_type: true,
    amount: true,
    is_paid: true,
    description: true
  });
  const [printColumns, setPrintColumns] = useState({
    expense_date: true,
    invoice_number: true,
    driver_name: true,
    driver_number: true,
    trailer_type: true,
    amount: true,
    is_paid: true,
    description: true
  });

  // PIN States
  const [deletePin, setDeletePin] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);

  // UI States
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

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

  const { data: allAppSettings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSetting.list(),
    initialData: [],
  });

  const { data: printTemplates = [], refetch: refetchTemplates } = useQuery({
    queryKey: ['printTemplates'],
    queryFn: () => base44.entities.PrintTemplate.list(),
    initialData: [],
    staleTime: 0,
    cacheTime: 0,
  });

  useEffect(() => {
    const normalRateSetting = allAppSettings.find(s => s.setting_key === 'trailer_normal_rate');
    const gharabilRateSetting = allAppSettings.find(s => s.setting_key === 'trailer_gharabil_rate');
    
    if (normalRateSetting) {
      const rate = parseFloat(normalRateSetting.setting_value);
      setNormalRate(rate);
      setTempNormalRate(rate);
    } else {
        setNormalRate(NORMAL_TRAILER_RATE);
        setTempNormalRate(NORMAL_TRAILER_RATE);
    }
    if (gharabilRateSetting) {
      const rate = parseFloat(gharabilRateSetting.setting_value);
      setGharabilRate(rate);
      setTempGharabilRate(rate);
    } else {
        setGharabilRate(GHARABIL_TRAILER_RATE);
        setTempGharabilRate(GHARABIL_TRAILER_RATE);
    }

    setExpenseForm(prev => {
        if (prev.trailer_type === 'عادی') {
            return { ...prev, amount: normalRateSetting ? parseFloat(normalRateSetting.setting_value) : NORMAL_TRAILER_RATE };
        } else if (prev.trailer_type === 'غەربیل') {
            return { ...prev, amount: gharabilRateSetting ? parseFloat(gharabilRateSetting.setting_value) : GHARABIL_TRAILER_RATE };
        }
        return prev;
    });

  }, [allAppSettings]);

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }) => {
      const existing = allAppSettings.find(s => s.setting_key === key);
      if (existing) {
        return base44.entities.AppSetting.update(existing.id, {
          setting_value: value.toString()
        });
      } else {
        return base44.entities.AppSetting.create({
          setting_key: key,
          setting_value: value.toString(),
          setting_category: 'trailer_rates',
          description: key === 'trailer_normal_rate' ? 'نرخی تێکەرەی عادی' : 'نرخی تێکەرەی غەربیل'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings'] });
    },
  });

  const handleSaveRates = async () => {
    try {
      await updateSettingMutation.mutateAsync({ key: 'trailer_normal_rate', value: tempNormalRate });
      await updateSettingMutation.mutateAsync({ key: 'trailer_gharabil_rate', value: tempGharabilRate });
      
      setNormalRate(tempNormalRate);
      setGharabilRate(tempGharabilRate);
      setShowSettingsDialog(false);
      setSuccess('نرخەکان بە سەرکەوتوویی نوێکرانەوە');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('هەڵە لە نوێکردنەوەی نرخەکان');
      setTimeout(() => setError(''), 3000);
    }
  };

  const { data: allTrailerDrivers = [] } = useQuery({
    queryKey: ['trailerDrivers'],
    queryFn: () => base44.entities.TrailerDriver.list(),
    initialData: [],
  });

  const { data: allTrailerExpenses = [] } = useQuery({
    queryKey: ['trailerExpenses'],
    queryFn: () => base44.entities.TrailerExpense.list('-expense_date'),
    initialData: [],
  });

  const trailerDrivers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') return allTrailerDrivers;
    return allTrailerDrivers.filter(d => d.created_by === currentUser.email);
  }, [allTrailerDrivers, currentUser]);

  const trailerExpenses = useMemo(() => {
    if (!currentUser) return [];
    const expenses = currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin' 
      ? allTrailerExpenses 
      : allTrailerExpenses.filter(e => e.created_by === currentUser.email);
    return showDeleted ? expenses.filter(e => e.is_deleted) : expenses.filter(e => !e.is_deleted);
  }, [allTrailerExpenses, currentUser, showDeleted]);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set();
    // Use allTrailerExpenses to show all months regardless of current filter/user
    allTrailerExpenses.forEach(exp => {
      const date = new Date(exp.expense_date);
      monthsSet.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(monthsSet).sort().reverse();
  }, [allTrailerExpenses]);

  const filteredExpenses = useMemo(() => {
    return trailerExpenses.filter(exp => {
      if (selectedMonth !== 'all') {
        const expDate = new Date(exp.expense_date);
        const expMonth = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
        if (expMonth !== selectedMonth) return false;
      }
      if (selectedDriver !== 'all' && exp.driver_id !== selectedDriver) return false;
      if (selectedTrailerType !== 'all' && exp.trailer_type !== selectedTrailerType) return false;
      if (paymentFilter === 'paid' && !exp.is_paid) return false;
      if (paymentFilter === 'unpaid' && exp.is_paid) return false;
      if (invoiceSearch && exp.invoice_number && !exp.invoice_number.toLowerCase().includes(invoiceSearch.toLowerCase())) return false;
      return true;
    });
  }, [trailerExpenses, selectedMonth, selectedDriver, selectedTrailerType, paymentFilter, invoiceSearch]);

  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const unpaidAmount = useMemo(() => {
    return filteredExpenses.filter(e => !e.is_paid).reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const normalCount = useMemo(() => {
    return filteredExpenses.filter(e => e.trailer_type === 'عادی').length;
  }, [filteredExpenses]);

  const gharabilCount = useMemo(() => {
    return filteredExpenses.filter(e => e.trailer_type === 'غەربیل').length;
  }, [filteredExpenses]);

  const deletedCount = useMemo(() => {
    const expenses = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin' 
      ? allTrailerExpenses 
      : allTrailerExpenses.filter(e => e.created_by === currentUser?.email);
    return expenses.filter(e => e.is_deleted).length;
  }, [allTrailerExpenses, currentUser]);

  const getNextDriverNumber = () => {
    if (trailerDrivers.length === 0) return '1';
    const numbers = trailerDrivers
      .map(d => parseInt(d.driver_number) || 0)
      .filter(n => !isNaN(n));
    const maxNumber = Math.max(...numbers, 0);
    return (maxNumber + 1).toString();
  };

  const createDriverMutation = useMutation({
    mutationFn: (data) => base44.entities.TrailerDriver.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailerDrivers'] });
      setShowDriverDialog(false);
      setDriverForm({
        driver_name: '',
        driver_number: '',
        assigned_months: []
      });
      setSuccess('شۆفێر بە سەرکەوتوویی زیادکرا');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const updateDriverMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrailerDriver.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailerDrivers'] });
      setShowDriverDialog(false);
      setEditingDriver(null);
      setSuccess('شۆفێر بە سەرکەوتوویی نوێکرایەوە');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id) => base44.entities.TrailerDriver.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailerDrivers'] });
      setSuccess('شۆفێر سڕایەوە');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.TrailerExpense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailerExpenses'] });
      setExpenseForm({
        expense_date: format(new Date(), 'yyyy-MM-dd'),
        invoice_number: '',
        driver_id: '',
        driver_name: '',
        driver_number: '',
        trailer_type: 'عادی',
        amount: normalRate,
        is_paid: false,
        description: ''
      });
      setSuccess('خەرجی بە سەرکەوتوویی تۆمارکرا');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TrailerExpense.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailerExpenses'] });
      setShowEditDialog(false);
      setEditingExpense(null);
      setSelectedExpenses([]);
      setSuccess('خەرجی بە سەرکەوتوویی نوێکرایەوە');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id) => base44.entities.TrailerExpense.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trailerExpenses'] });
      setSelectedExpenses([]);
      setSuccess('خەرجی بە تەواوی سڕایەوە');
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const handleDriverSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...driverForm,
      driver_number: editingDriver ? driverForm.driver_number : getNextDriverNumber(),
      assigned_months: driverForm.assigned_months || [] // Ensure assigned_months is an array
    };
    
    if (editingDriver) {
      updateDriverMutation.mutate({ id: editingDriver.id, data: dataToSubmit });
    } else {
      createDriverMutation.mutate(dataToSubmit);
    }
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setDriverForm({
      driver_name: driver.driver_name,
      driver_number: driver.driver_number,
      assigned_months: driver.assigned_months || []
    });
    setShowDriverDialog(true);
  };

  const handleDeleteDriver = (id) => {
    if (window.confirm('دڵنیایت لە سڕینەوەی ئەم شۆفێرە؟')) {
      deleteDriverMutation.mutate(id);
    }
  };

  const handleDriverSelect = (driverId) => {
    const driver = trailerDrivers.find(d => d.id === driverId);
    if (driver) {
      setExpenseForm(prev => ({
        ...prev,
        driver_id: driver.id,
        driver_name: driver.driver_name,
        driver_number: driver.driver_number
      }));
    }
  };

  const handleTrailerTypeChange = (type) => {
    if (type === 'عادی') {
      setExpenseForm(prev => ({ ...prev, trailer_type: type, amount: normalRate }));
    } else {
      setExpenseForm(prev => ({ ...prev, trailer_type: type, amount: gharabilRate }));
    }
  };

  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.trailer_type || !expenseForm.amount) {
      setError('تکایە خانە پێویستەکان پڕبکەرەوە');
      setTimeout(() => setError(''), 3000);
      return;
    }

    createExpenseMutation.mutate({
      expense_date: expenseForm.expense_date,
      invoice_number: expenseForm.invoice_number || undefined,
      driver_id: expenseForm.driver_id || undefined,
      driver_name: expenseForm.driver_name || undefined,
      driver_number: expenseForm.driver_number || undefined,
      trailer_type: expenseForm.trailer_type,
      amount: parseFloat(expenseForm.amount),
      is_paid: expenseForm.is_paid,
      description: expenseForm.description || undefined,
      is_deleted: false
    });
  };

  const handleEdit = (expense) => {
    setEditingExpense({
      ...expense,
      amount: expense.amount || 0,
      description: expense.description || ''
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (!editingExpense) return;

    updateExpenseMutation.mutate({
      id: editingExpense.id,
      data: {
        expense_date: editingExpense.expense_date,
        invoice_number: editingExpense.invoice_number || undefined,
        driver_id: editingExpense.driver_id || undefined,
        driver_name: editingExpense.driver_name || undefined,
        driver_number: editingExpense.driver_number || undefined,
        trailer_type: editingExpense.trailer_type,
        amount: parseFloat(editingExpense.amount),
        is_paid: editingExpense.is_paid,
        description: editingExpense.description || undefined
      }
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('دڵنیایت لە سڕینەوەی ئەم تۆمارە؟')) return;
    const expense = allTrailerExpenses.find(e => e.id === id);
    if (expense) {
      updateExpenseMutation.mutate({
        id,
        data: { ...expense, is_deleted: true }
      });
    }
  };

  const handleRecover = (id) => {
    if (!window.confirm('دڵنیایت لە گەڕاندنەوەی ئەم تۆمارە؟')) return;
    const expense = allTrailerExpenses.find(e => e.id === id);
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

  const handleBulkSoftDelete = () => {
    if (selectedExpenses.length === 0) return;
    if (window.confirm(`دڵنیایت لە سڕینەوەی ${selectedExpenses.length} تۆمار؟`)) {
      selectedExpenses.forEach(id => {
        const expense = allTrailerExpenses.find(e => e.id === id);
        if (expense) {
          updateExpenseMutation.mutate({
            id,
            data: { ...expense, is_deleted: true }
          });
        }
      });
    }
  };

  const handleBulkRecover = () => {
    if (selectedExpenses.length === 0) return;
    if (window.confirm(`دڵنیایت لە گەڕاندنەوەی ${selectedExpenses.length} تۆمار؟`)) {
      selectedExpenses.forEach(id => {
        const expense = allTrailerExpenses.find(e => e.id === id);
        if (expense) {
          updateExpenseMutation.mutate({
            id,
            data: { ...expense, is_deleted: false }
          });
        }
      });
    }
  };

  const handleBulkPermanentDelete = () => {
    if (selectedExpenses.length === 0) return;
    const savedPin = localStorage.getItem('deletePin');
    if (!savedPin) {
      alert('تکایە یەکەم جار پینکۆد دابنێ لە ڕێکخستنەکان');
      return;
    }

    const enteredPin = prompt('تکایە پینکۆد بنووسە بۆ سڕینەوەی هەمیشەیی:');
    if (enteredPin === savedPin) {
      if (window.confirm(`دڵنیایت لە سڕینەوەی هەمیشەیی ${selectedExpenses.length} تۆمار؟ ئەم کردارە ناگەڕێتەوە!`)) {
        selectedExpenses.forEach(id => {
          deleteExpenseMutation.mutate(id);
        });
      }
    } else {
      alert('پینکۆد هەڵەیە!');
    }
  };

  const handleSelectExpense = (expenseId) => {
    setSelectedExpenses(prev => {
      if (prev.includes(expenseId)) {
        return prev.filter(id => id !== expenseId);
      } else {
        return [...prev, expenseId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedExpenses.length === filteredExpenses.length && filteredExpenses.length > 0) {
      setSelectedExpenses([]);
    } else {
      setSelectedExpenses(filteredExpenses.map(e => e.id));
    }
  };

  const handleTogglePaid = (expense) => {
    updateExpenseMutation.mutate({
      id: expense.id,
      data: { ...expense, is_paid: !expense.is_paid }
    });
  };

  const handleSaveDeletePin = () => {
    if (deletePin.length >= 4 && /^\d+$/.test(deletePin)) {
      localStorage.setItem('deletePin', deletePin);
      setShowPinDialog(false);
      setSuccess('پینکۆد بە سەرکەوتوویی هەڵگیرا!');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('پینکۆد دەبێت لانیکەم 4 ژمارە بێت و تەنها ژمارە بێت');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getPrintSettingValue = (key, defaultValue = '') => {
    const setting = allAppSettings.find(s => s.setting_key === `print_${key}`);
    return setting ? setting.setting_value : defaultValue;
  };

  const handlePrint = async (expense) => {
    await refetchTemplates();
    
    const defaultTemplate = printTemplates.find(t => t.template_type === 'invoice' && t.is_default);
    
    if (!defaultTemplate) {
      alert('هیچ تێمپلەیتێکی بنەڕەتی بۆ وەسڵ نەدۆزرایەوە');
      return;
    }

    const companyName = getPrintSettingValue('header_company_name', 'نەسرەدین رۆژبەیانی');
    const logoUrl = getPrintSettingValue('header_logo_url', '');
    const logoSize = getPrintSettingValue('header_logo_size', '60');

    const selectedColumnKeys = Object.keys(printColumns).filter(key => printColumns[key]);
    const columnMap = {
      expense_date: 'بەروار',
      invoice_number: 'ژمارەی وەسڵ',
      driver_name: 'ناوی شۆفێر',
      driver_number: 'ژمارە',
      trailer_type: 'جۆری تێکەرە',
      amount: 'بڕی پارە',
      is_paid: 'پارەدراوە',
      description: 'تێبینی'
    };

    const headers = selectedColumnKeys.map(key => columnMap[key]);
    
    const cells = selectedColumnKeys.map(key => {
      if (key === 'expense_date') return expense.expense_date;
      if (key === 'invoice_number') return expense.invoice_number || '-';
      if (key === 'driver_name') return expense.driver_name || '-';
      if (key === 'driver_number') return expense.driver_number || '-';
      if (key === 'trailer_type') return expense.trailer_type;
      if (key === 'amount') return formatCurrency(expense.amount);
      if (key === 'is_paid') return expense.is_paid ? '✓ دراوە' : '✗ نەدراوە';
      if (key === 'description') return expense.description || '-';
      return '';
    });

    let headerHtml = `<div class="company-name">${companyName}</div><div class="report-title">وەسڵ تێکەرە</div><div class="report-period">${expense.expense_date}</div>`;
    
    if (logoUrl) {
      headerHtml = `<div style="text-align: center; margin-bottom: 15px;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto;" /></div>${headerHtml}`;
    }

    let html = defaultTemplate.html_content
      .replace(/<div class="header">[\s\S]*?<\/div>/, `<div class="header">${headerHtml}</div>`)
      .replace(/\{\{total_records\}\}/g, '1')
      .replace(/\{\{total_iqd\}\}/g, formatCurrency(expense.amount))
      .replace(/\{\{print_date\}\}/g, format(new Date(), 'yyyy-MM-dd • HH:mm'));

    const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
    html = html.replace(/\{\{table_headers\}\}/g, headersHtml);

    const rowHtml = `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    html = html.replace(/\{\{table_rows\}\}/g, rowHtml);

    const totalRowHtml = `<tr class="total-row"><td colspan="${selectedColumnKeys.length - 1}">کۆی گشتی</td><td>${formatCurrency(expense.amount)}</td></tr>`;
    html = html.replace(/\{\{total_rows\}\}/g, totalRowHtml);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>وەسڵ</title><style>${defaultTemplate.css_content || ''}</style></head><body>${html}<script>window.onload = function() { window.print(); };</script></body></html>`);
    printWindow.document.close();
  };

  const handleBulkPrint = async () => {
    await refetchTemplates();
    
    const defaultTemplate = printTemplates.find(t => t.template_type === 'bulk_report' && t.is_default);
    if (!defaultTemplate) {
      alert('هیچ تێمپلەیتێکی بنەڕەتی بۆ ڕاپۆرت نەدۆزرایەوە');
      return;
    }

    const expensesToPrint = selectedExpenses.length > 0 
      ? filteredExpenses.filter(e => selectedExpenses.includes(e.id))
      : filteredExpenses;
    
    if (expensesToPrint.length === 0) {
        alert('هیچ خەرجییەک نییە بۆ چاپکردن.');
        return;
    }

    const companyName = getPrintSettingValue('header_company_name', 'نەسرەدین رۆژبەیانی');
    const logoUrl = getPrintSettingValue('header_logo_url', '');
    const logoSize = getPrintSettingValue('header_logo_size', '60');

    const selectedColumnKeys = Object.keys(printColumns).filter(key => printColumns[key]);
    const columnMap = {
      expense_date: 'بەروار',
      invoice_number: 'ژمارەی وەسڵ',
      driver_name: 'ناوی شۆفێر',
      driver_number: 'ژمارە',
      trailer_type: 'جۆری تێکەرە',
      amount: 'بڕی پارە',
      is_paid: 'پارەدراوە',
      description: 'تێبینی'
    };

    const headers = selectedColumnKeys.map(key => columnMap[key]);
    
    const rowsHtml = expensesToPrint.map(exp => {
      const cells = selectedColumnKeys.map(key => {
        if (key === 'expense_date') return exp.expense_date;
        if (key === 'invoice_number') return exp.invoice_number || '-';
        if (key === 'driver_name') return exp.driver_name || '-';
        if (key === 'driver_number') return exp.driver_number || '-';
        if (key === 'trailer_type') return exp.trailer_type;
        if (key === 'amount') return formatCurrency(exp.amount);
        if (key === 'is_paid') return exp.is_paid ? '✓ دراوە' : '✗ نەدراوە';
        if (key === 'description') return exp.description || '-';
        return '';
      });
      return `<tr>${cells.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');

    const total = expensesToPrint.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalRowHtml = `<tr class="total-row"><td colspan="${selectedColumnKeys.length - 1}">کۆی گشتی</td><td>${formatCurrency(total)}</td></tr>`;

    let headerHtml = `<div class="company-name">${companyName}</div><div class="report-title">ڕاپۆرتی تێکەرە</div><div class="report-period">${selectedMonth !== 'all' ? selectedMonth : 'هەموو مانگەکان'}</div>`;
    
    if (logoUrl) {
      headerHtml = `<div style="text-align: center; margin-bottom: 15px;"><img src="${logoUrl}" alt="Logo" style="height: ${logoSize}px; width: auto;" /></div>${headerHtml}`;
    }

    let html = defaultTemplate.html_content
      .replace(/<div class="header">[\s\S]*?<\/div>/, `<div class="header">${headerHtml}</div>`)
      .replace(/\{\{total_records\}\}/g, expensesToPrint.length.toString())
      .replace(/\{\{total_iqd\}\}/g, formatCurrency(total))
      .replace(/\{\{print_date\}\}/g, format(new Date(), 'yyyy-MM-dd • HH:mm'));

    const headersHtml = headers.map(h => `<th>${h}</th>`).join('');
    html = html.replace(/\{\{table_headers\}\}/g, headersHtml);
    html = html.replace(/\{\{table_rows\}\}/g, rowsHtml);
    html = html.replace(/\{\{total_rows\}\}/g, totalRowHtml);

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>ڕاپۆرت</title><style>${defaultTemplate.css_content || ''}</style></head><body>${html}<script>window.onload = function() { window.print(); };</script></body></html>`);
    printWindow.document.close();
    setShowPrintDialog(false);
  };

  const exportToExcel = () => {
    const expensesToExport = selectedExpenses.length > 0 
      ? filteredExpenses.filter(e => selectedExpenses.includes(e.id))
      : filteredExpenses;

    if (expensesToExport.length === 0) {
        alert('هیچ خەرجییەک نییە بۆ هەناردەکردن.');
        return;
    }

    const columnMap = {
      expense_date: 'بەروار',
      invoice_number: 'ژمارەی وەسڵ',
      driver_name: 'ناوی شۆفێر',
      driver_number: 'ژمارە',
      trailer_type: 'جۆری تێکەرە',
      amount: 'بڕی پارە',
      is_paid: 'پارەدراوە',
      description: 'تێبینی'
    };

    const selectedColumnKeys = Object.keys(exportColumns).filter(key => exportColumns[key]).reverse();
    const headers = selectedColumnKeys.map(key => columnMap[key]);

    const rows = expensesToExport.map(rec => {
      const row = [];
      selectedColumnKeys.forEach(key => {
        if (key === 'expense_date') row.push(rec.expense_date);
        else if (key === 'invoice_number') row.push(rec.invoice_number || '');
        else if (key === 'driver_name') row.push(rec.driver_name || '');
        else if (key === 'driver_number') row.push(rec.driver_number || '');
        else if (key === 'trailer_type') row.push(rec.trailer_type);
        else if (key === 'amount') row.push(rec.amount || 0);
        else if (key === 'is_paid') row.push(rec.is_paid ? 'بەڵێ' : 'نەخێر');
        else if (key === 'description') row.push(rec.description || '');
      });
      return row;
    });

    const total = expensesToExport.reduce((sum, e) => sum + (e.amount || 0), 0);
    rows.push([]); // Empty row for separation
    const totalRow = Array(selectedColumnKeys.length).fill('');
    const amountIndex = selectedColumnKeys.indexOf('amount');
    if (amountIndex !== -1) {
        totalRow[amountIndex] = total;
        totalRow[0] = 'کۆی گشتی';
    } else if (selectedColumnKeys.length > 0) {
        totalRow[0] = 'کۆی گشتی';
    }
    
    rows.push(totalRow);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trailers_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    setShowExportDialog(false);
  };

  const formatCurrency = (amount) => {
    if (!showAmounts) return '***';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Truck className="w-8 h-8" />
              بەڕێوەبردنی تێکەرە
            </h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setTempNormalRate(normalRate);
              setTempGharabilRate(gharabilRate);
              setShowSettingsDialog(true);
            }}
          >
            <SettingsIcon className="w-5 h-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAmounts(!showAmounts)}
          >
            {showAmounts ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedExpenses.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-blue-800 font-semibold">
                {selectedExpenses.length} تۆمار هەڵبژێردراوە
              </span>
              <div className="flex gap-2 flex-wrap">
                {!showDeleted ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkSoftDelete}
                  >
                    <Trash2 className="w-4 h-4 ml-2" />
                    سڕینەوە ({selectedExpenses.length})
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkRecover}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="w-4 h-4 ml-2" />
                      گەڕاندنەوە
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkPermanentDelete}
                    >
                      <Flame className="w-4 h-4 ml-2" />
                      سڕینەوەی هەمیشەیی
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedExpenses([])}
                >
                  پاشگەزبوونەوە
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">کۆی گشتی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalAmount)}</div>
              <p className="text-xs opacity-80 mt-1">{filteredExpenses.length} تۆمار</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">پارە نەدراوە</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(unpaidAmount)}</div>
              <p className="text-xs opacity-80 mt-1">{filteredExpenses.filter(e => !e.is_paid).length} تۆمار</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">تێکەرەی عادی</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{normalCount}</div>
              <p className="text-xs opacity-80 mt-1">{formatCurrency(normalCount * normalRate)}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">تێکەرەی غەربیل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{gharabilCount}</div>
              <p className="text-xs opacity-80 mt-1">{formatCurrency(gharabilCount * gharabilRate)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="add-expense">زیادکردنی خەرجی</TabsTrigger>
            <TabsTrigger value="drivers">شۆفێرەکان ({trailerDrivers.length})</TabsTrigger>
            <TabsTrigger value="reports">ڕاپۆرتەکان</TabsTrigger>
          </TabsList>

          {/* Add Expense Tab */}
          <TabsContent value="add-expense">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
                <CardTitle>زیادکردنی خەرجیی نوێ</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleExpenseSubmit} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>بەروار</Label>
                      <Input
                        type="date"
                        value={expenseForm.expense_date}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, expense_date: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        ژمارەی وەسڵ
                      </Label>
                      <Input
                        type="text"
                        value={expenseForm.invoice_number}
                        onChange={(e) => setExpenseForm(prev => ({ ...prev, invoice_number: e.target.value }))}
                        placeholder="No.1568, No.55 ..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>جۆری تێکەرە <span className="text-red-500">*</span></Label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => handleTrailerTypeChange('عادی')}
                        className={`p-6 rounded-lg border-2 font-bold transition-all ${
                          expenseForm.trailer_type === 'عادی'
                            ? 'bg-blue-100 border-blue-500 text-blue-700 shadow-md'
                            : 'bg-white border-gray-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="text-xl mb-2">تێکەرەی عادی</div>
                        <div className="text-2xl font-bold text-blue-600">{formatCurrency(normalRate)}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTrailerTypeChange('غەربیل')}
                        className={`p-6 rounded-lg border-2 font-bold transition-all ${
                          expenseForm.trailer_type === 'غەربیل'
                            ? 'bg-orange-100 border-orange-500 text-orange-700 shadow-md'
                            : 'bg-white border-gray-200 hover:border-orange-300'
                        }`}
                      >
                        <div className="text-xl mb-2">تێکەرەی غەربیل</div>
                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(gharabilRate)}</div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>شۆفێر</Label>
                    <Select value={expenseForm.driver_id} onValueChange={handleDriverSelect}>
                      <SelectTrigger>
                        <SelectValue placeholder="شۆفێر هەڵبژێرە" />
                      </SelectTrigger>
                      <SelectContent>
                        {trailerDrivers.map(driver => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.driver_name} (#{driver.driver_number})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>بڕی پارە <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      step="1"
                      value={expenseForm.amount}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                      required
                      className="text-2xl font-bold"
                      readOnly
                    />
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse bg-blue-50 p-4 rounded-lg">
                    <Checkbox
                      id="is_paid"
                      checked={expenseForm.is_paid}
                      onCheckedChange={(checked) => setExpenseForm(prev => ({ ...prev, is_paid: checked }))}
                    />
                    <Label htmlFor="is_paid" className="cursor-pointer">پارەدراوە ✓</Label>
                  </div>

                  <div className="space-y-2">
                    <Label>تێبینی</Label>
                    <Input
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="تێبینی"
                    />
                  </div>

                  <Button type="submit" className="w-full text-lg py-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                    <Save className="w-5 h-5 ml-2" />
                    تۆمارکردن
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Drivers Tab */}
          <TabsContent value="drivers">
            <Card className="border-none shadow-xl">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    شۆفێرەکانی تێکەرە
                  </CardTitle>
                  <Button onClick={() => {
                    setEditingDriver(null);
                    setDriverForm({
                      driver_name: '',
                      driver_number: '',
                      assigned_months: []
                    });
                    setShowDriverDialog(true);
                  }}>
                    <Plus className="w-4 h-4 ml-2" />
                    زیادکردنی شۆفێر
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid gap-4">
                  {trailerDrivers.map(driver => (
                    <div key={driver.id} className="bg-white p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{driver.driver_name}</h3>
                          <p className="text-sm text-gray-600">ژمارە: {driver.driver_number}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="icon" onClick={() => handleEditDriver(driver)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="destructive" size="icon" onClick={() => handleDeleteDriver(driver.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {trailerDrivers.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>هیچ شۆفێرێک زیادنەکراوە</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  onClick={() => setShowExportDialog(true)}
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4" />
                  Excel {selectedExpenses.length > 0 ? `(${selectedExpenses.length})` : `(${filteredExpenses.length})`}
                </Button>
                <Button
                  onClick={() => setShowPrintDialog(true)}
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Printer className="w-4 h-4" />
                  چاپکردن {selectedExpenses.length > 0 ? `(${selectedExpenses.length})` : `(${filteredExpenses.length})`}
                </Button>
                <Button
                  variant={showDeleted ? "default" : "outline"}
                  onClick={() => {
                    setShowDeleted(!showDeleted);
                    setSelectedExpenses([]);
                  }}
                  className="gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  سڕاوەکان ({deletedCount})
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPinDialog(true)}
                  className="gap-2"
                >
                  <Lock className="w-4 h-4" />
                  پینکۆد
                </Button>
              </div>

              {/* Filters */}
              <Card className="border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="w-5 h-5" />
                      <CardTitle>فلتەرەکان</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length}
                        onCheckedChange={handleSelectAll}
                        id="select-all"
                      />
                      <Label htmlFor="select-all" className="cursor-pointer text-sm">
                        هەڵبژاردنی هەموو ({filteredExpenses.length})
                      </Label>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="space-y-2">
                      <Label>ژمارەی وەسڵ</Label>
                      <Input
                        type="text"
                        value={invoiceSearch}
                        onChange={(e) => setInvoiceSearch(e.target.value)}
                        placeholder="No.1568, No.55 ..."
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>مانگ</Label>
                      <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">هەموو مانگەکان</SelectItem>
                          {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{month}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>شۆفێر</Label>
                      <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">هەموو شۆفێرەکان</SelectItem>
                          {trailerDrivers.map(driver => (
                            <SelectItem key={driver.id} value={driver.id}>{driver.driver_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>جۆری تێکەرە</Label>
                      <Select value={selectedTrailerType} onValueChange={setSelectedTrailerType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">هەموویان</SelectItem>
                          <SelectItem value="عادی">تێکەرەی عادی</SelectItem>
                          <SelectItem value="غەربیل">تێکەرەی غەربیل</SelectItem>
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
                  </div>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="border-none shadow-xl">
                <CardHeader className="bg-gradient-to-r from-gray-100 to-gray-200 border-b">
                  <CardTitle>لیستی خەرجییەکان ({filteredExpenses.length})</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-3 text-right text-xs font-bold border-b w-12">
                            <Checkbox
                              checked={filteredExpenses.length > 0 && selectedExpenses.length === filteredExpenses.length}
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                          <th className="p-3 text-right text-xs font-bold border-b">بەروار</th>
                          <th className="p-3 text-right text-xs font-bold border-b">ژمارەی وەسڵ</th>
                          <th className="p-3 text-right text-xs font-bold border-b">شۆفێر</th>
                          <th className="p-3 text-right text-xs font-bold border-b">جۆری تێکەرە</th>
                          <th className="p-3 text-right text-xs font-bold border-b">بڕی پارە</th>
                          <th className="p-3 text-right text-xs font-bold border-b">باری پارە</th>
                          <th className="p-3 text-right text-xs font-bold border-b">تێبینی</th>
                          <th className="p-3 text-right text-xs font-bold border-b w-32">کردارەکان</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredExpenses.map((exp, idx) => (
                          <tr key={exp.id} className={`border-b hover:bg-blue-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                            <td className="p-3 border-r border-gray-200">
                              <Checkbox
                                checked={selectedExpenses.includes(exp.id)}
                                onCheckedChange={() => handleSelectExpense(exp.id)}
                              />
                            </td>
                            <td className="p-3 text-sm font-medium">{exp.expense_date}</td>
                            <td className="p-3 text-sm">
                              {exp.invoice_number && (
                                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                                  <Receipt className="w-3 h-3 ml-1" />
                                  {exp.invoice_number}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-sm">
                              <div className="font-semibold">{exp.driver_name || '-'}</div>
                              <div className="text-xs text-gray-600">{exp.driver_number || '-'}</div>
                            </td>
                            <td className="p-3">
                              <Badge className={exp.trailer_type === 'عادی' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}>
                                {exp.trailer_type}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm font-bold text-emerald-600">{formatCurrency(exp.amount)}</td>
                            <td className="p-3">
                              {!showDeleted ? (
                                <Checkbox
                                  checked={exp.is_paid}
                                  onCheckedChange={() => handleTogglePaid(exp)}
                                  className="data-[state=checked]:bg-green-600"
                                />
                              ) : (
                                <Badge className={exp.is_paid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                  {exp.is_paid ? '✓' : '✗'}
                                </Badge>
                              )}
                            </td>
                            <td className="p-3 text-sm text-gray-600">{exp.description || '-'}</td>
                            {!showDeleted ? (
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePrint(exp)}
                                    className="h-7 w-7"
                                    title="چاپکردن"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </Button>
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
                              </td>
                            ) : (
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button
                                    size="icon"
                                    onClick={() => handleRecover(exp.id)}
                                    className="h-7 w-7 bg-green-600 hover:bg-green-700"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    onClick={() => handlePermanentDelete(exp.id)}
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
                      <tfoot>
                        <tr className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold">
                          <td colSpan="5" className="p-4 text-right text-lg border-t-2">کۆی گشتی</td>
                          <td className="p-4 text-xl border-t-2">{formatCurrency(totalAmount)}</td>
                          <td colSpan="3" className="p-4 border-t-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                    {filteredExpenses.length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Truck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>هیچ تۆمارێک نەدۆزرایەوە</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Driver Dialog */}
        <Dialog open={showDriverDialog} onOpenChange={setShowDriverDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDriver ? 'دەستکاریکردنی شۆفێر' : 'زیادکردنی شۆفێری نوێ'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleDriverSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>ناوی شۆفێر</Label>
                <Input
                  value={driverForm.driver_name}
                  onChange={(e) => setDriverForm(prev => ({ ...prev, driver_name: e.target.value }))}
                  required
                />
              </div>
              {editingDriver && (
                <div className="space-y-2">
                  <Label>ژمارەی شۆفێر</Label>
                  <Input
                    value={driverForm.driver_number}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowDriverDialog(false)}>
                  پاشگەزبوونەوە
                </Button>
                <Button type="submit">
                  {editingDriver ? 'نوێکردنەوە' : 'زیادکردن'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                ڕێکخستنی نرخەکان
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>نرخی تێکەرەی عادی</Label>
                <Input
                  type="number"
                  value={tempNormalRate}
                  onChange={(e) => setTempNormalRate(parseFloat(e.target.value) || 0)}
                  className="text-2xl font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label>نرخی تێکەرەی غەربیل</Label>
                <Input
                  type="number"
                  value={tempGharabilRate}
                  onChange={(e) => setTempGharabilRate(parseFloat(e.target.value) || 0)}
                  className="text-2xl font-bold"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowSettingsDialog(false)}>
                  پاشگەزبوونەوە
                </Button>
                <Button onClick={handleSaveRates}>
                  <Save className="w-4 h-4 ml-2" />
                  پاشەکەوتکردن
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>دەستکاریکردنی خەرجی</DialogTitle>
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
                  <Label>ژمارەی وەسڵ</Label>
                  <Input
                    value={editingExpense.invoice_number || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, invoice_number: e.target.value })}
                    placeholder="No.1568"
                  />
                </div>
                <div className="space-y-2">
                  <Label>جۆری تێکەرە</Label>
                  <Select
                    value={editingExpense.trailer_type}
                    onValueChange={(value) => setEditingExpense({ ...editingExpense, trailer_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="عادی">تێکەرەی عادی</SelectItem>
                      <SelectItem value="غەربیل">تێکەرەی غەربیل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>بڕی پارە</Label>
                  <Input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: e.target.value })}
                    className="text-2xl font-bold"
                  />
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id="is_paid_edit"
                    checked={editingExpense.is_paid}
                    onCheckedChange={(checked) => setEditingExpense({ ...editingExpense, is_paid: checked })}
                  />
                  <Label htmlFor="is_paid_edit" className="cursor-pointer">پارەدراوە</Label>
                </div>
                <div className="space-y-2">
                  <Label>تێبینی</Label>
                  <Input
                    value={editingExpense.description || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                    پاشگەزبوونەوە
                  </Button>
                  <Button onClick={handleSaveEdit}>
                    نوێکردنەوە
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* PIN Dialog */}
        <Dialog open={showPinDialog} onOpenChange={setShowPinDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>پینکۆدی سڕینەوەی هەمیشەیی</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-pin">پینکۆد (لانیکەم 4 ژمارە)</Label>
                <Input
                  id="delete-pin"
                  type="password"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  placeholder="1234"
                  maxLength={6}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowPinDialog(false)}>پاشگەزبوونەوە</Button>
                <Button onClick={handleSaveDeletePin}>پاشەکەوتکردن</Button>
              </DialogFooter>
            </div>
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
                <div key={key} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`export-col-${key}`}
                    checked={exportColumns[key]}
                    onCheckedChange={(checked) => setExportColumns(prev => ({ ...prev, [key]: checked }))}
                  />
                  <Label htmlFor={`export-col-${key}`}>
                    {key === 'expense_date' && 'بەروار'}
                    {key === 'invoice_number' && 'ژمارەی وەسڵ'}
                    {key === 'driver_name' && 'ناوی شۆفێر'}
                    {key === 'driver_number' && 'ژمارە'}
                    {key === 'trailer_type' && 'جۆری تێکەرە'}
                    {key === 'amount' && 'بڕی پارە'}
                    {key === 'is_paid' && 'پارەدراوە'}
                    {key === 'description' && 'تێبینی'}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowExportDialog(false)}>پاشگەزبوونەوە</Button>
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
                <div key={key} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`print-col-${key}`}
                    checked={printColumns[key]}
                    onCheckedChange={(checked) => setPrintColumns(prev => ({ ...prev, [key]: checked }))}
                  />
                  <Label htmlFor={`print-col-${key}`}>
                    {key === 'expense_date' && 'بەروار'}
                    {key === 'invoice_number' && 'ژمارەی وەسڵ'}
                    {key === 'driver_name' && 'ناوی شۆفێر'}
                    {key === 'driver_number' && 'ژمارە'}
                    {key === 'trailer_type' && 'جۆری تێکەرە'}
                    {key === 'amount' && 'بڕی پارە'}
                    {key === 'is_paid' && 'پارەدراوە'}
                    {key === 'description' && 'تێبینی'}
                  </Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPrintDialog(false)}>پاشگەزبوونەوە</Button>
              <Button onClick={handleBulkPrint}>چاپکردن</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
