/* =========================================================
   오늘의 스케줄 타이머
   ========================================================= */

const MEDIA_PATHS = {
  gifWork: 'images/0.gif',
  gifRest: 'images/1-2.gif',
  gifStart: 'images/1-3.gif',
  gifEnd: 'images/1-1.gif',
  gifMad: 'images/2.gif',
  gifAllFinish: 'images/3.gif',

  audioStart: 'sounds/start.mp3',
  audioMad: 'sounds/mad.mp3',
  audioFinish: 'sounds/finish.mp3'
};


/* =========================================================
   기본 설정
   ========================================================= */

const STORAGE_KEY = 'todayScheduleTasks';

const ROW_HEIGHT = 44;
const MAX_PAPER_HEIGHT = 0;

let tasks = [];

let wheelValues = {
  startHour: 0,
  startMin: 0,
  endHour: 0,
  endMin: 0
};

let currentTaskIndex = -1;
let currentTask = null;

let scheduleTimer = null;
let activeTimer = null;
let madTimer = null;

let isReady = false;
let isScheduleRunning = false;
let isMad = false;

let clockTimer = null;


/* =========================================================
   DOM 준비
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  loadTasks();

  setDefaultTimes();

  createAllWheels();

  startClock();

  renderTimeline();

  updateApprovalButton();

  setupButtons();

});


/* =========================================================
   localStorage
   ========================================================= */

function loadTasks() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      tasks = [];
      return;
    }

    const parsed =
      JSON.parse(saved);

    if (Array.isArray(parsed)) {
      tasks = parsed;
    } else {
      tasks = [];
    }

  } catch (error) {

    console.error(
      '스케줄 불러오기 실패:',
      error
    );

    tasks = [];
  }

}


function saveTasks() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tasks)
  );

}


/* =========================================================
   시계
   ========================================================= */

function updateClock(screenNumber) {

  const now =
    new Date();

  const hour =
    String(now.getHours()).padStart(2, '0');

  const minute =
    String(now.getMinutes()).padStart(2, '0');

  const second =
    String(now.getSeconds()).padStart(2, '0');

  const h =
    document.getElementById(
      `h${screenNumber}`
    );

  const m =
    document.getElementById(
      `m${screenNumber}`
    );

  const s =
    document.getElementById(
      `s${screenNumber}`
    );

  if (h) {
    h.textContent = hour;
  }

  if (m) {
    m.textContent = minute;
  }

  if (s) {
    s.textContent = second;
  }

}


function startClock() {

  updateClock(1);
  updateClock(2);

  if (clockTimer) {
    clearInterval(clockTimer);
  }

  clockTimer =
    setInterval(() => {

      updateClock(1);
      updateClock(2);

      if (isScheduleRunning) {
        renderActiveTimeline();
      }

    }, 700);

}


/* =========================================================
   기본 시간
   ========================================================= */

function setDefaultTimes() {

  const now =
    new Date();

  const hour =
    now.getHours();

  const minute =
    now.getMinutes();

  wheelValues.startHour =
    hour;

  wheelValues.startMin =
    minute;

  wheelValues.endHour =
    hour;

  wheelValues.endMin =
    minute;

}


/* =========================================================
   시간 휠
   ========================================================= */

function createAllWheels() {

  createWheel(
    document.getElementById(
      'wheel-start-hour'
    ),
    'startHour',
    24
  );

  createWheel(
    document.getElementById(
      'wheel-start-min'
    ),
    'startMin',
    60
  );

  createWheel(
    document.getElementById(
      'wheel-end-hour'
    ),
    'endHour',
    24
  );

  createWheel(
    document.getElementById(
      'wheel-end-min'
    ),
    'endMin',
    60
  );

  updateAllWheelPositions();

}


