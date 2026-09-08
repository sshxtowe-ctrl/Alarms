let alarms = [];

let ringingAlarm = null;


// ========================================
// เสียง Alarm
// ========================================

// alarm.mp3 อยู่โฟลเดอร์เดียวกับไฟล์เว็บ
const alarmSound = new Audio("alarm.mp3");

// ให้เสียงเล่นวนไปเรื่อย ๆ จนกว่าจะกดหยุด
alarmSound.loop = true;


// ========================================
// โหลดข้อมูล
// ========================================

const savedAlarms =
  localStorage.getItem("myAlarms");

if (savedAlarms) {
  alarms = JSON.parse(savedAlarms);
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
// ตั้ง Alarm ใน Android
// ========================================

function scheduleNativeAlarm(alarm) {

  if (!isAndroidApp()) {
    return;
  }

  window.AndroidAlarm.scheduleAlarm(
    String(alarm.id),
    alarm.time,
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


  // ถ้าเปิดเป็นเว็บ
  // ให้ JavaScript เช็กเวลาเอง
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
    document.getElementById("alarmName").value;


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


  // ส่งให้ Android ตั้ง Alarm จริง
  scheduleNativeAlarm(alarm);


  // ล้างช่องกรอก
  document.getElementById("alarmTime").value = "";

  document.getElementById("alarmName").value = "";


  document.getElementById("status").textContent =
    `ตั้งปลุก ${time} เรียบร้อยแล้ว 🔔`;

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


  alarm.enabled = !alarm.enabled;


  if (alarm.enabled) {

    // เปิด Alarm
    scheduleNativeAlarm(alarm);

  } else {

    // ปิด Alarm
    cancelNativeAlarm(alarm.id);

  }


  saveAlarms();

  renderAlarms();

}


// ========================================
// ลบ Alarm
// ========================================

function deleteAlarm(id) {

  // ยกเลิก Alarm ใน Android ก่อน
  cancelNativeAlarm(id);


  // ลบออกจากรายการ
  alarms =
    alarms.filter(a => a.id !== id);


  saveAlarms();

  renderAlarms();

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


  alarms.forEach(alarm => {

    if (
      alarm.enabled &&
      alarm.time === currentTime &&
      now.getSeconds() === 0
    ) {

      showWebAlarm(alarm);

    }

  });

}


// ========================================
// แสดง Alarm บนเว็บ
// ========================================

function showWebAlarm(alarm) {

  // จำว่า Alarm ตัวไหนกำลังดัง
  ringingAlarm = alarm;


  // เปิด Modal
  document
    .getElementById("alarmModal")
    .classList.add("show");


  // แสดงชื่อ
  document
    .getElementById("ringingName")
    .textContent =
      `⏰ ${alarm.name}`;


  // แสดงเวลา
  document
    .getElementById("ringingTime")
    .textContent =
      `เวลาปลุก ${alarm.time}`;


  // เปลี่ยนสถานะ
  document
    .getElementById("status")
    .textContent =
      "⏰ ถึงเวลาปลุกแล้ว!";


  // ========================================
  // เล่นเสียง alarm.mp3
  // ========================================

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


  // เปลี่ยนสถานะ
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


  // ปิด Modal
  document
    .getElementById("alarmModal")
    .classList.remove("show");


  // หยุดเสียง
  alarmSound.pause();

  alarmSound.currentTime = 0;


  // ล้าง Alarm ที่กำลังดัง
  ringingAlarm = null;


  // ตอนนี้ยังไม่ได้ตั้งเวลา Snooze ใหม่
  document
    .getElementById("status")
    .textContent =
      "Snooze แล้ว";

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
