const API_BASE_URL = window.location.pathname.startsWith("/app")
    ? `${window.location.origin}/api`
    : "http://localhost:3000/api";

let authToken = localStorage.getItem("token") || null;

function setToken(token) {
    authToken = token;
    localStorage.setItem("token", token);
}

function clearToken() {
    authToken = null;
    localStorage.removeItem("token");
}

function hasToken() {
    return !!authToken;
}

async function request(path, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {})
    };

    if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers
    });

    const text = await response.text();

    let data = null;

    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!response.ok) {
        const message = data?.message || data?.details || "API error";
        throw new Error(message);
    }

    return data;
}

const api = {
    async login(login, password) {
        const data = await request("/auth/login", {
            method: "POST",
            body: JSON.stringify({
                login,
                password
            })
        });

        setToken(data.token);

        return data.user;
    },

    getMe() {
        return request("/auth/me");
    },

    startWork() {
        return request("/time-entries/start-work", {
            method: "POST"
        });
    },

    endWork() {
        return request("/time-entries/end-work", {
            method: "POST"
        });
    },

    startBreak() {
        return request("/time-entries/break-start", {
            method: "POST"
        });
    },

    endBreak() {
        return request("/time-entries/break-end", {
            method: "POST"
        });
    },

    getMyTimeEntries(from, to) {
        const query = [];

        if (from) {
            query.push(`from=${encodeURIComponent(from)}`);
        }

        if (to) {
            query.push(`to=${encodeURIComponent(to)}`);
        }

        const queryString = query.length ? `?${query.join("&")}` : "";

        return request(`/time-entries/my${queryString}`);
    },

    getMySummary(from, to) {
        const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

        return request(`/reports/my/summary${query}`);
    },

    getAdminStats() {
        return request("/admin/system-stats");
    },

    getUsers() {
        return request("/users");
    },

    blockUser(id) {
        return request(`/admin/users/${id}/block`, {
            method: "POST"
        });
    },

    unblockUser(id) {
        return request(`/admin/users/${id}/unblock`, {
            method: "POST"
        });
    },

    changeUserRole(id, role) {
        return request(`/admin/users/${id}/role`, {
            method: "PATCH",
            body: JSON.stringify({
                role
            })
        });
    },

    getUsersWithStats(from, to) {
        const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

        return request(`/admin/users-with-stats${query}`);
    },

    createAbsence(payload) {
        return request("/absences", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    getMyAbsences(from, to) {
        const query = [];

        if (from) {
            query.push(`from=${encodeURIComponent(from)}`);
        }

        if (to) {
            query.push(`to=${encodeURIComponent(to)}`);
        }

        const queryString = query.length ? `?${query.join("&")}` : "";

        return request(`/absences/my${queryString}`);
    },

    getAllAbsences() {
        return request("/absences/all");
    },

    getMySchedule() {
        return request("/schedules/my");
    },

    createSchedule(payload) {
        return request("/schedules", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    },

    getAudit() {
        return request("/audit");
    },

    getAdminSummary(from, to, userId) {
        const query = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

        if (userId) {
            return request(`/reports/users/${userId}/summary${query}`);
        }

        return request(`/reports/summary${query}`);
    }
};