function createWheel(
  container,
  key,
  max
) {

  if (!container) {
    return;
  }

  container.innerHTML = '';

  const fragment =
    document.createDocumentFragment();

  const topSpacer =
    document.createElement('div');

  topSpacer.className =
    'wheel-spacer';

  fragment.appendChild(
    topSpacer
  );


  for (
    let i = 0;
    i < max;
    i++
  ) {

    const item =
      document.createElement('div');

    item.className =
      'wheel-item';

    item.dataset.value =
      i;

    item.textContent =
      String(i).padStart(2, '0');

    fragment.appendChild(
      item
    );

  }


  const bottomSpacer =
    document.createElement('div');

  bottomSpacer.className =
    'wheel-spacer';

  fragment.appendChild(
    bottomSpacer
  );

  container.appendChild(
    fragment
  );

    container.addEventListener(
    'click',
    (event) => {

      const item =
        event.target.closest('.wheel-item');

      if (!item) {
        return;
      }

      const value =
        Number(item.dataset.value);

      wheelValues[key] =
        value;

      scrollWheelToValue(
        container,
        key,
        value,
        true
      );

      updateSelectedWheelItem(
        container,
        value
      );


      if (
        key === 'startHour' ||
        key === 'startMin'
      ) {

        syncEndTimeToStart();

      }

    }
  );


  /* =====================================================
     키보드 ↑ ↓ 로 시간 변경
     ===================================================== */

  container.setAttribute(
    'tabindex',
    '0'
  );


  container.addEventListener(
    'keydown',
    (event) => {

      let direction = 0;

      if (event.key === 'ArrowUp') {
        direction = -1;
      }

      if (event.key === 'ArrowDown') {
        direction = 1;
      }

      if (!direction) {
        return;
      }

      event.preventDefault();


      let nextValue =
        wheelValues[key] + direction;


      /* 시작 분 ↔ 시간 연동 */

      if (key === 'startMin') {

        if (nextValue >= 60) {

          nextValue = 0;

          wheelValues.startHour =
            (wheelValues.startHour + 1) % 24;

          scrollWheelToValue(
            document.getElementById(
              'wheel-start-hour'
            ),
            'startHour',
            wheelValues.startHour,
            true
          );

        }


        if (nextValue < 0) {

          nextValue = 59;

          wheelValues.startHour =
            (wheelValues.startHour + 23) % 24;

          scrollWheelToValue(
            document.getElementById(
              'wheel-start-hour'
            ),
            'startHour',
            wheelValues.startHour,
            true
          );

        }

      } else {

        if (nextValue < 0) {
          nextValue = max - 1;
        }

        if (nextValue >= max) {
          nextValue = 0;
        }

      }


      wheelValues[key] =
        nextValue;


      scrollWheelToValue(
        container,
        key,
        nextValue,
        true
      );


      updateSelectedWheelItem(
        container,
        nextValue
      );


      if (
        key === 'startHour' ||
        key === 'startMin'
      ) {

        syncEndTimeToStart();

      }

    }
  );


  let lastScrollTop = 0;

  let snapTimer = null;

  let programmaticScroll = false;


  container.addEventListener(
    'scroll',
    () => {

      const currentScrollTop =
        container.scrollTop;

      if (programmaticScroll) {

        lastScrollTop =
          currentScrollTop;

        return;
      }

      const diff =
        currentScrollTop -
        lastScrollTop;

      if (Math.abs(diff) < 2) {
        return;
      }

      lastScrollTop =
        currentScrollTop;


      const rawIndex =
        Math.round(
          currentScrollTop /
          ROW_HEIGHT
        ) - 1;

      let value =
        rawIndex;

      if (value < 0) {
        value = 0;
      }

      if (value >= max) {
        value = max - 1;
      }


      if (
        wheelValues[key] !== value
      ) {

        wheelValues[key] =
          value;

        updateSelectedWheelItem(
          container,
          value
        );


        if (
          key === 'startHour' ||
          key === 'startMin'
        ) {

          syncEndTimeToStart();

        }

      }


      clearTimeout(
        snapTimer
      );

      snapTimer =
        setTimeout(() => {

          snapWheel(
            container,
            key,
            max
          );

        }, 100);

    },
    {
      passive: true
    }
  );


  let wheelAccumulator = 0;

  let wheelResetTimer = null;


  container.addEventListener(
    'wheel',
    (event) => {

      event.preventDefault();

      wheelAccumulator +=
        event.deltaY;

      clearTimeout(
        wheelResetTimer
      );

      wheelResetTimer =
        setTimeout(() => {

          wheelAccumulator = 0;

        }, 120);


      if (
        Math.abs(
          wheelAccumulator
        ) < 50
      ) {

        return;
      }


      const direction =
        wheelAccumulator > 0
          ? -1
          : 1;

      wheelAccumulator = 0;


      let nextValue =
        wheelValues[key] +
        direction;


      /* =====================================================
         시작 시간의 분 휠
         59 → 00 이 될 때 시간도 +1
         00 → 59 이 될 때 시간도 -1
         ===================================================== */

      if (key === 'startMin') {

        if (nextValue >= 60) {

          nextValue = 0;

          wheelValues.startHour =
            (wheelValues.startHour + 1) % 24;

          scrollWheelToValue(
            document.getElementById(
              'wheel-start-hour'
            ),
            'startHour',
            wheelValues.startHour,
            true
          );

        }


        if (nextValue < 0) {

          nextValue = 59;

          wheelValues.startHour =
            (wheelValues.startHour + 23) % 24;

          scrollWheelToValue(
            document.getElementById(
              'wheel-start-hour'
            ),
            'startHour',
            wheelValues.startHour,
            true
          );

        }

      } else {

        if (nextValue < 0) {
          nextValue = max - 1;
        }

        if (nextValue >= max) {
          nextValue = 0;
        }

      }


      wheelValues[key] =
        nextValue;


      scrollWheelToValue(
        container,
        key,
        nextValue,
        true
      );


      updateSelectedWheelItem(
        container,
        nextValue
      );


      if (
        key === 'startHour' ||
        key === 'startMin'
      ) {

        syncEndTimeToStart();

      }

    },
    {
      passive: false
    }
  );


  let dragging = false;

  let dragStartY = 0;

  let dragStartScrollTop = 0;


  container.addEventListener(
    'pointerdown',
    (event) => {

      dragging = true;

      dragStartY =
        event.clientY;

      dragStartScrollTop =
        container.scrollTop;

      container.setPointerCapture?.(
        event.pointerId
      );

      container.classList.add(
        'dragging'
      );

    }
  );


  container.addEventListener(
    'pointermove',
    (event) => {

      if (!dragging) {
        return;
      }

      const delta =
        event.clientY -
        dragStartY;

      container.scrollTop =
        dragStartScrollTop -
        delta;

    }
  );


  const endDrag =
    (event) => {

      if (!dragging) {
        return;
      }

      dragging = false;


      try {

        container.releasePointerCapture?.(
          event.pointerId
        );

      } catch (error) {}


      container.classList.remove(
        'dragging'
      );


      clearTimeout(
        snapTimer
      );


      snapTimer =
        setTimeout(() => {

          snapWheel(
            container,
            key,
            max
          );

        }, 80);

    };


  container.addEventListener(
    'pointerup',
    endDrag
  );

  container.addEventListener(
    'pointercancel',
    endDrag
  );

}


