
import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2, Edit2, CheckCircle2, AlertCircle, Plus, Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from "date-fns";

const formatCurrency = (amount, currency = 'IQD') => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount) + (currency === 'USD' ? ' $' : ' IQD');
};

export default function Employees() {
  const queryClient = useQueryClient();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_number: '',
    salary: 0,
    currency: 'IQD',
    payment_date: format(new Date(), 'yyyy-MM-dd'),
    is_paid: false
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list('employee_number'),
    initialData: [],
  });

  const monthStr = format(currentMonth, 'yyyy-MM');

  // Filter out deleted employees
  const activeEmployees = useMemo(() => {
    return employees.filter(emp => !emp.is_deleted);
  }, [employees]);

  // Filter employees for current viewing month - ONLY if month is explicitly assigned
  const currentMonthEmployees = useMemo(() => {
    return activeEmployees.filter(emp => {
      const assignedMonths = emp.assigned_months;
      if (!assignedMonths || !Array.isArray(assignedMonths) || assignedMonths.length === 0) {
        return false; // Don't include if no months assigned
      }
      return assignedMonths.includes(monthStr);
    });
  }, [activeEmployees, monthStr]);

  const totalSalaryIQD = useMemo(() => {
    return currentMonthEmployees.filter(emp => emp.currency === 'IQD').reduce((sum, emp) => sum + (emp.salary || 0), 0);
  }, [currentMonthEmployees]);

  const totalSalaryUSD = useMemo(() => {
    return currentMonthEmployees.filter(emp => emp.currency === 'USD').reduce((sum, emp) => sum + (emp.salary || 0), 0);
  }, [currentMonthEmployees]);

  // Generate 12 months dynamically based on currentMonth (6 past + current + 5 future)
  const generateMonths = () => {
    const months = [];
    for (let i = -6; i <= 5; i++) {
      const date = i < 0 ? subMonths(currentMonth, Math.abs(i)) : addMonths(currentMonth, i);
      months.push({
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MM/yy'),
        isCurrent: i === 0
      });
    }
    return months;
  };

  const months = useMemo(() => generateMonths(), [currentMonth]);

  const createEmployeeMutation = useMutation({
    mutationFn: (data) => base44.entities.Employee.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setShowAddDialog(false);
        setEditingEmployee(null);
        resetForm();
        setSuccess(false);
      }, 1500);
    },
    onError: () => {
      setError('هەڵە لە زیادکردنی کارمەند');
      setSuccess(false);
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Employee.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setSuccess(true);
      setError('');
      setTimeout(() => {
        setShowAddDialog(false);
        setEditingEmployee(null);
        resetForm();
        setSuccess(false);
      }, 1500);
    },
    onError: () => {
      setError('هەڵە لە نوێکردنەوەی کارمەند');
      setSuccess(false);
    }
  });

  // This mutation is no longer used for soft delete. It would be used for hard delete if needed.
  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => base44.entities.Employee.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });

  const toggleMonthMutation = useMutation({
    mutationFn: async ({ employeeId, month }) => {
      const employee = employees.find(e => e.id === employeeId); // Find from the full list to preserve all properties
      if (!employee) return;
      
      let currentMonths = Array.isArray(employee.assigned_months) ? employee.assigned_months : [];
      let updatedMonths;
      
      if (currentMonths.includes(month)) {
        // Remove month
        updatedMonths = currentMonths.filter(m => m !== month);
      } else {
        // Add month
        updatedMonths = [...currentMonths, month];
      }
      
      // Preserve all existing fields, including is_deleted if present
      const updateData = {
        ...employee,
        assigned_months: updatedMonths
      };
      
      await base44.entities.Employee.update(employeeId, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (error) => {
      console.error('Error toggling month:', error);
      setError('هەڵە لە گۆڕینی مانگ');
      setTimeout(() => setError(''), 3000);
    }
  });

  const resetForm = () => {
    setFormData({
      employee_name: '',
      employee_number: '',
      salary: 0,
      currency: 'IQD',
      payment_date: format(new Date(), 'yyyy-MM-dd'),
      is_paid: false
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployeeMutation.mutate({
        id: editingEmployee.id,
        data: formData
      });
    } else {
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      employee_name: employee.employee_name,
      employee_number: employee.employee_number,
      salary: employee.salary,
      currency: employee.currency || 'IQD',
      payment_date: employee.payment_date || format(new Date(), 'yyyy-MM-dd'),
      is_paid: employee.is_paid || false
    });
    setShowAddDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('دڵنیای لە سڕینەوەی ئەم کارمەندە؟')) {
      const employee = employees.find(e => e.id === id); // Find the employee from the full list
      if (employee) {
        updateEmployeeMutation.mutate({ // Use update mutation for soft delete
          id,
          data: { ...employee, is_deleted: true } // Set is_deleted to true
        });
      }
    }
  };

  const handleToggleMonth = (employeeId, month) => {
    toggleMonthMutation.mutate({ employeeId, month });
  };

  const isMonthAssigned = (employee, month) => {
    const assignedMonths = Array.isArray(employee.assigned_months) ? employee.assigned_months : [];
    return assignedMonths.includes(month);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600">چاوەڕێ بە...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">کارمەندان</h1>
            <p className="text-gray-600 mt-1">بەڕێوەبردنی کارمەندان و مووچەی مانگانە</p>
          </div>
          <Button
            onClick={() => {
              setEditingEmployee(null);
              resetForm();
              setShowAddDialog(true);
            }}
            className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
          >
            <Plus className="w-5 h-5 ml-2" />
            کارمەندی نوێ
          </Button>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Month Navigator */}
        <Card className="mb-6 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="text-sm text-purple-800 font-semibold">
                    بینینی مانگی:
                  </div>
                  <div className="text-2xl font-bold text-purple-900">
                    {format(currentMonth, 'MMMM yyyy')} ({monthStr})
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousMonth}
                  className="hover:bg-purple-100"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToToday}
                  className="hover:bg-purple-100 px-4"
                >
                  ئەمڕۆ
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextMonth}
                  className="hover:bg-purple-100"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی مووچە بۆ {monthStr} (IQD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalSalaryIQD, 'IQD')}</div>
              <p className="text-xs opacity-80 mt-1">{currentMonthEmployees.filter(e => e.currency === 'IQD').length} کارمەند</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی مووچە بۆ {monthStr} (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(totalSalaryUSD, 'USD')}</div>
              <p className="text-xs opacity-80 mt-1">{currentMonthEmployees.filter(e => e.currency === 'USD').length} کارمەند</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CalendarIcon className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">ڕێنمایی:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <span className="font-bold text-green-700">سەوز</span> = مووچەی ئەم مانگە دراوە</li>
                  <li>• <span className="font-bold text-red-700">سوور</span> = مووچەی ئەم مانگە نەدراوە</li>
                  <li>• <span className="font-bold text-gray-500">ڕەسەن</span> = ئەم مانگە بۆ ئەم کارمەندە نییە</li>
                  <li>• <span className="font-bold text-blue-600">خاڵی شین</span> = مانگی ئێستا (لە grid دا)</li>
                  <li>• کلیک لەسەر مانگێک بکە بۆ زیادکردن/لابردنی</li>
                  <li>• بۆ بینینی مانگەکانی 2027-2028، دووگمەی "<ChevronLeft className="w-3 h-3 inline" />" بەکاربهێنە</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {activeEmployees.map((employee) => {
            const assignedMonths = Array.isArray(employee.assigned_months) ? employee.assigned_months : [];

            return (
              <Card key={employee.id} className="hover:shadow-xl transition-all duration-300 border-2">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl">{employee.employee_name}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          #{employee.employee_number}
                        </Badge>
                        {isMonthAssigned(employee, monthStr) && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            لە مانگی {monthStr} دایە
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">مووچە: </span>
                          <span className="font-bold text-purple-600">
                            {formatCurrency(employee.salary || 0, employee.currency)}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600">بەروار: </span>
                          <span className="font-medium">{employee.payment_date || '-'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(employee)}
                        className="hover:bg-purple-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(employee.id)}
                        className="hover:bg-red-100 text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-3">
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      مانگەکان ({assignedMonths.length} مانگ دیاریکراوە):
                    </Label>
                  </div>
                  <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
                    {months.map(({ value, label, isCurrent }) => {
                      const isAssigned = isMonthAssigned(employee, value);
                      const isPaid = isAssigned && employee.is_paid;
                      const isViewingMonth = value === monthStr;
                      
                      return (
                        <button
                          key={value}
                          onClick={() => handleToggleMonth(employee.id, value)}
                          disabled={toggleMonthMutation.isPending}
                          className={`
                            relative p-2 rounded-lg text-xs font-bold transition-all duration-200
                            ${isAssigned 
                              ? isPaid
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md'
                                : 'bg-red-500 text-white hover:bg-red-600 shadow-md'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                            }
                            ${isViewingMonth ? 'ring-4 ring-blue-500' : isCurrent ? 'ring-2 ring-blue-300' : ''}
                            disabled:opacity-50 disabled:cursor-not-allowed
                          `}
                          title={isAssigned 
                            ? isPaid 
                              ? `${label} - پارەدراوە` 
                              : `${label} - نەدراوە`
                            : `${label} - دیارینەکراوە`
                          }
                        >
                          {label}
                          {isViewingMonth && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                          )}
                          {isAssigned && (
                            <div className="text-[10px] mt-0.5">
                              {isPaid ? '✓' : '✗'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  
                  {assignedMonths.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm bg-gray-50 rounded-lg mt-3">
                      هیچ مانگێک دیارینەکراوە. کلیک لەسەر مانگێک بکە بۆ دیاریکردنی.
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {activeEmployees.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-gray-500 text-lg">هیچ کارمەندێک زیادنەکراوە</p>
          </Card>
        )}

        {/* Add/Edit Employee Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingEmployee ? 'دەستکاریکردنی کارمەند' : 'کارمەندی نوێ'}
              </DialogTitle>
            </DialogHeader>

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {editingEmployee ? 'کارمەند بە سەرکەوتوویی نوێکرایەوە!' : 'کارمەند بە سەرکەوتوویی زیادکرا!'}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee_name">ناوی کارمەند</Label>
                <Input
                  id="employee_name"
                  value={formData.employee_name}
                  onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employee_number">ژمارەی کارمەند</Label>
                <Input
                  id="employee_number"
                  value={formData.employee_number}
                  onChange={(e) => setFormData({...formData, employee_number: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">جۆری دراو</Label>
                <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
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
                <Label htmlFor="salary">مووچە ({formData.currency})</Label>
                <Input
                  id="salary"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData({...formData, salary: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_date">بەرواری پارەدان</Label>
                <Input
                  id="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => setFormData({...formData, payment_date: e.target.value})}
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>تێبینی:</strong> دوای زیادکردنی کارمەند، دەتوانیت کلیک لەسەر مانگەکان بکەیت بۆ دیاریکردنی کام مانگێک مووچە دەدرێت.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1"
                >
                  پاشگەزبوونەوە
                </Button>
                <Button
                  type="submit"
                  disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {createEmployeeMutation.isPending || updateEmployeeMutation.isPending
                    ? 'چاوەڕێ بە...'
                    : editingEmployee
                    ? 'نوێکردنەوە'
                    : 'زیادکردن'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
