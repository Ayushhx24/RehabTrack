/* const squatsTracker = {
  name: "Squats",
  goal: 0, count: 0, state: "up", history: [], currentAngle: 180,
  feedback: "Start squatting!", lastStateTime: 0, debounce: 500, repsData: [],
  minAngleForRep: 180, maxAngleForRep: 0,

  setGoal: function (g) { this.goal = parseInt(g); this.reset(); },
  reset: function () {
    this.count = 0; this.history = []; this.repsData = [];
    this.feedback = "Start squatting!"; this.state = "up";
    this.currentAngle = 180; this.lastStateTime = 0;
  },

detect: function (pose) {
    // Safety check to ensure all keypoints exist before we use them
    if (!pose.leftHip || !pose.leftKnee || !pose.leftAnkle) {
      console.warn("Squat tracker waiting for hip, knee, and ankle keypoints.");
      return; // Exit the function if any keypoint is missing for this frame
    }
    
    const { leftHip, leftKnee, leftAnkle } = pose;

    if (leftHip.confidence > 0.2 && leftKnee.confidence > 0.2 && leftAnkle.confidence > 0.2) {
      this.currentAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      this.history.push(this.currentAngle);

      if (this.state === "down") {
        this.minAngleForRep = Math.min(this.minAngleForRep, this.currentAngle);
        this.maxAngleForRep = Math.max(this.maxAngleForRep, this.currentAngle);
      }
      
      const currentTime = millis();
      
      // State change to DOWN
      // CHANGED: The angle threshold is now 120, making it easier to start a rep.
      if (this.currentAngle < 120 && this.state === "up" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "down"; 
        this.lastStateTime = currentTime;
        this.minAngleForRep = 180; 
        this.maxAngleForRep = 0;
      }
      
      // State change to UP (Rep completion)
      if (this.currentAngle > 160 && this.state === "down" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "up"; 
        this.count++; 
        this.lastStateTime = currentTime;
        
        const repData = {
          rep_number: this.count,
          top_angle: parseFloat(this.maxAngleForRep.toFixed(1)),
          bottom_angle: parseFloat(this.minAngleForRep.toFixed(1)),
        };
        this.repsData.push(repData);
        console.log(`%cREP ${this.count} COMPLETED!`, "color: #00ff00; font-size: 14px;", repData);
      }
    }
  },

checkForm: function (pose) {
    // This feedback is also made more lenient to match the new depth.
    if (this.state === "down") {
      const avgHipY = (pose.leftHip.y + pose.rightHip.y) / 2;
      const avgKneeY = (pose.leftKnee.y + pose.rightKnee.y) / 2;
      this.feedback =
        avgHipY > avgKneeY + 20 ? "Go a little lower!" : "Good Depth!";
    } else {
      this.feedback = "Good Form!";
    }
  },

  drawUI: function () {
    fill(255);
    stroke(0);
    strokeWeight(4);
    textAlign(LEFT, TOP);
    textSize(32);
    text(`Squats: ${this.count} / ${this.goal}`, 10, 30);
    text(`Depth: ${this.currentDepth.toFixed(0)}`, 10, 70);

    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 110);
  },

  drawGraph: function() {
    if (this.depthHistory.length > 1) {
      textAlign(LEFT, CENTER);
      fill(150);
      textSize(12);
      text("Up", 20, 150);
      text("Parallel", 20, height / 2);
      text("Down", 20, height - 50);

      noFill();
      stroke(0, 255, 255);
      strokeWeight(2);
      beginShape();
      for (let i = 0; i < this.depthHistory.length; i++) {
        const x = map(i, 0, this.depthHistory.length - 1, 60, width - 20);
        const y = map(this.depthHistory[i], 150, -50, 150, height - 50);
        vertex(x, y);
      }
      endShape();
    }
  },
};

// This line makes the tracker available to the main sketch.js file
var currentTracker = squatsTracker; */

// squats.js - FINAL CORRECTED AND POLISHED VERSION