function snapWheel(
  container,
  key,
  max
) {

  if (!container) {
    return;
  }

  let value =
    wheelValues[key];

  if (value < 0) {
    value = 0;
  }

  if (value >= max) {
    value = max - 1;
  }

  wheelValues[key] =
    value;


  scrollWheelToValue(
    container,
    key,
    value,
    true
  );


  updateSelectedWheelItem(
    container,
    value
  );

}


function scrollWheelToValue(
  container,
  key,
  value,
  smooth = false
) {

  if (!container) {
    return;
  }

  const top =
    (value + 1) *
    ROW_HEIGHT;


  container.scrollTo({
    top,
    behavior:
      smooth
        ? 'smooth'
        : 'auto'
  });


  updateSelectedWheelItem(
    container,
    value
  );

}


function updateSelectedWheelItem(
  container,
  value
) {

  if (!container) {
    return;
  }

  const items =
    container.querySelectorAll(
      '.wheel-item'
    );


  items.forEach(
    (item) => {

      const itemValue =
        Number(
          item.dataset.value
        );

      item.classList.toggle(
        'selected',
        itemValue === value
      );

    }
  );

}


function updateAllWheelPositions() {

  scrollWheelToValue(
    document.getElementById(
      'wheel-start-hour'
    ),
    'startHour',
    wheelValues.startHour,
    false
  );


  scrollWheelToValue(
    document.getElementById(
      'wheel-start-min'
    ),
    'startMin',
    wheelValues.startMin,
    false
  );


  scrollWheelToValue(
    document.getElementById(
      'wheel-end-hour'
    ),
    'endHour',
    wheelValues.endHour,
    false
  );


  scrollWheelToValue(
    document.getElementById(
      'wheel-end-min'
    ),
    'endMin',
    wheelValues.endMin,
    false
  );

}


