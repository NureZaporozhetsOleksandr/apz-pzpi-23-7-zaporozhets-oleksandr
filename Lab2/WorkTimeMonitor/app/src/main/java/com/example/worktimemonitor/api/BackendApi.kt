package com.example.worktimemonitor.api

import com.example.worktimemonitor.model.AdminStats
import com.example.worktimemonitor.model.ApiMessageResponse
import com.example.worktimemonitor.model.LoginRequest
import com.example.worktimemonitor.model.LoginResponse
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST

interface BackendApi {

    @POST("auth/login")
    suspend fun login(
        @Body request: LoginRequest
    ): LoginResponse

    @GET("auth/me")
    suspend fun getMe(
        @Header("Authorization") token: String
    ): Any

    @POST("time-entries/start-work")
    suspend fun startWork(
        @Header("Authorization") token: String
    ): ApiMessageResponse

    @POST("time-entries/end-work")
    suspend fun endWork(
        @Header("Authorization") token: String
    ): ApiMessageResponse

    @POST("time-entries/break-start")
    suspend fun startBreak(
        @Header("Authorization") token: String
    ): ApiMessageResponse

    @POST("time-entries/break-end")
    suspend fun endBreak(
        @Header("Authorization") token: String
    ): ApiMessageResponse

    @GET("time-entries/my")
    suspend fun getMyTimeEntries(
        @Header("Authorization") token: String
    ): Any

    @GET("schedules/my")
    suspend fun getMySchedule(
        @Header("Authorization") token: String
    ): Any

    @GET("admin/system-stats")
    suspend fun getSystemStats(
        @Header("Authorization") token: String
    ): AdminStats
}