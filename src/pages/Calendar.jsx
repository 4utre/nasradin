import React, { useState, useMemo, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek } from "date-fns";
import { ArrowRight, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

const expenseTypeColors = {
  "شوێن کڕینی گەورە": "bg-purple-500",
  "شۆفێر بچووک": "bg-blue-500",
  "حەقان بچووک": "bg-cyan-500",
  "حەقان گەورە": "bg-indigo-500",
  "کڕینەوە": "bg-green-500",
  "حانیینە سنبل": "bg-orange-500",
  "حانیینە زاڵاق": "bg-red-500",
  "تێنکەر تاو": "bg-yellow-500",
  "خۆی کێشی": "bg-pink-500"
};

const ADMIN_EMAIL = 'hershufo23@gmail.com';

export default function Calendar() {
  const navigate = useNavigate();
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

  const { data: allExpenses = [] } = useQuery({
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
        return true;
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

  const calendarDays = useMemo(() => {
    const start = startOfWeek(monthStart, { weekStartsOn: 6 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 6 });
    return eachDayOfInterval({ start, end });
  }, [monthStart, monthEnd]);

  const getExpensesForDay = (day) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return expenses.filter(exp => exp.expense_date === dayStr);
  };

  const getDayTotalIQD = (day) => {
    const dayExpenses = getExpensesForDay(day);
    return dayExpenses.filter(exp => exp.currency === 'IQD' || !exp.currency).reduce((sum, exp) => sum + (exp.amount || 0), 0);
  };

  const getDayTotalUSD = (day) => {
    const dayExpenses = getExpensesForDay(day);
    return dayExpenses.filter(exp => exp.currency === 'USD').reduce((sum, exp) => sum + (exp.amount || 0), 0);
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
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">کالێندەری مانگانە</h1>
            <p className="text-gray-600 mt-1">بینینی خەرجییەکانی مانگی {currentMonth.getMonth() + 1} {currentMonth.getFullYear()}</p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowAmounts(!showAmounts)}
            className="hover:bg-gray-100"
          >
            {showAmounts ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                const dayExpenses = getExpensesForDay(day);
                const dayTotalIQD = getDayTotalIQD(day);
                const dayTotalUSD = getDayTotalUSD(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const unpaidExpenses = dayExpenses.filter(e => !e.is_paid);

                return (
                  <div
                    key={idx}
                    className={`
                      relative min-h-[120px] p-3 rounded-lg border-2 transition-all duration-200
                      ${isCurrentMonth ? 'bg-white' : 'bg-gray-50 opacity-50'}
                      ${isTodayDate ? 'border-emerald-500 shadow-md ring-2 ring-emerald-200' : 'border-gray-200'}
                    `}
                  >
                    <div className={`text-lg font-bold mb-2 ${isTodayDate ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {format(day, 'd')}
                      {isTodayDate && <Badge className="ml-2 bg-emerald-100 text-emerald-800 text-xs">ئەمڕۆ</Badge>}
                    </div>
                    
                    {dayExpenses.length > 0 && (
                      <div className="space-y-2">
                        {dayTotalIQD > 0 && (
                          <div className="text-xs bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded">
                            {formatCurrency(dayTotalIQD)} IQD
                          </div>
                        )}
                        {dayTotalUSD > 0 && (
                          <div className="text-xs bg-teal-50 text-teal-700 font-bold px-2 py-1 rounded">
                            {formatCurrency(dayTotalUSD)} USD
                          </div>
                        )}
                        
                        {unpaidExpenses.length > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-xs w-full justify-center">
                            {unpaidExpenses.length} نەدراوە
                          </Badge>
                        )}
                        
                        <div className="flex flex-wrap gap-1 mt-2">
                          {dayExpenses.slice(0, 3).map((exp, i) => (
                            <div
                              key={i}
                              className={`w-3 h-3 rounded-full ${expenseTypeColors[exp.expense_type] || 'bg-gray-400'}`}
                              title={exp.expense_type}
                            />
                          ))}
                          {dayExpenses.length > 3 && (
                            <div className="text-[10px] text-gray-600 font-bold">+{dayExpenses.length - 3}</div>
                          )}
                        </div>

                        <div className="text-[10px] text-gray-500 mt-1">
                          {dayExpenses.length} خەرجی
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span className="text-sm">شوێن کڕینی گەورە</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span className="text-sm">شۆفێر بچووک</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
            <span className="text-sm">حەقان بچووک</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-sm">کڕینەوە</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-sm">حانیینە سنبل</span>
          </div>
        </div>
      </div>
    </div>
  );
}