/* const squatsTracker = {
  name: "Squats",
  goal: 0, count: 0, state: "up", history: [], currentAngle: 180,
  feedback: "Start squatting!", lastStateTime: 0, debounce: 500, repsData: [],
  minAngleForRep: 180, maxAngleForRep: 0,

  setGoal: function (g) { this.goal = parseInt(g); this.reset(); },
  
  reset: function () {
    this.count = 0; this.history = []; this.repsData = [];
    this.feedback = "Start squatting!"; this.state = "up";
    this.currentAngle = 180; this.lastStateTime = 0;
  },

  detect: function (pose) {
    // Safety check to ensure all keypoints exist before we use them
    if (!pose.leftHip || !pose.leftKnee || !pose.leftAnkle) {
      console.warn("Squat tracker waiting for hip, knee, and ankle keypoints.");
      return; // Exit the function if any keypoint is missing for this frame
    }
    this.currentKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
    this.currentBackAngle = this.calculateAngle(leftShoulder, leftHip, leftKnee); // NEW
    
    const { leftHip, leftKnee, leftAnkle } = pose;

    if (leftHip.confidence > 0.2 && leftKnee.confidence > 0.2 && leftAnkle.confidence > 0.2) {
      this.currentAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      this.history.push(this.currentAngle);

      if (this.state === "down") {
        this.minAngleForRep = Math.min(this.minAngleForRep, this.currentAngle);
        this.maxAngleForRep = Math.max(this.maxAngleForRep, this.currentAngle);
      }
      
      const currentTime = millis();
      
      // State change to DOWN
      if (this.currentAngle < 120 && this.state === "up" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "down"; 
        this.lastStateTime = currentTime;
        this.minAngleForRep = 180; 
        this.maxAngleForRep = 0;
      }
      
      // State change to UP (Rep completion)
      if (this.currentAngle > 160 && this.state === "down" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "up"; 
        this.count++; 
        this.lastStateTime = currentTime;
        
        const repData = {
          rep_number: this.count,
          top_angle: parseFloat(this.maxAngleForRep.toFixed(1)),
          bottom_angle: parseFloat(this.minAngleForRep.toFixed(1)),
        };
        this.repsData.push(repData);
      }
    }
  },

  // FIXED: Added a safety check to prevent crashes
  checkForm: function (pose) {
    if (!pose.leftHip || !pose.rightHip || !pose.leftKnee || !pose.rightKnee) {
        this.feedback = "Adjust position";
        return;
    }
    
    // Logic is now based on the knee angle for consistency
    if (this.state === "down" && this.currentAngle > 100) {
      this.feedback = "Go deeper!";
    } else if (this.state === "up" && this.currentAngle < 160) {
      this.feedback = "Stand up fully!";
    } else {
      this.feedback = "Good Form!";
    }
    if (this.currentBackAngle < 70) { // Example threshold
    this.feedback = "Keep your chest up!";
}
  },

  calculateAngle: function (A, B, C) {
    const BA = [A.x - B.x, A.y - B.y];
    const BC = [C.x - B.x, C.y - B.y];
    const dotProduct = BA[0] * BC[0] + BA[1] * BC[1];
    const magnitudeBA = Math.sqrt(BA[0] ** 2 + BA[1] ** 2);
    const magnitudeBC = Math.sqrt(BC[0] ** 2 + BC[1] ** 2);
    if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
    const angleRad = Math.acos(dotProduct / (magnitudeBA * magnitudeBC));
    return (angleRad * 180) / Math.PI;
  },

  // FIXED: Displays the correct 'currentAngle' variable
  drawUI: function () {
    fill(255);
    stroke(0);
    strokeWeight(4);
    textAlign(LEFT, TOP);
    textSize(32);
    text(`Squats: ${this.count} / ${this.goal}`, 10, 30);
    text(`Knee Angle: ${this.currentAngle.toFixed(0)}°`, 10, 70); // Changed from 'Depth'

    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 110);
  },

  drawGraph: function () {
    if (this.history.length > 1) {
      textAlign(LEFT, CENTER); fill(150); textSize(12);
      text("180° (Up)", 20, 150);
      text("90° (Parallel)", 20, height / 2);
      text("0° (Down)", 20, height - 50);

      noFill(); stroke(0, 255, 255); strokeWeight(2);
      beginShape();
      for (let i = 0; i < this.history.length; i++) {
        const x = map(i, 0, this.history.length - 1, 80, width - 20);
        const y = map(this.history[i], 0, 180, height - 50, 150); // Mapped to angle
        vertex(x, y);
      }
      endShape();
    }
  },
};

// This line makes the tracker available to the main sketch.js file
var currentTracker = squatsTracker; */

// squats.js - FINAL CORRECTED VERSION

