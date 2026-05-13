package com.example.worktimemonitor.model

enum class WorkStatus(
    val title: String
) {
    NOT_STARTED("Робочий день не розпочато"),
    WORKING("Робочий день розпочато"),
    BREAK("Перерва активна"),
    FINISHED("Робочий день завершено")
}

