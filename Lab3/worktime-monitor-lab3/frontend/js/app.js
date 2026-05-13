const state = {
    user: null,
    records: [],
    workStatusKey: "idle",
    isWorkStarted: false,
    isBreakStarted: false,
    adminStats: null,
    users: [],
    absences: [],
    schedule: null,
    audit: [],
    summary: null
};

const pages = {
    dashboard: document.getElementById("dashboardPage"),
    history: document.getElementById("historyPage"),
    statistics: document.getElementById("statisticsPage"),
    absences: document.getElementById("absencesPage"),
    schedule: document.getElementById("schedulePage"),
    admin: document.getElementById("adminPage"),
    backup: document.getElementById("backupPage"),
    profile: document.getElementById("profilePage")
};

const pageTitles = {
    dashboard: ["Головна", "Dashboard"],
    history: ["Історія", "History"],
    statistics: ["Статистика", "Statistics"],
    absences: ["Відсутності", "Absences"],
    schedule: ["Графік", "Schedule"],
    admin: ["Адміністрування", "Administration"],
    backup: ["Резервна копія", "Backup"],
    profile: ["Профіль", "Profile"]
};

const workStatusTexts = {
    idle: ["Робочий день не розпочато", "Work day has not started"],
    working: ["Робочий день розпочато", "Work day started"],
    break: ["Перерва активна", "Break is active"],
    afterBreak: ["Робота продовжується", "Work continues"],
    finished: ["Робочий день завершено", "Work day finished"]
};

function t(uk, en) {
    return currentLang === "uk" ? uk : en;
}

function getWorkStatusText() {
    const value = workStatusTexts[state.workStatusKey] || workStatusTexts.idle;
    return t(value[0], value[1]);
}

function normalizeUser(user) {
    const rawIsActive = user.IsActive ?? user.isActive;

    return {
        id: user.Id ?? user.id,
        fullName: user.FullName ?? user.fullName,
        login: user.Login ?? user.login,
        email: user.Email ?? user.email,
        role: user.Role ?? user.role ?? "Employee",
        isActive: rawIsActive === undefined
            ? true
            : rawIsActive === 1 || rawIsActive === true
    };
}

function normalizeEntry(entry) {
    return {
        id: entry.Id ?? entry.id,
        userId: entry.UserId ?? entry.userId,
        entryType: entry.EntryType ?? entry.entryType,
        startTime: entry.StartTime ?? entry.startTime,
        endTime: entry.EndTime ?? entry.endTime,
        comment: entry.Comment ?? entry.comment
    };
}

function isAdmin() {
    return state.user?.role?.trim().toLowerCase() === "admin";
}

function toast(message) {
    const element = document.getElementById("toast");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;
    element.classList.remove("hidden");

    setTimeout(() => {
        element.classList.add("hidden");
    }, 2500);
}

function minutesToText(minutesValue) {
    const safeMinutes = Math.max(0, Math.round(minutesValue || 0));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;

    return currentLang === "uk"
        ? `${hours} год ${minutes} хв`
        : `${hours} h ${minutes} min`;
}

function dateOnly(date) {
    return date.toISOString().slice(0, 10);
}

function todayRange() {
    const date = new Date();

    return {
        from: dateOnly(date),
        to: dateOnly(date)
    };
}

function weekRange() {
    const now = new Date();
    const start = new Date(now);
    const day = start.getDay() || 7;

    start.setDate(start.getDate() - day + 1);

    return {
        from: dateOnly(start),
        to: dateOnly(now)
    };
}

function setElementText(id, text) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = text;
    }
}

function setElementHtml(id, html) {
    const element = document.getElementById(id);

    if (element) {
        element.innerHTML = html;
    }
}

