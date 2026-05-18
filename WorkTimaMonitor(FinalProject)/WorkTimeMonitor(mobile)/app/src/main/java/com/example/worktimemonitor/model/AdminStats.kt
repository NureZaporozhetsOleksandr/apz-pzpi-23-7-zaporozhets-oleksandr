package com.example.worktimemonitor.model

data class AdminStats(
    val activeUsers: Int = 0,
    val blockedUsers: Int = 0,
    val totalUsers: Int = 0,
    val totalTimeEntries: Int = 0,
    val totalAbsences: Int = 0
)