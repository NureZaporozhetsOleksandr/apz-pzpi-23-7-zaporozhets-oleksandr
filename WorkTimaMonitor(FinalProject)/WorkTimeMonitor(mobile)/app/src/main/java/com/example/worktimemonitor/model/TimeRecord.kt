package com.example.worktimemonitor.model

import com.google.gson.annotations.SerializedName

data class TimeRecord(
    val id: Int,
    val action: String,
    val time: String,
    val description: String
)

data class BackendTimeEntry(
    @SerializedName(value = "Id", alternate = ["id"])
    val id: Int = 0,

    @SerializedName(value = "UserId", alternate = ["userId"])
    val userId: Int = 0,

    @SerializedName(value = "EntryType", alternate = ["entryType"])
    val entryType: String = "",

    @SerializedName(value = "StartTime", alternate = ["startTime"])
    val startTime: String? = null,

    @SerializedName(value = "EndTime", alternate = ["endTime"])
    val endTime: String? = null,

    @SerializedName(value = "Comment", alternate = ["comment"])
    val comment: String? = null
)