/* =========================================================
   시작 시간 → 종료 시간 동기화
   ========================================================= */

function syncEndTimeToStart() {

  wheelValues.endHour =
    wheelValues.startHour;

  wheelValues.endMin =
    wheelValues.startMin;


  const endHourContainer =
    document.getElementById(
      'wheel-end-hour'
    );

  const endMinContainer =
    document.getElementById(
      'wheel-end-min'
    );


  if (endHourContainer) {

    scrollWheelToValue(
      endHourContainer,
      'endHour',
      wheelValues.endHour,
      true
    );

  }


  if (endMinContainer) {

    scrollWheelToValue(
      endMinContainer,
      'endMin',
      wheelValues.endMin,
      true
    );

  }

}


/* =========================================================
   스케줄 추가
   ========================================================= */

function addTask() {

  const memoInput =
    document.getElementById(
      'memo-input'
    );

  const memo =
    memoInput?.value.trim() ||
    '';


  if (!memo) {

    memoInput?.focus();

    return;
  }


  const startMinutes =
    wheelValues.startHour * 60 +
    wheelValues.startMin;


  const endMinutes =
    wheelValues.endHour * 60 +
    wheelValues.endMin;


  if (
    endMinutes === startMinutes
  ) {

    alert(
      '시작 시간과 종료 시간을 다르게 설정해주세요.'
    );

    return;
  }


  if (
    endMinutes < startMinutes
  ) {

    alert(
      '종료 시간은 시작 시간보다 늦어야 합니다.'
    );

    return;
  }


  const task = {

    id: Date.now(),

    startHour:
      wheelValues.startHour,

    startMin:
      wheelValues.startMin,

    endHour:
      wheelValues.endHour,

    endMin:
      wheelValues.endMin,

    memo

  };


  tasks.push(task);


  tasks.sort(
    (a, b) => {

      return (
        getTaskStartMinutes(a) -
        getTaskStartMinutes(b)
      );

    }
  );


  saveTasks();


  memoInput.value = '';


  wheelValues.startHour =
    task.endHour;

  wheelValues.startMin =
    task.endMin;

  wheelValues.endHour =
    task.endHour;

  wheelValues.endMin =
    task.endMin;


  updateAllWheelPositions();

  renderTimeline();

  updateApprovalButton();

}


function getTaskStartMinutes(task) {

  return (
    task.startHour * 60 +
    task.startMin
  );

}


function getTaskEndMinutes(task) {

  return (
    task.endHour * 60 +
    task.endMin
  );

}


function formatTime(
  hour,
  minute
) {

  return (
    String(hour).padStart(2, '0') +
    ':' +
    String(minute).padStart(2, '0')
  );

}


/* =========================================================
   쉬는 시간 생성
   ========================================================= */

function createTimelineItems() {

  const items = [];


  const sortedTasks =
    [...tasks].sort(
      (a, b) =>
        getTaskStartMinutes(a) -
        getTaskStartMinutes(b)
    );


  for (
    let i = 0;
    i < sortedTasks.length;
    i++
  ) {

    const task =
      sortedTasks[i];


    if (i > 0) {

      const previous =
        sortedTasks[i - 1];

      const previousEnd =
        getTaskEndMinutes(
          previous
        );

      const currentStart =
        getTaskStartMinutes(
          task
        );


      if (
        currentStart >
        previousEnd
      ) {

        items.push({

          type: 'break',

          start:
            previousEnd,

          end:
            currentStart

        });

      }

    }


    items.push({

      type: 'task',

      task

    });

  }


  return items;

}


/* =========================================================
   화면 1 스케줄 렌더링
   ========================================================= */

