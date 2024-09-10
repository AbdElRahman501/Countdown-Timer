const starFocusBtn = document.getElementById('start-focus');
const startBreakBtn = document.getElementById('start-break');
const stopBtn = document.getElementById('stop');
const focusMinutesInput = document.getElementById('focus-minutes');
const breakMinutesInput = document.getElementById('break-minutes');
const countdownDisplay = document.getElementById('countdown');
const sessionNameInput = document.getElementById('session-name');


const musicAudio = new Audio('music.mp3');
const alarmSound = new Audio('alarm.mp3');
let sessionName = "";

let timer;
let timerStart = 0;
let remainingTime = 0;
let focusMinutes = 0;
let breakMinutes = 0;
let disableNotification = false;

let sites = []


// Load saved values from local storage
document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get(['focusMinutes', 'breakMinutes'], data => {
        focusMinutes = data.focusMinutes || 0;
        breakMinutes = data.breakMinutes || 0;
        focusMinutesInput.value = focusMinutes;
        breakMinutesInput.value = breakMinutes;
    });
    displaySessions();
});

// Update remaining time and display
function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const seconds = (remainingTime % 60).toString().padStart(2, '0');
    countdownDisplay.textContent = `${minutes}:${seconds}`;
    chrome.action.setBadgeText({ text: `${minutes}:${seconds}` });
}

// Start timer
function startTimer(timerType) {
    if (timerType === 'focus') {
        sessionName = sessionNameInput.value.trim();
        timerStart = focusMinutes * 60
        remainingTime = focusMinutes * 60;
        playMusic();

    } else if (timerType === 'break') {
        remainingTime = breakMinutes * 60;
        stopMusic();
    } else {
        return;
    }
    disableNotification = false
    stopAlarm();
    updateDisplay();
    timer = setInterval(tick, 1000);
}

// Stop timer
function stopTimer() {
    disableNotification = true
    clearInterval(timer);
    remainingTime = 0;
    updateDisplay();
    stopMusic();
    stopAlarm();
}

// Start timer on click
starFocusBtn.addEventListener('click', () => {
    startTimer('focus');
});

startBreakBtn.addEventListener('click', () => {
    startTimer('break');
});

stopBtn.addEventListener('click', stopTimer)
// Save values to local storage when input changes
focusMinutesInput.addEventListener('input', (e) => {
    focusMinutes = parseInt(e.target.value);
    chrome.storage.local.set({ focusMinutes });
});

breakMinutesInput.addEventListener('input', (e) => {
    breakMinutes = parseInt(e.target.value);
    chrome.storage.local.set({ breakMinutes });
});


// Show notification
function showNotification() {
    if (Notification.permission === 'granted') {
        new Notification('Timer Complete', { body: 'Your countdown has finished.' });
    }
}

// Play music
function playMusic() {
    musicAudio.play();
}

// Stop music
function stopMusic() {
    musicAudio.pause();
    musicAudio.currentTime = 0;
}

// Stop alarm
function stopAlarm() {
    alarmSound.pause();
    alarmSound.currentTime = 0;
    alarmSound.loop = false;
}


const sessionsList = document.getElementById('sessions-list');

function updateSession() {
    if (!sessionName) return;

    chrome.storage.local.get("sessions", result => {
        const sessions = result.sessions || [];
        let existsSession = sessions.find ? sessions.find(session => session.name === sessionName) : null;

        if (existsSession) {
            existsSession = {
                name: existsSession.name,
                totalTime: existsSession.totalTime + 1,
                sites: sites
            };
            chrome.storage.local.set({ sessions: [...sessions.filter(session => session.name !== sessionName), existsSession] });

        } else {
            let newSession = {
                name: sessionName,
                startTime: new Date().getTime(),
                totalTime: 0,
                sites: []
            }

            chrome.storage.local.set({ sessions: [...sessions, newSession] });
        }
    });

}



// Display sessions from local storage
function displaySessions() {
    chrome.storage.local.get("sessions", result => {
        const sessions = result.sessions || [];
        sessionsList.innerHTML = '';
        sessions.sort((a, b) => b.totalTime - a.totalTime).forEach(session => {
            const div = document.createElement('div');
            div.className = 'session-item';
            div.innerHTML = `
            <h3>${session.name}</h3>
            <p>Time Spent: ${Math.floor(session.totalTime / 60)} minutes ${Math.floor((session.totalTime % 60))} seconds</p>
            <p>Sites:</p>
            <ul>
                ${session.sites.map(site => `<li>${site.domain}: ${Math.floor(site.timeSpent / 60)} minutes ${site.timeSpent % 60} seconds</li>`).join('')}
            </ul>
            <button class="delete-btn" session-name="${session.name}">Delete</button>
        `;
            // Attach event listeners to edit and delete buttons
            const deleteBtn = div.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', handleDeleteSession);
            sessionsList.appendChild(div);
        });
    })
}


// Delete session handler
function handleDeleteSession(event) {
    const name = event.target.getAttribute('session-name');
    chrome.storage.local.get("sessions", result => {
        const sessions = result.sessions || [];
        const updatedSessions = sessions.filter(s => s.name !== name);
        chrome.storage.local.set({ sessions: updatedSessions });
        displaySessions();
    });
}
// Call displaySessions on page load






// Tick function
function tick() {
    if (remainingTime > 0) {
        remainingTime--;
        updateDisplay();
        updateSession();
        displaySessions();
    } else {
        if (disableNotification) return;
        clearInterval(timer);
        alarmSound.loop = true;
        alarmSound.play();
        showNotification();
        stopMusic();
    }
}