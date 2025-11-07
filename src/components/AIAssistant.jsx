
import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, X, Loader2, Sparkles, TrendingUp, AlertTriangle, FileText } from "lucide-react";
import { format } from "date-fns";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const messagesEndRef = useRef(null);

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

  const { data: drivers = [] } = useQuery({
    queryKey: ['drivers'],
    queryFn: () => base44.entities.Driver.list(),
    initialData: [],
  });

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: () => base44.entities.Employee.list(),
    initialData: [],
  });

  const expenses = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin'
    ? allExpenses
    : allExpenses.filter(exp => exp.created_by === currentUser?.email);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const suggestions = [
    "کۆی خەرجییەکانی ئەم مانگە چەندە؟",
    "پارە نەدراوەکان بدۆزەوە",
    "کامەیان زۆرترین پارەیان وەرگرتووە؟",
    "ڕاپۆرتی ئەم هەفتەیە بنووسە",
    "ئاماری مانگی ڕابردوو",
  ];

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Detect if user is asking for previous month or specific month
      let targetMonth = format(new Date(), 'yyyy-MM');
      let monthDescription = 'ئەم مانگە';
      
      const lowerMessage = userMessage.toLowerCase();
      
      // Check for previous month keywords in Kurdish
      if (lowerMessage.includes('ڕابردوو') || lowerMessage.includes('پێشوو') || lowerMessage.includes('کۆن')) {
        const prevDate = new Date();
        prevDate.setMonth(prevDate.getMonth() - 1);
        targetMonth = format(prevDate, 'yyyy-MM');
        monthDescription = 'مانگی ڕابردوو';
      }
      
      // Check for current month keywords
      if (lowerMessage.includes('ئەم مانگە') || lowerMessage.includes('ئێستا') || lowerMessage.includes('ئەمڕۆ')) {
        targetMonth = format(new Date(), 'yyyy-MM');
        monthDescription = 'ئەم مانگە';
      }
      
      // Prepare data context for AI based on target month
      const monthExpenses = expenses.filter(exp => exp.expense_date?.startsWith(targetMonth));
      const monthEmployees = employees.filter(emp => {
        const assignedMonths = emp.assigned_months;
        if (!assignedMonths || !Array.isArray(assignedMonths)) return false;
        return assignedMonths.includes(targetMonth);
      });
      
      const totalIQD = monthExpenses
        .filter(e => e.currency === 'IQD' || !e.currency)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const totalUSD = monthExpenses
        .filter(e => e.currency === 'USD')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const employeeSalaryIQD = monthEmployees
        .filter(e => e.currency === 'IQD')
        .reduce((sum, e) => sum + (e.salary || 0), 0);

      const employeeSalaryUSD = monthEmployees
        .filter(e => e.currency === 'USD')
        .reduce((sum, e) => sum + (e.salary || 0), 0);
      
      const unpaidExpenses = monthExpenses.filter(e => !e.is_paid);
      const unpaidIQD = unpaidExpenses
        .filter(e => e.currency === 'IQD' || !e.currency)
        .reduce((sum, e) => sum + (e.amount || 0), 0);
      const unpaidUSD = unpaidExpenses
        .filter(e => e.currency === 'USD')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Top drivers by spending
      const driverTotals = {};
      monthExpenses.forEach(exp => {
        if (exp.driver_name) {
          if (!driverTotals[exp.driver_name]) {
            driverTotals[exp.driver_name] = { total: 0, count: 0 };
          }
          driverTotals[exp.driver_name].total += exp.amount || 0;
          driverTotals[exp.driver_name].count += 1;
        }
      });

      const topDrivers = Object.entries(driverTotals)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5)
        .map(([name, data]) => `${name}: ${formatCurrency(data.total)} IQD (${data.count} خەرجی)`);

      // Expense type distribution
      const expenseTypes = {};
      monthExpenses.forEach(exp => {
        if (exp.expense_type) {
          expenseTypes[exp.expense_type] = (expenseTypes[exp.expense_type] || 0) + 1;
        }
      });

      const topExpenseTypes = Object.entries(expenseTypes)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => `${type}: ${count} جار`);

      const contextData = `
بنەماکانی داتا بۆ ${monthDescription} (${targetMonth}):

کۆی خەرجییەکان:
- دینار: ${formatCurrency(totalIQD)} IQD
- دۆلار: ${formatCurrency(totalUSD)} USD
- ژمارەی خەرجییەکان: ${monthExpenses.length}

کۆی مووچەی کارمەندان:
- دینار: ${formatCurrency(employeeSalaryIQD)} IQD
- دۆلار: ${formatCurrency(employeeSalaryUSD)} USD
- ژمارەی کارمەندان: ${monthEmployees.length}

کۆی گشتی (خەرجی + مووچە):
- دینار: ${formatCurrency(totalIQD + employeeSalaryIQD)} IQD
- دۆلار: ${formatCurrency(totalUSD + employeeSalaryUSD)} USD

پارە نەدراوە:
- دینار: ${formatCurrency(unpaidIQD)} IQD
- دۆلار: ${formatCurrency(unpaidUSD)} USD
- ژمارەی خەرجییەکان: ${unpaidExpenses.length}

${topDrivers.length > 0 ? `زۆرترین شۆفێرەکان:\n${topDrivers.join('\n')}` : ''}

${topExpenseTypes.length > 0 ? `زۆرترین جۆرەکانی خەرجی:\n${topExpenseTypes.join('\n')}` : ''}

ژمارەی شۆفێرەکان: ${drivers.length}
`;

      const prompt = `
تۆ یارمەتیدەرێکی زیرەکی بە زمانی کوردی (سۆرانی) بۆ سیستەمی بەڕێوەبردنی خەرجییەکان.

داتاکانی ئێستا:
${contextData}

پرسیاری بەکارهێنەر:
${userMessage}

ڕێنماییەکان گرنگەکان:
1. وەڵام بە کوردی بدەرەوە (سۆرانی)
2. CRITICAL: تەنها ژمارەی ئینگلیزی بەکاربهێنە (0-9) نەک ژمارەی کوردی یان عەرەبی
3. وەڵامەکە کورت و ڕاستەوخۆ بێت - تێبینی زیادە مەنووسە
4. تەنها ئەو زانیارییانە بنووسە کە پرسراون
5. فۆرماتی ژمارە: 1,234,567 (بە کۆما)
6. ئەگەر پرسیار لەسەر "مانگی ڕابردوو" بوو، ئاماری مانگی ${targetMonth} بنووسە

نموونەی وەڵامی دروست:
کۆی خەرجییەکانی مانگی ڕابردوو: 14,868,870 IQD
ژمارەی خەرجییەکان: 35
پارە نەدراو: 6,155,000 IQD

وەڵام:`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response,
        metadata: {
          totalExpenses: monthExpenses.length,
          totalIQD: totalIQD + employeeSalaryIQD,
          totalUSD: totalUSD + employeeSalaryUSD,
          unpaid: unpaidExpenses.length
        }
      }]);

    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'ببورە، هەڵەیەک ڕوویدا. تکایە دووبارە هەوڵ بدەرەوە.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-14 h-14 md:w-16 md:h-16 rounded-full shadow-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 z-50"
        size="icon"
      >
        {isOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Bot className="w-5 h-5 md:w-6 md:h-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-20 md:bottom-24 left-2 right-2 md:left-6 md:right-auto md:w-[450px] h-[70vh] md:h-[600px] max-h-[600px] shadow-2xl z-50 flex flex-col border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white border-b py-3 md:py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 md:w-6 md:h-6" />
                </div>
                <div>
                  <CardTitle className="text-base md:text-lg">یارمەتیدەری AI</CardTitle>
                  <p className="text-[10px] md:text-xs opacity-90">پرسیار لەسەر خەرجییەکانت بکە</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 md:w-4 md:h-4 animate-pulse" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center py-4 md:py-8">
                  <Bot className="w-12 h-12 md:w-16 md:h-16 text-purple-300 mx-auto mb-3 md:mb-4" />
                  <p className="text-sm md:text-base text-gray-600 font-semibold mb-2">سڵاو! چۆن یارمەتیت بدەم؟</p>
                  <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4">هەندێک پێشنیار:</p>
                  <div className="space-y-2">
                    {suggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestionClick(sug)}
                        className="block w-full text-xs md:text-sm text-right px-3 md:px-4 py-2 bg-white hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[80%] rounded-2xl px-3 md:px-4 py-2 md:py-3 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                        : 'bg-white border-2 border-purple-200 text-gray-800'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-purple-600">
                        <Bot className="w-3 h-3 md:w-4 md:h-4" />
                        <span className="text-[10px] md:text-xs font-semibold">AI یارمەتیدەر</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">
                      {msg.content}
                    </div>
                    {msg.metadata && (
                      <div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-purple-200 flex flex-wrap gap-1 md:gap-2">
                        <Badge className="bg-purple-100 text-purple-800 text-[10px] md:text-xs">
                          {msg.metadata.totalExpenses} خەرجی
                        </Badge>
                        {msg.metadata.unpaid > 0 && (
                          <Badge className="bg-red-100 text-red-800 text-[10px] md:text-xs">
                            <AlertTriangle className="w-2 h-2 md:w-3 md:h-3 ml-1" />
                            {msg.metadata.unpaid} نەدراوە
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-end">
                  <div className="bg-white border-2 border-purple-200 rounded-2xl px-3 md:px-4 py-2 md:py-3">
                    <div className="flex items-center gap-2 text-purple-600">
                      <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
                      <span className="text-xs md:text-sm">بیردەکەمەوە...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 md:p-4 border-t bg-white">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="پرسیارێک بکە..."
                  className="flex-1 text-sm md:text-base"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 h-9 w-9 md:h-10 md:w-10"
                  size="icon"
                >
                  <Send className="w-4 h-4 md:w-5 md:h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
