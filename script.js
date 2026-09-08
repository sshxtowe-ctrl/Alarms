let alarms = [];

let ringingAlarm = null;

let lastTriggered = {};


// ========================================
// เสียง Alarm
// ========================================

const alarmSound = new Audio("alarm.mp3");

alarmSound.loop = true;


// ========================================
// โหลดข้อมูล
// ========================================

const savedAlarms =
  localStorage.getItem("myAlarms");

if (savedAlarms) {
  try {
    alarms = JSON.parse(savedAlarms);
  } catch (error) {
    alarms = [];
  }
}


// ========================================
// เช็กว่าเปิดอยู่ใน Android App หรือเว็บ
// ========================================

function isAndroidApp() {

  return (
    window.AndroidAlarm &&
    typeof window.AndroidAlarm.scheduleAlarm === "function"
  );

}


// ========================================
// หาเวลาปลุกครั้งถัดไป
// ========================================

function getNextAlarmDate(time) {

  const now = new Date();

  const [hours, minutes] =
    time.split(":").map(Number);

  const alarmDate = new Date();

  alarmDate.setHours(hours);
  alarmDate.setMinutes(minutes);
  alarmDate.setSeconds(0);
  alarmDate.setMilliseconds(0);


  // ถ้าเวลาที่ตั้งผ่านไปแล้ว
  // ให้เลื่อนไปเป็นวันพรุ่งนี้
  if (alarmDate <= now) {

    alarmDate.setDate(
      alarmDate.getDate() + 1
    );

  }


  return alarmDate;

}


// ========================================
// ตั้ง Alarm ใน Android
// ========================================

function scheduleNativeAlarm(alarm) {

  if (!isAndroidApp()) {
    return;
  }


  const alarmDate =
    getNextAlarmDate(alarm.time);


  // ส่ง timestamp ไปให้ Android
  window.AndroidAlarm.scheduleAlarm(
    String(alarm.id),
    alarmDate.getTime(),
    alarm.name
  );

}


// ========================================
// ยกเลิก Alarm ใน Android
// ========================================

function cancelNativeAlarm(id) {

  if (!isAndroidApp()) {
    return;
  }


  window.AndroidAlarm.cancelAlarm(
    String(id)
  );

}


// ========================================
// นาฬิกา
// ========================================

function updateClock() {

  const now = new Date();


  const hours =
    String(now.getHours()).padStart(2, "0");

  const minutes =
    String(now.getMinutes()).padStart(2, "0");

  const seconds =
    String(now.getSeconds()).padStart(2, "0");


  document.getElementById("clock").textContent =
    `${hours}:${minutes}:${seconds}`;


  document.getElementById("date").textContent =
    now.toLocaleDateString("th-TH", {

      weekday: "long",

      year: "numeric",

      month: "long",

      day: "numeric"

    });


  // ถ้าเป็นเว็บไซต์
  // ให้ JavaScript ตรวจสอบเวลาเอง

  if (!isAndroidApp()) {

    checkWebAlarms(now);

  }

}


// ========================================
// ตั้งปลุก
// ========================================

function setAlarm() {

  const time =
    document.getElementById("alarmTime").value;

  const name =
    document.getElementById("alarmName").value.trim();


  if (!time) {

    alert("กรุณาเลือกเวลาก่อนนะ");

    return;

  }


  const alarm = {

    id: Date.now(),

    time: time,

    name: name || "ปลุก",

    enabled: true

  };


  alarms.push(alarm);

  saveAlarms();

  renderAlarms();


  // ตั้ง Alarm ใน Android
  scheduleNativeAlarm(alarm);


  // ล้างช่องกรอก

  document.getElementById("alarmTime").value = "";

  document.getElementById("alarmName").value = "";


  const nextAlarm =
    getNextAlarmDate(time);


  const tomorrow =
    new Date();

  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


  let dayText = "วันนี้";


  if (
    nextAlarm.getDate() !==
    new Date().getDate()
  ) {

    dayText = "พรุ่งนี้";

  }


  document.getElementById("status").textContent =
    `ตั้งปลุก ${dayText} ${time} เรียบร้อยแล้ว 🔔`;

}


// ========================================
// แสดงรายการ Alarm
// ========================================

function renderAlarms() {

  const list =
    document.getElementById("alarmList");


  if (alarms.length === 0) {

    list.innerHTML =
      `<p class="empty">
        ยังไม่มีการตั้งปลุก
      </p>`;

    return;

  }


  list.innerHTML = "";


  alarms.forEach(alarm => {

    const item =
      document.createElement("div");


    item.className = "alarm";


    item.innerHTML = `

      <div class="alarm-info">

        <div class="alarm-time">
          ${alarm.time}
        </div>

        <div class="alarm-name">
          ${alarm.name}
        </div>

      </div>


      <button
        class="toggle ${alarm.enabled ? "on" : ""}"
        onclick="toggleAlarm(${alarm.id})"
      >

        <span class="toggle-circle"></span>

      </button>


      <button
        class="delete-button"
        onclick="deleteAlarm(${alarm.id})"
      >
        ลบ
      </button>

    `;


    list.appendChild(item);

  });

}


// ========================================
// เปิด / ปิด Alarm
// ========================================