function showApp() {
    document.getElementById("loginPage").classList.add("hidden");
    document.getElementById("contentPage").classList.remove("hidden");
    document.getElementById("sidebar").classList.remove("hidden");

    document.querySelectorAll(".admin-only").forEach((element) => {
        element.classList.toggle("hidden", !isAdmin());
    });

    updateUserInfo();
    showPage("dashboard");
}

function showLogin() {
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("contentPage").classList.add("hidden");
    document.getElementById("sidebar").classList.add("hidden");
}

function showPage(pageName) {
    if (!pages[pageName]) {
        return;
    }

    Object.values(pages).forEach((page) => {
        page.classList.remove("active-page");
    });

    pages[pageName].classList.add("active-page");

    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.classList.toggle("active", button.dataset.page === pageName);
    });

    updatePageHeader(pageName);
    refreshLanguageUI(false);

    if (pageName === "history") {
        loadHistory();
    }

    if (pageName === "statistics") {
        loadRealStatistics();
    }

    if (pageName === "absences") {
        loadAbsences();
    }

    if (pageName === "schedule") {
        loadSchedule();
    }

    if (pageName === "admin") {
        loadAdminOverview();
    }

    if (pageName === "backup") {
        updateBackupPreview();
    }
}

function updatePageHeader(pageName) {
    const title = pageTitles[pageName];

    if (title) {
        setElementText("pageTitle", currentLang === "uk" ? title[0] : title[1]);
    }

    setElementText(
        "pageSubtitle",
        t("Система моніторингу робочого часу", "Employee work time monitoring system")
    );
}

function translateDashboard() {
    setElementText("currentSessionTitle", t("Поточна сесія", "Current session"));

    setElementText(
        "currentSessionHint",
        t(
            "Використовуйте кнопки нижче, щоб фіксувати робочі події.",
            "Use the buttons below to record work events."
        )
    );

    setElementHtml("startWorkBtn", `
        <strong>${t("Почати робочий день", "Start work day")}</strong>
        <span>StartWork</span>
    `);

    setElementHtml("startBreakBtn", `
        <strong>${t("Почати перерву", "Start break")}</strong>
        <span>BreakStart</span>
    `);

    setElementHtml("endBreakBtn", `
        <strong>${t("Завершити перерву", "End break")}</strong>
        <span>BreakEnd</span>
    `);

    setElementHtml("endWorkBtn", `
        <strong>${t("Завершити робочий день", "End work day")}</strong>
        <span>EndWork</span>
    `);

    setElementText("workedTodayTitle", t("Відпрацьовано сьогодні", "Worked today"));
    setElementText("workedWeekTitle", t("Відпрацьовано за тиждень", "Worked this week"));
    setElementText("timeRecordsTitle", t("Записи часу", "Time records"));
}

function refreshLanguageUI(reloadActivePage = true) {
    applyTranslations();
    translateDashboard();
    updateUserInfo();
    updateDashboard();
    renderHistory();

    if (state.summary) {
        updateStatsUI(state.summary);
    }

    if (state.absences.length > 0) {
        renderAbsences();
    }

    if (state.schedule) {
        renderSchedule();
    }

    if (isAdmin()) {
        renderAdminStats();
        renderUsers();
        populateReportUsers();
        renderAudit();
    }

    const activeButton = document.querySelector(".nav-btn.active");

    if (activeButton) {
        updatePageHeader(activeButton.dataset.page);

        if (reloadActivePage) {
            const pageName = activeButton.dataset.page;

            if (pageName === "backup") {
                updateBackupPreview();
            }
        }
    }
}

function updateUserInfo() {
    if (!state.user) {
        return;
    }

    setElementText("userName", state.user.fullName || "User");
    setElementText("userRole", state.user.role || "Employee");
    setElementText("profileName", state.user.fullName || "User");
    setElementText("profileLogin", state.user.login || state.user.email || "login");
    setElementText("profileRole", state.user.role || "Employee");

    setElementText(
        "profileStatus",
        state.user.isActive
            ? t("Активний", "Active")
            : t("Заблокований", "Blocked")
    );
}

