$('#subject').select2({
    dropdownCssClass: 'dark-dropdown'
});

// Modal Logic
const modal = document.getElementById('videoModal');
const videoFrame = document.getElementById('videoFrame');

function openVideo(videoId) {
    modal.style.display = 'flex';
    // Auto-play enabled
    videoFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

function closeVideo() {
    modal.style.display = 'none';
    videoFrame.src = ''; // Stop video
}

// Close on outside click
window.onclick = function (event) {
    if (event.target == modal) {
        closeVideo();
    }
}