function toggleAlarm(id) {

  const alarm =
    alarms.find(a => a.id === id);


  if (!alarm) {
    return;
  }


  alarm.enabled =
    !alarm.enabled;


  if (alarm.enabled) {

    // เปิด Alarm
    scheduleNativeAlarm(alarm);


    document.getElementById("status").textContent =
      `เปิดปลุก ${alarm.time} แล้ว 🔔`;

  } else {

    // ปิด Alarm
    cancelNativeAlarm(alarm.id);


    document.getElementById("status").textContent =
      `ปิดปลุก ${alarm.time} แล้ว`;

  }


  saveAlarms();

  renderAlarms();

}


// ========================================
// ลบ Alarm
// ========================================

function deleteAlarm(id) {

  // ยกเลิก Alarm ใน Android
  cancelNativeAlarm(id);


  // ลบออกจากรายการ
  alarms =
    alarms.filter(a => a.id !== id);


  saveAlarms();

  renderAlarms();


  document.getElementById("status").textContent =
    "ลบ Alarm แล้ว";

}


// ========================================
// เว็บ Fallback
// ========================================

function checkWebAlarms(now) {

  const currentTime =
    String(now.getHours()).padStart(2, "0")
    + ":"
    +
    String(now.getMinutes()).padStart(2, "0");


  const today =
    now.toISOString().split("T")[0];


  alarms.forEach(alarm => {

    if (
      !alarm.enabled ||
      alarm.time !== currentTime ||
      now.getSeconds() !== 0
    ) {

      return;

    }


    const triggerKey =
      `${alarm.id}-${today}`;


    // ป้องกัน Alarm เดิมดังซ้ำ
    // ภายในวันเดียวกัน

    if (
      lastTriggered[alarm.id] ===
      triggerKey
    ) {

      return;

    }


    lastTriggered[alarm.id] =
      triggerKey;


    showWebAlarm(alarm);

  });

}


// ========================================
// แสดง Alarm บนเว็บ
// ========================================

function showWebAlarm(alarm) {

  ringingAlarm = alarm;


  // เปิด Modal

  document
    .getElementById("alarmModal")
    .classList.add("show");


  // ชื่อปลุก

  document
    .getElementById("ringingName")
    .textContent =
      `⏰ ${alarm.name}`;


  // เวลาปลุก

  document
    .getElementById("ringingTime")
    .textContent =
      `เวลาปลุก ${alarm.time}`;


  // สถานะ

  document
    .getElementById("status")
    .textContent =
      "⏰ ถึงเวลาปลุกแล้ว!";


  // เล่นเสียง

  alarmSound.currentTime = 0;


  alarmSound.play().catch(error => {

    console.log(
      "ไม่สามารถเล่นเสียง Alarm ได้:",
      error
    );

  });

}


// ========================================
// หยุด Alarm
// ========================================

function stopAlarm() {

  // ปิด Modal

  document
    .getElementById("alarmModal")
    .classList.remove("show");


  // หยุดเสียง

  alarmSound.pause();

  alarmSound.currentTime = 0;


  // ล้าง Alarm ที่กำลังดัง

  ringingAlarm = null;


  // สถานะ

  document
    .getElementById("status")
    .textContent =
      "หยุด Alarm แล้ว";

}


// ========================================
// Snooze
// ========================================

function snoozeAlarm() {

  if (!ringingAlarm) {
    return;
  }


  // เก็บ Alarm เดิมไว้ก่อน

  const oldAlarm =
    ringingAlarm;


  // ปิด Modal

  document
    .getElementById("alarmModal")
    .classList.remove("show");


  // หยุดเสียง

  alarmSound.pause();

  alarmSound.currentTime = 0;


  // ล้าง Alarm ที่กำลังดัง

  ringingAlarm = null;


  // ตั้ง Snooze 5 นาที

  const snoozeDate =
    new Date(
      Date.now() + 5 * 60 * 1000
    );


  const hours =
    String(
      snoozeDate.getHours()
    ).padStart(2, "0");


  const minutes =
    String(
      snoozeDate.getMinutes()
    ).padStart(2, "0");


  const snoozeAlarmData = {

    id: Date.now(),

    time: `${hours}:${minutes}`,

    name: `${oldAlarm.name} (Snooze)`,

    enabled: true

  };


  alarms.push(
    snoozeAlarmData
  );


  saveAlarms();

  renderAlarms();


  // ถ้าเป็น Android
  // ตั้ง Alarm ใหม่อีก 5 นาที

  if (isAndroidApp()) {

    window.AndroidAlarm.scheduleAlarm(

      String(snoozeAlarmData.id),

      snoozeDate.getTime(),

      snoozeAlarmData.name

    );

  }


  document
    .getElementById("status")
    .textContent =
      "Snooze อีก 5 นาที 😴";

}


// ========================================
// LocalStorage
// ========================================

function saveAlarms() {

  localStorage.setItem(

    "myAlarms",

    JSON.stringify(alarms)

  );

}


// ========================================
// ปุ่มตั้ง Alarm
// ========================================

document
  .getElementById("setAlarmButton")
  .addEventListener(
    "click",
    setAlarm
  );


// ========================================
// ปุ่มหยุด
// ========================================

document
  .getElementById("stopButton")
  .addEventListener(
    "click",
    stopAlarm
  );


// ========================================
// ปุ่ม Snooze
// ========================================

document
  .getElementById("snoozeButton")
  .addEventListener(
    "click",
    snoozeAlarm
  );


// ========================================
// เริ่มต้น
// ========================================

renderAlarms();

updateClock();


setInterval(
  updateClock,
  1000
);