function updateDashboard() {
    setElementText("workStatus", getWorkStatusText());
    setElementText("localRecordCount", String(state.records.length));

    const badge = document.getElementById("statusBadge");

    if (badge) {
        badge.textContent = state.isBreakStarted
            ? t("Перерва", "Break")
            : state.isWorkStarted
                ? t("Працює", "Working")
                : t("Очікування", "Idle");
    }
}

function formatEvent(type) {
    const map = {
        StartWork: t("Початок роботи", "Start work"),
        EndWork: t("Завершення роботи", "End work"),
        BreakStart: t("Початок перерви", "Start break"),
        BreakEnd: t("Завершення перерви", "End break")
    };

    return map[type] || type;
}

function renderHistory() {
    const box = document.getElementById("historyList");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    if (!state.records.length) {
        box.innerHTML = `<p class="muted">${t("Історія поки порожня", "History is empty")}</p>`;
        return;
    }

    [...state.records].reverse().forEach((record) => {
        const item = document.createElement("div");
        item.className = "list-item";

        item.innerHTML = `
            <div class="row">
                <b>${formatEvent(record.entryType || record.action)}</b>
                <span>${new Date(record.startTime || record.time).toLocaleString()}</span>
            </div>
            <p>${record.comment || record.description || ""}</p>
        `;

        box.appendChild(item);
    });
}

async function handleLogin(event) {
    event?.preventDefault();

    const login = document.getElementById("loginInput").value.trim();
    const password = document.getElementById("passwordInput").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    try {
        await api.login(login, password);

        const me = await api.getMe();

        state.user = normalizeUser(me);
        localStorage.setItem("user", JSON.stringify(state.user));

        showApp();

        await Promise.all([
            loadHistory(false),
            loadRealStatistics(false),
            isAdmin() ? loadAdminStats(false) : Promise.resolve()
        ]);

        toast(t("Вхід виконано", "Signed in"));
    } catch (errorObject) {
        error.textContent = `${t("Помилка входу", "Login error")}: ${errorObject.message}`;
    }
}

async function restoreSession() {
    if (!hasToken()) {
        showLogin();
        return;
    }

    try {
        state.user = normalizeUser(await api.getMe());
        localStorage.setItem("user", JSON.stringify(state.user));

        showApp();

        await Promise.all([
            loadHistory(false),
            loadRealStatistics(false),
            isAdmin() ? loadAdminStats(false) : Promise.resolve()
        ]);
    } catch {
        clearToken();
        localStorage.removeItem("user");
        showLogin();
    }
}

async function doTimeAction(actionName, apiMethod) {
    try {
        await apiMethod();

        if (actionName === "StartWork") {
            state.isWorkStarted = true;
            state.isBreakStarted = false;
            state.workStatusKey = "working";
        }

        if (actionName === "BreakStart") {
            state.isBreakStarted = true;
            state.workStatusKey = "break";
        }

        if (actionName === "BreakEnd") {
            state.isBreakStarted = false;
            state.workStatusKey = "afterBreak";
        }

        if (actionName === "EndWork") {
            state.isWorkStarted = false;
            state.isBreakStarted = false;
            state.workStatusKey = "finished";
        }

        toast(t("Дію виконано", "Action completed"));

        await loadHistory(false);
        await loadRealStatistics(false);

        updateDashboard();
    } catch (errorObject) {
        alert(`${t("Помилка запиту", "Request error")}: ${errorObject.message}`);
    }
}

async function loadHistory(show = true) {
    try {
        const data = await api.getMyTimeEntries();

        state.records = Array.isArray(data)
            ? data.map(normalizeEntry)
            : [];

        renderHistory();
        updateDashboard();
    } catch (errorObject) {
        if (show) {
            alert(errorObject.message);
        }
    }
}

