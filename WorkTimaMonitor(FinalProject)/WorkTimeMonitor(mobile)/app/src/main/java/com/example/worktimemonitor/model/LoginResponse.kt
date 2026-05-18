package com.example.worktimemonitor.model

data class LoginResponse(
    val token: String,
    val user: BackendUser
)

data class BackendUser(
    val id: Int,
    val fullName: String,
    val role: String
)