function renderTimeline() {

  const track =
    document.getElementById(
      'paper-track'
    );

  const viewport =
    document.getElementById(
      'paper-viewport'
    );


  if (!track || !viewport) {
    return;
  }


  track.innerHTML = '';


  /* 헤더 */

  const header =
    document.createElement(
      'div'
    );

  header.className =
    'excel-header-row';


  header.innerHTML = `

    <div class="excel-col header-col">
      start
    </div>

    <div class="excel-col header-col">
      end
    </div>

    <div class="excel-col header-col todo-header">
      to-do
    </div>

  `;


  track.appendChild(
    header
  );


  /* 일정 */

  const items =
    createTimelineItems();


  items.forEach(
    (item) => {

      if (
        item.type === 'task'
      ) {

        const row =
          document.createElement(
            'div'
          );

        row.className =
          'excel-data-row';


        row.innerHTML = `

          <div class="excel-col">
            ${formatTime(
              item.task.startHour,
              item.task.startMin
            )}
          </div>

          <div class="excel-col">
            ${formatTime(
              item.task.endHour,
              item.task.endMin
            )}
          </div>

          <div class="excel-col todo-cell">

            <span class="todo-text">
              ${escapeHtml(
                item.task.memo
              )}
            </span>

            <button
              type="button"
              class="delete-task-btn"
              data-task-id="${item.task.id}"
              aria-label="스케줄 삭제"
            >
              ×
            </button>

          </div>

        `;


        track.appendChild(
          row
        );


      } else {

        const row =
          document.createElement(
            'div'
          );

        row.className =
          'excel-data-row break-row';


        row.innerHTML = `

          <div class="excel-col">
            ${formatMinutes(
              item.start
            )}
          </div>

          <div class="excel-col">
            ${formatMinutes(
              item.end
            )}
          </div>

          <div class="excel-col todo-cell">
            break
          </div>

        `;


        track.appendChild(
          row
        );

      }

    }
  );


  const rowCount =
    1 + items.length;


  const contentHeight =
    rowCount *
    ROW_HEIGHT;


  const viewportHeight =
    contentHeight;


  viewport.style.height =
    `${viewportHeight}px`;


  requestAnimationFrame(
    () => {

      viewport.scrollTop =
        Math.max(
          0,
          contentHeight -
          viewportHeight
        );

    }
  );

}


/* =========================================================
   스케줄 삭제
   ========================================================= */

function deleteTask(taskId) {

  tasks =
    tasks.filter(
      task =>
        String(task.id) !== String(taskId)
    );


  /* localStorage에 즉시 다시 저장 */
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(tasks)
  );


  /* 화면 1 갱신 */
  renderTimeline();


  /* 화면 2 갱신 */
  renderActiveTimeline();


  /* APPROVED 버튼 상태 갱신 */
  updateApprovalButton();

}


/* =========================================================
   화면 2 스케줄 렌더링
   ========================================================= */

function renderActiveTimeline() {

  const timeline =
    document.getElementById(
      'active-timeline'
    );

  if (!timeline) {
    return;
  }

  timeline.innerHTML = '';

  const now =
    getCurrentMinutes();

  const items =
    createTimelineItems();


  /* 헤더 */

  const header =
    document.createElement('div');

  header.className =
    'excel-header-row active-header-row';

  header.innerHTML = `

    <div class="excel-col header-col">
      start
    </div>

    <div class="excel-col header-col">
      end
    </div>

    <div class="excel-col header-col">
      to-do
    </div>

    <div class="excel-col header-col check-header">
    </div>

  `;

  timeline.appendChild(header);


  /* 전체 일정 */

  items.forEach((item) => {

    const row =
      document.createElement('div');

    row.className =
      'excel-data-row active-data-row';


    if (item.type === 'task') {

      const task =
        item.task;

      const endMinutes =
        getTaskEndMinutes(task);

      const isDone =
        endMinutes <= now;


      if (isDone) {
        row.classList.add('completed');
      }


      row.innerHTML = `

        <div class="excel-col">
          ${formatTime(
            task.startHour,
            task.startMin
          )}
        </div>

        <div class="excel-col">
          ${formatTime(
            task.endHour,
            task.endMin
          )}
        </div>

        <div class="excel-col todo-cell">
          ${escapeHtml(
            task.memo
          )}
        </div>

        <div class="excel-col check-cell">
          ${
            isDone
              ? '✓'
              : ''
          }
        </div>

      `;


    } else {

      const isDone =
        item.end <= now;


      row.classList.add(
        'break-row'
      );


      if (isDone) {
        row.classList.add('completed');
      }


      row.innerHTML = `

        <div class="excel-col">
          ${formatMinutes(
            item.start
          )}
        </div>

        <div class="excel-col">
          ${formatMinutes(
            item.end
          )}
        </div>

        <div class="excel-col todo-cell">
          break
        </div>

        <div class="excel-col check-cell">
          ${
            isDone
              ? '✓'
              : ''
          }
        </div>

      `;

    }


    timeline.appendChild(row);

  });


  timeline.classList.remove(
    'hidden'
  );

}


