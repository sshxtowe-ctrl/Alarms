let alarms = [];

let ringingAlarm = null;

let lastTriggered = {};


// ========================================
// เสียง Alarm
// ========================================

const alarmSound =
  new Audio("alarm.mp3");

alarmSound.loop = true;


// ========================================
// โหลดข้อมูล
// ========================================

const savedAlarms =
  localStorage.getItem("borrowAlarms");

if (savedAlarms) {

  try {

    alarms =
      JSON.parse(savedAlarms);

  } catch (error) {

    alarms = [];

  }

}


// ========================================
// เช็ก Android App
// ========================================

function isAndroidApp() {

  return (

    window.AndroidAlarm &&

    typeof
      window.AndroidAlarm.scheduleAlarm
      === "function"

  );

}


// ========================================
// หาเวลาปลุกครั้งถัดไป
// ========================================

function getNextAlarmDate(time) {

  const now =
    new Date();


  const [hours, minutes] =
    time.split(":").map(Number);


  const alarmDate =
    new Date();


  alarmDate.setHours(
    hours
  );

  alarmDate.setMinutes(
    minutes
  );

  alarmDate.setSeconds(
    0
  );

  alarmDate.setMilliseconds(
    0
  );


  // ถ้าเวลาผ่านไปแล้ว
  // ให้เป็นวันพรุ่งนี้

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
    getNextAlarmDate(
      alarm.time
    );


  window.AndroidAlarm.scheduleAlarm(

    String(alarm.id),

    alarmDate.getTime(),

    `${alarm.borrower} ยืม ${alarm.item}`

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

  const now =
    new Date();


  const hours =
    String(
      now.getHours()
    ).padStart(2, "0");


  const minutes =
    String(
      now.getMinutes()
    ).padStart(2, "0");


  const seconds =
    String(
      now.getSeconds()
    ).padStart(2, "0");


  document
    .getElementById("clock")
    .textContent =
      `${hours}:${minutes}:${seconds}`;


  document
    .getElementById("date")
    .textContent =
      now.toLocaleDateString(
        "th-TH",
        {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }
      );


  // ถ้าเปิดเป็นเว็บไซต์
  // ให้ JavaScript ตรวจสอบเวลา

  if (!isAndroidApp()) {

    checkWebAlarms(now);

  }

}


// ========================================
// เพิ่มรายการยืมของ
// ========================================

function setAlarm() {

  const borrower =
    document
      .getElementById("borrowerName")
      .value
      .trim();


  const item =
    document
      .getElementById("itemName")
      .value
      .trim();


  const time =
    document
      .getElementById("alarmTime")
      .value;


  // ตรวจสอบข้อมูล

  if (!borrower) {

    alert(
      "กรุณาระบุชื่อคนยืม"
    );

    return;

  }


  if (!item) {

    alert(
      "กรุณาระบุของที่ยืม"
    );

    return;

  }


  if (!time) {

    alert(
      "กรุณาเลือกเวลาแจ้งเตือน"
    );

    return;

  }


  // สร้างรายการ

  const alarm = {

    id: Date.now(),

    borrower: borrower,

    item: item,

    time: time,

    enabled: true

  };


  alarms.push(alarm);


  saveAlarms();

  renderAlarms();


  // ตั้ง Alarm Android

  scheduleNativeAlarm(
    alarm
  );


  // หาวันที่จะปลุก

  const nextAlarm =
    getNextAlarmDate(
      time
    );


  const today =
    new Date();


  let dayText =
    "วันนี้";


  if (
    nextAlarm.getDate() !==
      today.getDate() ||

    nextAlarm.getMonth() !==
      today.getMonth() ||

    nextAlarm.getFullYear() !==
      today.getFullYear()
  ) {

    dayText =
      "พรุ่งนี้";

  }


  // ล้างช่องกรอก

  document
    .getElementById("borrowerName")
    .value = "";


  document
    .getElementById("itemName")
    .value = "";


  document
    .getElementById("alarmTime")
    .value = "";


  // แสดงสถานะ

  document
    .getElementById("status")
    .textContent =

      `แจ้งเตือน ${dayText} ${time} เรียบร้อยแล้ว 🔔`;

}


// ========================================
// แสดงรายการ
// ========================================

function renderAlarms() {

  const list =
    document
      .getElementById("alarmList");


  if (alarms.length === 0) {

    list.innerHTML =

      `<p class="empty">
        ยังไม่มีรายการยืมของ
      </p>`;

    return;

  }


  list.innerHTML = "";


  alarms.forEach(
    alarm => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "alarm";


      item.innerHTML = `

        <div class="alarm-info">

          <div class="alarm-time">
            ${alarm.time}
          </div>

          <div class="borrower">
            👤 ${alarm.borrower}
          </div>

          <div class="item">
            📦 ${alarm.item}
          </div>

        </div>


        <button
          class="toggle ${
            alarm.enabled
              ? "on"
              : ""
          }"
          onclick="toggleAlarm(${alarm.id})"
        >

          <span
            class="toggle-circle"
          ></span>

        </button>


        <button
          class="delete-button"
          onclick="deleteAlarm(${alarm.id})"
        >
          ลบ
        </button>

      `;


      list.appendChild(item);

    }
  );

}


