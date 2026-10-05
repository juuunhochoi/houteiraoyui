
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

// introScreen.addEventListener("click", () => {
//     introScreen.classList.add("hidden");
// });
let pageInfo = {};

fetch("./about.json")
    .then(response => response.json())
    .then(data => {
        pageInfo = data;
        console.log(pageInfo);
    });


// 페이지 이름 통일용

let currentPage = null;

function openPage(pageName) {
    currentPage = pageName;
    projectFrame.src = `./pages/${pageName}/index.html`;
}

projects.forEach((project) => {
    project.addEventListener("click", () => {

        projectFrame.src = "";
        back();

        openPage(project.dataset.page);
    });
});




// 버튼 로직
home.addEventListener("click", () => {
    currentPage = null;
    projectFrame.src="";

});

infoButton.addEventListener("click", () => {
    info();
});

backButton.addEventListener("click", () => {
    back();
});

function info () {
    if (currentPage!=null) {
        infoButton.classList.add("hidden");
        backButton.classList.remove("hidden");

        viewInfo();
    }
}

function back () {
    
    backButton.classList.add("hidden");
    infoButton.classList.remove("hidden");
    closeInfo();

}


// view info
// about.json 불러오기


function viewInfo() {
    const info = pageInfo[currentPage];

    console.log("infoTitle:", infoTitle);
    console.log("infoAbout:", infoAbout);
    console.log("infoMap:", infoMap);
    console.log("infoLicense:", infoLicense);

    if (!info) {
        console.log("해당 페이지 정보 없음");
        return;
    }

    infoTitle.textContent = info.title;
    infoAbout.textContent = info.about;
    infoMap.textContent = info.map;
    infoLicense.textContent = info.license;

    infoPanel.classList.remove("hidden");
    projectFrame.classList.add("hidden");
}

function closeInfo() {
    infoPanel.classList.add("hidden");
    projectFrame.classList.remove("hidden");
}