/* =========================================================
   HTML escape
   ========================================================= */

function escapeHtml(value) {

  return String(value)

    .replaceAll(
      '&',
      '&amp;'
    )

    .replaceAll(
      '<',
      '&lt;'
    )

    .replaceAll(
      '>',
      '&gt;'
    )

    .replaceAll(
      '"',
      '&quot;'
    )

    .replaceAll(
      "'",
      '&#039;'
    );

}


/* =========================================================
   분 → 시간
   ========================================================= */

function formatMinutes(
  totalMinutes
) {

  const hour =
    Math.floor(
      totalMinutes / 60
    );

  const minute =
    totalMinutes % 60;


  return formatTime(
    hour,
    minute
  );

}


/* =========================================================
   APPROVED 버튼
   ========================================================= */

function updateApprovalButton() {

  const button =
    document.getElementById(
      'approval-stamp'
    );


  if (!button) {
    return;
  }


  button.disabled =
    tasks.length === 0;

}


function setupButtons() {

  const addButton =
    document.getElementById(
      'add-btn'
    );


  const approvalButton =
    document.getElementById(
      'approval-stamp'
    );


  const seatButton =
    document.getElementById(
      'seat-btn'
    );


  const backButton =
    document.getElementById(
      'back-btn'
    );


  addButton?.addEventListener(
    'click',
    addTask
  );


  approvalButton?.addEventListener(
    'click',
    playApprovalStamp
  );


  seatButton?.addEventListener(
    'click',
    handleSit
  );


  backButton?.addEventListener(
    'click',
    goBackToSetup
  );


  /* 스케줄 삭제 */

  const paperTrack =
    document.getElementById(
      'paper-track'
    );


  paperTrack?.addEventListener(
    'click',
    (event) => {

      const button =
        event.target.closest(
          '.delete-task-btn'
        );


      if (!button) {
        return;
      }


      const taskId =
        Number(
          button.dataset.taskId
        );


      deleteTask(taskId);

    }
  );


  document
    .getElementById(
      'memo-input'
    )
    ?.addEventListener(
      'keydown',
      (event) => {

        if (
          event.key === 'Enter'
        ) {

          event.preventDefault();

          addTask();

        }

      }
    );

}


/* =========================================================
   승인 스탬프
   ========================================================= */

function playApprovalStamp() {

  const button =
    document.getElementById(
      'approval-stamp'
    );


  /*
   * APPROVED 클릭 자체를
   * 브라우저 오디오 재생 승인으로 사용
   */

  let audio =
    document.getElementById(
      'global-audio'
    );


  if (!audio) {

    audio =
      document.createElement(
        'audio'
      );

    audio.id =
      'global-audio';

    audio.preload =
      'auto';

    document.body.appendChild(
      audio
    );

  }



  if (!button) {

    switchToActiveScreen();

    return;
  }


  button.disabled = true;


  button.classList.add(
    'stamp-approved'
  );


  setTimeout(
    () => {

      switchToActiveScreen();

    },
    650
  );

}

/* =========================================================
   화면 전환
   ========================================================= */

function switchToActiveScreen() {

  const setup =
    document.getElementById(
      'screen-setup'
    );


  const active =
    document.getElementById(
      'screen-active'
    );


  setup?.classList.add(
    'hidden'
  );


  active?.classList.remove(
    'hidden'
  );


  renderActiveTimeline();


  startSchedule();

}


function goBackToSetup() {

  clearScheduleTimers();


  isReady = false;

  isScheduleRunning = false;

  isMad = false;


  currentTaskIndex = -1;

  currentTask = null;


  const setup =
    document.getElementById(
      'screen-setup'
    );


  const active =
    document.getElementById(
      'screen-active'
    );


  active?.classList.add(
    'hidden'
  );


  setup?.classList.remove(
    'hidden'
  );


  renderTimeline();

  updateApprovalButton();

}


/* =========================================================
   스케줄 시작
   ========================================================= */