// ========================================
// เปิด / ปิด
// ========================================

function toggleAlarm(id) {

  const alarm =
    alarms.find(
      a => a.id === id
    );


  if (!alarm) {

    return;

  }


  alarm.enabled =
    !alarm.enabled;


  if (alarm.enabled) {

    scheduleNativeAlarm(
      alarm
    );


    document
      .getElementById("status")
      .textContent =

        `เปิดแจ้งเตือน ${alarm.time} แล้ว 🔔`;

  } else {

    cancelNativeAlarm(
      alarm.id
    );


    document
      .getElementById("status")
      .textContent =

        `ปิดแจ้งเตือน ${alarm.time} แล้ว`;

  }


  saveAlarms();

  renderAlarms();

}


// ========================================
// ลบรายการ
// ========================================

function deleteAlarm(id) {

  cancelNativeAlarm(
    id
  );


  alarms =
    alarms.filter(
      a => a.id !== id
    );


  saveAlarms();

  renderAlarms();


  document
    .getElementById("status")
    .textContent =
      "ลบรายการแล้ว";

}


// ========================================
// ตรวจสอบ Alarm บนเว็บ
// ========================================

function checkWebAlarms(now) {

  const currentTime =

    String(
      now.getHours()
    ).padStart(2, "0")

    +

    ":"

    +

    String(
      now.getMinutes()
    ).padStart(2, "0");


  // ใช้วันที่แบบ local
  // ไม่ใช้ toISOString()
  // เพื่อป้องกันปัญหาเวลาไทย

  const today =

    `${now.getFullYear()}-` +

    `${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-` +

    `${String(
      now.getDate()
    ).padStart(2, "0")}`;


  alarms.forEach(
    alarm => {

      if (

        !alarm.enabled ||

        alarm.time !==
          currentTime ||

        now.getSeconds() !==
          0

      ) {

        return;

      }


      const triggerKey =

        `${alarm.id}-${today}`;


      // ป้องกันการดังซ้ำ

      if (
        lastTriggered[
          alarm.id
        ] === triggerKey
      ) {

        return;

      }


      lastTriggered[
        alarm.id
      ] = triggerKey;


      showWebAlarm(
        alarm
      );

    }
  );

}


// ========================================
// แสดงหน้าต่างแจ้งเตือน
// ========================================

function showWebAlarm(alarm) {

  ringingAlarm =
    alarm;


  // เปิด Modal

  document
    .getElementById(
      "alarmModal"
    )
    .classList.add(
      "show"
    );


  // ชื่อคนยืม

  document
    .getElementById(
      "ringingName"
    )
    .textContent =

      `👤 ${alarm.borrower}`;


  // ของที่ยืม

  document
    .getElementById(
      "ringingItem"
    )
    .textContent =

      `📦 ${alarm.item}`;


  // เวลา

  document
    .getElementById(
      "ringingTime"
    )
    .textContent =

      `เวลาที่แจ้งเตือน ${alarm.time}`;


  // สถานะ

  document
    .getElementById(
      "status"
    )
    .textContent =

      "🔔 ถึงเวลาแจ้งเตือนแล้ว!";


  // เล่นเสียง

  alarmSound.currentTime =
    0;


  alarmSound
    .play()
    .catch(
      error => {

        console.log(
          "ไม่สามารถเล่นเสียง Alarm ได้:",
          error
        );

      }
    );

}


// ========================================
// หยุดแจ้งเตือน
// ========================================

function stopAlarm() {

  // ปิด Modal

  document
    .getElementById(
      "alarmModal"
    )
    .classList.remove(
      "show"
    );


  // หยุดเสียง

  alarmSound.pause();

  alarmSound.currentTime =
    0;


  // ล้างรายการที่กำลังดัง

  ringingAlarm =
    null;


  // เปลี่ยนสถานะ

  document
    .getElementById(
      "status"
    )
    .textContent =

      "หยุดแจ้งเตือนแล้ว";

}


// ========================================
// LocalStorage
// ========================================

function saveAlarms() {

  localStorage.setItem(

    "borrowAlarms",

    JSON.stringify(
      alarms
    )

  );

}


// ========================================
// ปุ่มเพิ่มรายการ
// ========================================

document
  .getElementById(
    "setAlarmButton"
  )
  .addEventListener(
    "click",
    setAlarm
  );


// ========================================
// ปุ่มหยุด
// ========================================

document
  .getElementById(
    "stopButton"
  )
  .addEventListener(
    "click",
    stopAlarm
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