const squatsTracker = {
  name: "Squats",
  goal: 0, count: 0, state: "up", history: [],
  feedback: "Start squatting!", lastStateTime: 0, debounce: 500, repsData: [],
 
  currentKneeAngle: 180,
  currentBackAngle: 180,
  minKneeAngleForRep: 180,
  minBackAngleForRep: 180,

  setGoal: function (g) { this.goal = parseInt(g); this.reset(); },
  
  reset: function () {
    this.count = 0; this.history = []; this.repsData = [];
    this.feedback = "Start squatting!"; this.state = "up";
    this.currentKneeAngle = 180; this.currentBackAngle = 180;
    this.lastStateTime = 0;
  },

  detect: function (pose) {

    if (!pose.leftShoulder || !pose.leftHip || !pose.leftKnee || !pose.leftAnkle) {
      console.warn("Tracker waiting for keypoints.");
      return; // Exit if any keypoint is missing
    }
    
    // CORRECTED: Create variables from the pose object FIRST
    const { leftShoulder, leftHip, leftKnee, leftAnkle } = pose;

    if (leftShoulder.confidence > 0.2 && leftHip.confidence > 0.2 && leftKnee.confidence > 0.2 && leftAnkle.confidence > 0.2) {

      this.currentKneeAngle = this.calculateAngle(leftHip, leftKnee, leftAnkle);
      this.currentBackAngle = this.calculateAngle(leftShoulder, leftHip, leftKnee);
      
      this.history.push(this.currentKneeAngle);

      if (this.state === "down") {
        this.minKneeAngleForRep = Math.min(this.minKneeAngleForRep, this.currentKneeAngle);
        this.minBackAngleForRep = Math.min(this.minBackAngleForRep, this.currentBackAngle);
      }
      
      const currentTime = millis();
      

      if (this.currentKneeAngle < 120 && this.state === "up" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "down"; 
        this.lastStateTime = currentTime;
        this.minKneeAngleForRep = 180; 
        this.minBackAngleForRep = 180;
      }
      

      if (this.currentKneeAngle > 160 && this.state === "down" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "up"; 
        this.count++; 
        this.lastStateTime = currentTime;
        

        const repData = {
          rep_number: this.count,
          depth_angle: parseFloat(this.minKneeAngleForRep.toFixed(1)),
          lean_angle: parseFloat(this.minBackAngleForRep.toFixed(1)),
        };
        this.repsData.push(repData);
      }
    }
  },

  checkForm: function (pose) {

    if (this.currentBackAngle < 75) {
        this.feedback = "Keep your chest up!";
    } else if (this.state === "down" && this.currentKneeAngle > 100) {
      this.feedback = "Go deeper!";
    } else if (this.state === "up" && this.currentKneeAngle < 160) {
      this.feedback = "Stand up fully!";
    } else {
      this.feedback = "Good Form!";
    }
  },

  calculateAngle: function (A, B, C) {
    const BA = [A.x - B.x, A.y - B.y];
    const BC = [C.x - B.x, C.y - B.y];
    const dotProduct = BA[0] * BC[0] + BA[1] * BC[1];
    const magnitudeBA = Math.sqrt(BA[0] ** 2 + BA[1] ** 2);
    const magnitudeBC = Math.sqrt(BC[0] ** 2 + BC[1] ** 2);
    if (magnitudeBA === 0 || magnitudeBC === 0) return 0;
    const angleRad = Math.acos(Math.min(1, Math.max(-1, dotProduct / (magnitudeBA * magnitudeBC))));
    return (angleRad * 180) / Math.PI;
  },

  drawUI: function () {
    fill(255);
    stroke(0);
    strokeWeight(4);
    textAlign(LEFT, TOP);
    
    textSize(32);
    text(`Squats: ${this.count} / ${this.goal}`, 10, 30);
    

    textSize(24);
    text(`Knee Angle: ${this.currentKneeAngle.toFixed(0)}°`, 10, 70);
    text(`Back Angle: ${this.currentBackAngle.toFixed(0)}°`, 10, 100);

    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 140);
  },

  drawGraph: function () {
    if (this.history.length > 1) {
      textAlign(LEFT, CENTER); fill(150); textSize(12);
      text("180° (Up)", 20, 150); text("90° (Parallel)", 20, height / 2); text("0° (Down)", 20, height - 50);
      noFill(); stroke(0, 255, 255); strokeWeight(2);
      beginShape();
      for (let i = 0; i < this.history.length; i++) {
        const x = map(i, 0, this.history.length - 1, 80, width - 20);
        const y = map(this.history[i], 0, 180, height - 50, 150);
        vertex(x, y);
      }
      endShape();
    }
  },
};


var currentTracker = squatsTracker;