
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"; // Added Badge import
import { Save, ArrowRight, CheckCircle2, AlertCircle, Clock, Plus, Settings, Zap } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const expenseTypeColors = {
  "purple": "bg-purple-100 border-purple-300",
  "blue": "bg-blue-100 border-blue-300",
  "cyan": "bg-cyan-100 border-cyan-300",
  "indigo": "bg-indigo-100 border-indigo-300",
  "green": "bg-green-100 border-green-300",
  "orange": "bg-orange-100 border-orange-300",
  "red": "bg-red-100 border-red-300",
  "yellow": "bg-yellow-100 border-yellow-300",
  "pink": "bg-pink-100 border-pink-300"
};

export default function AddExpense() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    driver_id: '',
    driver_name: '',
    driver_number: '',
    expense_type: '',
    hours: '',
    hourly_rate: '',
    is_overtime: false,
    amount: '',
    currency: 'IQD',
    is_paid: false,
    description: ''
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showManageTypes, setShowManageTypes] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('blue');

  // Convert time format (8.45) to decimal hours (8.75)
  const timeToDecimal = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.toString().split('.');
    const hours = parseInt(parts[0]) || 0;
    const minutes = parseInt(parts[1]) || 0;
    return hours + (minutes / 60); 
  };

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
    initialData: [],
  });

  const filteredDrivers = useMemo(() => {
    if (!formData.expense_date) return drivers;
    
    const selectedMonth = format(new Date(formData.expense_date), 'yyyy-MM');
    
    return drivers.filter(driver => {
      const assignedMonths = driver.assigned_months;
      if (!assignedMonths || !Array.isArray(assignedMonths) || assignedMonths.length === 0) {
        return true;
      }
      return assignedMonths.includes(selectedMonth);
    });
  }, [drivers, formData.expense_date]);

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ['expenseTypes'],
    queryFn: () => base44.entities.ExpenseType.list(),
    initialData: [],
  });

  const { data: allExpenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-created_date'),
    initialData: [],
  });

  const uniqueDescriptions = useMemo(() => {
    const descriptions = allExpenses
      .map(exp => exp.description)
      .filter(desc => desc && desc.trim() !== '');
    return [...new Set(descriptions)];
  }, [allExpenses]);

  const createExpenseMutation = useMutation({
    mutationFn: (data) => base44.entities.Expense.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        navigate(createPageUrl('Dashboard'));
      }, 1500);
    },
    onError: (err) => {
      setError('هەڵە لە تۆمارکردنی خەرجی. تکایە دووبارە هەوڵ بدەرەوە.');
      setSuccess(false);
    }
  });

  const createExpenseTypeMutation = useMutation({
    mutationFn: (data) => base44.entities.ExpenseType.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
      setNewTypeName('');
      setNewTypeColor('blue');
    },
  });

  const deleteExpenseTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.ExpenseType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenseTypes'] });
    },
  });

  const handleExpenseTypeSelect = (typeName) => {
    handleChange('expense_type', typeName);
  };

  const handleDriverSelect = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      const driverCurrency = driver.currency || 'IQD';
      const rateToUse = formData.is_overtime 
        ? (driver.overtime_rate || driver.hourly_rate || 0)
        : (driver.hourly_rate || 0);
        
      // Check if driver has assigned expense types
      const assignedExpenseTypes = Array.isArray(driver.assigned_expense_types) 
        ? driver.assigned_expense_types.filter(type => type && type.trim() !== '')
        : [];
      const autoSelectedExpenseType = assignedExpenseTypes.length > 0 
        ? assignedExpenseTypes[0] 
        : formData.expense_type; // Keep current if no specific assigned types

      setFormData(prev => ({
        ...prev,
        driver_id: driver.id,
        driver_name: driver.driver_name,
        driver_number: driver.driver_number,
        hourly_rate: rateToUse,
        currency: driverCurrency,
        expense_type: autoSelectedExpenseType // Auto-select first assigned expense type
      }));
      
      if (formData.hours) {
        const decimalHours = timeToDecimal(formData.hours);
        const calculatedAmount = decimalHours * rateToUse;
        setFormData(prev => ({ ...prev, amount: calculatedAmount.toString() }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        driver_id: '',
        driver_name: '',
        driver_number: '',
        hourly_rate: '',
        currency: 'IQD',
        amount: '',
      }));
    }
  };

  const handleCurrencyChange = (newCurrency) => {
    setFormData(prev => ({ ...prev, currency: newCurrency }));
    setError('');
  };

  const handleOvertimeToggle = (isOvertime) => {
    setFormData(prev => ({ ...prev, is_overtime: isOvertime }));
    
    if (formData.driver_id) {
      const driver = drivers.find(d => d.id === formData.driver_id);
      if (driver) {
        const rateToUse = isOvertime 
          ? (driver.overtime_rate || driver.hourly_rate || 0)
          : (driver.hourly_rate || 0);
          
        setFormData(prev => ({ ...prev, hourly_rate: rateToUse }));
        
        if (formData.hours && rateToUse) {
          const decimalHours = timeToDecimal(formData.hours);
          const calculatedAmount = decimalHours * rateToUse;
          setFormData(prev => ({ ...prev, amount: calculatedAmount.toString() }));
        }
      }
    }
  };

  const handleHoursChange = (hours) => {
    setFormData(prev => ({ ...prev, hours }));
    
    if (hours && formData.hourly_rate) {
      const decimalHours = timeToDecimal(hours);
      const calculatedAmount = decimalHours * parseFloat(formData.hourly_rate);
      setFormData(prev => ({ ...prev, amount: calculatedAmount.toString() }));
    } else if (!hours) {
      setFormData(prev => ({ ...prev, amount: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.expense_type || !formData.amount || !formData.expense_date) {
      setError('تکایە خانە پێویستەکان پڕبکەرەوە');
      return;
    }

    const decimalHours = formData.hours ? timeToDecimal(formData.hours) : undefined;

    const dataToSubmit = {
      expense_date: formData.expense_date,
      driver_id: formData.driver_id || undefined,
      driver_name: formData.driver_name || undefined,
      driver_number: formData.driver_number || undefined,
      expense_type: formData.expense_type,
      hours: decimalHours,
      hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
      is_overtime: formData.is_overtime,
      amount: parseFloat(formData.amount),
      currency: formData.currency || 'IQD',
      is_paid: formData.is_paid,
      description: formData.description || undefined
    };

    console.log('Submitting expense:', dataToSubmit);
    createExpenseMutation.mutate(dataToSubmit);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleAddExpenseType = () => {
    if (newTypeName.trim()) {
      createExpenseTypeMutation.mutate({
        type_name: newTypeName.trim(),
        color: newTypeColor
      });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">زیادکردنی خەرجیی نوێ</h1>
            <p className="text-gray-600 mt-1">تۆمارکردنی خەرجییەکان</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowManageTypes(true)}
            className="gap-2"
          >
            <Settings className="w-4 h-4" />
            بەڕێوەبردنی جۆرەکان
          </Button>
        </div>

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              خەرجی بە سەرکەوتوویی تۆمار کرا!
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="text-xl">زانیاری خەرجی</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="expense_date" className="text-base font-semibold">
                  بەروار <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="expense_date"
                  type="date"
                  value={formData.expense_date}
                  onChange={(e) => {
                    handleChange('expense_date', e.target.value);
                    const driver = drivers.find(d => d.id === formData.driver_id);
                    if (driver) {
                      const selectedMonth = format(new Date(e.target.value), 'yyyy-MM');
                      const assignedMonths = Array.isArray(driver.assigned_months) ? driver.assigned_months : [];
                      if (assignedMonths.length > 0 && !assignedMonths.includes(selectedMonth)) {
                        setFormData(prev => ({
                          ...prev,
                          driver_id: '',
                          driver_name: '',
                          driver_number: '',
                          hourly_rate: '',
                          currency: 'IQD',
                          amount: ''
                        }));
                      }
                    }
                  }}
                  className="text-lg"
                  required
                />
              </div>

              {/* Driver Selection */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  ناوی شۆفێر
                </Label>
                <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {filteredDrivers.map(driver => {
                    return (
                      <button
                        key={driver.id}
                        type="button"
                        onClick={() => handleDriverSelect(driver.id)}
                        className={`
                          relative p-1.5 rounded-lg border-2 text-center font-medium transition-all duration-200
                          ${formData.driver_id === driver.id 
                            ? 'bg-purple-100 border-purple-500 shadow-md scale-105' 
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                      >
                        <div className="font-bold truncate text-xs">{driver.driver_name}</div>
                        <div className="text-[8px] text-gray-500">
                          {formatCurrency(driver.hourly_rate || 0)} {driver.currency === 'USD' ? '$' : ''}
                        </div>
                        {driver.overtime_rate > 0 && (
                          <div className="text-[8px] text-amber-600 flex items-center justify-center gap-0.5">
                            <Zap className="w-2 h-2" />
                            {formatCurrency(driver.overtime_rate)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {filteredDrivers.length === 0 && (
                  <p className="text-sm text-amber-600">
                    هیچ شۆفێرێک بۆ ئەم مانگە دیارینەکراوە
                  </p>
                )}
              </div>

              {/* Driver Number */}
              <div className="space-y-2">
                <Label htmlFor="driver_number" className="text-base font-semibold">
                  ژمارەی شۆفێر
                </Label>
                <Input
                  id="driver_number"
                  type="text"
                  value={formData.driver_number}
                  onChange={(e) => handleChange('driver_number', e.target.value)}
                  placeholder="ژمارەی شۆفێر بنووسە"
                  className="text-lg"
                  disabled={!!formData.driver_id}
                />
              </div>

              {/* Overtime Toggle */}
              {formData.driver_id && (
                <div className="flex items-center space-x-2 space-x-reverse bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                  <Checkbox
                    id="is_overtime"
                    checked={formData.is_overtime}
                    onCheckedChange={handleOvertimeToggle}
                  />
                  <Label
                    htmlFor="is_overtime"
                    className="text-base font-semibold cursor-pointer flex items-center gap-2"
                  >
                    <Zap className="w-5 h-5 text-amber-600" />
                    کاتژمێری زیادە (Overtime)
                  </Label>
                  {formData.is_overtime && formData.hourly_rate && (
                    <span className="mr-auto text-sm font-bold text-amber-700">
                      نرخ: {formatCurrency(formData.hourly_rate)} {formData.currency}
                    </span>
                  )}
                </div>
              )}

              {/* Hours Input */}
              <div className="space-y-2">
                <Label htmlFor="hours" className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  ژمارەی کاتژمێرەکان
                  {formData.is_overtime && (
                    <span className="text-amber-600 text-sm">(کاتژمێری زیادە)</span>
                  )}
                </Label>
                <Input
                  id="hours"
                  type="text"
                  inputMode="decimal"
                  value={formData.hours}
                  onChange={(e) => handleHoursChange(e.target.value)}
                  placeholder="8.45 (8 کاتژمێر و 45 خولەک)"
                  className="text-lg"
                />
                {formData.hourly_rate && formData.hourly_rate !== '' && formData.hours && (
                  <p className={`text-sm ${formData.is_overtime ? 'text-amber-700 font-semibold' : 'text-gray-600'}`}>
                    {formData.hours} (واتە {timeToDecimal(formData.hours).toFixed(2)} کاتژمێر) × {formatCurrency(formData.hourly_rate)} {formData.currency} = {formatCurrency(timeToDecimal(formData.hours) * parseFloat(formData.hourly_rate))} {formData.currency}
                    {formData.is_overtime && <span className="mr-2">⚡ زیادە</span>}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  نموونە: 8.30 = 8 کاتژمێر و 30 خولەک، 8.45 = 8 کاتژمێر و 45 خولەک
                </p>
              </div>

              {/* Expense Type */}
              <div className="space-y-2">
                <Label className="text-base font-semibold">
                  جۆری خەرجی <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {expenseTypes.map(type => {
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleExpenseTypeSelect(type.type_name)}
                        className={`
                          relative p-2 rounded-lg border-2 text-center font-medium transition-all duration-200 text-xs
                          ${formData.expense_type === type.type_name 
                            ? `${expenseTypeColors[type.color]} border-current shadow-md scale-105` 
                            : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                          }
                        `}
                      >
                        {type.type_name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Currency Selection */}
              <div className="space-y-2">
                <Label htmlFor="currency" className="text-base font-semibold">
                  جۆری دراو <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.currency} 
                  onValueChange={handleCurrencyChange}
                >
                  <SelectTrigger className="text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IQD">دینار (IQD)</SelectItem>
                    <SelectItem value="USD">دۆلار (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-base font-semibold">
                  بڕی پارە <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleChange('amount', e.target.value)}
                    placeholder="0"
                    className={`text-2xl font-bold pl-16 ${formData.is_overtime ? 'border-amber-400 bg-amber-50' : ''}`}
                    required
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                    {formData.currency}
                  </span>
                  {formData.is_overtime && (
                    <Zap className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-600" />
                  )}
                </div>
              </div>

              {/* Paid Checkbox */}
              <div className="flex items-center space-x-2 space-x-reverse bg-blue-50 p-4 rounded-lg">
                <Checkbox
                  id="is_paid"
                  checked={formData.is_paid}
                  onCheckedChange={(checked) => handleChange('is_paid', checked)}
                />
                <Label
                  htmlFor="is_paid"
                  className="text-base font-semibold cursor-pointer"
                >
                  پارەدراوە ✓
                </Label>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-semibold">
                  تێبینی
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="وردەکاری زیاتر لەسەر خەرجییەکە..."
                  className="min-h-[120px] text-base"
                />
                {uniqueDescriptions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">پێشنیارەکانی پێشوو:</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueDescriptions.map((desc, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleChange('description', desc)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs border border-blue-200 transition-colors"
                        >
                          {desc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                  className="flex-1"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  type="submit"
                  className={`flex-1 text-lg py-6 ${
                    formData.is_overtime 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700' 
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }`}
                  disabled={createExpenseMutation.isPending}
                >
                  {createExpenseMutation.isPending ? (
                    'تۆمارکردن...'
                  ) : (
                    <>
                      <Save className="w-5 h-5 ml-2" />
                      تۆمارکردنی خەرجی
                      {formData.is_overtime && <Zap className="w-5 h-5 mr-2" />}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Manage Expense Types Dialog */}
        <Dialog open={showManageTypes} onOpenChange={setShowManageTypes}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">بەڕێوەبردنی جۆرەکانی خەرجی</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <Card className="border-2">
                <CardHeader className="bg-gray-50">
                  <CardTitle className="text-lg">زیادکردنی جۆری نوێ</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Input
                      placeholder="ناوی جۆری خەرجی"
                      value={newTypeName}
                      onChange={(e) => setNewTypeName(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={newTypeColor} onValueChange={setNewTypeColor}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(expenseTypeColors).map(color => (
                          <SelectItem key={color} value={color}>
                            <div className={`w-4 h-4 rounded ${expenseTypeColors[color]} border border-gray-300`} />
                            {color}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddExpenseType} disabled={!newTypeName.trim()}>
                      <Plus className="w-4 h-4 ml-2" />
                      زیادکردن
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">جۆرە هەنووکەییەکان</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {expenseTypes.map(type => (
                    <div
                      key={type.id}
                      className={`flex flex-col gap-2 p-4 rounded-lg ${expenseTypeColors[type.color]}`}
                    >
                      <span className="font-medium text-center">{type.type_name}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`دڵنیایت لە سڕینەوەی ${type.type_name}؟`)) {
                            deleteExpenseTypeMutation.mutate(type.id);
                          }
                        }}
                        className="w-full"
                      >
                        سڕینەوە
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