function updateStatsUI(summary) {
    const totals = summary?.totals || {};
    const worked = totals.totalWorkedMinutes || 0;

    setElementText("weekWorkedValue", minutesToText(worked));
    setElementText("statsWeekWorkedValue", minutesToText(worked));
    setElementText("statsRecordCount", String(state.records.length));

    const today = summary?.days?.find((day) => day.date === todayRange().from);
    const todayWorked = today?.workedMinutes || 0;

    setElementText("todayWorkedValue", minutesToText(todayWorked));
    setElementText("statsTodayWorkedValue", minutesToText(todayWorked));

    renderDailyStats(summary?.days || []);
}

function renderDailyStats(days) {
    const body = document.getElementById("dailyStatsBody");

    if (!body) {
        return;
    }

    body.innerHTML = "";

    if (!days.length) {
        body.innerHTML = `<tr><td colspan="5" class="muted">${t("Немає даних", "No data")}</td></tr>`;
        return;
    }

    days.forEach((day) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${day.date}</td>
            <td>${minutesToText(day.plannedMinutes)}</td>
            <td>${minutesToText(day.workedMinutes)}</td>
            <td>${day.isLate ? minutesToText(day.lateMinutes) : "—"}</td>
            <td>${day.hasAbsence ? t("Так", "Yes") : "—"}</td>
        `;

        body.appendChild(row);
    });
}

async function loadRealStatistics(show = true) {
    try {
        const range = weekRange();
        const summary = await api.getMySummary(range.from, range.to);

        state.summary = summary;

        updateStatsUI(summary);
    } catch (errorObject) {
        if (show) {
            alert(errorObject.message);
        }
    }
}

function renderAbsences() {
    const box = document.getElementById("absencesList");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    if (!state.absences.length) {
        box.innerHTML = `<p class="muted">${t("Відсутностей немає", "No absences")}</p>`;
        return;
    }

    state.absences.forEach((absence) => {
        const item = document.createElement("div");
        item.className = "list-item";

        item.innerHTML = `
            <b>${absence.Type || absence.type}</b>
            <p>${absence.DateStart || absence.dateStart} — ${absence.DateEnd || absence.dateEnd}</p>
            <span>${absence.Comment || absence.comment || ""}</span>
        `;

        box.appendChild(item);
    });
}

async function loadAbsences(show = true) {
    try {
        const list = await api.getMyAbsences();

        state.absences = Array.isArray(list) ? list : [];
        renderAbsences();
    } catch (errorObject) {
        if (show) {
            alert(errorObject.message);
        }
    }
}

async function createAbsence() {
    const payload = {
        type: document.getElementById("absenceTypeInput").value,
        dateStart: document.getElementById("absenceStartInput").value,
        dateEnd: document.getElementById("absenceEndInput").value,
        comment: document.getElementById("absenceCommentInput").value
    };

    if (!payload.dateStart || !payload.dateEnd) {
        alert(t("Заповніть дати", "Fill dates"));
        return;
    }

    try {
        await api.createAbsence(payload);

        toast(t("Відсутність створено", "Absence created"));

        await loadAbsences(false);
    } catch (errorObject) {
        alert(errorObject.message);
    }
}

function renderSchedule() {
    const details = document.getElementById("scheduleDetails");

    if (!details) {
        return;
    }

    if (!state.schedule) {
        details.innerHTML = `<p class="muted">${t("Графік не знайдено", "Schedule not found")}</p>`;
        return;
    }

    const schedule = state.schedule;

    details.innerHTML = `
        <p><b>${t("Початок", "Start")}:</b> ${schedule.StartWork || schedule.startWork}</p>
        <p><b>${t("Кінець", "End")}:</b> ${schedule.EndWork || schedule.endWork}</p>
        <p><b>${t("Перерва", "Break")}:</b> ${schedule.BreakMinutes || schedule.breakMinutes} ${t("хв", "min")}</p>
        <p><b>${t("Робочі дні", "Working days")}:</b> ${schedule.WorkingDaysMask || schedule.workingDaysMask}</p>
    `;
}

async function loadSchedule(show = true) {
    try {
        state.schedule = await api.getMySchedule();
        renderSchedule();
    } catch (errorObject) {
        state.schedule = null;
        renderSchedule();

        if (show) {
            console.error(errorObject);
        }
    }
}

async function createSchedule() {
    const payload = {
        userId: document.getElementById("scheduleUserIdInput").value || null,
        startWork: document.getElementById("scheduleStartInput").value,
        endWork: document.getElementById("scheduleEndInput").value,
        breakMinutes: Number(document.getElementById("scheduleBreakInput").value),
        workingDaysMask: document.getElementById("scheduleMaskInput").value
    };

    try {
        await api.createSchedule(payload);

        toast(t("Графік створено", "Schedule created"));

        await loadSchedule(false);
    } catch (errorObject) {
        alert(errorObject.message);
    }
}

function renderAdminStats() {
    const stats = state.adminStats || {};

    setElementText("activeUsers", stats.activeUsers ?? stats.activeusers ?? 0);
    setElementText("blockedUsers", stats.blockedUsers ?? stats.blockedusers ?? 0);
    setElementText("totalUsers", stats.totalUsers ?? stats.totalusers ?? 0);
    setElementText("totalTimeEntries", stats.totalTimeEntries ?? stats.totaltimeentries ?? 0);
    setElementText("totalAbsences", stats.totalAbsences ?? stats.totalabsences ?? 0);
}

async function loadAdminStats(show = true) {
    if (!isAdmin()) {
        return;
    }

    try {
        state.adminStats = await api.getAdminStats();
        renderAdminStats();
    } catch (errorObject) {
        if (show) {
            alert(errorObject.message);
        }
    }
}

async function loadAdminOverview() {
    if (!isAdmin()) {
        return;
    }

    await Promise.all([
        loadAdminStats(false),
        loadUsers(false),
        loadAudit(false)
    ]).catch(() => {});
}

async function loadUsers(show = true) {
    try {
        const users = await api.getUsers();

        state.users = Array.isArray(users)
            ? users.map(normalizeUser)
            : [];

        renderUsers();
        populateReportUsers();
    } catch (errorObject) {
        if (show) {
            alert(errorObject.message);
        }
    }
}

function renderUsers() {
    const body = document.getElementById("usersBody");

    if (!body) {
        return;
    }

    body.innerHTML = "";

    state.users.forEach((user) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.fullName}</td>
            <td>${user.login}</td>
            <td>${user.email}</td>
            <td>
                <select data-role-user="${user.id}">
                    <option ${user.role === "Employee" ? "selected" : ""}>Employee</option>
                    <option ${user.role === "Manager" ? "selected" : ""}>Manager</option>
                    <option ${user.role === "Admin" ? "selected" : ""}>Admin</option>
                </select>
            </td>
            <td>${user.isActive ? t("Активний", "Active") : t("Заблокований", "Blocked")}</td>
            <td>
                <div class="inline-actions">
                    <button class="secondary-btn small-btn" data-save-role="${user.id}">
                        ${t("Змінити роль", "Change role")}
                    </button>
                    <button class="${user.isActive ? "danger-btn" : "success-btn"} small-btn" data-toggle-user="${user.id}">
                        ${user.isActive ? t("Блокувати", "Block") : t("Розблокувати", "Unblock")}
                    </button>
                </div>
            </td>
        `;

        body.appendChild(row);
    });

    body.querySelectorAll("[data-save-role]").forEach((button) => {
        button.addEventListener("click", async () => {
            const id = button.dataset.saveRole;
            const role = body.querySelector(`[data-role-user="${id}"]`).value;

            try {
                await api.changeUserRole(id, role);

                toast(t("Роль змінено", "Role changed"));

                await loadUsers(false);
                await loadAdminStats(false);
            } catch (errorObject) {
                alert(errorObject.message);
            }
        });
    });

    body.querySelectorAll("[data-toggle-user]").forEach((button) => {
        button.addEventListener("click", async () => {
            const id = button.dataset.toggleUser;
            const user = state.users.find((item) => String(item.id) === String(id));

            try {
                if (user.isActive) {
                    await api.blockUser(id);
                } else {
                    await api.unblockUser(id);
                }

                toast(t("Статус змінено", "Status changed"));

                await loadUsers(false);
                await loadAdminStats(false);
            } catch (errorObject) {
                alert(errorObject.message);
            }
        });
    });
}

