const button = document.getElementById("analyzeBtn");

button.addEventListener("click", function () {

  const resume =
    document.getElementById("resumeInput").value.toLowerCase();

  const job =
    document.getElementById("jobInput").value.toLowerCase();

  const scoreText =
    document.getElementById("score");

  const feedbackText =
    document.getElementById("feedback");

  if (resume === "" || job === "") {

    scoreText.textContent = "Match Score: --%";

    feedbackText.textContent =
      "Please paste both your resume and the job description.";

    return;
  }

  const keywords = [
    "python",
    "javascript",
    "java",
    "c++",
    "html",
    "css",
    "git",
    "github",
    "api",
    "sql",
    "react",
    "node",
    "data structures",
    "object-oriented",
    "problem solving",
    "ai",
    "machine learning"
  ];

  let matched = [];

  keywords.forEach((keyword) => {

    if (
      resume.includes(keyword) &&
      job.includes(keyword)
    ) {

      matched.push(keyword);

    }

  });

  const score =
    Math.min(95, matched.length * 8 + 25);

  scoreText.textContent =
    `Match Score: ${score}%`;

  feedbackText.innerHTML = `
    <strong>Matched Keywords:</strong>
    ${matched.length > 0
      ? matched.join(", ")
      : "No strong matches found."}

    <br><br>

    <strong>Suggestion:</strong>
    Add more skills and technologies mentioned in the job description.
  `;
});