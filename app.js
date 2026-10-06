
const introScreen = document.getElementById("intro-screen");
const projectFrame = document.getElementById("project-frame");
const projects = document.querySelectorAll(".sidebar li[data-page]");

const aboutButton = document.getElementById("aboutButton");
const infoButton = document.getElementById("infoButton");
const backButton = document.getElementById("backButton");
const home = document.getElementById("home");

const infoPanel = document.getElementById("infoPanel");
const infoTitle = document.getElementById("infoTitle");
const infoAbout = document.getElementById("infoAbout");
const infoMap = document.getElementById("infoMap");
const infoLicense = document.getElementById("infoLicense");


// ==============================
// About JSON
// ==============================

let pageInfo = {};

fetch("./about.json")
    .then(response => response.json())
    .then(data => {
        pageInfo = data;
        console.log(pageInfo);
    })
    .catch(error => {
        console.error("about.json을 불러오지 못했습니다:", error);
    });


// ==============================
// 현재 페이지
// ==============================

let currentPage = "home";

function openPage(pageName) {
    currentPage = pageName;

    // 새 페이지를 불러오는 동안 iframe을 숨김
    projectFrame.classList.add("hidden");

    projectFrame.src = `./pages/${pageName}/index.html`;
}


// ==============================
// iframe 로딩 완료
// ==============================

projectFrame.addEventListener("load", () => {

    // 현재 페이지가 있을 때만 iframe 표시
    if (currentPage !== null) {
        projectFrame.classList.remove("hidden");
    }
});


// ==============================
// 프로젝트 메뉴
// ==============================

projects.forEach((project) => {

    project.addEventListener("click", () => {

        const pageName = project.dataset.page;

        closeInfo();

        backButton.classList.add("hidden");
        infoButton.classList.remove("hidden");

        openPage(pageName);
    });

});


// ==============================
// Home
// ==============================

home.addEventListener("click", () => {

    currentPage = "home";

    closeInfo();

    // iframe 숨기기
    projectFrame.classList.add("hidden");

    // 버튼 상태
    backButton.classList.add("hidden");
    infoButton.classList.remove("hidden");

    // iframe 초기화
    projectFrame.src = "about:blank";
});


// ==============================
// Info 버튼
// ==============================

infoButton.addEventListener("click", () => {
    info();
    console.log(currentPage);
});


backButton.addEventListener("click", () => {

    closeInfo();

    projectFrame.classList.remove("hidden");

    // 버튼 상태
    backButton.classList.add("hidden");
    infoButton.classList.remove("hidden");
});



function info() {

    if (currentPage === null) {
        return;
    }

    viewInfo();
    projectFrame.classList.add("hidden");

    infoButton.classList.add("hidden");
    backButton.classList.remove("hidden");
}



function viewInfo() {

    const info = pageInfo[currentPage];

    console.log("currentPage:", currentPage);
    console.log("info:", info);

    if (!info) {
        console.log("해당 페이지 정보 없음:", currentPage);
        return;
    }

    infoTitle.textContent = info.title;
    infoAbout.textContent = info.about;
    infoMap.textContent = info.map;
    infoLicense.textContent = info.license;

    infoPanel.classList.remove("hidden");
}

function closeInfo() {
    infoPanel.classList.add("hidden");
}