function populateReportUsers() {
    const select = document.getElementById("reportUserInput");

    if (!select) {
        return;
    }

    const current = select.value;

    select.innerHTML = `<option value="">${t("Усі користувачі", "All users")}</option>`;

    state.users.forEach((user) => {
        const option = document.createElement("option");

        option.value = user.id;
        option.textContent = `${user.fullName} (${user.login})`;

        select.appendChild(option);
    });

    select.value = current;
}

async function loadAdminReport() {
    const from = document.getElementById("reportFromInput").value || weekRange().from;
    const to = document.getElementById("reportToInput").value || weekRange().to;
    const userId = document.getElementById("reportUserInput").value;

    try {
        const data = await api.getAdminSummary(from, to, userId);

        setElementHtml("adminReportBox", `<pre>${JSON.stringify(data, null, 2)}</pre>`);
    } catch (errorObject) {
        setElementHtml("adminReportBox", `<p class="error-text">${errorObject.message}</p>`);
    }
}

function renderAudit() {
    const box = document.getElementById("auditList");

    if (!box) {
        return;
    }

    box.innerHTML = "";

    if (!state.audit.length) {
        box.innerHTML = `<p class="muted">${t("Аудит порожній", "Audit is empty")}</p>`;
        return;
    }

    state.audit.slice(0, 50).forEach((auditItem) => {
        const item = document.createElement("div");
        item.className = "list-item";

        item.innerHTML = `
            <div class="row">
                <b>${auditItem.Action}</b>
                <span>${new Date(auditItem.Timestamp).toLocaleString()}</span>
            </div>
            <p>${auditItem.EntityName} #${auditItem.EntityId || "—"}</p>
        `;

        box.appendChild(item);
    });
}

