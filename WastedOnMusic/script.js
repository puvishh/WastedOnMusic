
const API_KEY = 'LAST_FM_APIKEY';
let isManualMode = true;


function addSongInput() {
    const songContainer = document.getElementById('song-container');

    const songDiv = document.createElement('div');
    songDiv.classList.add('song-input');
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.placeholder = 'Amount';
    amountInput.classList.add('amount-input');
    const durationInput = document.createElement('input');
    durationInput.type = 'text';
    durationInput.placeholder = 'Duration (mm:ss)';
    durationInput.classList.add('duration-input');
    songDiv.appendChild(amountInput);
    songDiv.appendChild(durationInput);
    songContainer.appendChild(songDiv);
}

function calculateTotal() {
    let totalSeconds = 0;

    const songInputs = document.querySelectorAll('.song-input');
    songInputs.forEach(songDiv => {
        const amount = parseInt(songDiv.querySelector('.amount-input').value) || 0;
        const durationText = songDiv.querySelector('.duration-input').value.trim();
        const [minutes, seconds] = durationText.split(':').map(num => parseInt(num));

        if (!isNaN(minutes) && !isNaN(seconds)) {
            const durationInSeconds = minutes * 60 + seconds;
            totalSeconds += amount * durationInSeconds;
        }
    });

    displayResults(totalSeconds);
}

document.addEventListener('DOMContentLoaded', function() {
    const usernameInput = document.getElementById('username');

    usernameInput.setAttribute('autocomplete', 'new-password');
    usernameInput.setAttribute('autocorrect', 'off');
    usernameInput.setAttribute('autocapitalize', 'none');
    usernameInput.setAttribute('spellcheck', 'false');
    usernameInput.setAttribute('name', 'username');
});



async function fetchProfileData(username) {
    let totalPlays = 0;
    let userImage = '';
    let profileUrl = '';

    const userUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${API_KEY}&format=json`;
    try {
        const response = await fetch(userUrl);
        const data = await response.json();
        userImage = data.user.image[2]['#text'];
        totalPlays = parseInt(data.user.playcount);
        profileUrl = data.user.url;
    } catch (error) {
        console.error('Error fetching user info:', error);
        return;
    }

    const userImageElement = document.getElementById('user-image');
    const userDetailsElement = document.getElementById('user-details');
    const userPanel = document.querySelector('.user-panel');
    if (userImage) {
        userImageElement.src = userImage;
        userImageElement.classList.remove('hidden');
    }
    document.getElementById('total-plays').textContent = `Total Plays: ${totalPlays}`;
    userDetailsElement.classList.remove('hidden');

    const usernameLink = document.createElement('a');
    usernameLink.href = profileUrl;
    usernameLink.textContent = username;
    usernameLink.classList.add('user-link');
    userPanel.innerHTML = '';
    userPanel.appendChild(usernameLink);

    const fetchInputs = document.getElementById('lastfm-mode');
    fetchInputs.classList.add('hidden');
}

function toggleMode() {
    const manualMode = document.getElementById('manual-mode');
    const lastfmMode = document.getElementById('lastfm-mode');
    const toggleButton = document.getElementById('toggle-mode');

    if (isManualMode) {
        manualMode.classList.add('hidden');
        lastfmMode.classList.remove('hidden');
        toggleButton.textContent = 'Manual';
    } else {
        manualMode.classList.remove('hidden');
        lastfmMode.classList.add('hidden');
        toggleButton.textContent = 'LastFM';
    }

    isManualMode = !isManualMode;
}

function displayResults(totalSeconds) {
    const totalDays = Math.floor(totalSeconds / (24 * 3600));
    const totalHours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
    const remainingSeconds = totalSeconds % 60;

    document.getElementById('total-days').textContent = totalDays;
    document.getElementById('total-hours').textContent = totalHours;
    document.getElementById('total-minutes').textContent = totalMinutes;
    document.getElementById('total-seconds').textContent = remainingSeconds;

    const totalHourOutput = (totalSeconds / 3600).toFixed(2);
    document.getElementById('total-hour-output').textContent = totalHourOutput;
}

async function fetchLastFmData() {
    const username = document.getElementById('username').value;
    if (!username) {
        alert('Please enter a Last.fm username.');
        return;
    }

    const fetchInputs = document.getElementById('lastfm-mode');
    fetchInputs.classList.add('hidden');

    let totalSeconds = 0;
    let topTrack = null;
    let weeklyPlays = 0;

    await fetchProfileData(username);

    const topTracksUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${API_KEY}&format=json&limit=1`;
    try {
        const response = await fetch(topTracksUrl);
        const data = await response.json();
        if (data && data.toptracks && data.toptracks.track && data.toptracks.track.length > 0) {
            const track = data.toptracks.track[0];
            topTrack = track;
            document.getElementById('top-track-title').textContent = track.name;
            document.getElementById('top-track-title').classList.add('song-title');
            document.getElementById('top-track-artist').textContent = track.artist.name;
            document.getElementById('top-track-artist').classList.add('artist-name');
        }
    } catch (error) {
        console.error('Error fetching top tracks:', error);
    }

    const weeklyUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getweeklytrackchart&user=${username}&api_key=${API_KEY}&format=json`;
    try {
        const response = await fetch(weeklyUrl);
        const data = await response.json();
        data.weeklytrackchart.track.forEach(track => {
            weeklyPlays += parseInt(track.playcount);
        });
    } catch (error) {
        console.error('Error fetching weekly plays data:', error);
    }

    document.getElementById('weekly-plays').textContent = `Plays This Week: ${weeklyPlays}`;

    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
        const url = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&api_key=${API_KEY}&format=json&limit=200&page=${page}`;
        try {
            const response = await fetch(url);
            const data = await response.json();
            const tracks = data.toptracks.track;

            totalPages = parseInt(data.toptracks['@attr'].totalPages);

            tracks.forEach((track, index) => {
                const duration = parseInt(track.duration);
                const playcount = parseInt(track.playcount);
                if (duration && playcount) {
                    totalSeconds += duration * playcount;
                }

                if (page === 1 && index === 0) {
                    topTrack = track;
                    document.getElementById('top-track-title').textContent = track.name;
                    document.getElementById('top-track-title').classList.add('song-title');
                    document.getElementById('top-track-artist').textContent = track.artist.name;
                    document.getElementById('top-track-artist').classList.add('artist-name');
                }
            });

            displayResults(totalSeconds);
        } catch (error) {
            console.error('Error fetching Last.fm data:', error);
            break;
        }

        page++;
    }
}
