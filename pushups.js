// pushups.js

/* const pushupsTracker = {
  name: "Push-ups",
  goal: 0, count: 0, state: "up", history: [],
  feedback: "Get into a plank position!", lastStateTime: 0, debounce: 500, repsData: [],
  currentAngle: 180, minAngleForRep: 180, maxAngleForRep: 0,

  currentElbowAngle: 180,
  currentBodyAngle: 180,
  minElbowAngleForRep: 180, // For depth
  minBodyAngleForRep: 180,  // For body alignment
  repStartTime: 0,          // For tempo

  setGoal: function (g) { this.goal = parseInt(g); this.reset(); },
  
  reset: function () {
    this.count = 0; this.history = []; this.repsData = [];
    this.feedback = "Get into a plank position!"; this.state = "up";
    this.currentAngle = 180; this.lastStateTime = 0;
    this.currentElbowAngle = 180; this.currentBodyAngle = 180;
    this.lastStateTime = 0;
  },

  detect: function (pose) {
    // Safety check for all needed keypoints
    if (!pose.leftElbow || !pose.rightElbow || !pose.leftShoulder || !pose.rightShoulder || !pose.leftWrist || !pose.rightWrist) {
      console.warn("Tracker waiting for arm keypoints.");
      return;
    }
    
    const { leftShoulder, leftElbow, leftWrist, rightShoulder, rightElbow, rightWrist } = pose;

    if (leftElbow.confidence > 0.2 && rightElbow.confidence > 0.2 && leftShoulder.confidence > 0.2 && rightShoulder.confidence > 0.2) {
      // Calculate the angle for both elbows and average them
      const leftAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      this.currentAngle = (leftAngle + rightAngle) / 2;
      this.history.push(this.currentAngle);

      if (this.state === "down") {
        this.minAngleForRep = Math.min(this.minAngleForRep, this.currentAngle);
        this.maxAngleForRep = Math.max(this.maxAngleForRep, this.currentAngle);
      }
      
      const currentTime = millis();
      
      // State change to DOWN (arms bent)
      if (this.currentAngle < 100 && this.state === "up" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "down"; 
        this.lastStateTime = currentTime;
        this.minAngleForRep = 180;
        this.maxAngleForRep = 0;
      }
      
      // State change to UP (arms straight, rep completion)
      if (this.currentAngle > 160 && this.state === "down" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "up"; 
        this.count++; 
        this.lastStateTime = currentTime;
        
        const repData = {
          rep_number: this.count,
          bottom_angle: parseFloat(this.minAngleForRep.toFixed(1)), // How low you went
          top_angle: parseFloat(this.maxAngleForRep.toFixed(1)),    // How straight your arms were
        };
        this.repsData.push(repData);
      }
    }
  },

  checkForm: function (pose) {
    // Check if the body is straight by measuring the hip angle
    if (pose.leftShoulder && pose.leftHip && pose.leftAnkle) {
        const hipAngle = this.calculateAngle(pose.leftShoulder, pose.leftHip, pose.leftAnkle);
        if (hipAngle < 160) {
            this.feedback = "Keep your body straight!";
        } else {
            this.feedback = "Good Form!";
        }
    }
    else if(this.state === "down" && curre)
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

  drawUI: function () {
    fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP); textSize(32);
    text(`Pushups: ${this.count} / ${this.goal}`, 10, 30);
    text(`Angle: ${this.currentAngle.toFixed(0)}°`, 10, 70);
    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 110);
  },

  drawGraph: function () {
    if (this.history.length > 1) {
      textAlign(LEFT, CENTER); fill(150); textSize(12);
      text("180°", 20, 150); text("90°", 20, height / 2); text("0°", 20, height - 50);
      noFill(); stroke(0, 255, 255); strokeWeight(2);
      beginShape();
      for (let i = 0; i < this.history.length; i++) {
        const x = map(i, 0, this.history.length - 1, 60, width - 20);
        const y = map(this.history[i], 0, 180, height - 50, 150);
        vertex(x, y);
      }
      endShape();
    }
  },
};
// This line makes the tracker available to the main sketch.js file
var currentTracker = pushupsTracker; */

