
import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowRight, Download, Database, Mail, CheckCircle2, AlertCircle, FileJson, FileCode, Clock, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

export default function Backup() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [currentUser, setCurrentUser] = useState(null);
  const [exportFormat, setExportFormat] = useState('json');
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupEmail, setAutoBackupEmail] = useState('');
  const [timeUntilNextBackup, setTimeUntilNextBackup] = useState('');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetPinInput, setResetPinInput] = useState('');

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

    const savedAutoBackup = localStorage.getItem('autoBackupEnabled');
    const savedEmail = localStorage.getItem('autoBackupEmail');
    if (savedAutoBackup === 'true') {
      setAutoBackupEnabled(true);
      setAutoBackupEmail(savedEmail || '');
    }
  }, []);

  // Update countdown display only (actual backup logic is in Layout now)
  useEffect(() => {
    const updateCountdown = () => {
      const lastBackupTime = localStorage.getItem('lastAutoBackupTime');
      if (!lastBackupTime || !autoBackupEnabled) {
        setTimeUntilNextBackup('');
        return;
      }

      const now = new Date().getTime();
      const nextBackupTime = parseInt(lastBackupTime) + (24 * 60 * 60 * 1000);
      const timeLeft = nextBackupTime - now;

      if (timeLeft <= 0) {
        setTimeUntilNextBackup('داگرتنی پاشەکەوت...');
        return;
      }

      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

      setTimeUntilNextBackup(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [autoBackupEnabled]);

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
    initialData: [],
  });

  const { data: allDrivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
    initialData: [],
  });

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const { data: allExpenseTypes = [] } = useQuery({
    queryKey: ['expenseTypes'],
    queryFn: () => base44.entities.ExpenseType.list(),
    initialData: [],
  });

  const { data: allAppSettings = [] } = useQuery({
    queryKey: ['appSettings'],
    queryFn: () => base44.entities.AppSetting.list(),
    initialData: [],
  });

  const { data: allPrintTemplates = [] } = useQuery({
    queryKey: ['printTemplates'],
    queryFn: () => base44.entities.PrintTemplate.list(),
    initialData: [],
  });

  const expenses = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allExpenses
    : allExpenses.filter(exp => exp.created_by === currentUser?.email);

  const drivers = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allDrivers
    : allDrivers.filter(d => d.created_by === currentUser?.email);

  const employees = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allEmployees
    : allEmployees.filter(e => e.created_by === currentUser?.email);

  const expenseTypes = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allExpenseTypes
    : allExpenseTypes.filter(t => t.created_by === currentUser?.email);

  const appSettings = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allAppSettings
    : [];

  const printTemplates = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allPrintTemplates
    : [];

  const getFilteredExpenses = () => {
    if (selectedMonth === 'all') return expenses;
    
    const [year, month] = selectedMonth.split('-');
    const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
    const monthEnd = endOfMonth(new Date(parseInt(year), parseInt(month) - 1));
    
    return expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate >= monthStart && expDate <= monthEnd;
    });
  };

  const availableMonths = Array.from(new Set(allExpenses.map(exp => {
    const date = new Date(exp.expense_date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }))).sort().reverse();

  const generateJSONBackup = () => {
    return {
      timestamp: new Date().toISOString(),
      version: '2.0',
      month: 'all',
      data: {
        expenses: expenses,
        drivers: drivers,
        employees: employees,
        expenseTypes: expenseTypes,
        appSettings: appSettings,
        printTemplates: printTemplates
      }
    };
  };

  const generateSQLBackup = () => {
    const filteredExpenses = getFilteredExpenses();
    
    let sql = '-- Expense Tracking System Database Backup\n';
    sql += `-- Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n`;
    sql += `-- Month: ${selectedMonth === 'all' ? 'All' : selectedMonth}\n`;
    sql += `-- Version: 2.0\n\n`;

    if (selectedMonth === 'all') {
      // Export Drivers
      sql += '-- Drivers Table\n';
      sql += 'CREATE TABLE IF NOT EXISTS drivers (\n';
      sql += '  id VARCHAR(255) PRIMARY KEY,\n';
      sql += '  driver_name VARCHAR(255),\n';
      sql += '  driver_number VARCHAR(255),\n';
      sql += '  phone VARCHAR(255),\n';
      sql += '  hourly_rate DECIMAL(10, 2),\n';
      sql += '  overtime_rate DECIMAL(10, 2),\n';
      sql += '  currency VARCHAR(10),\n';
      sql += '  assigned_months TEXT,\n';
      sql += '  created_date TIMESTAMP,\n';
      sql += '  created_by VARCHAR(255)\n';
      sql += ');\n\n';

      drivers.forEach(driver => {
        const assignedMonthsStr = Array.isArray(driver.assigned_months) ? driver.assigned_months.join(',') : '';
        sql += `INSERT INTO drivers (id, driver_name, driver_number, phone, hourly_rate, overtime_rate, currency, assigned_months, created_date, created_by) VALUES ('${driver.id}', '${(driver.driver_name || '').replace(/'/g, "''")}', '${driver.driver_number || ''}', '${driver.phone || ''}', ${driver.hourly_rate || 0}, ${driver.overtime_rate || 0}, '${driver.currency || 'IQD'}', '${assignedMonthsStr}', '${driver.created_date}', '${driver.created_by}');\n`;
      });

      // Export Employees
      sql += '\n-- Employees Table\n';
      sql += 'CREATE TABLE IF NOT EXISTS employees (\n';
      sql += '  id VARCHAR(255) PRIMARY KEY,\n';
      sql += '  employee_name VARCHAR(255),\n';
      sql += '  employee_number VARCHAR(255),\n';
      sql += '  salary DECIMAL(10, 2),\n';
      sql += '  currency VARCHAR(10),\n';
      sql += '  payment_date DATE,\n';
      sql += '  is_paid BOOLEAN,\n';
      sql += '  assigned_months TEXT,\n';
      sql += '  created_date TIMESTAMP,\n';
      sql += '  created_by VARCHAR(255)\n';
      sql += ');\n\n';

      employees.forEach(emp => {
        const assignedMonthsStr = Array.isArray(emp.assigned_months) ? emp.assigned_months.join(',') : '';
        sql += `INSERT INTO employees (id, employee_name, employee_number, salary, currency, payment_date, is_paid, assigned_months, created_date, created_by) VALUES ('${emp.id}', '${(emp.employee_name || '').replace(/'/g, "''")}', '${emp.employee_number || ''}', ${emp.salary || 0}, '${emp.currency || 'IQD'}', '${emp.payment_date || ''}', ${emp.is_paid ? 'TRUE' : 'FALSE'}, '${assignedMonthsStr}', '${emp.created_date}', '${emp.created_by}');\n`;
      });

      // Export Expense Types
      sql += '\n-- Expense Types Table\n';
      sql += 'CREATE TABLE IF NOT EXISTS expense_types (\n';
      sql += '  id VARCHAR(255) PRIMARY KEY,\n';
      sql += '  type_name VARCHAR(255),\n';
      sql += '  color VARCHAR(50),\n';
      sql += '  created_date TIMESTAMP,\n';
      sql += '  created_by VARCHAR(255)\n';
      sql += ');\n\n';

      expenseTypes.forEach(type => {
        sql += `INSERT INTO expense_types (id, type_name, color, created_date, created_by) VALUES ('${type.id}', '${(type.type_name || '').replace(/'/g, "''")}', '${type.color || ''}', '${type.created_date}', '${type.created_by}');\n`;
      });

      // Export App Settings
      if (appSettings.length > 0) {
        sql += '\n-- App Settings Table\n';
        sql += 'CREATE TABLE IF NOT EXISTS app_settings (\n';
        sql += '  id VARCHAR(255) PRIMARY KEY,\n';
        sql += '  setting_key VARCHAR(255),\n';
        sql += '  setting_value TEXT,\n';
        sql += '  setting_category VARCHAR(100),\n';
        sql += '  description TEXT,\n';
        sql += '  created_date TIMESTAMP,\n';
        sql += '  created_by VARCHAR(255)\n';
        sql += ');\n\n';

        appSettings.forEach(setting => {
          sql += `INSERT INTO app_settings (id, setting_key, setting_value, setting_category, description, created_date, created_by) VALUES ('${setting.id}', '${(setting.setting_key || '').replace(/'/g, "''")}', '${(setting.setting_value || '').replace(/'/g, "''")}', '${setting.setting_category || ''}', '${(setting.description || '').replace(/'/g, "''")}', '${setting.created_date}', '${setting.created_by}');\n`;
        });
      }

      // Export Print Templates
      if (printTemplates.length > 0) {
        sql += '\n-- Print Templates Table\n';
        sql += 'CREATE TABLE IF NOT EXISTS print_templates (\n';
        sql += '  id VARCHAR(255) PRIMARY KEY,\n';
        sql += '  template_name VARCHAR(255),\n';
        sql += '  template_type VARCHAR(100),\n';
        sql += '  html_content TEXT,\n';
        sql += '  css_content TEXT,\n';
        sql += '  is_default BOOLEAN,\n';
        sql += '  description TEXT,\n';
        sql += '  created_date TIMESTAMP,\n';
        sql += '  created_by VARCHAR(255)\n';
        sql += ');\n\n';

        printTemplates.forEach(template => {
          sql += `INSERT INTO print_templates (id, template_name, template_type, html_content, css_content, is_default, description, created_date, created_by) VALUES ('${template.id}', '${(template.template_name || '').replace(/'/g, "''")}', '${template.template_type || ''}', '${(template.html_content || '').replace(/'/g, "''")}', '${(template.css_content || '').replace(/'/g, "''")}', ${template.is_default ? 'TRUE' : 'FALSE'}, '${(template.description || '').replace(/'/g, "''")}', '${template.created_date}', '${template.created_by}');\n`;
        });
      }
    }

    // Export Expenses
    sql += '\n-- Expenses Table\n';
    sql += 'CREATE TABLE IF NOT EXISTS expenses (\n';
    sql += '  id VARCHAR(255) PRIMARY KEY,\n';
    sql += '  expense_date DATE,\n';
    sql += '  driver_id VARCHAR(255),\n';
    sql += '  driver_name VARCHAR(255),\n';
    sql += '  driver_number VARCHAR(255),\n';
    sql += '  expense_type VARCHAR(255),\n';
    sql += '  hours DECIMAL(10, 2),\n';
    sql += '  hourly_rate DECIMAL(10, 2),\n';
    sql += '  is_overtime BOOLEAN,\n';
    sql += '  amount DECIMAL(10, 2),\n';
    sql += '  currency VARCHAR(10),\n';
    sql += '  is_paid BOOLEAN,\n';
    sql += '  is_deleted BOOLEAN,\n';
    sql += '  description TEXT,\n';
    sql += '  created_date TIMESTAMP,\n';
    sql += '  created_by VARCHAR(255)\n';
    sql += ');\n\n';

    filteredExpenses.forEach(exp => {
      sql += `INSERT INTO expenses (id, expense_date, driver_id, driver_name, driver_number, expense_type, hours, hourly_rate, is_overtime, amount, currency, is_paid, is_deleted, description, created_date, created_by) VALUES ('${exp.id}', '${exp.expense_date}', '${exp.driver_id || ''}', '${(exp.driver_name || '').replace(/'/g, "''")}', '${exp.driver_number || ''}', '${(exp.expense_type || '').replace(/'/g, "''")}', ${exp.hours || 0}, ${exp.hourly_rate || 0}, ${exp.is_overtime ? 'TRUE' : 'FALSE'}, ${exp.amount || 0}, '${exp.currency || 'IQD'}', ${exp.is_paid ? 'TRUE' : 'FALSE'}, ${exp.is_deleted ? 'TRUE' : 'FALSE'}, '${(exp.description || '').replace(/'/g, "''")}', '${exp.created_date}', '${exp.created_by}');\n`;
    });

    return sql;
  };

  const generateExcelCSV = () => {
    const columnMap = {
      record_date: 'بەروار',
      type: 'جۆر',
      name: 'ناو',
      number: 'ژمارە',
      category: 'جۆری خەرجی/مووچە',
      hours: 'کاتژمێر',
      hourly_rate: 'کرێی کاتژمێر',
      amount: 'بڕی پارە',
      currency: 'دراو',
      is_paid: 'پارەدراوە',
      is_overtime: 'کاتژمێری زیادە',
      description: 'تێبینی'
    };

    // Convert expenses to records
    const expenseRecords = expenses.map(exp => ({
      record_date: exp.expense_date,
      type: 'خەرجی',
      name: exp.driver_name || '-',
      number: exp.driver_number || '-',
      category: exp.expense_type,
      hours: exp.hours || '-',
      hourly_rate: exp.hourly_rate || '-',
      amount: exp.amount || 0,
      currency: exp.currency || 'IQD',
      is_paid: exp.is_paid ? 'بەڵێ' : 'نەخێر',
      is_overtime: exp.is_overtime ? 'بەڵێ' : 'نەخێر',
      description: exp.description || '-'
    }));

    // Convert employees to records
    const employeeRecords = employees.map(emp => ({
      record_date: emp.payment_date || '-',
      type: 'کارمەند',
      name: emp.employee_name,
      number: emp.employee_number,
      category: 'مووچەی کارمەند',
      hours: '-',
      hourly_rate: '-',
      amount: emp.salary || 0,
      currency: emp.currency || 'IQD',
      is_paid: emp.is_paid ? 'بەڵێ' : 'نەخێر',
      is_overtime: 'نەخێر',
      description: 'مووچە'
    }));

    const allRecords = [...expenseRecords, ...employeeRecords].sort((a, b) => {
      return new Date(b.record_date) - new Date(a.record_date);
    });

    const selectedColumnKeys = Object.keys(columnMap);
    const headers = selectedColumnKeys.map(key => columnMap[key]);

    const rows = allRecords.map(rec => {
      const row = [];
      selectedColumnKeys.forEach(key => {
        row.push(rec[key]);
      });
      return row;
    });

    // Add totals
    const totalIQD = allRecords.filter(r => r.currency === 'IQD').reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalUSD = allRecords.filter(r => r.currency === 'USD').reduce((sum, r) => sum + (r.amount || 0), 0);
    const totalHours = allRecords.filter(r => r.type === 'خەرجی' && r.hours !== '-').reduce((sum, r) => sum + (parseFloat(r.hours) || 0), 0);

    rows.push([]); // Empty row
    
    const totalRowIQD = Array(selectedColumnKeys.length).fill('');
    const amountIndex = selectedColumnKeys.indexOf('amount');
    const currencyIndex = selectedColumnKeys.indexOf('currency');
    const labelIndex = selectedColumnKeys.indexOf('type');
    const hoursIndex = selectedColumnKeys.indexOf('hours');

    if (amountIndex !== -1) totalRowIQD[amountIndex] = totalIQD;
    if (currencyIndex !== -1) totalRowIQD[currencyIndex] = 'IQD';
    if (hoursIndex !== -1) totalRowIQD[hoursIndex] = totalHours.toFixed(1);
    totalRowIQD[labelIndex] = 'کۆی گشتی';
    rows.push(totalRowIQD);

    if (totalUSD > 0) {
      const totalRowUSD = Array(selectedColumnKeys.length).fill('');
      if (amountIndex !== -1) totalRowUSD[amountIndex] = totalUSD;
      if (currencyIndex !== -1) totalRowUSD[currencyIndex] = 'USD';
      totalRowUSD[labelIndex] = 'کۆی گشتی';
      rows.push(totalRowUSD);
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const BOM = '\uFEFF';
    const RTL_MARK = '\u200F';
    return BOM + RTL_MARK + csvContent;
  };

  // The sendAutoBackup function was removed from this component as its logic
  // is now handled by the Layout component for centralized automatic backup.

  const downloadFullBackup = async () => {
    setIsDownloading(true);
    setError('');
    
    try {
      const filteredExpenses = getFilteredExpenses();
      
      if (exportFormat === 'json') {
        let backupObject;
        if (selectedMonth === 'all') {
          backupObject = generateJSONBackup();
        } else {
          backupObject = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            month: selectedMonth,
            data: {
              expenses: filteredExpenses,
              drivers: [],
              employees: [],
              expenseTypes: [],
              appSettings: [],
              printTemplates: []
            }
          };
        }

        const jsonString = JSON.stringify(backupObject, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const filename = selectedMonth === 'all' 
          ? `backup_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`
          : `backup_${selectedMonth}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const sqlContent = generateSQLBackup();
        const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        const filename = selectedMonth === 'all' 
          ? `backup_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.sql`
          : `backup_${selectedMonth}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.sql`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setSuccess('پاشەکەوتکردن بە سەرکەوتوویی داگیرا');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error downloading backup:', err);
      setError('هەڵە لە داگرتنی پاشەکەوتکردن');
    }
    
    setIsDownloading(false);
  };

  const sendBackupToEmail = async () => {
    if (!email) {
      setError('تکایە ئیمەیڵ بنووسە');
      return;
    }

    setIsSending(true);
    setError('');
    
    try {
      const filteredExpenses = getFilteredExpenses();
      let blob, filename, fileType;
      
      if (exportFormat === 'json') {
        let backupObject;
        if (selectedMonth === 'all') {
          backupObject = generateJSONBackup();
        } else {
          backupObject = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            month: selectedMonth,
            data: {
              expenses: filteredExpenses,
              drivers: [],
              employees: [],
              expenseTypes: [],
              appSettings: [],
              printTemplates: []
            }
          };
        }

        const jsonString = JSON.stringify(backupObject, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
        filename = selectedMonth === 'all' 
          ? `backup_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`
          : `backup_${selectedMonth}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
        fileType = 'application/json';
      } else {
        const sqlContent = generateSQLBackup();
        blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
        filename = selectedMonth === 'all' 
          ? `backup_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.sql`
          : `backup_${selectedMonth}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.sql`;
        fileType = 'text/plain';
      }
      
      const file = new File([blob], filename, { type: fileType });
      const uploadResult = await base44.integrations.Core.UploadFile({ file: file });
      
      await base44.integrations.Core.SendEmail({
        to: email,
        subject: `Expense System Backup (${exportFormat.toUpperCase()}) - ${selectedMonth === 'all' ? 'Full Database' : selectedMonth} - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
        body: `پاشەکەوتکردنی سیستەمی خەرجی

بەرواری پاشەکەوتکردن: ${format(new Date(), 'yyyy-MM-dd HH:mm')}
مانگ: ${selectedMonth === 'all' ? 'هەموویان' : selectedMonth}
فۆرمات: ${exportFormat.toUpperCase()}

ژمارەی خەرجییەکان: ${filteredExpenses.length}
${selectedMonth === 'all' ? `ژمارەی شۆفێرەکان: ${drivers.length}
ژمارەی کارمەندان: ${employees.length}
ژمارەی جۆرەکان: ${expenseTypes.length}` : ''}

فایلی پاشەکەوتکردن:
${uploadResult.file_url}

---
سیستەمی بەڕێوەبردنی خەرجی`
      });
      
      setSuccess(`پاشەکەوتکردن بە سەرکەوتوویی نێردرا بۆ ${email}`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      console.error('Error sending backup to email:', err);
      setError('هەڵە لە ناردنی ئیمەیڵ: ' + (err.message || ''));
    }
    
    setIsSending(false);
  };

  const handleAutoBackupToggle = (enabled) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    if (enabled && autoBackupEmail) {
      localStorage.setItem('lastAutoBackupTime', new Date().getTime().toString());
    } else {
      localStorage.removeItem('lastAutoBackupTime');
    }
  };

  const handleAutoBackupEmailChange = (emailValue) => {
    setAutoBackupEmail(emailValue);
    localStorage.setItem('autoBackupEmail', emailValue);
    if (autoBackupEnabled && emailValue) {
        localStorage.setItem('lastAutoBackupTime', new Date().getTime().toString());
    }
  };

  const resetDatabase = async () => {
    const savedPin = localStorage.getItem('deletePin');
    
    if (!savedPin) {
      setError('تکایە یەکەم جار پینکۆد دابنێ لە ڕێکخستنەکان (لە لاپەڕەی ڕاپۆرتەکان)');
      return;
    }

    if (resetConfirmation !== 'RESET') {
      setError('تکایە RESET بنووسە بۆ دڵنیابوونەوە');
      return;
    }

    if (resetPinInput !== savedPin) {
      setError('پینکۆد هەڵەیە!');
      setResetPinInput('');
      return;
    }

    try {
      for (const expense of expenses) {
        await base44.entities.Expense.delete(expense.id);
      }

      for (const driver of drivers) {
        await base44.entities.Driver.delete(driver.id);
      }

      for (const employee of employees) {
        await base44.entities.Employee.delete(employee.id);
      }

      for (const type of expenseTypes) {
        await base44.entities.ExpenseType.delete(type.id);
      }

      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });

      setSuccess('بنکەی زانیارییەکان بە سەرکەوتوویی پاککرایەوە!');
      setShowResetDialog(false);
      setResetConfirmation('');
      setResetPinInput('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error resetting database:', err);
      setError('هەڵە لە پاککردنەوەی بنکەی زانیارییەکان: ' + (err.message || ''));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredExpensesForStats = getFilteredExpenses();
  
  // Get filtered employees for stats
  const filteredEmployeesForStats = useMemo(() => {
    if (selectedMonth === 'all') {
      return employees; // Use the already user-filtered 'employees' list
    }
    
    // Filter employees by selected month
    return employees.filter(emp => {
      const assignedMonths = emp.assigned_months;
      if (!assignedMonths || !Array.isArray(assignedMonths) || assignedMonths.length === 0) {
        return false;
      }
      return assignedMonths.includes(selectedMonth);
    });
  }, [employees, selectedMonth]); // Dependency on 'employees' (which is derived from 'allEmployees' and currentUser) and 'selectedMonth'
  
  // Calculate total including both expenses and employees
  const totalExpenses = filteredExpensesForStats.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const totalEmployeeSalaries = filteredEmployeesForStats.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  const totalCombined = totalExpenses + totalEmployeeSalaries;

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">پاشەکەوتکردنی زانیارییەکان</h1>
            <p className="text-gray-600 mt-1">داگرتن و ناردنی پاشەکەوتی تەواو</p>
          </div>
          <Button
            variant="destructive"
            onClick={() => setShowResetDialog(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            پاککردنەوەی بنکەی زانیارییەکان
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

        {/* Auto Backup Settings */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              پاشەکەوتی ئۆتۆماتیکی ڕۆژانە
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={autoBackupEnabled}
                  onCheckedChange={handleAutoBackupToggle}
                  id="auto-backup"
                />
                <Label htmlFor="auto-backup" className="text-base cursor-pointer">
                  چالاککردنی پاشەکەوتی ئۆتۆماتیکی ڕۆژانە (JSON + SQL + Excel)
                </Label>
              </div>
              
              {autoBackupEnabled && (
                <>
                  <div className="space-y-2">
                    <Label>ئیمەیڵ بۆ پاشەکەوتی ئۆتۆماتیک</Label>
                    <Input
                      type="email"
                      value={autoBackupEmail}
                      onChange={(e) => handleAutoBackupEmailChange(e.target.value)}
                      placeholder="example@email.com"
                    />
                  </div>
                  
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 mb-2">
                      <strong>3 فایل دەنێردرێت هەر 24 کاتژمێرێک:</strong>
                    </p>
                    <ul className="text-sm text-green-800 list-disc list-inside space-y-1">
                      <li>📄 JSON - بۆ گەڕاندنەوەی تەواوی بنکەی زانیارییەکان</li>
                      <li>💾 SQL - بۆ ئیمپۆرتکردن بۆ MySQL/PostgreSQL</li>
                      <li>📊 Excel (CSV) - بۆ شیکاری و ڕاپۆرتەکان</li>
                    </ul>
                  </div>
                  
                  {timeUntilNextBackup && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-800">
                        <Clock className="w-4 h-4" />
                        <span className="font-semibold">پاشەکەوتی دواتر:</span>
                        <span className="font-mono">{timeUntilNextBackup}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Month and Format Selector */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle>هەڵبژاردنەکان</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="month_select">مانگ بۆ پاشەکەوتکردن</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">هەموو بنکەی زانیارییەکان</SelectItem>
                    {availableMonths.map(month => {
                      const [year, monthNum] = month.split('-');
                      return (
                        <SelectItem key={month} value={month}>
                          مانگی {monthNum} {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="format_select">فۆرماتی پاشەکەوتکردن</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">
                      <div className="flex items-center gap-2">
                        <FileJson className="w-4 h-4" />
                        JSON
                      </div>
                    </SelectItem>
                    <SelectItem value="sql">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4" />
                        SQL
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Database Stats */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              ئاماری بنکەی زانیارییەکان
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">
                  ژمارەی خەرجییەکان {selectedMonth !== 'all' && `(${selectedMonth})`}
                </div>
                <div className="text-3xl font-bold text-blue-600">{filteredExpensesForStats.length}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">
                  ژمارەی کارمەندان {selectedMonth !== 'all' && `(${selectedMonth})`}
                </div>
                <div className="text-3xl font-bold text-purple-600">{filteredEmployeesForStats.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">کۆی گشتی (خەرجی + کارمەند)</div>
                <div className="text-3xl font-bold text-green-600">{formatCurrency(totalCombined)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  خەرجی: {formatCurrency(totalExpenses)}<br/>
                  کارمەند: {formatCurrency(totalEmployeeSalaries)}
                </div>
              </div>
              {selectedMonth === 'all' && (
                <>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">ژمارەی شۆفێرەکان</div>
                    <div className="text-3xl font-bold text-purple-600">{drivers.length}</div>
                  </div>
                  <div className="bg-pink-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">ژمارەی جۆرەکان</div>
                    <div className="text-3xl font-bold text-pink-600">{expenseTypes.length}</div>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">ڕێکخستنەکان و تێمپلەیتەکان</div>
                    <div className="text-3xl font-bold text-amber-600">{appSettings.length + printTemplates.length}</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Download Backup */}
        <Card className="border-none shadow-lg mb-6">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              داگرتنی پاشەکەوتکردن
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">
              {selectedMonth === 'all' 
                ? `داگرتنی پاشەکەوتی تەواوی بنکەی زانیارییەکان بە فۆرماتی ${exportFormat.toUpperCase()}`
                : `داگرتنی پاشەکەوت بۆ مانگی ${selectedMonth} بە فۆرماتی ${exportFormat.toUpperCase()}`
              }
            </p>
            <Button
              onClick={downloadFullBackup}
              disabled={isDownloading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isDownloading ? (
                'داگرتن...'
              ) : (
                <>
                  <Download className="w-5 h-5 ml-2" />
                  داگرتنی پاشەکەوتکردن ({exportFormat.toUpperCase()})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Send to Email */}
        <Card className="border-none shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 border-b">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              ناردن بۆ ئیمەیڵ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-4">
              ناردنی پاشەکەوت بە فایلی {exportFormat.toUpperCase()} بۆ ئیمەیڵەکەت
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">ناونیشانی ئیمەیڵ</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="text-lg"
                />
              </div>
              <Button
                onClick={sendBackupToEmail}
                disabled={isSending}
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {isSending ? (
                  'ناردن...'
                ) : (
                  <>
                    <Mail className="w-5 h-5 ml-2" />
                    ناردنی پاشەکەوتکردن ({exportFormat.toUpperCase()})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>تێبینی:</strong> پاشەکەوتکردنەکە هەموو زانیارییەکانی هەڵبژێردراو لەخۆدەگرێت (خەرجییەکان، شۆفێرەکان، کارمەندان، جۆرەکان، ڕێکخستنەکان). تکایە لە شوێنێکی پارێزراو هەڵیبگرە.
            {exportFormat === 'sql' && ' فایلی SQL دەتوانرێت بۆ گەڕاندنەوەی زانیارییەکان لە هەر بنکەی زانیارییەکی MySQL, PostgreSQL یان SQLite بەکاربهێنرێت.'}
          </p>
        </div>
      </div>

      {/* Reset Database Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600">
              ئاگاداری! پاککردنەوەی بنکەی زانیارییەکان
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ئەم کردارە هەموو زانیارییەکان دەسڕێتەوە و ناگەڕێتەوە!
              </AlertDescription>
            </Alert>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2">
                <strong>ئەم دەسڕێتەوە:</strong>
              </p>
              <ul className="text-sm text-yellow-800 list-disc list-inside space-y-1">
                <li>هەموو خەرجییەکان ({expenses.length})</li>
                <li>هەموو شۆفێرەکان ({drivers.length})</li>
                <li>هەموو کارمەندان ({employees.length})</li>
                <li>هەموو جۆرەکانی خەرجی ({expenseTypes.length})</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Label>بۆ دڵنیابوونەوە، تکایە <strong className="text-red-600">RESET</strong> بنووسە:</Label>
              <Input
                value={resetConfirmation}
                onChange={(e) => setResetConfirmation(e.target.value)}
                placeholder="RESET"
                className="text-center font-bold"
              />
            </div>

            <div className="space-y-2">
              <Label>پینکۆد:</Label>
              <Input
                type="password"
                value={resetPinInput}
                onChange={(e) => setResetPinInput(e.target.value)}
                placeholder="پینکۆد بنووسە"
                className="text-center text-2xl tracking-widest"
                maxLength={6}
              />
              <p className="text-xs text-gray-500">
                هەمان پینکۆدی سڕینەوەی هەمیشەیی (لە لاپەڕەی ڕاپۆرتەکان دایدەنرێت)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowResetDialog(false);
                  setResetConfirmation('');
                  setResetPinInput('');
                }} 
                className="flex-1"
              >
                پاشگەزبوونەوە
              </Button>
              <Button 
                variant="destructive" 
                onClick={resetDatabase}
                disabled={resetConfirmation !== 'RESET' || !resetPinInput}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 ml-2" />
                پاککردنەوەی هەموو شتێک
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
