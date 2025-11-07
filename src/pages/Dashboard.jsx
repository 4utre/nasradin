
import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, TrendingUp, Calendar as CalendarIcon, Wallet, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";

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

export default function Dashboard() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentUser, setCurrentUser] = useState(null);
  const [showAmounts, setShowAmounts] = useState(true);
  
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
  }, []);

  const { data: allExpenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => base44.entities.Expense.list('-expense_date'),
    initialData: [],
  });

  const { data: allEmployees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const expenses = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.email === ADMIN_EMAIL || currentUser.role === 'admin') return allExpenses;
    return allExpenses.filter(exp => exp.created_by === currentUser.email);
  }, [allExpenses, currentUser]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStr = format(currentMonth, 'yyyy-MM');
  
  const currentMonthExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const expDate = new Date(exp.expense_date);
      return expDate >= monthStart && expDate <= monthEnd;
    });
  }, [expenses, monthStart, monthEnd]);

  const currentMonthEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      const assignedMonths = emp.assigned_months;
      if (!assignedMonths || !Array.isArray(assignedMonths) || assignedMonths.length === 0) {
        return false; // Don't include if no months assigned
      }
      return assignedMonths.includes(monthStr);
    });
  }, [allEmployees, monthStr]);

  const totalMonthExpensesIQD = useMemo(() => {
    return currentMonthExpenses.filter(exp => exp.currency === 'IQD' || !exp.currency).reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [currentMonthExpenses]);

  const totalMonthExpensesUSD = useMemo(() => {
    return currentMonthExpenses.filter(exp => exp.currency === 'USD').reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [currentMonthExpenses]);

  const totalEmployeeSalaryIQD = useMemo(() => {
    return currentMonthEmployees.filter(emp => emp.currency === 'IQD').reduce((sum, emp) => sum + (emp.salary || 0), 0);
  }, [currentMonthEmployees]);

  const totalEmployeeSalaryUSD = useMemo(() => {
    return currentMonthEmployees.filter(emp => emp.currency === 'USD').reduce((sum, emp) => sum + (emp.salary || 0), 0);
  }, [currentMonthEmployees]);

  const grandTotalIQD = totalMonthExpensesIQD + totalEmployeeSalaryIQD;
  const grandTotalUSD = totalMonthExpensesUSD + totalEmployeeSalaryUSD;

  const unpaidExpenses = useMemo(() => {
    return currentMonthExpenses.filter(exp => !exp.is_paid);
  }, [currentMonthExpenses]);

  const unpaidAmountIQD = useMemo(() => {
    return unpaidExpenses.filter(exp => exp.currency === 'IQD' || !exp.currency).reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [unpaidExpenses]);

  const unpaidAmountUSD = useMemo(() => {
    return unpaidExpenses.filter(exp => exp.currency === 'USD').reduce((sum, exp) => sum + (exp.amount || 0), 0);
  }, [unpaidExpenses]);

  const totalHours = useMemo(() => {
    return currentMonthExpenses.reduce((sum, exp) => sum + (exp.hours || 0), 0);
  }, [currentMonthExpenses]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 6 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 6 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const getExpensesForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return expenses.filter(exp => exp.expense_date === dayStr);
  };

  const getDayTotal = (day) => {
    const dayExpenses = getExpensesForDay(day);
    return dayExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const formatCurrency = (amount) => {
    if (!showAmounts) return '***';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const weekDays = ["شەممە", "یەکشەممە", "دووشەممە", "سێشەممە", "چوارشەممە", "پێنجشەممە", "هەینی"];

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">داشبۆرد</h1>
            <p className="text-gray-600 mt-2">بەڕێوەبردنی خەرجییەکانی مانگی {currentMonth.getMonth() + 1} {currentMonth.getFullYear()}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowAmounts(!showAmounts)}
              className="hover:bg-gray-100"
            >
              {showAmounts ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>
            <Link to={createPageUrl("AddExpense")}>
              <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg">
                <PlusCircle className="w-5 h-5 ml-2" />
                زیادکردنی خەرجی
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی گشتی (IQD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(grandTotalIQD)}</div>
              <p className="text-xs opacity-80 mt-1">{currentMonthExpenses.filter(e => e.currency === 'IQD' || !e.currency).length} خەرجی + {currentMonthEmployees.filter(e => e.currency === 'IQD').length} کارمەند</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی گشتی (USD)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatCurrency(grandTotalUSD)}</div>
              <p className="text-xs opacity-80 mt-1">{currentMonthExpenses.filter(e => e.currency === 'USD').length} خەرجی + {currentMonthEmployees.filter(e => e.currency === 'USD').length} کارمەند</p>
            </CardContent>
          </Card>

          <Link to={createPageUrl("Reports?filter=unpaid")} className="block">
            <Card className="border-none shadow-lg bg-gradient-to-br from-red-500 to-red-600 text-white hover:shadow-xl transition-shadow cursor-pointer h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium opacity-90">
                  پارە نەدراوە
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(unpaidAmountIQD)} IQD</div>
                <div className="text-xl font-bold mt-1">{formatCurrency(unpaidAmountUSD)} USD</div>
                <p className="text-xs opacity-80 mt-1">{unpaidExpenses.length} خەرجی</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium opacity-90">
                کۆی کاتژمێرەکان
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalHours.toFixed(1)}</div>
              <p className="text-xs opacity-80 mt-1">کاتژمێر لەم مانگەدا</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900">
                مانگی {currentMonth.getMonth() + 1} {currentMonth.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                const dayTotal = getDayTotal(day);
                const dayExpenses = getExpensesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const unpaidTotal = dayExpenses.filter(e => !e.is_paid).reduce((sum, e) => sum + e.amount, 0);

                return (
                  <Link
                    key={idx}
                    to={createPageUrl(`Calendar?date=${format(day, 'yyyy-MM-dd')}`)}
                    className={`
                      relative min-h-[80px] p-2 rounded-lg border-2 transition-all duration-200
                      ${isCurrentMonth ? 'bg-white hover:shadow-md hover:scale-105' : 'bg-gray-50 opacity-50'}
                      ${isTodayDate ? 'border-emerald-500 shadow-md' : 'border-gray-200'}
                      ${dayExpenses.length > 0 ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                    </div>
                    {dayExpenses.length > 0 && (
                      <>
                        <div className="text-xs font-bold text-blue-600 mb-1">
                          {formatCurrency(dayTotal)}
                        </div>
                        {unpaidTotal > 0 && (
                          <div className="text-[10px] font-bold text-red-600 mb-1">
                            نەدراوە: {formatCurrency(unpaidTotal)}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {dayExpenses.slice(0, 2).map((exp, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${expenseTypeColors[exp.expense_type]?.replace('text-', 'bg-').split(' ')[0]}`}
                            />
                          ))}
                          {dayExpenses.length > 2 && (
                            <div className="text-[10px] text-gray-500">+{dayExpenses.length - 2}</div>
                          )}
                        </div>
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
