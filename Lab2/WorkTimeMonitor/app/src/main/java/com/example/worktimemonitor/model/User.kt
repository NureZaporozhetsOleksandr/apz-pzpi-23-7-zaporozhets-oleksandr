package com.example.worktimemonitor.model

data class User(
    val id: Int,
    val fullName: String,
    val email: String,
    val role: String,
    val position: String,
    val department: String,
    val workSchedule: String
)

