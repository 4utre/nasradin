import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import Calendar from './pages/Calendar';
import Drivers from './pages/Drivers';
import Reports from './pages/Reports';
import Backup from './pages/Backup';
import Users from './pages/Users';
import Employees from './pages/Employees';
import Settings from './pages/Settings';
import PrintTemplates from './pages/PrintTemplates';
import PrintSettings from './pages/PrintSettings';
import Trailers from './pages/Trailers';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "AddExpense": AddExpense,
    "Calendar": Calendar,
    "Drivers": Drivers,
    "Reports": Reports,
    "Backup": Backup,
    "Users": Users,
    "Employees": Employees,
    "Settings": Settings,
    "PrintTemplates": PrintTemplates,
    "PrintSettings": PrintSettings,
    "Trailers": Trailers,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};