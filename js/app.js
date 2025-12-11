$(document).ready(function () {
    // Mobile menu toggle
    $("#hamburgerBtn").click(function () {
        $("#navLinks").toggleClass("open");
    });

    $(".nav-links a").click(function () {
        $("#navLinks").removeClass("open");
    });

    // THEMES AVAILABLE (same names as your CSS classes)
    const themes = ["theme-purple", "theme-cyan", "theme-green"];

    // Read current theme
    let savedTheme = localStorage.getItem("theme");

    if (savedTheme && themes.includes(savedTheme)) {
        document.documentElement.classList.add(savedTheme);
        // mark the correct radio button
        $('input[name="theme"][value="' + savedTheme + '"]').prop("checked", true);
    }

    // Save new theme
    $('input[name="theme"]').change(function () {
        const selectedTheme = $(this).val();

        // Remove all theme classes
        themes.forEach(t => document.documentElement.classList.remove(t));

        // Add the new one
        document.documentElement.classList.add(selectedTheme);

        // Save
        localStorage.setItem("theme", selectedTheme);
    });
});

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