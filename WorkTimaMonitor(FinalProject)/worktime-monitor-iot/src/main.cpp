#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFiClientSecure.h>

// ===== OLED =====
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
const int I2C_SDA = 21;
const int I2C_SCL = 22;

// ===== WiFi (Wokwi) =====
const char* WIFI_SSID = "Wokwi-GUEST";
const char* WIFI_PASS = "";

// ===== Buttons =====
const int PIN_START       = 13;
const int PIN_END         = 12;
const int PIN_BREAK_START = 14;
const int PIN_BREAK_END   = 27;

// ===== Config =====
String DEVICE_ID = "ESP32-TIME-TERM-01";
String USER_ID   = "1";
String API_URL = "https://c1w4dp4q-3000.euw.devtunnels.ms/api/iot/events";
// ===== State machine =====
enum WorkState { IDLE, WORKING, ON_BREAK };
WorkState state = IDLE;

// ===== Timing =====
unsigned long workStartMs = 0;
unsigned long breakStartMs = 0;
unsigned long totalBreakMs = 0;

// ===== Last event / status =====
String lastEvent = "-";
int lastHttpCode = 0;

// ===== Offline queue =====
struct EventItem { String json; };
EventItem queueBuf[10];
int qHead = 0, qTail = 0;

bool queueIsEmpty() { return qHead == qTail; }
bool queueIsFull() { return ((qTail + 1) % 10) == qHead; }

int queueCount() {
  if (qTail >= qHead) return qTail - qHead;
  return 10 - (qHead - qTail);
}

void enqueue(const String& json) {
  if (queueIsFull()) qHead = (qHead + 1) % 10;
  queueBuf[qTail].json = json;
  qTail = (qTail + 1) % 10;
}

bool dequeue(String& out) {
  if (queueIsEmpty()) return false;
  out = queueBuf[qHead].json;
  qHead = (qHead + 1) % 10;
  return true;
}

// ===== Helpers =====
String stateShort() {
  if (state == IDLE) return "IDLE";
  if (state == WORKING) return "WORK";
  return "BREAK";
}

String two(int v) { return (v < 10 ? "0" : "") + String(v); }

String fmtMmSs(unsigned long ms) {
  unsigned long sec = ms / 1000UL;
  int mm = (int)(sec / 60UL);
  int ss = (int)(sec % 60UL);
  return two(mm) + ":" + two(ss);
}

unsigned long currentBreakMs() {
  if (state == ON_BREAK) return totalBreakMs + (millis() - breakStartMs);
  return totalBreakMs;
}

unsigned long currentWorkNetMs() {
  if (state == IDLE) return 0;
  unsigned long worked = millis() - workStartMs;
  unsigned long br = currentBreakMs();
  if (worked > br) return worked - br;
  return 0;
}

String makeEventJson(const String& type, long workedMinutes, long breakMinutes) {
  String json = "{";
  json += "\"deviceId\":\"" + DEVICE_ID + "\",";
  json += "\"userId\":\"" + USER_ID + "\",";
  json += "\"type\":\"" + type + "\",";
  json += "\"state\":\"" + stateShort() + "\",";
  json += "\"workedMinutes\":" + String(workedMinutes) + ",";
  json += "\"breakMinutes\":" + String(breakMinutes) + ",";
  json += "\"tsMs\":" + String((unsigned long)millis());
  json += "}";
  return json;
}

