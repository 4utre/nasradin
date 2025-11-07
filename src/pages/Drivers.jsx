
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit2, Calendar, Users, CheckCircle2, AlertCircle, Clock, Search, DollarSign, ChevronLeft, ChevronRight, Zap, Tag } from "lucide-react";
import { format } from "date-fns";

const formatCurrency = (amount, currency = 'IQD') => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount) + (currency === 'USD' ? ' $' : ' IQD');
};

export default function Drivers() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMonthsDialog, setShowMonthsDialog] = useState(false);
  const [showExpenseTypesDialog, setShowExpenseTypesDialog] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [managingMonthsDriver, setManagingMonthsDriver] = useState(null);
  const [managingExpenseTypesDriver, setManagingExpenseTypesDriver] = useState(null);
  const [showBulkMonthsDialog, setShowBulkMonthsDialog] = useState(false);
  const [showBulkRateDialog, setShowBulkRateDialog] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState([]);
  const [bulkMonths, setBulkMonths] = useState([]);
  const [newBulkMonth, setNewBulkMonth] = useState('');
  const [newMonth, setNewMonth] = useState('');
  const [bulkHourlyRate, setBulkHourlyRate] = useState('');
  const [bulkCurrency, setBulkCurrency] = useState('IQD');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [newDriver, setNewDriver] = useState({
    driver_name: '',
    driver_number: '',
    phone: '',
    hourly_rate: 0,
    overtime_rate: 0,
    currency: 'IQD',
    assigned_months: [],
    assigned_expense_types: []
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list('driver_number'),
    initialData: [],
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list(),
    initialData: [],
  });

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ['expenseTypes'],
    queryFn: () => base44.entities.ExpenseType.list(),
    initialData: [],
  });

  const createDriverMutation = useMutation({
    mutationFn: (driverData) => base44.entities.Driver.create(driverData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setShowAddDialog(false);
        resetNewDriverForm();
        setSuccess(false);
      }, 1500);
    },
    onError: () => {
      setError('هەڵە لە زیادکردنی شۆفێر');
      setSuccess(false);
    }
  });

  const updateDriverMutation = useMutation({
    mutationFn: async ({ id, driverData, oldDriverName }) => {
      await base44.entities.Driver.update(id, driverData);
      
      if (oldDriverName && oldDriverName !== driverData.driver_name) {
        const driverExpenses = expenses.filter(exp => exp.driver_id === id);
        
        for (const expense of driverExpenses) {
          await base44.entities.Expense.update(expense.id, {
            ...expense,
            driver_name: driverData.driver_name
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setShowEditDialog(false);
        setEditingDriver(null);
        setSuccess(false);
      }, 1500);
    },
    onError: () => {
      setError('هەڵە لە نوێکردنەوەی شۆفێر');
      setSuccess(false);
    }
  });

  const deleteDriverMutation = useMutation({
    mutationFn: (id) => base44.entities.Driver.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
    },
  });

  const bulkUpdateRateMutation = useMutation({
    mutationFn: async ({ driverIds, hourlyRate, currency }) => {
      for (const driverId of driverIds) {
        const driver = drivers.find(d => d.id === driverId);
        if (driver) {
          await base44.entities.Driver.update(driverId, {
            driver_name: driver.driver_name,
            driver_number: driver.driver_number,
            phone: driver.phone,
            hourly_rate: parseFloat(hourlyRate),
            overtime_rate: driver.overtime_rate || 0,
            currency: currency,
            assigned_months: Array.isArray(driver.assigned_months) ? driver.assigned_months : [],
            assigned_expense_types: Array.isArray(driver.assigned_expense_types) ? driver.assigned_expense_types : []
          });
        }
      }
      
      for (const driverId of driverIds) {
        const driverExpenses = expenses.filter(exp => exp.driver_id === driverId && exp.hours);
        for (const expense of driverExpenses) {
          const newAmount = expense.hours * parseFloat(hourlyRate);
          await base44.entities.Expense.update(expense.id, {
            ...expense,
            hourly_rate: parseFloat(hourlyRate),
            currency: currency,
            amount: newAmount
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setShowBulkRateDialog(false);
        setSelectedDrivers([]);
        setBulkHourlyRate('');
        setSuccess(false);
      }, 1500);
    },
    onError: () => {
      setError('هەڵە لە نوێکردنەوەی کرێی کاتژمێر');
      setSuccess(false);
    }
  });

  const bulkAssignMonthsMutation = useMutation({
    mutationFn: async ({ driverIds, months }) => {
      for (const driverId of driverIds) {
        const driver = drivers.find(d => d.id === driverId);
        if (driver) {
          let currentMonths = [];
          if (driver.assigned_months && Array.isArray(driver.assigned_months)) {
            currentMonths = driver.assigned_months;
          }
          
          const combinedMonths = [...currentMonths, ...months];
          const updatedMonths = Array.from(new Set(combinedMonths));
          
          await base44.entities.Driver.update(driverId, {
            driver_name: driver.driver_name,
            driver_number: driver.driver_number,
            phone: driver.phone,
            hourly_rate: driver.hourly_rate,
            overtime_rate: driver.overtime_rate || 0,
            currency: driver.currency,
            assigned_months: updatedMonths,
            assigned_expense_types: Array.isArray(driver.assigned_expense_types) ? driver.assigned_expense_types : []
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setShowBulkMonthsDialog(false);
        setSelectedDrivers([]);
        setBulkMonths([]);
        setSuccess(false);
      }, 1500);
    },
    onError: () => {
      setError('هەڵە لە دیاریکردنی مانگەکان');
      setSuccess(false);
    }
  });

  const resetNewDriverForm = () => {
    setNewDriver({
      driver_name: '',
      driver_number: '',
      phone: '',
      hourly_rate: 0,
      overtime_rate: 0,
      currency: 'IQD',
      assigned_months: [],
      assigned_expense_types: []
    });
  };

  const handleAdd = async () => {
    setError('');
    setSuccess(false);
    if (!newDriver.driver_name || !newDriver.driver_number) {
      setError('ناوی شۆفێر و ژمارەی شۆفێر پێویستە.');
      return;
    }
    createDriverMutation.mutate(newDriver);
  };

  const handleEdit = (driver) => {
    setEditingDriver({
      ...driver,
      hourly_rate: driver.hourly_rate || 0,
      overtime_rate: driver.overtime_rate || 0,
      currency: driver.currency || 'IQD',
      assigned_months: Array.isArray(driver.assigned_months) ? driver.assigned_months : [],
      assigned_expense_types: Array.isArray(driver.assigned_expense_types) ? driver.assigned_expense_types : []
    });
    setShowEditDialog(true);
    setError('');
    setSuccess(false);
  };

  const handleSaveEdit = async () => {
    setError('');
    setSuccess(false);
    if (!editingDriver.driver_name || !editingDriver.driver_number) {
      setError('ناوی شۆفێر و ژمارەی شۆفێر پێویستە.');
      return;
    }
    updateDriverMutation.mutate({
      id: editingDriver.id,
      driverData: {
        driver_name: editingDriver.driver_name,
        driver_number: editingDriver.driver_number,
        phone: editingDriver.phone,
        hourly_rate: editingDriver.hourly_rate,
        overtime_rate: editingDriver.overtime_rate,
        currency: editingDriver.currency,
        assigned_months: Array.isArray(editingDriver.assigned_months) ? editingDriver.assigned_months : [],
        assigned_expense_types: Array.isArray(editingDriver.assigned_expense_types) ? editingDriver.assigned_expense_types : []
      },
      oldDriverName: editingDriver.driver_name
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('دڵنیای لە سڕینەوەی ئەم شۆفێرە؟')) {
      deleteDriverMutation.mutate(id);
    }
  };

  const handleManageMonths = (driver) => {
    setManagingMonthsDriver(driver);
    setShowMonthsDialog(true);
  };

  const handleManageExpenseTypes = (driver) => {
    setManagingExpenseTypesDriver(driver);
    setShowExpenseTypesDialog(true);
  };

  const handleAddMonth = () => {
    if (!newMonth) return;
    
    let currentMonths = Array.isArray(managingMonthsDriver.assigned_months) ? managingMonthsDriver.assigned_months : [];
    const combinedMonths = [...currentMonths, newMonth];
    const updatedMonths = Array.from(new Set(combinedMonths));
    
    updateDriverMutation.mutate({
      id: managingMonthsDriver.id,
      driverData: {
        driver_name: managingMonthsDriver.driver_name,
        driver_number: managingMonthsDriver.driver_number,
        phone: managingMonthsDriver.phone,
        hourly_rate: managingMonthsDriver.hourly_rate,
        overtime_rate: managingMonthsDriver.overtime_rate || 0,
        currency: managingMonthsDriver.currency,
        assigned_months: updatedMonths,
        assigned_expense_types: Array.isArray(managingMonthsDriver.assigned_expense_types) ? managingMonthsDriver.assigned_expense_types : []
      },
      oldDriverName: managingMonthsDriver.driver_name
    });
    setNewMonth('');
  };

  const handleRemoveMonth = (month) => {
    let currentMonths = Array.isArray(managingMonthsDriver.assigned_months) ? managingMonthsDriver.assigned_months : [];
    const updatedMonths = currentMonths.filter(m => m !== month);
    
    updateDriverMutation.mutate({
      id: managingMonthsDriver.id,
      driverData: {
        driver_name: managingMonthsDriver.driver_name,
        driver_number: managingMonthsDriver.driver_number,
        phone: managingMonthsDriver.phone,
        hourly_rate: managingMonthsDriver.hourly_rate,
        overtime_rate: managingMonthsDriver.overtime_rate || 0,
        currency: managingMonthsDriver.currency,
        assigned_months: updatedMonths,
        assigned_expense_types: Array.isArray(managingMonthsDriver.assigned_expense_types) ? managingMonthsDriver.assigned_expense_types : []
      },
      oldDriverName: managingMonthsDriver.driver_name
    });
  };

  const handleToggleExpenseType = (typeName) => {
    const currentTypes = Array.isArray(managingExpenseTypesDriver.assigned_expense_types) 
      ? managingExpenseTypesDriver.assigned_expense_types 
      : [];
    
    const updatedTypes = currentTypes.includes(typeName)
      ? currentTypes.filter(t => t !== typeName)
      : [...currentTypes, typeName];
    
    updateDriverMutation.mutate({
      id: managingExpenseTypesDriver.id,
      driverData: {
        driver_name: managingExpenseTypesDriver.driver_name,
        driver_number: managingExpenseTypesDriver.driver_number,
        phone: managingExpenseTypesDriver.phone,
        hourly_rate: managingExpenseTypesDriver.hourly_rate,
        overtime_rate: managingExpenseTypesDriver.overtime_rate || 0,
        currency: managingExpenseTypesDriver.currency,
        assigned_months: Array.isArray(managingExpenseTypesDriver.assigned_months) ? managingExpenseTypesDriver.assigned_months : [],
        assigned_expense_types: updatedTypes
      },
      oldDriverName: managingExpenseTypesDriver.driver_name
    });
  };

  const toggleDriverSelection = (driverId) => {
    setSelectedDrivers(prev =>
      prev.includes(driverId)
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  const toggleAllDrivers = () => {
    if (selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(filteredDrivers.map(d => d.id));
    }
  };

  const handleAddBulkMonth = () => {
    if (!newBulkMonth || bulkMonths.includes(newBulkMonth)) return;
    setBulkMonths([...bulkMonths, newBulkMonth]);
    setNewBulkMonth('');
  };

  const handleRemoveBulkMonth = (month) => {
    setBulkMonths(bulkMonths.filter(m => m !== month));
  };

  const handleBulkAssignMonths = () => {
    if (selectedDrivers.length === 0) {
      setError('تکایە لانیکەم یەک شۆفێر هەڵبژێرە');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (bulkMonths.length === 0) {
      setError('تکایە لانیکەم یەک مانگ زیادبکە');
      setTimeout(() => setError(''), 3000);
      return;
    }

    bulkAssignMonthsMutation.mutate({
      driverIds: selectedDrivers,
      months: bulkMonths
    });
  };

  const handleBulkUpdateRate = () => {
    if (selectedDrivers.length === 0) {
      setError('تکایە لانیکەم یەک شۆفێر هەڵبژێرە');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!bulkHourlyRate || parseFloat(bulkHourlyRate) <= 0) {
      setError('تکایە کرێی کاتژمێر بنووسە');
      setTimeout(() => setError(''), 3000);
      return;
    }

    bulkUpdateRateMutation.mutate({
      driverIds: selectedDrivers,
      hourlyRate: bulkHourlyRate,
      currency: bulkCurrency
    });
  };

  const filteredDrivers = drivers.filter(driver => {
    const searchMatch = searchQuery === '' ||
      driver.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      driver.driver_number?.toString().includes(searchQuery) ||
      driver.phone?.includes(searchQuery);
    
    return searchMatch;
  });

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2);
    setCurrentMonth(format(prevDate, 'yyyy-MM'));
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split('-').map(Number);
    const nextDate = new Date(year, month);
    setCurrentMonth(format(nextDate, 'yyyy-MM'));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">چاوەڕێ بە...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">شۆفێرەکان</h1>
            <p className="text-gray-600 mt-1">بەڕێوەبردنی شۆفێرەکان</p>
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <div className="text-lg font-semibold px-4">
              {currentMonth.split('-')[1]}/{currentMonth.split('-')[0]}
            </div>
            <Button variant="outline" size="icon" onClick={goToNextMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {selectedDrivers.length > 0 && (
              <>
                <Button
                  onClick={() => setShowBulkRateDialog(true)}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  <Clock className="w-5 h-5 ml-2" />
                  دیاریکردنی کرێی کاتژمێر ({selectedDrivers.length})
                </Button>
                <Button
                  onClick={() => setShowBulkMonthsDialog(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <Users className="w-5 h-5 ml-2" />
                  دیاریکردنی مانگ ({selectedDrivers.length})
                </Button>
              </>
            )}
            <Button
              onClick={() => {
                resetNewDriverForm();
                setShowAddDialog(true);
              }}
              className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
            >
              + شۆفێری نوێ
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="گەڕان بە ناو، ژمارە، تەلەفۆن..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 text-lg"
            />
          </div>
        </div>

        {/* The selected drivers checkbox for all drivers is removed as per the outline */}

        <div className="overflow-x-auto rounded-lg shadow-lg">
          <table className="min-w-full bg-white border border-gray-200">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-4 text-right text-sm font-semibold text-gray-700 w-1/5">ناوی شۆفێر</th>
                <th className="p-4 text-right text-sm font-semibold text-gray-700 w-1/6">ژمارەی تەلەفۆن</th>
                <th className="p-4 text-right text-sm font-semibold text-gray-700 w-1/6">کرێی کاتژمێر (ئاسایی)</th>
                <th className="p-4 text-right text-sm font-semibold text-gray-700 w-1/6">کرێی کاتژمێر (زیادە)</th>
                <th className="p-4 text-right text-sm font-semibold text-gray-700 w-1/6">جۆرەکانی خەرجی</th>
                <th className="p-4 text-center text-sm font-semibold text-gray-700 w-auto">کردارەکان</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.map((driver) => {
                const assignedExpenseTypes = Array.isArray(driver.assigned_expense_types) ? driver.assigned_expense_types : [];
                return (
                  <tr key={driver.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="p-4 border-r border-gray-200">
                      <div className="font-bold text-lg">{driver.driver_name}</div>
                      <div className="text-sm text-gray-600">#{driver.driver_number}</div>
                    </td>
                    <td className="p-4 text-sm border-r border-gray-200 text-gray-600">{driver.phone || '-'}</td>
                    <td className="p-4 border-r border-gray-200">
                      <div className="flex flex-col gap-1">
                        <div className="text-right font-bold text-emerald-600 text-lg">
                          {formatCurrency(driver.hourly_rate || 0, driver.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {driver.currency === 'USD' ? 'دۆلار' : 'دینار'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-gray-200">
                      <div className="flex flex-col gap-1">
                        <div className="text-right font-bold text-amber-600 text-lg flex items-center justify-end gap-1">
                          <Zap className="w-4 h-4" />
                          {formatCurrency(driver.overtime_rate || 0, driver.currency)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {driver.currency === 'USD' ? 'دۆلار' : 'دینار'}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 border-r border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {assignedExpenseTypes.length > 0 ? (
                          assignedExpenseTypes.slice(0, 2).map((type, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-300">
                              {type}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">هیچیان</span>
                        )}
                        {assignedExpenseTypes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{assignedExpenseTypes.length - 2}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleManageExpenseTypes(driver)}
                          className="h-8 w-8"
                          title="بەڕێوەبردنی جۆرەکانی خەرجی"
                        >
                          <Tag className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleManageMonths(driver)}
                          className="h-8 w-8"
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(driver)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(driver.id)}
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDrivers.length === 0 && (
          <Card className="p-12 text-center mt-6">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">
              {searchQuery ? 'هیچ شۆفێرێک نەدۆزرایەوە' : 'هیچ شۆفێرێک زیادنەکراوە'}
            </p>
          </Card>
        )}

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">زیادکردنی شۆفێری نوێ</DialogTitle>
            </DialogHeader>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  شۆفێر بە سەرکەوتوویی زیادکرا!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ناوی شۆفێر</Label>
                  <Input
                    value={newDriver.driver_name}
                    onChange={(e) => setNewDriver({...newDriver, driver_name: e.target.value})}
                    placeholder="ناوی شۆفێر بنووسە"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>ژمارەی شۆفێر</Label>
                  <Input
                    type="number"
                    value={newDriver.driver_number}
                    onChange={(e) => setNewDriver({...newDriver, driver_number: e.target.value})}
                    placeholder="ژمارە"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>ژمارەی تەلەفۆن</Label>
                <Input
                  type="tel"
                  value={newDriver.phone}
                  onChange={(e) => setNewDriver({...newDriver, phone: e.target.value})}
                  placeholder="07XX XXX XXXX"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>کرێی کاتژمێر (ئاسایی)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDriver.hourly_rate}
                    onChange={(e) => setNewDriver({...newDriver, hourly_rate: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    کرێی کاتژمێر (زیادە)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newDriver.overtime_rate}
                    onChange={(e) => setNewDriver({...newDriver, overtime_rate: parseFloat(e.target.value) || 0})}
                    placeholder="0"
                    className="border-amber-300 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>جۆری دراو</Label>
                <Select value={newDriver.currency} onValueChange={(value) => setNewDriver({...newDriver, currency: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IQD">دینار (IQD)</SelectItem>
                    <SelectItem value="USD">دۆلار (USD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                  پاشگەزبوونەوە
                </Button>
                <Button onClick={handleAdd} disabled={createDriverMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                  {createDriverMutation.isPending ? 'زیادکردن...' : 'زیادکردن'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Driver Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">دەستکاریکردنی شۆفێر</DialogTitle>
            </DialogHeader>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  شۆفێر بە سەرکەوتوویی نوێکرایەوە!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {editingDriver && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ناوی شۆفێر</Label>
                    <Input
                      value={editingDriver.driver_name}
                      onChange={(e) => setEditingDriver({...editingDriver, driver_name: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ژمارەی شۆفێر</Label>
                    <Input
                      type="number"
                      value={editingDriver.driver_number}
                      onChange={(e) => setEditingDriver({...editingDriver, driver_number: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>ژمارەی تەلەفۆن</Label>
                  <Input
                    type="tel"
                    value={editingDriver.phone || ''}
                    onChange={(e) => setEditingDriver({...editingDriver, phone: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>کرێی کاتژمێر (ئاسایی)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDriver.hourly_rate}
                      onChange={(e) => setEditingDriver({...editingDriver, hourly_rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600" />
                      کرێی کاتژمێر (زیادە)
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingDriver.overtime_rate || 0}
                      onChange={(e) => setEditingDriver({...editingDriver, overtime_rate: parseFloat(e.target.value) || 0})}
                      className="border-amber-300 focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>جۆری دراو</Label>
                  <Select value={editingDriver.currency} onValueChange={(value) => setEditingDriver({...editingDriver, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQD">دینار (IQD)</SelectItem>
                      <SelectItem value="USD">دۆلار (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setShowEditDialog(false)} className="flex-1">
                    پاشگەزبوونەوە
                  </Button>
                  <Button onClick={handleSaveEdit} disabled={updateDriverMutation.isPending} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {updateDriverMutation.isPending ? 'نوێکردنەوە...' : 'نوێکردنەوە'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Dialog open={showMonthsDialog} onOpenChange={setShowMonthsDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                بەڕێوەبردنی مانگەکان - {managingMonthsDriver?.driver_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="month"
                  value={newMonth}
                  onChange={(e) => setNewMonth(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddMonth}>
                  زیادکردن
                </Button>
              </div>

              <div className="space-y-2">
                {(() => {
                  const assignedMonths = Array.isArray(managingMonthsDriver?.assigned_months) 
                    ? managingMonthsDriver.assigned_months 
                    : [];

                  return assignedMonths.length > 0 ? (
                    assignedMonths.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{month}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMonth(month)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">هیچ مانگێک زیادنەکراوە</p>
                  );
                })()}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkMonthsDialog} onOpenChange={setShowBulkMonthsDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                دیاریکردنی مانگ بۆ چەند شۆفێرێک ({selectedDrivers.length})
              </DialogTitle>
            </DialogHeader>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  مانگەکان بە سەرکەوتوویی دیاریکران!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-2">شۆفێرە هەڵبژێردراوەکان:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDrivers.map(driverId => {
                    const driver = drivers.find(d => d.id === driverId);
                    return driver ? (
                      <Badge key={driverId} className="bg-blue-100 text-blue-800">
                        {driver.driver_name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">مانگەکان بۆ دیاریکردن:</Label>
                <div className="flex gap-2">
                  <Input
                    type="month"
                    value={newBulkMonth}
                    onChange={(e) => setNewBulkMonth(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleAddBulkMonth}>
                    زیادکردن
                  </Button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {bulkMonths.length > 0 ? (
                    bulkMonths.map((month, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{month}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveBulkMonth(month)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">هیچ مانگێک زیادنەکراوە</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkMonthsDialog(false)}
                  className="flex-1"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  onClick={handleBulkAssignMonths}
                  disabled={bulkAssignMonthsMutation.isPending || bulkMonths.length === 0}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  {bulkAssignMonthsMutation.isPending ? 'دیاریکردن...' : `دیاریکردن بۆ ${selectedDrivers.length} شۆفێر`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showBulkRateDialog} onOpenChange={setShowBulkRateDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                دیاریکردنی کرێی کاتژمێر بۆ چەند شۆفێرێک ({selectedDrivers.length})
              </DialogTitle>
            </DialogHeader>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  کرێی کاتژمێر بە سەرکەوتوویی نوێکرایەوە و هەموو خەرجییەکان حیسابکرانەوە!
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-semibold text-blue-800 mb-2">شۆفێرە هەڵبژێردراوەکان:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDrivers.map(driverId => {
                    const driver = drivers.find(d => d.id === driverId);
                    return driver ? (
                      <Badge key={driverId} className="bg-blue-100 text-blue-800">
                        {driver.driver_name} - {formatCurrency(driver.hourly_rate || 0, driver.currency || 'IQD')}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">ئاگاداری:</p>
                </div>
                <p className="text-sm text-amber-700">
                  کاتێک کرێی کاتژمێر دەگۆڕێت، هەموو خەرجییەکانی ئەم شۆفێرانە کە کاتژمێریان تێدایە بە ئۆتۆماتیک حیساب دەکرێنەوە.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bulk_currency" className="text-base font-semibold">
                  جۆری دراو
                </Label>
                <Select value={bulkCurrency} onValueChange={setBulkCurrency}>
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
                <Label htmlFor="bulk_hourly_rate" className="text-base font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  کرێی کاتژمێر ({bulkCurrency})
                </Label>
                <Input
                  id="bulk_hourly_rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkHourlyRate}
                  onChange={(e) => setBulkHourlyRate(e.target.value)}
                  placeholder="بڕی پارە بنووسە"
                  className="text-2xl font-bold"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowBulkRateDialog(false)}
                  className="flex-1"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  onClick={handleBulkUpdateRate}
                  disabled={bulkUpdateRateMutation.isPending || !bulkHourlyRate}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {bulkUpdateRateMutation.isPending ? 'نوێکردنەوە...' : `دیاریکردن بۆ ${selectedDrivers.length} شۆفێر`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Manage Expense Types Dialog */}
        <Dialog open={showExpenseTypesDialog} onOpenChange={setShowExpenseTypesDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Tag className="w-6 h-6" />
                دیاریکردنی جۆرەکانی خەرجی - {managingExpenseTypesDriver?.driver_name}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>چۆن کاردەکات:</strong>
                </p>
                <p className="text-xs text-blue-700">
                  کاتێک جۆرێکی خەرجی هەڵدەبژێریت لە لاپەڕەی زیادکردنی خەرجی، ئەم شۆفێرە بە ئۆتۆماتیک هەڵدەبژێردرێت.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {expenseTypes.map(type => {
                  const currentTypes = Array.isArray(managingExpenseTypesDriver?.assigned_expense_types) 
                    ? managingExpenseTypesDriver.assigned_expense_types 
                    : [];
                  const isAssigned = currentTypes.includes(type.type_name);
                  
                  return (
                    <div
                      key={type.id}
                      onClick={() => handleToggleExpenseType(type.type_name)}
                      className={`
                        p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                        ${isAssigned 
                          ? 'bg-indigo-100 border-indigo-500 shadow-md' 
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{type.type_name}</span>
                        {isAssigned && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {expenseTypes.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  هیچ جۆرێکی خەرجی زیادنەکراوە
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowExpenseTypesDialog(false)}
                  className="flex-1"
                >
                  داخستن
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