async function loadAudit(show = true) {
    try {
        const audit = await api.getAudit();

        state.audit = Array.isArray(audit) ? audit : [];
        renderAudit();
    } catch (errorObject) {
        if (show) {
            alert(errorObject.message);
        }
    }
}

function updateBackupPreview() {
    const backup = {
        createdAt: new Date().toISOString(),
        user: state.user,
        workStatus: getWorkStatusText(),
        records: state.records,
        adminStats: state.adminStats,
        users: state.users,
        absences: state.absences,
        schedule: state.schedule,
        summary: state.summary
    };

    setElementText("backupPreview", JSON.stringify(backup, null, 2));
}

function exportBackup() {
    updateBackupPreview();

    const blob = new Blob(
        [document.getElementById("backupPreview").textContent],
        { type: "application/json" }
    );

    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "worktime-monitor-backup.json";
    link.click();

    URL.revokeObjectURL(link.href);
}

function importBackup() {
    const file = document.getElementById("importFile").files[0];

    if (!file) {
        alert(t("Оберіть JSON-файл", "Choose JSON file"));
        return;
    }

    const reader = new FileReader();

    reader.onload = () => {
        try {
            const backup = JSON.parse(reader.result);

            state.records = backup.records || [];
            state.adminStats = backup.adminStats || null;
            state.absences = backup.absences || [];
            state.schedule = backup.schedule || null;
            state.summary = backup.summary || null;

            renderHistory();
            renderAdminStats();
            updateDashboard();
            updateBackupPreview();

            toast(t("Backup імпортовано", "Backup imported"));
        } catch {
            alert(t("Помилка імпорту JSON", "JSON import error"));
        }
    };

    reader.readAsText(file);
}