function startSchedule() {

  if (
    tasks.length === 0
  ) {

    return;
  }


  clearScheduleTimers();


  isScheduleRunning = true;


  renderActiveTimeline();


  currentTaskIndex =
    findCurrentTaskIndex();


  if (
    currentTaskIndex < 0
  ) {

    currentTaskIndex = 0;

  }

  showAnimation(
    MEDIA_PATHS.gifAllFinish
  );


  waitUntilTaskStart();

}


/* =========================================================
   현재 일정 찾기
   ========================================================= */

function findCurrentTaskIndex() {

  const now =
    getCurrentMinutes();


  for (
    let i = 0;
    i < tasks.length;
    i++
  ) {

    const task =
      tasks[i];


    if (

      now >=
      getTaskStartMinutes(task)

      &&

      now <
      getTaskEndMinutes(task)

    ) {

      return i;

    }

  }


  for (
    let i = 0;
    i < tasks.length;
    i++
  ) {

    if (
      getTaskStartMinutes(
        tasks[i]
      ) > now
    ) {

      return i;

    }

  }


  return -1;

}


/* =========================================================
   현재 시간 → 분
   ========================================================= */

function getCurrentMinutes() {

  const now =
    new Date();


  return (
    now.getHours() * 60 +
    now.getMinutes()
  );

}


/* =========================================================
   다음 일정 대기
   ========================================================= */

function waitUntilTaskStart() {

  if (

    currentTaskIndex < 0

    ||

    currentTaskIndex >=
    tasks.length

  ) {

    finishAllSchedule();

    return;
  }


  const task =
    tasks[currentTaskIndex];


  currentTask =
    task;


  const now =
    new Date();


  const currentSeconds =

    now.getHours() * 3600 +

    now.getMinutes() * 60 +

    now.getSeconds();


  const targetSeconds =

    task.startHour * 3600 +

    task.startMin * 60;


  let diff =
    targetSeconds -
    currentSeconds;


  if (
    diff <= 0
  ) {

    openDoorForTask();
    

    return;
  }


  scheduleTimer =
    setTimeout(
      () => {

        openDoorForTask();

      },
      diff * 1000
    );

}


/* =========================================================
   문 열림 / 입장
   ========================================================= */

function openDoorForTask() {

  if (!currentTask) {
    return;
  }

  setStatus(
    '입장 시간'
  );

  showAnimation(
    MEDIA_PATHS.gifStart
  );

  playAudio(
    MEDIA_PATHS.audioStart
  );

  activeTimer =
    setTimeout(
      () => {

        enterSitWaiting();

      },
      700 
    );

}

/* =========================================================
   SIT
   ========================================================= */

   function enterSitWaiting() {

  if (!currentTask) {
    return;
  }

  isReady = false;

  const seatButton =
    document.getElementById(
      'seat-btn'
    );

  seatButton?.classList.remove(
    'hidden'
  );

  startMadState();

  activeTimer =
    setTimeout(
      () => {

        // 60초 동안 SIT하지 않은 경우
        // 기존 상태 유지

      },
      60 * 1000
    );

}

function handleSit() {

  if (!currentTask) {
    return;
  }


  stopMadState();


  isReady = true;


  const seatButton =
    document.getElementById(
      'seat-btn'
    );


  seatButton?.classList.add(
    'hidden'
  );


  setStatus(
    '작업 중'
  );


  showAnimation(
    MEDIA_PATHS.gifWork
  );


  startCurrentTaskTimer();

}


/* =========================================================
   작업 진행
   ========================================================= */

function startCurrentTaskTimer() {

  if (!currentTask) {
    return;
  }


  if (activeTimer) {

    clearTimeout(
      activeTimer
    );

  }


  const now =
    new Date();


  const nowSeconds =

    now.getHours() * 3600 +

    now.getMinutes() * 60 +

    now.getSeconds();


  const endSeconds =

    currentTask.endHour * 3600 +

    currentTask.endMin * 60;


  let diff =
    endSeconds -
    nowSeconds;


  if (
    diff <= 0
  ) {

    finishCurrentTask();

    return;
  }


  activeTimer =
    setTimeout(
      () => {

        finishCurrentTask();

      },
      diff * 1000
    );

}


/* =========================================================
   작업 종료
   ========================================================= */

