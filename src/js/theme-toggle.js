const header = document.querySelector("header")
const body   = document.querySelector("body");
const themeToggle = header.querySelector("#theme-toggle");
let darkModeEnabled = JSON.parse(localStorage.getItem("quiz-dark-mode")) || false;

body.classList.toggle("dark-mode", darkModeEnabled);
themeToggle.checked = darkModeEnabled;


const togglePageTheme = () => {
    darkModeEnabled = !darkModeEnabled
    localStorage.setItem("quiz-dark-mode", darkModeEnabled);
    body.classList.toggle("dark-mode", darkModeEnabled);
}


themeToggle.addEventListener("change", togglePageTheme);