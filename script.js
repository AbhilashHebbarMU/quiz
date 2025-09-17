document.addEventListener("DOMContentLoaded", () => {
  const userDetailsForm = document.getElementById("userDetailsForm");
  const quizOverlay = document.getElementById("quizOverlay");
  const quizContainer = document.getElementById("quizContainer");
  const quizQuestion = document.getElementById("quizQuestion");
  const quizOptions = document.getElementById("quizOptions");
  const quizFeedback = document.getElementById("quizFeedback");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const progressFill = document.getElementById("progressFill");
  const timerSpan = document.getElementById("timer");
  const scoreContainer = document.getElementById("scoreContainer");
  const scoreSpan = document.getElementById("score");
  const scoreDetails = document.getElementById("scoreDetails");
  const downloadCertificateBtn = document.getElementById("downloadCertificateBtn");
  const restartQuizBtn = document.getElementById("restartQuizBtn");
  const pageHeader = document.getElementById("pageHeader");

  const soundClick = new Audio("sounds/click.mp3");
  const soundCorrect = new Audio("sounds/correct.mp3");
  const soundIncorrect = new Audio("sounds/incorrect.mp3");

  function playSound(sound) {
    sound.currentTime = 0;
    sound.play().catch(() => {});
  }

  let quizData = [];
  let currentQuestionIndex = 0;
  let score = 0;
  let timerId = null;
  let timeLeft = 15;
  const totalQuestions = 10;
  let userDetails = {};
  const selectedCategory = localStorage.getItem("selectedCategory") || "9";

  userDetailsForm.addEventListener("submit", e => {
    e.preventDefault();

    userDetails = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      age: document.getElementById("age").value.trim(),
      school: document.getElementById("school").value.trim(),
      difficulty: userDetailsForm.difficulty.value,
    };

    if (!userDetails.name || !userDetails.email || !userDetails.difficulty) {
      alert("Please complete all required fields.");
      return;
    }

    if (pageHeader) {
      pageHeader.classList.add("hide");
    }
    userDetailsForm.style.display = "none";
    quizOverlay.classList.remove("hidden");
    quizContainer.style.display = "flex";
    document.body.style.background = "#fff";
    fetchQuizQuestions(selectedCategory, userDetails.difficulty);
  });

  function fetchQuizQuestions(categoryId, difficulty) {
    const url = `https://opentdb.com/api.php?amount=${totalQuestions}&category=${categoryId}&difficulty=${difficulty}&type=multiple&encode=url3986`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        quizData = data.results.map(q => {
          const correct = decodeURIComponent(q.correct_answer);
          const incorrect = q.incorrect_answers.map(ans => decodeURIComponent(ans));
          const options = shuffleArray([...incorrect, correct]);
          return {
            question: decodeURIComponent(q.question),
            options: options,
            answer: options.indexOf(correct),
            explanation: "Explanation not available.",
          };
        });
        currentQuestionIndex = 0;
        score = 0;
        showQuiz();
        showQuestion();
      })
      .catch(() => {
        alert("Failed to load quiz questions.");
        userDetailsForm.style.display = "block";
        quizOverlay.classList.add("hidden");
        quizContainer.style.display = "none";
        if (pageHeader) pageHeader.classList.remove("hide");
      });
  }

  function showQuiz() {
    scoreContainer.style.display = "none";
    quizOverlay.classList.remove("hidden");
    quizContainer.style.display = "flex";
  }

  function showQuestion() {
    clearInterval(timerId);
    timeLeft = 15;
    timerSpan.textContent = `Time left: ${timeLeft}s`;
    timerId = setInterval(() => {
      timeLeft--;
      timerSpan.textContent = `Time left: ${timeLeft}s`;
      if (timeLeft <= 0) {
        clearInterval(timerId);
        showAnswer(-1);
      }
    }, 1000);

    const q = quizData[currentQuestionIndex];
    quizQuestion.textContent = `Q${currentQuestionIndex + 1}: ${q.question}`;
    quizQuestion.style.opacity = 0;
    quizOptions.innerHTML = "";
    quizFeedback.innerHTML = "";
    nextQuestionBtn.disabled = true;

    fadeIn(quizQuestion);

    q.options.forEach((text, i) => {
      const option = document.createElement("div");
      option.className = "option";
      option.textContent = text;
      option.style.opacity = 0;
      option.style.transition = `opacity 0.4s ease ${i * 0.15}s`;
      option.addEventListener("click", () => {
        playSound(soundClick);
        showAnswer(i);
      });
      quizOptions.appendChild(option);
      setTimeout(() => option.style.opacity = 1, i * 150);
    });

    updateProgressBar();
  }

  function showAnswer(selectedIndex) {
    clearInterval(timerId);
    const q = quizData[currentQuestionIndex];
    const options = quizOptions.children;
    for (let opt of options) {
      opt.style.pointerEvents = "none";
    }

    for (let i = 0; i < options.length; i++) {
      options[i].classList.remove("option-correct", "option-incorrect");
      if (i === q.answer) options[i].classList.add("option-correct");
      if (selectedIndex === i && selectedIndex !== q.answer)
        options[i].classList.add("option-incorrect");
    }

    let message;
    if (selectedIndex === q.answer) {
      message = "🎉 Correct!";
      score++;
      playSound(soundCorrect);
    } else if (selectedIndex === -1) {
      message = "⏰ Time's up!";
    } else {
      message = `❌ Incorrect! The correct answer is: ${q.options[q.answer]}`;
      playSound(soundIncorrect);
    }

    showFeedback(message, q.explanation);
    nextQuestionBtn.disabled = false;
  }

  function showFeedback(message, explanation) {
    quizFeedback.innerHTML = "";
    const msgDiv = document.createElement("div");
    msgDiv.className = message.startsWith("🎉") ? "feedback correct" : "feedback incorrect";
    msgDiv.textContent = message;
    quizFeedback.appendChild(msgDiv);

    if (explanation) {
      const explDiv = document.createElement("div");
      explDiv.className = "feedback-explanation";
      explDiv.textContent = explanation;
      quizFeedback.appendChild(explDiv);
    }
  }

  nextQuestionBtn.addEventListener("click", () => {
    currentQuestionIndex++;
    if (currentQuestionIndex < totalQuestions) {
      showQuestion();
    } else {
      showScoreScreen();
    }
  });

  function updateProgressBar() {
    const percent = (currentQuestionIndex / totalQuestions) * 100;
    progressFill.style.width = `${percent}%`;
  }

  function showScoreScreen() {
    quizOverlay.classList.add("hidden");
    quizContainer.style.display = "none";
    scoreContainer.style.display = "flex";

    scoreSpan.textContent = `${score} / ${totalQuestions}`;

    const percentage = Math.round((score / totalQuestions) * 100);
    let performance, grade;
    if (percentage >= 90) {
      performance = "Outstanding!";
      grade = "A";
    } else if (percentage >= 80) {
      performance = "Excellent!";
      grade = "A";
    } else if (percentage >= 70) {
      performance = "Good job!";
      grade = "B";
    } else if (percentage >= 60) {
      performance = "Not bad!";
      grade = "C";
    } else {
      performance = "Keep practicing!";
      grade = "D";
    }
    scoreDetails.innerHTML = `
      <p>${performance}</p>
      <p>Grade: ${grade}</p>
      <p>Percentage: ${percentage}%</p>
      <p>Name: ${userDetails.name}</p>
      <p>Email: ${userDetails.email}</p>
      <p>Phone: ${userDetails.phone}</p>
      <p>Age: ${userDetails.age}</p>
      <p>School/College: ${userDetails.school}</p>
      <p>Category (ID): ${selectedCategory}</p>
      <p>Difficulty: ${userDetails.difficulty}</p>
    `;
    downloadCertificateBtn.style.display = "inline-block";
  }

  downloadCertificateBtn.addEventListener("click", () => {
    generateCertificate();
  });

  restartQuizBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  function generateCertificate() {
    const percentage = Math.round((score / totalQuestions) * 100);
    let grade = "";
    if (percentage >= 90) grade = "A";
    else if (percentage >= 80) grade = "A";
    else if (percentage >= 70) grade = "B";
    else if (percentage >= 60) grade = "C";
    else grade = "D";

    const certificateHTML = `
      <!DOCTYPE html>
      <html lang="en">
      <head><meta charset="UTF-8"><title>Certificate</title>
        <style>
          body { font-family: Arial, sans-serif; background:#667eea; color: white; text-align: center; padding: 5rem; }
          .certificate { background-color: white; color: #333; padding: 3rem; border-radius: 15px; max-width: 600px; margin: auto; }
          h1 { font-size: 2.5rem; margin-bottom: 1rem; }
          p { font-size: 1.2rem; }
          .grade { font-weight: bold; font-size: 1.5rem; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Certificate of Completion</h1>
          <p>Congratulations, <strong>${userDetails.name}</strong>!</p>
          <p>You completed the quiz with a grade of <span class="grade">${grade}</span></p>
          <p>Percentage Score: <strong>${percentage}%</strong></p>
          <p>Email: ${userDetails.email}</p>
          <p>Phone: ${userDetails.phone}</p>
          <p>Age: ${userDetails.age}</p>
          <p>School/College: ${userDetails.school}</p>
          <p>Category ID: ${selectedCategory}</p>
          <p>Difficulty: ${userDetails.difficulty}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([certificateHTML], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Certificate_${userDetails.name}_${new Date().toISOString().split("T")[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function fadeIn(element) {
    element.style.opacity = 0;
    element.style.transition = "opacity 0.4s ease";
    requestAnimationFrame(() => {
      element.style.opacity = 1;
    });
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
});