function finishCurrentTask() {

  if (!currentTask) {
    return;
  }


  clearActiveTimer();


  renderActiveTimeline();


  setStatus(
    '퇴장'
  );


  showAnimation(
    MEDIA_PATHS.gifEnd
  );

  playAudio(
    MEDIA_PATHS.audioStart
  );



  activeTimer =
    setTimeout(
      () => {

        moveToNextTask();

      },
      700
    );

}


/* =========================================================
   다음 일정
   ========================================================= */

function moveToNextTask() {

  clearActiveTimer();


  currentTaskIndex++;


  isReady = false;

  isMad = false;


  const seatButton =
    document.getElementById(
      'seat-btn'
    );


  seatButton?.classList.add(
    'hidden'
  );


  if (
    currentTaskIndex >=
    tasks.length
  ) {

    finishAllSchedule();

    return;
  }


  currentTask =
    tasks[currentTaskIndex];


  setStatus(
    '대기 중'
  );


  showAnimation(
    MEDIA_PATHS.gifRest
  );


  renderActiveTimeline();


  waitUntilTaskStart();

}


/* =========================================================
   최종 종료
   ========================================================= */

function finishAllSchedule() {

  clearScheduleTimers();


  isScheduleRunning = false;

  isReady = false;

  isMad = false;


  currentTask = null;


  const seatButton =
    document.getElementById(
      'seat-btn'
    );


  seatButton?.classList.add(
    'hidden'
  );


  renderActiveTimeline();

  playAudio(
    MEDIA_PATHS.audioFinish
  );


  setStatus(
    '오늘의 일정 완료'
  );


  showAnimation(
    MEDIA_PATHS.gifAllFinish
  );

}


/* =========================================================
   화난 상태
   ========================================================= */

function startMadState() {

  if (!currentTask) {
    return;
  }


  isMad = true;


  setStatus(
    'SIT 해주세요'
  );


  showAnimation(
    MEDIA_PATHS.gifMad
  );


  playAudio(
    MEDIA_PATHS.audioMad
  );


  const audio =
    document.getElementById(
      'global-audio'
    );


  if (audio) {

    audio.loop = true;

  }

}


/* =========================================================
   화난 상태 종료
   ========================================================= */

function stopMadState() {

  isMad = false;


  if (madTimer) {

    clearInterval(
      madTimer
    );

    madTimer = null;

  }


  const audio =
    document.getElementById(
      'global-audio'
    );


  if (audio) {

    audio.pause();

    audio.currentTime = 0;

    audio.loop = false;

  }

}


/* =========================================================
   애니메이션
   ========================================================= */

function showAnimation(src) {

  const image =
    document.getElementById(
      'anim-img'
    );


  const placeholder =
    document.getElementById(
      'anim-placeholder'
    );


  if (!image) {
    return;
  }


  if (!src) {

    image.classList.add(
      'hidden'
    );

    placeholder?.classList.remove(
      'hidden'
    );

    return;
  }


  image.src =
    src;


  image.classList.remove(
    'hidden'
  );


  placeholder?.classList.add(
    'hidden'
  );

}


/* =========================================================
   오디오
   ========================================================= */

function playAudio(src) {

  if (!src) {
    return;
  }


  let audio =
    document.getElementById(
      'global-audio'
    );


  if (!audio) {

    audio =
      document.createElement(
        'audio'
      );

    audio.id =
      'global-audio';

    document.body.appendChild(
      audio
    );

  }


  audio.pause();

  audio.currentTime = 0;

  audio.src = src;

  audio.loop = false;


  audio.play().catch(
    () => {}
  );

}


/* =========================================================
   상태 표시
   ========================================================= */

function setStatus(text) {

  const badge =
    document.getElementById(
      'status-badge'
    );


  if (badge) {

    badge.textContent =
      text;

  }

}


/* =========================================================
   타이머 정리
   ========================================================= */

function clearActiveTimer() {

  if (activeTimer) {

    clearTimeout(
      activeTimer
    );

    activeTimer = null;

  }

}


function clearScheduleTimers() {

  if (scheduleTimer) {

    clearTimeout(
      scheduleTimer
    );

    scheduleTimer = null;

  }


  if (activeTimer) {

    clearTimeout(
      activeTimer
    );

    activeTimer = null;

  }


  stopMadState();

}