// ===== Network (supports OFFLINE) =====
bool postJson(const String& json) {
  if (API_URL == "" || API_URL == "OFFLINE") {
    lastHttpCode = 299;
    Serial.println("[SIM] send ok (OFFLINE)");
    Serial.print("[SIM] payload=");
    Serial.println(json);
    return true;
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[HTTP] WiFi not connected");
    return false;
  }

  if (!API_URL.startsWith("http")) {
    Serial.println("[HTTP] invalid API_URL");
    return false;
  }

  HTTPClient http;
  int code = -1;

  if (API_URL.startsWith("https://")) {
    WiFiClientSecure client;
    client.setInsecure();

    http.begin(client, API_URL);
  } else {
    http.begin(API_URL);
  }

  http.setTimeout(15000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", "worktime-iot-key");

  code = http.POST(json);

  String resp = http.getString();

  http.end();

  lastHttpCode = code;

  Serial.print("[HTTP] code=");
  Serial.print(code);
  Serial.print(" resp=");
  Serial.println(resp);

  return code >= 200 && code < 300;
}

// avoid spam
unsigned long lastQueueTryMs = 0;
void flushQueueIfPossible() {
  if (WiFi.status() != WL_CONNECTED && API_URL != "OFFLINE") return;

  unsigned long now = millis();
  if (now - lastQueueTryMs < 2000) return;
  lastQueueTryMs = now;

  if (queueIsEmpty()) return;

  String json;
  if (!dequeue(json)) return;

  Serial.println("[QUEUE] sending stored event...");
  if (!postJson(json)) {
    Serial.println("[QUEUE] failed, put back");
    enqueue(json);
  } else {
    Serial.println("[QUEUE] sent");
  }
}

// ===== OLED UI (2 pages, auto rotate) =====
int page = 0; // 0=Summary, 1=Config
unsigned long lastPageSwitchMs = 0;
unsigned long lastOledTickMs = 0;

String shortDevId() {
  if (DEVICE_ID.length() <= 10) return DEVICE_ID;
  return DEVICE_ID.substring(0, 10) + "..";
}

String shortUrl() {
  if (API_URL == "OFFLINE") return "OFFLINE";
  if (API_URL.length() <= 16) return API_URL;
  return API_URL.substring(0, 16) + "..";
}

void drawSummary() {
  // Big STATE
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(2);
  display.setCursor(0, 0);
  display.print(stateShort());

  // Work/Break timers
  display.setTextSize(1);
  display.setCursor(0, 22);
  display.print("Work ");
  display.print(fmtMmSs(currentWorkNetMs()));

  display.setCursor(0, 34);
  display.print("Break ");
  display.print(fmtMmSs(currentBreakMs()));

  // Last event
  display.setCursor(0, 46);
  display.print("Last ");
  display.print(lastEvent);

  // Status line
  display.setCursor(0, 56);
  display.print("WiFi:");
  display.print((WiFi.status() == WL_CONNECTED) ? "OK" : "NO");
  display.print(" H:");
  display.print(lastHttpCode);
  display.print(" Q:");
  display.print(queueCount());
}

void drawConfig() {
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);

  display.setCursor(0, 0);
  display.print("CFG");

  display.setCursor(0, 12);
  display.print("User: ");
  display.print(USER_ID);

  display.setCursor(0, 24);
  display.print("Dev : ");
  display.print(shortDevId());

  display.setCursor(0, 36);
  display.print("URL : ");
  display.print(shortUrl());

  display.setCursor(0, 48);
  display.print("IP  : ");
  if (WiFi.status() == WL_CONNECTED) display.print(WiFi.localIP());
  else display.print("-");

  display.setCursor(0, 58);
  display.print("Type STATUS / HELP");
}

void oledRender(bool force = false) {
  unsigned long now = millis();

  if (!force && now - lastOledTickMs < 200) return;
  lastOledTickMs = now;

  if (now - lastPageSwitchMs > 5000) {
    page = (page + 1) % 2;
    lastPageSwitchMs = now;
  }

  display.clearDisplay();
  if (page == 0) drawSummary();
  else drawConfig();
  display.display();
}

// ===== Serial commands =====
void printHelp() {
  Serial.println("Commands:");
  Serial.println("  CFG URL=OFFLINE | https://...   (set endpoint)");
  Serial.println("  CFG USER=1                      (set user id)");
  Serial.println("  CFG DEV=ESP32-001               (set device id)");
  Serial.println("  STATUS");
  Serial.println("  HELP");
}

void printStatus() {
  Serial.print("[STATUS] WiFi=");
  Serial.println(WiFi.status() == WL_CONNECTED ? "CONNECTED" : "DISCONNECTED");
  Serial.print("[STATUS] state="); Serial.println(stateShort());
  Serial.print("[STATUS] URL="); Serial.println(API_URL);
  Serial.print("[STATUS] USER="); Serial.println(USER_ID);
  Serial.print("[STATUS] DEV="); Serial.println(DEVICE_ID);
  Serial.print("[STATUS] queueCount="); Serial.println(queueCount());
}

