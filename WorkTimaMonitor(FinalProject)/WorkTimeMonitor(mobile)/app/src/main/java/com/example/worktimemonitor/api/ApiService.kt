package com.example.worktimemonitor.api

import com.example.worktimemonitor.model.AdminStats
import com.example.worktimemonitor.model.BackendTimeEntry
import com.example.worktimemonitor.model.LoginRequest
import com.example.worktimemonitor.model.TimeRecord
import com.example.worktimemonitor.model.User
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class ApiService {

    private var jwtToken: String? = null

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
        val entry = RetrofitClient.api.startWork(getToken())
        return mapBackendEntryToTimeRecord(entry)
    }

    suspend fun endWork(): TimeRecord {
        val entry = RetrofitClient.api.endWork(getToken())
        return mapBackendEntryToTimeRecord(entry)
    }

    suspend fun startBreak(): TimeRecord {
        val entry = RetrofitClient.api.startBreak(getToken())
        return mapBackendEntryToTimeRecord(entry)
    }

    suspend fun endBreak(): TimeRecord {
        val entry = RetrofitClient.api.endBreak(getToken())
        return mapBackendEntryToTimeRecord(entry)
    }

    suspend fun getAdminStats(): AdminStats {
        return RetrofitClient.api.getSystemStats(getToken())
    }

    suspend fun getMyTimeEntries(): List<TimeRecord> {
        return RetrofitClient.api.getMyTimeEntries(getToken())
            .map { mapBackendEntryToTimeRecord(it) }
    }

    fun clearLocalData() {
        jwtToken = null
    }

    private fun mapBackendEntryToTimeRecord(entry: BackendTimeEntry): TimeRecord {
        return TimeRecord(
            id = entry.id,
            action = formatEntryType(entry.entryType),
            time = formatTime(entry.startTime),
            description = buildDescription(entry)
        )
    }

    private fun formatEntryType(type: String): String {
        return when (type) {
            "StartWork" -> "Початок роботи"
            "EndWork" -> "Завершення роботи"
            "BreakStart" -> "Початок перерви"
            "BreakEnd" -> "Завершення перерви"
            else -> type.ifBlank { "Подія робочого часу" }
        }
    }

    private fun buildDescription(entry: BackendTimeEntry): String {
        val comment = entry.comment.orEmpty()

        return if (comment.contains("iot", ignoreCase = true)) {
            "Подія отримана від IoT-пристрою ESP32"
        } else {
            "Подія отримана з backend"
        }
    }

    private fun formatTime(isoTime: String?): String {
        if (isoTime.isNullOrBlank()) {
            return getCurrentTime()
        }

        return try {
            val inputFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            val outputFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
            val date = inputFormat.parse(isoTime)
            if (date != null) outputFormat.format(date) else isoTime
        } catch (e: Exception) {
            isoTime
        }
    }

    private fun getCurrentTime(): String {
        val formatter = SimpleDateFormat("HH:mm", Locale.getDefault())
        return formatter.format(Date())
    }
}