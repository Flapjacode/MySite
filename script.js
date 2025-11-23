// DOM Ready (faster than window.onload)
document.addEventListener("DOMContentLoaded", () => {

    // Jupiter Terminal
    window.Jupiter.init({
        displayMode: "integrated",
        integratedTargetId: "integrated-terminal",
        endpoint: "http://192.168.1.88:8899/"
    });

});

// Sidebar open
function w3_open() {
    document.getElementById("mySidebar").style.display = "block";
}

// Sidebar close
function w3_close() {
    document.getElementById("mySidebar").style.display = "none";
}

// Mobile nav toggle
function openNav() {
    const x = document.getElementById("navDemo");
    x.classList.toggle("w3-show");
}