void handleSerial() {
  if (!Serial.available()) return;
  String line = Serial.readStringUntil('\n');
  line.trim();
  if (line.length() == 0) return;

  if (line == "HELP") { printHelp(); return; }
  if (line == "STATUS") { printStatus(); oledRender(true); return; }

  if (!line.startsWith("CFG ")) {
    Serial.println("[SER] unknown command. Type HELP");
    return;
  }

  String kv = line.substring(4);
  int eq = kv.indexOf('=');
  if (eq < 0) {
    Serial.println("[CFG] invalid. Example: CFG URL=OFFLINE");
    return;
  }

  String key = kv.substring(0, eq);
  String val = kv.substring(eq + 1);
  key.trim(); val.trim();

  if (key == "URL") API_URL = val;
  else if (key == "USER") USER_ID = val;
  else if (key == "DEV") DEVICE_ID = val;
  else {
    Serial.println("[CFG] unknown key. Use URL/USER/DEV");
    return;
  }

  Serial.println("[CFG] updated");
  printStatus();
  oledRender(true);
}

// ===== Business logic =====
void sendOrQueue(const String& tag, const String& json) {
  lastEvent = tag;
  Serial.println(json);
  if (!postJson(json)) enqueue(json);
  oledRender(true);
}

void onStartWork() {
  if (state != IDLE) { Serial.println("[BL] StartWork denied"); lastEvent="DENY_START"; oledRender(true); return; }
  state = WORKING;
  workStartMs = millis();
  totalBreakMs = 0;
  sendOrQueue("START", makeEventJson("START_WORK", 0, 0));
}

void onEndWork() {
  if (state == IDLE) { Serial.println("[BL] EndWork denied"); lastEvent="DENY_END"; oledRender(true); return; }

  if (state == ON_BREAK) totalBreakMs += (millis() - breakStartMs);

  unsigned long workedMs = (millis() - workStartMs);
  long breakMin  = (long)(totalBreakMs / 60000UL);
  long workedMin = (long)((workedMs > totalBreakMs ? (workedMs - totalBreakMs) : 0) / 60000UL);

  state = IDLE;
  sendOrQueue("END", makeEventJson("END_WORK", workedMin, breakMin));
}

void onBreakStart() {
  if (state != WORKING) { Serial.println("[BL] BreakStart denied"); lastEvent="DENY_BS"; oledRender(true); return; }
  state = ON_BREAK;
  breakStartMs = millis();
  sendOrQueue("B+ ", makeEventJson("BREAK_START", 0, (long)(totalBreakMs / 60000UL)));
}

void onBreakEnd() {
  if (state != ON_BREAK) { Serial.println("[BL] BreakEnd denied"); lastEvent="DENY_BE"; oledRender(true); return; }
  totalBreakMs += (millis() - breakStartMs);
  state = WORKING;
  sendOrQueue("B- ", makeEventJson("BREAK_END", 0, (long)(totalBreakMs / 60000UL)));
}

// ===== Buttons edge detect =====
bool prevStart = true, prevEnd = true, prevBS = true, prevBE = true;

void setup() {
  Serial.begin(115200);

  pinMode(PIN_START, INPUT_PULLUP);
  pinMode(PIN_END, INPUT_PULLUP);
  pinMode(PIN_BREAK_START, INPUT_PULLUP);
  pinMode(PIN_BREAK_END, INPUT_PULLUP);

  Wire.begin(I2C_SDA, I2C_SCL);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println("SSD1306 allocation failed");
  }

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Time Terminal");
  display.println("Booting...");
  display.display();

  Serial.println("Connecting WiFi...");
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(200);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected.");

  printHelp();
  printStatus();

  lastPageSwitchMs = millis();
  oledRender(true);
}

void loop() {
  handleSerial();
  flushQueueIfPossible();

  bool curStart = digitalRead(PIN_START);
  bool curEnd   = digitalRead(PIN_END);
  bool curBS    = digitalRead(PIN_BREAK_START);
  bool curBE    = digitalRead(PIN_BREAK_END);

  if (prevStart && !curStart) onStartWork();
  if (prevEnd   && !curEnd)   onEndWork();
  if (prevBS    && !curBS)    onBreakStart();
  if (prevBE    && !curBE)    onBreakEnd();

  prevStart = curStart; prevEnd = curEnd; prevBS = curBS; prevBE = curBE;

  oledRender(false);

  delay(30);
}