const pushupsTracker = {
  name: "Push-ups", userContext: "",
  goal: 0, count: 0, state: "up", history: [],
  feedback: "Get into a plank position!", lastStateTime: 0, debounce: 500, repsData: [],
  
  currentElbowAngle: 180,
  currentBodyAngle: 180,
  minElbowAngleForRep: 180, 
  minBodyAngleForRep: 180,  
  repStartTime: 0,          

  setGoal: function (g) { this.goal = parseInt(g); this.reset(); },
  
  reset: function () {
    this.count = 0; this.history = []; this.repsData = [];
    this.feedback = "Get into a plank position!"; this.state = "up";
    this.currentElbowAngle = 180; this.currentBodyAngle = 180;
    this.lastStateTime = 0;
  },

  generateAnalysis: function () {
    if (this.repsData.length === 0) {
      return {
        summary: "No reps were completed.",
        recommendation: "Try to complete at least one rep to get an analysis."
      };
    }

    let totalDepth = 0, totalAlignment = 0;
    let worstAlignmentRep = { body_alignment_angle: 180 };

    for (const rep of this.repsData) {
      totalDepth += rep.depth_angle;
      totalAlignment += rep.body_alignment_angle;
      if (rep.body_alignment_angle < worstAlignmentRep.body_alignment_angle) worstAlignmentRep = rep;
    }

    const avgDepth = totalDepth / this.repsData.length;
    const avgAlignment = totalAlignment / this.repsData.length;

    let summary = `Your average depth was ${avgDepth.toFixed(1)}° and average body alignment was ${avgAlignment.toFixed(1)}°.`;
    let recommendation = "";

    if (avgAlignment < 160) {
      recommendation = `Your top priority is body alignment. Your hips sagged significantly on rep #${worstAlignmentRep.rep_number} (${worstAlignmentRep.body_alignment_angle}°). Brace your core and glutes to keep a straight line from shoulders to ankles.`;
    } else if (avgDepth > 100) {
      recommendation = `Great alignment! Your next step is to increase your depth. Focus on lowering your chest until your elbows reach a 90° angle.`;
    } else {
      recommendation = `Excellent form! Your push-ups show great depth and a solid, straight body line. Great work.`;
    }
    return { summary, recommendation };
  },
  
  detect: function (pose) {

    if (!pose.leftElbow || !pose.rightElbow || !pose.leftShoulder || !pose.rightShoulder || !pose.leftWrist || !pose.rightWrist || !pose.leftHip || !pose.leftAnkle) {
      console.warn("Tracker waiting for all keypoints.");
      return;
    }
    
    const { leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, leftAnkle } = pose;

    if (leftElbow.confidence > 0.2 && rightElbow.confidence > 0.2 && leftShoulder.confidence > 0.2 && leftHip.confidence > 0.2 && leftAnkle.confidence > 0.2) {

      const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
      const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
      this.currentElbowAngle = (leftElbowAngle + rightElbowAngle) / 2;
      this.currentBodyAngle = this.calculateAngle(leftShoulder, leftHip, leftAnkle); 
      
      this.history.push(this.currentElbowAngle);


      if (this.state === "down") {
        this.minElbowAngleForRep = Math.min(this.minElbowAngleForRep, this.currentElbowAngle);
        this.minBodyAngleForRep = Math.min(this.minBodyAngleForRep, this.currentBodyAngle);
      }
      
      const currentTime = millis();
      

      if (this.currentElbowAngle < 110 && this.state === "up" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "down"; 
        this.lastStateTime = currentTime;
        this.minElbowAngleForRep = 180;
        this.minBodyAngleForRep = 180;
      }
      

      if (this.currentElbowAngle > 130 && this.state === "down" && currentTime - this.lastStateTime > this.debounce) {
        this.state = "up"; 
        this.count++; 
        

        const repDuration = (currentTime - this.lastStateTime) / 1000; 
        this.lastStateTime = currentTime;
        

        const repData = {
          rep_number: this.count,
          depth_angle: parseFloat(this.minElbowAngleForRep.toFixed(1)),
          body_alignment_angle: parseFloat(this.minBodyAngleForRep.toFixed(1)),
          rep_duration_seconds: parseFloat(repDuration.toFixed(2)),
        };
        this.repsData.push(repData);
      }
    }
  },


  checkForm: function () {
    if (this.currentBodyAngle < 140) {
      this.feedback = "Keep your body straight!";
    } else if (this.state === "down" && this.currentElbowAngle > 100) {
      this.feedback = "Go lower!";
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
    fill(255); stroke(0); strokeWeight(4); textAlign(LEFT, TOP);
    textSize(32);
    text(`Push-ups: ${this.count} / ${this.goal}`, 10, 30);
    
    textSize(24);
    text(`Elbow Angle: ${this.currentElbowAngle.toFixed(0)}°`, 10, 70);
    text(`Body Angle: ${this.currentBodyAngle.toFixed(0)}°`, 10, 100);

    textSize(28);
    fill(this.feedback.includes("Good") ? [0, 255, 0] : [255, 0, 0]);
    text(`Form: ${this.feedback}`, 10, 140);
  },

  drawGraph: function () {
    if (this.history.length > 1) {
      textAlign(LEFT, CENTER); fill(150); textSize(12);
      text("180°", 20, 150); text("90°", 20, height / 2); text("0°", 20, height - 50);
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

var currentTracker = pushupsTracker;