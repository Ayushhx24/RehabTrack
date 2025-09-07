Firebase Setup Guide for RehabTrack
Follow these steps to connect your RehabTrack application to a Firebase project for authentication.

1. Create a Firebase Project

Go to the Firebase Console.

Click on "Add project" and give your project a name (e.g., "RehabTrack").

Continue through the setup steps. You can choose whether or not to enable Google Analytics.

Once your project is created, you'll be taken to the project dashboard.

2. Register Your Web App
On your project dashboard, click the web icon (</>) to add a new web app.

Give your app a nickname (e.g., "RehabTrack Web").

You do not need to set up Firebase Hosting at this time.

Click "Register app".

3. Get Your Firebase Configuration

After registering your app, Firebase will provide you with a firebaseConfig object. It will look something like this:

const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcd..."
};

Copy this entire object.

4. Add the Configuration to Your Code
Open login.html and index.html in your code editor.

Find the firebaseConfig variable in the <script type="module"> tag at the bottom of each file.

Replace the placeholder object with the actual firebaseConfig object you copied from the Firebase console.

Before:

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    // ... more placeholder values
};

After:

const firebaseConfig = {
  apiKey: "AIzaSy...", // Your actual key
  authDomain: "rehabtrack-project.firebaseapp.com", // Your actual domain
  // ... Paste all your actual values here
};

Do this for BOTH login.html and index.html.

5. Enable Email/Password Authentication

In the Firebase Console, go to the Authentication section (from the left-hand menu).

Click on the "Sign-in method" tab.

Find "Email/Password" in the list of providers and click on it.

Enable the toggle switch and click "Save".

You're All Set!
Your RehabTrack application is now connected to Firebase. You can now register new users and log them in. The application will handle redirecting users between the landing page, login page, and the main exercise dashboard.