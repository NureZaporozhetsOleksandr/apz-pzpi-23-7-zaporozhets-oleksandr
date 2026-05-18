const translations = {
    uk: {
        navDashboard: "Головна",
        navHistory: "Історія",
        navStatistics: "Статистика",
        navAbsences: "Відсутності",
        navSchedule: "Графік",
        navAdmin: "Адмін",
        navBackup: "Backup",
        navProfile: "Профіль",

        logout: "Вийти",

        loginSubtitle: "Web-клієнт системи обліку робочого часу",
        loginLabel: "Логін",
        passwordLabel: "Пароль",
        loginBtn: "Увійти",

        dashboardEyebrow: "Поточна сесія",
        dashboardHint: "Використовуйте кнопки нижче, щоб фіксувати робочі події.",

        startWork: "Почати робочий день",
        startBreak: "Почати перерву",
        endBreak: "Завершити перерву",
        endWork: "Завершити робочий день",

        todayWorked: "Відпрацьовано сьогодні",
        weekWorked: "Відпрацьовано за тиждень",
        timeRecords: "Записи часу",

        historyTitle: "Історія відміток",
        historySubtitle: "Список подій робочого часу користувача.",
        refresh: "Оновити",

        dailyStats: "Деталізація за днями",
        dailyStatsSubtitle: "План, факт, запізнення та відсутності.",
        date: "Дата",
        planned: "План",
        worked: "Факт",
        late: "Запізнення",
        absence: "Відсутність",

        createAbsence: "Створити запис відсутності",
        absenceType: "Тип",
        dateStart: "Дата початку",
        dateEnd: "Дата завершення",
        comment: "Коментар",
        save: "Зберегти",

        myAbsences: "Мої відсутності",
        myAbsencesSubtitle: "Записи відпусток, лікарняних та інших відсутностей.",

        mySchedule: "Мій графік",
        myScheduleSubtitle: "Персональний або загальний робочий графік.",
        createSchedule: "Створити графік",
        userIdOptional: "ID користувача або порожньо для загального",
        startWorkTime: "Початок роботи",
        endWorkTime: "Кінець роботи",
        breakMinutes: "Перерва, хв",
        workingDaysMask: "Робочі дні",

        adminOverview: "Огляд",
        adminUsers: "Користувачі",
        adminReports: "Звіти",
        adminAudit: "Аудит",

        activeUsers: "Активні користувачі",
        blockedUsers: "Заблоковані користувачі",
        totalUsers: "Усього користувачів",
        totalTimeEntries: "Записи часу",
        totalAbsences: "Записи відсутностей",

        usersManagement: "Керування користувачами",
        usersManagementSubtitle: "Блокування, розблокування та зміна ролей.",
        name: "Ім’я",
        role: "Роль",
        status: "Статус",
        actions: "Дії",

        systemReports: "Звіти системи",
        systemReportsSubtitle: "Зведення за користувачами та періодом.",
        allUsers: "Усі користувачі",

        auditLog: "Журнал аудиту",
        auditLogSubtitle: "Дії користувачів і зміни сутностей.",

        exportData: "Експорт даних",
        exportDescription: "Формування JSON-файлу з даними поточної web-сесії.",
        exportBtn: "Експортувати JSON",

        importData: "Імпорт даних",
        importDescription: "Завантаження JSON-файлу для відновлення даних.",
        importBtn: "Імпортувати",

        backupPreview: "Попередній перегляд backup",

        accountStatus: "Статус акаунта",
        backend: "Backend"
    },

    en: {
        navDashboard: "Dashboard",
        navHistory: "History",
        navStatistics: "Statistics",
        navAbsences: "Absences",
        navSchedule: "Schedule",
        navAdmin: "Admin",
        navBackup: "Backup",
        navProfile: "Profile",

        logout: "Logout",

        loginSubtitle: "Web client for employee work time tracking",
        loginLabel: "Login",
        passwordLabel: "Password",
        loginBtn: "Sign in",

        dashboardEyebrow: "Current session",
        dashboardHint: "Use the buttons below to record work events.",

        startWork: "Start work day",
        startBreak: "Start break",
        endBreak: "End break",
        endWork: "End work day",

        todayWorked: "Worked today",
        weekWorked: "Worked this week",
        timeRecords: "Time records",

        historyTitle: "Time entry history",
        historySubtitle: "List of user work-time events.",
        refresh: "Refresh",

        dailyStats: "Daily details",
        dailyStatsSubtitle: "Planned time, worked time, lateness and absences.",
        date: "Date",
        planned: "Planned",
        worked: "Worked",
        late: "Late",
        absence: "Absence",

        createAbsence: "Create absence record",
        absenceType: "Type",
        dateStart: "Start date",
        dateEnd: "End date",
        comment: "Comment",
        save: "Save",

        myAbsences: "My absences",
        myAbsencesSubtitle: "Vacation, sick leave and other absence records.",

        mySchedule: "My schedule",
        myScheduleSubtitle: "Personal or default work schedule.",
        createSchedule: "Create schedule",
        userIdOptional: "User ID or empty for default",
        startWorkTime: "Start work",
        endWorkTime: "End work",
        breakMinutes: "Break, min",
        workingDaysMask: "Working days",

        adminOverview: "Overview",
        adminUsers: "Users",
        adminReports: "Reports",
        adminAudit: "Audit",

        activeUsers: "Active users",
        blockedUsers: "Blocked users",
        totalUsers: "Total users",
        totalTimeEntries: "Time entries",
        totalAbsences: "Absence records",

        usersManagement: "User management",
        usersManagementSubtitle: "Block, unblock and change roles.",
        name: "Name",
        role: "Role",
        status: "Status",
        actions: "Actions",

        systemReports: "System reports",
        systemReportsSubtitle: "Summary by users and period.",
        allUsers: "All users",

        auditLog: "Audit log",
        auditLogSubtitle: "User actions and entity changes.",

        exportData: "Export data",
        exportDescription: "Creates a JSON file with current web session data.",
        exportBtn: "Export JSON",

        importData: "Import data",
        importDescription: "Loads a JSON file to restore data.",
        importBtn: "Import",

        backupPreview: "Backup preview",

        accountStatus: "Account status",
        backend: "Backend"
    }
};

let currentLang = localStorage.getItem("lang") || "uk";

function applyTranslations() {
    const dict = translations[currentLang];

    document.querySelectorAll("[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");

        if (dict[key]) {
            element.textContent = dict[key];
        }
    });

    document.querySelectorAll("option[data-i18n]").forEach((element) => {
        const key = element.getAttribute("data-i18n");

        if (dict[key]) {
            element.textContent = dict[key];
        }
    });

    const langBtn = document.getElementById("langBtn");

    if (langBtn) {
        langBtn.textContent = currentLang === "uk" ? "EN" : "UK";
    }
}

function toggleLanguage() {
    currentLang = currentLang === "uk" ? "en" : "uk";
    localStorage.setItem("lang", currentLang);
    applyTranslations();
}