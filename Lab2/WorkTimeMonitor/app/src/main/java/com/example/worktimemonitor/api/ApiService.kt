package com.example.worktimemonitor.api

import com.example.worktimemonitor.model.AdminStats
import com.example.worktimemonitor.model.LoginRequest
import com.example.worktimemonitor.model.TimeRecord
import com.example.worktimemonitor.model.User
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ApiService {

    private var jwtToken: String? = null

    private val localRecords = mutableListOf<TimeRecord>()

    suspend fun login(login: String, password: String): User {
        val response = RetrofitClient.api.login(
            LoginRequest(
                login = login,
                password = password
            )
        )

        jwtToken = response.token

        val roleFromBackend = response.user.role.trim()
        val isAdmin = roleFromBackend.equals("Admin", ignoreCase = true)

        return User(
            id = response.user.id,
            fullName = response.user.fullName,
            email = login,
            role = if (isAdmin) "Admin" else roleFromBackend,
            position = if (isAdmin) {
                "Адміністратор системи"
            } else {
                "Співробітник"
            },
            department = if (isAdmin) {
                "Адміністрування"
            } else {
                "Відділ розробки"
            },
            workSchedule = "09:00 — 18:00"
        )
    }

    private fun getToken(): String {
        return "Bearer ${jwtToken ?: ""}"
    }

    suspend fun startWork(): TimeRecord {
        RetrofitClient.api.startWork(getToken())

        val record = TimeRecord(
            id = localRecords.size + 1,
            action = "Початок роботи",
            time = getCurrentTime(),
            description = "Запит виконано через POST /api/time-entries/start-work"
        )

        localRecords.add(record)
        return record
    }

    suspend fun endWork(): TimeRecord {
        RetrofitClient.api.endWork(getToken())

        val record = TimeRecord(
            id = localRecords.size + 1,
            action = "Завершення роботи",
            time = getCurrentTime(),
            description = "Запит виконано через POST /api/time-entries/end-work"
        )

        localRecords.add(record)
        return record
    }

    suspend fun startBreak(): TimeRecord {
        RetrofitClient.api.startBreak(getToken())

        val record = TimeRecord(
            id = localRecords.size + 1,
            action = "Початок перерви",
            time = getCurrentTime(),
            description = "Запит виконано через POST /api/time-entries/break-start"
        )

        localRecords.add(record)
        return record
    }

    suspend fun endBreak(): TimeRecord {
        RetrofitClient.api.endBreak(getToken())

        val record = TimeRecord(
            id = localRecords.size + 1,
            action = "Завершення перерви",
            time = getCurrentTime(),
            description = "Запит виконано через POST /api/time-entries/break-end"
        )

        localRecords.add(record)
        return record
    }

    suspend fun getAdminStats(): AdminStats {
        return RetrofitClient.api.getSystemStats(getToken())
    }

    fun getMyTimeEntries(): List<TimeRecord> {
        return localRecords
    }

    fun clearLocalData() {
        localRecords.clear()
        jwtToken = null
    }

    private fun getCurrentTime(): String {
        val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        return formatter.format(Date())
    }
}