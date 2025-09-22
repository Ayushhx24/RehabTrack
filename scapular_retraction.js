// scapular_retraction.js

const scapularRetractionTracker = {
  name: "Scapular Retraction",
  goal: 0,
  count: 0,
  state: "forward", // Can be 'forward' or 'back'
  history: [],
  currentAngle: 0,
  feedback: "Begin the rowing motion.",
  lastStateTime: 0,
  debounce: 500,
  repsData: [],

  setGoal: function (g) {
    this.goal = parseInt(g);
    this.reset();
  },

  reset: function () {
    this.count = 0;
    this.history = [];
    this.repsData = [];
    this.feedback = "Begin the rowing motion.";
    this.state = "forward";
    this.currentAngle = 0;
    this.lastStateTime = 0;
  },

  // This function generates a basic summary. It can be enhanced later.
  generateAnalysis: function () {
    if (this.repsData.length < 2) {
      return {
        summary: "Not enough reps were completed for a detailed analysis.",
        recommendation: "Try to complete at least 2 reps to get an analysis."
      };
    }
    let totalMaxAngle = 0;
    for (const rep of this.repsData) {
      totalMaxAngle += rep.max_angle;
    }
    const avgMaxAngle = totalMaxAngle / this.repsData.length;
    const summary = `Your average peak retraction was ${avgMaxAngle.toFixed(1)}°.`;
    let recommendation = "Focus on pulling your shoulder blades together at the peak of the movement.";
    if (avgMaxAngle < 45) {
        recommendation = "Good work on the retraction! Try to pull back even further to maximize engagement."
    }
    return { summary, recommendation };
  },

/*   detect: function (pose) {
    const { leftShoulder, leftElbow, leftWrist } = pose;

    if (leftShoulder.confidence > 0.3 && leftElbow.confidence > 0.3 && leftWrist.confidence > 0.3) {
      // We are measuring the angle at the shoulder to see how far the arm is pulled back
      // We create a "virtual" point straight down from the shoulder to measure against
      const shoulderPoint = { x: leftShoulder.x, y: leftShoulder.y };
      const downPoint = { x: leftShoulder.x, y: leftShoulder.y + 100 }; // A point directly below the shoulder
      const elbowPoint = { x: leftElbow.x, y: leftElbow.y };

      this.currentAngle = this.calculateAngle(downPoint, shoulderPoint, elbowPoint);
      this.history.push(this.currentAngle);

      const currentTime = millis();

      // State change to 'back' (Rep completion)
      if (this.currentAngle < 60 && this.state === "forward" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "back";
        this.count++;
        this.lastStateTime = currentTime;
        this.repsData.push({ rep_number: this.count, max_angle: this.currentAngle });
      }

      // State change to 'forward' (Reset for next rep)
      if (this.currentAngle > 80 && this.state === "back" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "forward";
        this.lastStateTime = currentTime;
      }
    }
  },

  checkForm: function (pose) {
    if (this.state === 'forward' && this.currentAngle < 80) {
        this.feedback = "Pull back further!";
    } else {
        this.feedback = "Good Form!";
    }
  }, */

  detect: function (pose) {
    const { leftShoulder, leftElbow } = pose;

    if (leftShoulder.confidence > 0.3 && leftElbow.confidence > 0.3) {
      // We create a "virtual" point straight down from the shoulder to measure against
      const shoulderPoint = { x: leftShoulder.x, y: leftShoulder.y };
      const downPoint = { x: leftShoulder.x, y: leftShoulder.y + 100 };
      const elbowPoint = { x: leftElbow.x, y: leftElbow.y };

      // This angle gets LARGER as the user pulls their elbow back
      this.currentAngle = this.calculateAngle(downPoint, shoulderPoint, elbowPoint);
      this.history.push(this.currentAngle);

      const currentTime = millis();

      // State change to 'back' when the arm is pulled back (angle is large)
      if (this.currentAngle > 70 && this.state === "forward" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "back";
        this.count++;
        this.lastStateTime = currentTime;
        this.repsData.push({ rep_number: this.count, max_angle: this.currentAngle });
      }

      // State change to 'forward' when the arm returns to the start (angle is small)
      if (this.currentAngle < 40 && this.state === "back" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "forward";
        this.lastStateTime = currentTime;
      }
    }
},

checkForm: function (pose) {
    if (this.state === 'forward' && this.currentAngle > 50) {
        this.feedback = "Pull back further!";
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
    if (magnitudeBA === 0 || magnitudeBC === 0) return 180;
    const angleRad = Math.acos(Math.min(1, Math.max(-1, dotProduct / (magnitudeBA * magnitudeBC))));
    return (angleRad * 180) / Math.PI;
  },

  drawUI: function () {
    fill(255);
    stroke(0);
    strokeWeight(4);
    textAlign(LEFT, TOP);
    textSize(32);
    text(`Rows: ${this.count} / ${this.goal}`, 10, 30);
    text(`Angle: ${this.currentAngle.toFixed(0)}°`, 10, 70);
    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 110);
  },
};

var currentTracker = scapularRetractionTracker;