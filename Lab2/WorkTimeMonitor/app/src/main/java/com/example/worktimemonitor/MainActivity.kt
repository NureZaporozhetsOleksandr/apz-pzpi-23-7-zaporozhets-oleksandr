package com.example.worktimemonitor

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountCircle
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Login
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.worktimemonitor.api.ApiService
import com.example.worktimemonitor.model.AdminStats
import com.example.worktimemonitor.model.TimeRecord
import com.example.worktimemonitor.model.User
import com.example.worktimemonitor.model.WorkStatus
import kotlinx.coroutines.launch

enum class Screen {
    Login,
    Home,
    History,
    Statistics,
    Admin,
    Profile
}

fun User.isAdmin(): Boolean {
    return role.trim().equals("Admin", ignoreCase = true)
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            WorkTimeMonitorApp()
        }
    }
}

@Composable
fun WorkTimeMonitorApp() {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val apiService = remember { ApiService() }

    var currentScreen by remember { mutableStateOf(Screen.Login) }
    var isLoggedIn by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }

    var currentUser by remember {
        mutableStateOf<User?>(null)
    }

    var adminStats by remember {
        mutableStateOf<AdminStats?>(null)
    }

    var workStatus by remember {
        mutableStateOf(WorkStatus.NOT_STARTED)
    }

    var isWorkStarted by remember { mutableStateOf(false) }
    var isBreakStarted by remember { mutableStateOf(false) }

    val records = remember {
        mutableStateListOf<TimeRecord>()
    }

    WorkTimeTheme {
        if (!isLoggedIn) {
            LoginScreen(
                isLoading = isLoading,
                onLogin = { login, password ->
                    coroutineScope.launch {
                        try {
                            isLoading = true

                            val user = apiService.login(login, password)

                            currentUser = user
                            records.clear()
                            records.addAll(apiService.getMyTimeEntries())

                            if (user.isAdmin()) {
                                try {
                                    adminStats = apiService.getAdminStats()
                                } catch (e: Exception) {
                                    adminStats = null
                                    Toast.makeText(
                                        context,
                                        "Адмін-статистика недоступна: ${e.message}",
                                        Toast.LENGTH_LONG
                                    ).show()
                                }
                            } else {
                                adminStats = null
                            }

                            isLoggedIn = true
                            currentScreen = Screen.Home

                            Toast.makeText(
                                context,
                                "Авторизація успішна. Роль: ${user.role}",
                                Toast.LENGTH_SHORT
                            ).show()
                        } catch (e: Exception) {
                            Toast.makeText(
                                context,
                                "Помилка входу: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        } finally {
                            isLoading = false
                        }
                    }
                }
            )
        } else {
            val safeUser = currentUser ?: User(
                id = 0,
                fullName = "Невідомий користувач",
                email = "unknown@nure.ua",
                role = "Employee",
                position = "Співробітник",
                department = "Відділ розробки",
                workSchedule = "09:00 — 18:00"
            )

            MainScreen(
                currentScreen = currentScreen,
                onScreenChange = { currentScreen = it },
                currentUser = safeUser,
                adminStats = adminStats,
                workStatus = workStatus,
                isWorkStarted = isWorkStarted,
                isBreakStarted = isBreakStarted,
                isLoading = isLoading,
                records = records,
                onStartWork = {
                    coroutineScope.launch {
                        try {
                            isLoading = true

                            val record = apiService.startWork()

                            records.add(record)
                            isWorkStarted = true
                            isBreakStarted = false
                            workStatus = WorkStatus.WORKING

                            Toast.makeText(
                                context,
                                "Робочий день розпочато",
                                Toast.LENGTH_SHORT
                            ).show()
                        } catch (e: Exception) {
                            Toast.makeText(
                                context,
                                "Помилка запиту: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                onStartBreak = {
                    coroutineScope.launch {
                        try {
                            isLoading = true

                            val record = apiService.startBreak()

                            records.add(record)
                            isBreakStarted = true
                            workStatus = WorkStatus.BREAK

                            Toast.makeText(
                                context,
                                "Перерву розпочато",
                                Toast.LENGTH_SHORT
                            ).show()
                        } catch (e: Exception) {
                            Toast.makeText(
                                context,
                                "Помилка запиту: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                onEndBreak = {
                    coroutineScope.launch {
                        try {
                            isLoading = true

                            val record = apiService.endBreak()

                            records.add(record)
                            isBreakStarted = false
                            workStatus = WorkStatus.WORKING

                            Toast.makeText(
                                context,
                                "Перерву завершено",
                                Toast.LENGTH_SHORT
                            ).show()
                        } catch (e: Exception) {
                            Toast.makeText(
                                context,
                                "Помилка запиту: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                onEndWork = {
                    coroutineScope.launch {
                        try {
                            isLoading = true

                            val record = apiService.endWork()

                            records.add(record)
                            isWorkStarted = false
                            isBreakStarted = false
                            workStatus = WorkStatus.FINISHED

                            Toast.makeText(
                                context,
                                "Робочий день завершено",
                                Toast.LENGTH_SHORT
                            ).show()
                        } catch (e: Exception) {
                            Toast.makeText(
                                context,
                                "Помилка запиту: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                onRefreshAdminStats = {
                    coroutineScope.launch {
                        try {
                            isLoading = true
                            adminStats = apiService.getAdminStats()

                            Toast.makeText(
                                context,
                                "Адмін-статистику оновлено",
                                Toast.LENGTH_SHORT
                            ).show()
                        } catch (e: Exception) {
                            Toast.makeText(
                                context,
                                "Помилка оновлення статистики: ${e.message}",
                                Toast.LENGTH_LONG
                            ).show()
                        } finally {
                            isLoading = false
                        }
                    }
                },
                onLogout = {
                    isLoggedIn = false
                    currentUser = null
                    adminStats = null
                    currentScreen = Screen.Login
                    workStatus = WorkStatus.NOT_STARTED
                    isWorkStarted = false
                    isBreakStarted = false
                    records.clear()
                    apiService.clearLocalData()
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    currentScreen: Screen,
    onScreenChange: (Screen) -> Unit,
    currentUser: User,
    adminStats: AdminStats?,
    workStatus: WorkStatus,
    isWorkStarted: Boolean,
    isBreakStarted: Boolean,
    isLoading: Boolean,
    records: List<TimeRecord>,
    onStartWork: () -> Unit,
    onStartBreak: () -> Unit,
    onEndBreak: () -> Unit,
    onEndWork: () -> Unit,
    onRefreshAdminStats: () -> Unit,
    onLogout: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "WorkTime Monitor",
                            fontWeight = FontWeight.Bold
                        )

                        Text(
                            text = "Мобільний клієнт системи обліку часу",
                            fontSize = 12.sp,
                            color = Color.White.copy(alpha = 0.85f)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF1E3A8A),
                    titleContentColor = Color.White
                )
            )
        },
        bottomBar = {
            NavigationBar(containerColor = Color.White) {
                NavigationBarItem(
                    selected = currentScreen == Screen.Home,
                    onClick = { onScreenChange(Screen.Home) },
                    icon = { Icon(Icons.Default.Home, contentDescription = null) },
                    label = { Text("Головна") }
                )

                NavigationBarItem(
                    selected = currentScreen == Screen.History,
                    onClick = { onScreenChange(Screen.History) },
                    icon = { Icon(Icons.Default.History, contentDescription = null) },
                    label = { Text("Історія") }
                )

                NavigationBarItem(
                    selected = currentScreen == Screen.Statistics,
                    onClick = { onScreenChange(Screen.Statistics) },
                    icon = { Icon(Icons.Default.BarChart, contentDescription = null) },
                    label = { Text("Статистика") }
                )

                if (currentUser.isAdmin()) {
                    NavigationBarItem(
                        selected = currentScreen == Screen.Admin,
                        onClick = { onScreenChange(Screen.Admin) },
                        icon = { Icon(Icons.Default.Work, contentDescription = null) },
                        label = { Text("Адмін") }
                    )
                }

                NavigationBarItem(
                    selected = currentScreen == Screen.Profile,
                    onClick = { onScreenChange(Screen.Profile) },
                    icon = { Icon(Icons.Default.AccountCircle, contentDescription = null) },
                    label = { Text("Профіль") }
                )
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF3F6FB))
                .padding(paddingValues)
        ) {
            when (currentScreen) {
                Screen.Home -> HomeScreen(
                    user = currentUser,
                    workStatus = workStatus,
                    isWorkStarted = isWorkStarted,
                    isBreakStarted = isBreakStarted,
                    isLoading = isLoading,
                    onStartWork = onStartWork,
                    onStartBreak = onStartBreak,
                    onEndBreak = onEndBreak,
                    onEndWork = onEndWork
                )

                Screen.History -> HistoryScreen(records = records)

                Screen.Statistics -> StatisticsScreen(records = records)

                Screen.Admin -> AdminScreen(
                    stats = adminStats,
                    isLoading = isLoading,
                    onRefresh = onRefreshAdminStats
                )

                Screen.Profile -> ProfileScreen(
                    user = currentUser,
                    onLogout = onLogout
                )

                Screen.Login -> {}
            }
        }
    }
}

@Composable
fun LoginScreen(
    isLoading: Boolean,
    onLogin: (String, String) -> Unit
) {
    var login by remember { mutableStateOf("admin") }
    var password by remember { mutableStateOf("123") }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    listOf(
                        Color(0xFF1E3A8A),
                        Color(0xFF2563EB),
                        Color(0xFFF3F6FB)
                    )
                )
            )
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(24.dp),
            elevation = CardDefaults.cardElevation(defaultElevation = 10.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Icon(
                    imageVector = Icons.Default.Work,
                    contentDescription = null,
                    tint = Color(0xFF1E3A8A),
                    modifier = Modifier.height(64.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "WorkTime Monitor",
                    fontSize = 26.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1E3A8A)
                )

                Text(
                    text = "Система моніторингу робочого часу",
                    fontSize = 14.sp,
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = login,
                    onValueChange = { login = it },
                    label = { Text("Логін") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    enabled = !isLoading
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Пароль") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    enabled = !isLoading
                )

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        onLogin(login, password)
                    },
                    enabled = !isLoading,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(14.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFF2563EB)
                    )
                ) {
                    Icon(Icons.Default.Login, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (isLoading) "Вхід..." else "Увійти")
                }

                Spacer(modifier = Modifier.height(12.dp))

                Text(
                    text = "Запит: POST /api/auth/login",
                    fontSize = 12.sp,
                    color = Color.Gray
                )
            }
        }
    }
}

@Composable
fun HomeScreen(
    user: User,
    workStatus: WorkStatus,
    isWorkStarted: Boolean,
    isBreakStarted: Boolean,
    isLoading: Boolean,
    onStartWork: () -> Unit,
    onStartBreak: () -> Unit,
    onEndBreak: () -> Unit,
    onEndWork: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(18.dp)
    ) {
        Text(
            text = "Головна",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF111827)
        )

        Text(
            text = "Вітаємо, ${user.fullName} | Роль: ${user.role}",
            fontSize = 14.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(18.dp))

        InfoCard(
            title = "Поточний статус",
            value = workStatus.title,
            description = "Дані передаються до Node.js/Express backend через REST API"
        )

        Spacer(modifier = Modifier.height(16.dp))

        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(22.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier.padding(18.dp)
            ) {
                Text(
                    text = "Дії співробітника",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold
                )

                Spacer(modifier = Modifier.height(14.dp))

                Button(
                    onClick = onStartWork,
                    enabled = !isWorkStarted && !isLoading,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
                ) {
                    Icon(Icons.Default.AccessTime, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Почати робочий день")
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = onStartBreak,
                    enabled = isWorkStarted && !isBreakStarted && !isLoading,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFF59E0B))
                ) {
                    Text("Почати перерву")
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = onEndBreak,
                    enabled = isWorkStarted && isBreakStarted && !isLoading,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF6366F1))
                ) {
                    Text("Завершити перерву")
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = onEndWork,
                    enabled = isWorkStarted && !isLoading,
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
                ) {
                    Text("Завершити робочий день")
                }

                if (isLoading) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Виконується запит до backend...",
                        color = Color.Gray,
                        fontSize = 13.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        InfoCard(
            title = "API-взаємодія",
            value = "REST + JWT",
            description = "Android-застосунок звертається до http://10.0.2.2:3000/api/"
        )
    }
}

