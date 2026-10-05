
const introScreen = document.getElementById("intro-screen");
const projectFrame = document.getElementById("project-frame");
const projects = document.querySelectorAll(".sidebar li[data-page]");
const infoButton = document.getElementById("infoButton");

// introScreen.addEventListener("click", () => {
//     introScreen.classList.add("hidden");
// });

projects.forEach((project) => {
    project.addEventListener("click", () => {
    projectFrame.src = project.dataset.page;
});
});


let pageInfo = {};
let currentPage = null;


// about.json 불러오기
fetch("./about.json")
    .then(response => response.json())
    .then(data => {
        pageInfo = data;
    });


// 프로젝트 클릭
projects.forEach((project) => {
    project.addEventListener("click", () => {

        const page = project.dataset.page;

        projectFrame.src = page;

        // 현재 페이지 기록
        currentPage = page;
    });
});


// About 버튼
infoButton.addEventListener("click", () => {

    const info = pageInfo[currentPage];

    if (!info) {
        console.log("현재 페이지의 정보가 없습니다.");
        return;
    }

});