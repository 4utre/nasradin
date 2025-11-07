
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { LayoutDashboard, PlusCircle, Users, FileText, Calendar, ChevronRight, ChevronLeft, Database, UserCog, Settings as SettingsIcon, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

const ADMIN_EMAIL = 'hershufo23@gmail.com';

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [autoBackupStatus, setAutoBackupStatus] = useState('idle'); // idle, running, success, error

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

  // Auto Backup Logic - Moved here so it persists across all pages
  useEffect(() => {
    let isBackupInProgress = false;

    const checkAndSendAutoBackup = async () => {
      // Don't run if already in progress
      if (isBackupInProgress) {
        console.log('Backup already in progress, skipping...');
        return;
      }

      const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
      const autoBackupEmail = localStorage.getItem('autoBackupEmail');
      
      if (!autoBackupEnabled || !autoBackupEmail) {
        console.log('Auto backup not enabled or email missing');
        return;
      }

      const lastBackupTime = localStorage.getItem('lastAutoBackupTime');
      const now = new Date().getTime();
      const twentyFourHours = 24 * 60 * 60 * 1000;

      if (!lastBackupTime || now - parseInt(lastBackupTime) >= twentyFourHours) {
        console.log('Auto backup is due, sending backup...');
        isBackupInProgress = true;
        setAutoBackupStatus('running');
        
        try {
          await sendAutoBackup(autoBackupEmail);
          setAutoBackupStatus('success');
          
          // Reset status after 5 seconds
          setTimeout(() => setAutoBackupStatus('idle'), 5000);
        } catch (err) {
          console.error('Auto backup failed:', err);
          setAutoBackupStatus('error');
          
          // Don't disable auto backup, just log the error
          // User can see error in console and backup will retry in 1 hour
          
          // Reset status after 10 seconds
          setTimeout(() => setAutoBackupStatus('idle'), 10000);
        } finally {
          isBackupInProgress = false;
        }
      }
    };

    const sendAutoBackup = async (email) => {
      console.log('Sending auto backup to:', email);
      
      try {
        // Fetch all data with error handling
        const expenses = await base44.entities.Expense.list().catch((e) => { console.error("Failed to fetch expenses:", e); return []; });
        const drivers = await base44.entities.Driver.list().catch((e) => { console.error("Failed to fetch drivers:", e); return []; });
        const employees = await base44.entities.Employee.list().catch((e) => { console.error("Failed to fetch employees:", e); return []; });
        const expenseTypes = await base44.entities.ExpenseType.list().catch((e) => { console.error("Failed to fetch expense types:", e); return []; });
        const appSettings = await base44.entities.AppSetting.list().catch((e) => { console.error("Failed to fetch app settings:", e); return []; });
        const printTemplates = await base44.entities.PrintTemplate.list().catch((e) => { console.error("Failed to fetch print templates:", e); return []; });

        console.log(`Fetched data: ${expenses.length} expenses, ${drivers.length} drivers, ${employees.length} employees`);

        // JSON Backup
        const jsonBackupData = {
          timestamp: new Date().toISOString(),
          version: '2.0',
          month: 'all',
          data: {
            expenses,
            drivers,
            employees,
            expenseTypes,
            appSettings,
            printTemplates
          }
        };
        
        const jsonBlob = new Blob([JSON.stringify(jsonBackupData, null, 2)], { type: 'application/json' });
        const jsonFilename = `auto_backup_json_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`;
        const jsonFile = new File([jsonBlob], jsonFilename, { type: 'application/json' });
        const jsonUploadResult = await base44.integrations.Core.UploadFile({ file: jsonFile });

        // SQL Backup (simplified version)
        let sqlContent = '-- Expense Tracking System Database Backup\n';
        sqlContent += `-- Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}\n\n`;
        
        sqlContent += '-- Expenses\n';
        expenses.forEach(exp => {
          // Escape single quotes in string values if necessary, or ensure clean data
          const driverName = exp.driver_name ? exp.driver_name.replace(/'/g, "''") : '';
          const expenseDate = exp.expense_date ? exp.expense_date.replace(/'/g, "''") : '';
          sqlContent += `INSERT INTO expenses VALUES ('${exp.id}', '${expenseDate}', '${driverName}', ${exp.amount || 0});\n`;
        });

        const sqlBlob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8' });
        const sqlFilename = `auto_backup_sql_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.sql`;
        const sqlFile = new File([sqlBlob], sqlFilename, { type: 'text/plain' });
        const sqlUploadResult = await base44.integrations.Core.UploadFile({ file: sqlFile });

        // Excel (CSV) Backup
        const csvHeaders = ['بەروار', 'ناو', 'بڕی پارە', 'دراو'];
        const csvRows = expenses.map(exp => 
          `"${exp.expense_date?.replace(/"/g, '""')}","${exp.driver_name?.replace(/"/g, '""') || '-'}","${exp.amount || 0}","${exp.currency?.replace(/"/g, '""') || 'IQD'}"`
        );
        const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
        const BOM = '\uFEFF';
        
        const excelBlob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const excelFilename = `auto_backup_excel_full_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
        const excelFile = new File([excelBlob], excelFilename, { type: 'text/csv' });
        const excelUploadResult = await base44.integrations.Core.UploadFile({ file: excelFile });

        // Send email
        await base44.integrations.Core.SendEmail({
          to: email,
          subject: `Automatic Daily Backup (JSON + SQL + Excel) - ${format(new Date(), 'yyyy-MM-dd HH:mm')}`,
          body: `پاشەکەوتکردنی ئۆتۆماتیکی ڕۆژانە

بەرواری پاشەکەوتکردن: ${format(new Date(), 'yyyy-MM-dd HH:mm')}

ژمارەی خەرجییەکان: ${expenses.length}
ژمارەی شۆفێرەکان: ${drivers.length}
ژمارەی کارمەندان: ${employees.length}
ژمارەی جۆرەکان: ${expenseTypes.length}

فایلی JSON (بۆ گەڕاندنەوەی تەواو):
${jsonUploadResult.file_url}

فایلی SQL (بۆ بنکەی زانیارییەکان):
${sqlUploadResult.file_url}

فایلی Excel (بۆ شیکاری و ڕاپۆرتەکان):
${excelUploadResult.file_url}

---
سیستەمی بەڕێوەبردنی خەرجی`
        });

        // Only update lastBackupTime if everything succeeded
        localStorage.setItem('lastAutoBackupTime', new Date().getTime().toString());
        console.log('Auto backup sent successfully!');
      } catch (err) {
        console.error('Auto backup failed with error:', err);
        // Don't update lastBackupTime so it will retry on next check
        throw err; // Re-throw to be caught by outer try-catch
      }
    };

    // Check immediately on mount
    checkAndSendAutoBackup();

    // Then check every hour
    const interval = setInterval(() => {
      checkAndSendAutoBackup();
    }, 60 * 60 * 1000); // Check every hour

    return () => clearInterval(interval);
  }, []); // Empty dependency array so it runs once on app mount

  const isAdmin = currentUser?.email === ADMIN_EMAIL || currentUser?.role === 'admin';

  const navigationItems = [
    {
      title: "داشبۆرد",
      url: createPageUrl("Dashboard"),
      icon: LayoutDashboard,
    },
    {
      title: "زیادکردنی خەرجی",
      url: createPageUrl("AddExpense"),
      icon: PlusCircle,
    },
    {
      title: "کالێندەر",
      url: createPageUrl("Calendar"),
      icon: Calendar,
    },
    {
      title: "شۆفێرەکان",
      url: createPageUrl("Drivers"),
      icon: Users,
    },
    {
      title: "کارمەندان",
      url: createPageUrl("Employees"),
      icon: Users,
    },
    {
      title: "تێکەرە",
      url: createPageUrl("Trailers"),
      icon: FileText,
    },
    {
      title: "ڕاپۆرتەکان",
      url: createPageUrl("Reports"),
      icon: FileText,
    },
    {
      title: "پاشەکەوتکردن",
      url: createPageUrl("Backup"),
      icon: Database,
    },
  ];

  if (isAdmin) {
    navigationItems.push({
      title: "بەکارهێنەران",
      url: createPageUrl("Users"),
      icon: UserCog,
    });
    navigationItems.push({
      title: "ڕێکخستنەکان",
      url: createPageUrl("Settings"),
      icon: SettingsIcon,
    });
    navigationItems.push({
      title: "ڕێکخستنی چاپکردن",
      url: createPageUrl("PrintSettings"),
      icon: Printer,
    });
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap');
        
        * {
          direction: rtl;
          font-family: 'Noto Sans Arabic', 'Segoe UI', Tahoma, Arial, sans-serif !important;
        }
        
        body {
          background: #F9FAFB;
        }
        
        .sidebar-rtl {
          border-left: 1px solid #E5E7EB;
          border-right: none;
          transition: all 0.3s ease-in-out;
          width: ${sidebarOpen ? '280px' : '0px'};
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .sidebar-rtl {
            position: fixed;
            top: 0;
            right: 0;
            height: 100vh;
            z-index: 50;
            background: white;
            width: ${sidebarOpen ? '280px' : '0px'};
          }
        }

        .auto-backup-indicator {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 1000;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          animation: slideIn 0.3s ease-out forwards; /* Changed to forwards to keep final state */
        }

        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .backup-running {
          background: #3B82F6;
          color: white;
        }

        .backup-success {
          background: #10B981;
          color: white;
        }

        .backup-error {
          background: #EF4444;
          color: white;
        }
      `}</style>
      
      <div className="min-h-screen flex w-full bg-gray-50" style={{direction: 'rtl'}}>
        {/* Auto Backup Status Indicator */}
        {autoBackupStatus !== 'idle' && (
          <div className={`auto-backup-indicator backup-${autoBackupStatus}`}>
            {autoBackupStatus === 'running' && (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>پاشەکەوتی ئۆتۆماتیک لە کاردایە...</span>
              </>
            )}
            {autoBackupStatus === 'success' && (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>پاشەکەوت بە سەرکەوتوویی نێردرا!</span>
              </>
            )}
            {autoBackupStatus === 'error' && (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>هەڵە لە پاشەکەوتکردن - دووبارە هەوڵ دەدرێتەوە</span>
              </>
            )}
          </div>
        )}

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div className="sidebar-rtl border-l border-gray-200 md:relative fixed z-50">
          <div className="h-full flex flex-col bg-white w-[280px]">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-lg">سیستەمی خەرجی</h2>
                  <p className="text-xs text-gray-500">کۆمپانیای کرێی ئامێرەکان</p>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-3 overflow-y-auto">
              <div className="mb-6">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                  مینیوی سەرەکی
                </div>
                <div>
                  {navigationItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.url}
                      onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 hover:text-emerald-700 transition-all duration-200 rounded-lg mb-1 ${
                        location.pathname === item.url ? 'bg-emerald-50 text-emerald-700 shadow-sm' : ''
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium text-[15px]">{item.title}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {currentUser?.full_name?.charAt(0) || 'ب'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">
                    {currentUser?.full_name || 'بەڕێوەبەر'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isAdmin ? 'بەڕێوەبەر' : 'بەکارهێنەر'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed top-1/2 -translate-y-1/2 z-50 shadow-lg bg-white hover:bg-gray-100 rounded-full w-8 h-8"
          style={{ right: sidebarOpen ? '280px' : '0px', transition: 'right 0.3s ease-in-out' }}
        >
          {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>

        <main className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