@Composable
fun HistoryScreen(records: List<TimeRecord>) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(18.dp)
    ) {
        Text(
            text = "Історія відміток",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF111827)
        )

        Text(
            text = "Журнал дій співробітника у мобільному застосунку",
            fontSize = 14.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(18.dp))

        if (records.isEmpty()) {
            Text(
                text = "Історія відміток поки порожня",
                color = Color.Gray
            )
        } else {
            records.reversed().forEach { record ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.History,
                            contentDescription = null,
                            tint = Color(0xFF2563EB)
                        )

                        Spacer(modifier = Modifier.width(14.dp))

                        Column {
                            Text(
                                text = record.action,
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )

                            Text(
                                text = record.description,
                                color = Color.Gray,
                                fontSize = 13.sp
                            )

                            Text(
                                text = "Час: ${record.time}",
                                color = Color(0xFF1E3A8A),
                                fontWeight = FontWeight.Medium
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun StatisticsScreen(records: List<TimeRecord>) {
    val startCount = records.count { it.action == "Початок роботи" }
    val endCount = records.count { it.action == "Завершення роботи" }
    val breakCount = records.count { it.action == "Початок перерви" }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(18.dp)
    ) {
        Text(
            text = "Статистика",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF111827)
        )

        Text(
            text = "Короткі показники робочого часу",
            fontSize = 14.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(18.dp))

        InfoCard(
            title = "Відпрацьовано сьогодні",
            value = "7 год 45 хв",
            description = "У повній версії розрахунок виконується на backend"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Відпрацьовано за тиждень",
            value = "38 год 20 хв",
            description = "Дані формуються на основі записів у базі даних"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Кількість початків роботи",
            value = startCount.toString(),
            description = "POST /api/time-entries/start-work"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Кількість завершень роботи",
            value = endCount.toString(),
            description = "POST /api/time-entries/end-work"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Кількість перерв",
            value = breakCount.toString(),
            description = "POST /api/time-entries/break-start"
        )
    }
}

@Composable
fun AdminScreen(
    stats: AdminStats?,
    isLoading: Boolean,
    onRefresh: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(18.dp)
    ) {
        Text(
            text = "Адміністрування",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF111827)
        )

        Text(
            text = "Системна статистика з backend API",
            fontSize = 14.sp,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(18.dp))

        Button(
            onClick = onRefresh,
            enabled = !isLoading,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E3A8A))
        ) {
            Text(if (isLoading) "Оновлення..." else "Оновити статистику")
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (stats == null) {
            InfoCard(
                title = "Статистика недоступна",
                value = "Немає даних",
                description = "Перевірте роль користувача Admin та доступність backend"
            )
        } else {
            InfoCard(
                title = "Активні користувачі",
                value = stats.activeUsers.toString(),
                description = "Кількість активних облікових записів у системі"
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoCard(
                title = "Заблоковані користувачі",
                value = stats.blockedUsers.toString(),
                description = "Кількість заблокованих облікових записів"
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoCard(
                title = "Усього користувачів",
                value = stats.totalUsers.toString(),
                description = "Загальна кількість користувачів системи"
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoCard(
                title = "Записи робочого часу",
                value = stats.totalTimeEntries.toString(),
                description = "Кількість записів у таблиці TimeEntries"
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoCard(
                title = "Записи відсутностей",
                value = stats.totalAbsences.toString(),
                description = "Кількість записів у таблиці AbsenceRecords"
            )

            Spacer(modifier = Modifier.height(12.dp))

            InfoCard(
                title = "Backend endpoint",
                value = "GET /api/admin/system-stats",
                description = "Дані отримуються з backend, реалізованого у минулому семестрі"
            )
        }
    }
}

@Composable
fun ProfileScreen(
    user: User,
    onLogout: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(18.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(12.dp))

        Icon(
            imageVector = Icons.Default.AccountCircle,
            contentDescription = null,
            tint = Color(0xFF2563EB),
            modifier = Modifier.height(92.dp)
        )

        Spacer(modifier = Modifier.height(12.dp))

        Text(
            text = user.fullName,
            fontSize = 24.sp,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = user.email,
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(20.dp))

        InfoCard(
            title = "Роль",
            value = user.role,
            description = "Роль користувача у системі"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Посада",
            value = user.position,
            description = "Посада співробітника"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Відділ",
            value = user.department,
            description = "Підрозділ, до якого належить співробітник"
        )

        Spacer(modifier = Modifier.height(12.dp))

        InfoCard(
            title = "Робочий графік",
            value = user.workSchedule,
            description = "У повній версії отримується через GET /api/schedules/my"
        )

        Spacer(modifier = Modifier.height(20.dp))

        Button(
            onClick = onLogout,
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
        ) {
            Icon(Icons.Default.Logout, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Вийти з акаунта")
        }
    }
}

@Composable
fun InfoCard(
    title: String,
    value: String,
    description: String
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 3.dp)
    ) {
        Column(
            modifier = Modifier.padding(18.dp)
        ) {
            Text(
                text = title,
                color = Color.Gray,
                fontSize = 14.sp
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = value,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF1E3A8A)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = description,
                color = Color.Gray,
                fontSize = 13.sp
            )
        }
    }
}

@Composable
fun WorkTimeTheme(content: @Composable () -> Unit) {
    val colorScheme = lightColorScheme(
        primary = Color(0xFF2563EB),
        secondary = Color(0xFF1E3A8A),
        background = Color(0xFFF3F6FB),
        surface = Color.White
    )

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}