function logout() {
    clearToken();
    localStorage.removeItem("user");

    Object.assign(state, {
        user: null,
        records: [],
        workStatusKey: "idle",
        isWorkStarted: false,
        isBreakStarted: false,
        adminStats: null,
        users: [],
        absences: [],
        schedule: null,
        audit: [],
        summary: null
    });

    showLogin();
}

function initTabs() {
    document.querySelectorAll(".tab-btn").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".tab-btn").forEach((item) => {
                item.classList.remove("active");
            });

            document.querySelectorAll(".admin-tab").forEach((tab) => {
                tab.classList.remove("active-admin-tab");
            });

            button.classList.add("active");
            document.getElementById(button.dataset.adminTab).classList.add("active-admin-tab");

            if (button.dataset.adminTab === "adminUsers") {
                loadUsers();
            }

            if (button.dataset.adminTab === "adminReports") {
                loadUsers(false);
                loadAdminReport();
            }

            if (button.dataset.adminTab === "adminAudit") {
                loadAudit();
            }
        });
    });
}

function setDefaultDates() {
    const range = weekRange();

    ["reportFromInput"].forEach((id) => {
        const element = document.getElementById(id);

        if (element) {
            element.value = range.from;
        }
    });

    ["reportToInput"].forEach((id) => {
        const element = document.getElementById(id);

        if (element) {
            element.value = range.to;
        }
    });

    const today = todayRange().from;

    ["absenceStartInput", "absenceEndInput"].forEach((id) => {
        const element = document.getElementById(id);

        if (element) {
            element.value = today;
        }
    });
}

function addClickListener(id, handler) {
    const element = document.getElementById(id);

    if (element) {
        element.addEventListener("click", handler);
    }
}

function initEvents() {
    addClickListener("loginBtn", handleLogin);
    addClickListener("logoutBtn", logout);

    addClickListener("langBtn", () => {
        toggleLanguage();
        refreshLanguageUI(true);
    });

    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            showPage(button.dataset.page);
        });
    });

    addClickListener("startWorkBtn", (event) => {
        event.preventDefault();
        doTimeAction("StartWork", api.startWork);
    });

    addClickListener("startBreakBtn", (event) => {
        event.preventDefault();
        doTimeAction("BreakStart", api.startBreak);
    });

    addClickListener("endBreakBtn", (event) => {
        event.preventDefault();
        doTimeAction("BreakEnd", api.endBreak);
    });

    addClickListener("endWorkBtn", (event) => {
        event.preventDefault();
        doTimeAction("EndWork", api.endWork);
    });

    addClickListener("loadHistoryBtn", () => {
        loadHistory();
    });

    addClickListener("loadStatsBtn", () => {
        loadRealStatistics();
    });

    addClickListener("createAbsenceBtn", createAbsence);

    addClickListener("loadAbsencesBtn", () => {
        loadAbsences();
    });

    addClickListener("loadScheduleBtn", () => {
        loadSchedule();
    });

    addClickListener("createScheduleBtn", createSchedule);

    addClickListener("loadUsersBtn", () => {
        loadUsers();
    });

    addClickListener("loadAdminStatsBtn", () => {
        loadAdminStats();
    });

    addClickListener("loadAdminReportBtn", loadAdminReport);

    addClickListener("loadAuditBtn", () => {
        loadAudit();
    });

    addClickListener("exportBtn", exportBackup);
    addClickListener("importBtn", importBackup);

    initTabs();
}

document.addEventListener("DOMContentLoaded", () => {
    applyTranslations();
    translateDashboard();
    setDefaultDates();
    initEvents();
    state.workStatusKey = "idle";
    updateDashboard();
    restoreSession();
});