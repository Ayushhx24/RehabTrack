// main.js - FINAL CORRECTED VERSION

document.addEventListener("DOMContentLoaded", () => {
    // --- Initialize Firebase services ---
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- Main Authentication Check (The "Gatekeeper") ---
    auth.onAuthStateChanged(user => {
        const mainContent = document.querySelector('main');
        const topBar = document.querySelector('.top-bar');
        const usernameSpan = document.getElementById('username');
        const userInfoDiv = document.getElementById('userInfo');

        if (user) {
            // If a user is logged in:
            // 1. Make the main content visible
            mainContent.style.display = 'block';
            topBar.style.display = 'flex';

            // 2. Fetch their user profile from Firestore
            db.collection("users").doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    // 3. Display their actual username and email
                    usernameSpan.textContent = userData.username;
                    userInfoDiv.innerHTML = `
                        <p><strong>${userData.username}</strong></p>
                        <p><small>${userData.email}</small></p>
                    `;
                } else {
                    console.log("No user profile found in Firestore.");
                    usernameSpan.textContent = "User"; // Fallback text
                }
            }).catch(error => {
                console.error("Error getting user data:", error);
            });

        } else {
            // If no user is signed in, redirect to the login page
            window.location.href = 'login.html';
        }
    });

    // --- Logout Button Logic ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log("User signed out successfully.");
                // onAuthStateChanged will automatically handle the redirect.
            }).catch((error) => {
                console.error("Sign out error", error);
            });
        });
    }

    // --- Modal and Navigation Logic ---
    const cards = document.querySelectorAll(".card");
    const modal = document.getElementById("exerciseModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalInstructions = document.getElementById("modalInstructions");
    const closeButton = document.querySelector(".close-button");
    const startExerciseBtn = document.getElementById("startExerciseBtn");
    let selectedExercise = "";

    const exerciseData = {
        curls: {
            title: "Instructions for Arm Curls",
            instructions: [
              "<strong>Camera Position:</strong> Ensure your entire upper body is visible and well-lit.",
              "<strong>Alignment:</strong> Stand or sit facing the camera directly.",
              "<strong>Movement:</strong> Keep your elbows stationary at your sides.",
            ],
            url: "arm_curls.html",
        },
        squats: {
            title: "Instructions for Squats",
            instructions: [
              "<strong>Camera Position:</strong> Ensure your entire body from head to feet is visible.",
              "<strong>Alignment:</strong> Stand with your feet shoulder-width apart.",
              "<strong>Movement:</strong> Keep your chest up and back straight as you lower your hips.",
            ],
            url: "squats.html",
        },
        pushups: {
            title: "Instructions for Push-ups",
            instructions: [
              "<strong>Camera Position:</strong> Place the camera on the floor, viewing you from the side.",
              "<strong>Alignment:</strong> Ensure your entire body is visible in a plank position.",
              "<strong>Movement:</strong> Lower your body until your chest is close to the floor.",
            ],
            url: "pushups.html",
        },
    };

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            selectedExercise = card.getAttribute("data-exercise");
            const data = exerciseData[selectedExercise];
            if (data) {
                modalTitle.innerText = data.title;
                modalInstructions.innerHTML = data.instructions.map((item) => `<li>${item}</li>`).join("");
                modal.style.display = "flex";
            }
        });
    });

    const closeModal = () => { if(modal) modal.style.display = "none"; };
    if(closeButton) closeButton.addEventListener("click", closeModal);
    window.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });

    if(startExerciseBtn) {
        startExerciseBtn.addEventListener("click", () => {
            const data = exerciseData[selectedExercise];
            if (data && data.url) {
                window.location.href = data.url;
            }
        });
    }
});