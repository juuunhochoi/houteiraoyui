
const introScreen = document.getElementById("intro-screen");
const mainScreen = document.getElementById("main-screen");
const projectFrame = document.getElementById("project-frame");
const projects = document.querySelectorAll(".sidebar li[data-page]");

introScreen.addEventListener("click", () => {
    introScreen.classList.add("hidden");
});

projects.forEach((project) => {
    project.addEventListener("click", () => {
    projectFrame.src = project.dataset.page;
});
});
