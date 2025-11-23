// Sidebar open
function w3_open() {
    let x = document.getElementById("mySidebar");
    x.style.display = "block";
}

// Sidebar close
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}

// Mobile navigation toggle
function openNav() {
    let x = document.getElementById("navDemo");
    if (x.className.indexOf("w3-show") === -1) {
        x.className += " w3-show";
    } else {
        x.className = x.className.replace(" w3-show", "");
    }
}

// Jupiter Terminal init
window.Jupiter.init({
    displayMode: "integrated",
    integratedTargetId: "integrated-terminal",
    endpoint: "http://192.168.1.88:8899/"
});
