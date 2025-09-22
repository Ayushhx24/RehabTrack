document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();
  const sessionsContainer = document.getElementById("sessions-container");

  auth.onAuthStateChanged((user) => {
    if (user) {
      // Fetch sessions from Firestore
      db.collection("users")
        .doc(user.uid)
        .collection("workouts")
        .orderBy("startTime", "desc") // Show newest first
        .get()
        .then((querySnapshot) => {
          if (querySnapshot.empty) {
            sessionsContainer.innerHTML =
              "<p>No sessions found. Go complete an exercise!</p>";
            return;
          }

          sessionsContainer.innerHTML = ""; // Clear loading text
          querySnapshot.forEach((doc) => {
            const session = doc.data();
            const sessionDate = session.startTime.toDate().toLocaleString();

            const card = document.createElement("div");
            card.classList.add("session-card");
            card.innerHTML = `
                          <h2>${session.exercise}</h2>
                          <div class="session-details">
                              <p><strong>Date:</strong> ${sessionDate}</p>
                              <p><strong>Completed:</strong> ${session.completed_reps} / ${session.goal}</p>
                              <p><strong>Duration:</strong> ${session.duration_seconds}s</p>
                          </div>
                      `;
            sessionsContainer.appendChild(card);
          });
        })
        .catch((error) => {
          console.error("Error fetching sessions:", error);
          sessionsContainer.innerHTML =
            "<p>Could not load session history.</p>";
        });
    } else {
      // Not logged in
      window.location.href = "login.html";
    }
  });
});
