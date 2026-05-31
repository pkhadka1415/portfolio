const askBtn = document.getElementById("askBtn");

askBtn.addEventListener("click", function () {
  const documentText = document.getElementById("documentInput").value.trim();
  const question = document.getElementById("questionInput").value.trim();
  const answerText = document.getElementById("answerText");

  if (documentText === "" || question === "") {
    answerText.textContent = "Please paste a document and ask a question.";
    return;
  }

  const answer = findBestAnswer(documentText, question);
  answerText.innerHTML = answer;
});

function findBestAnswer(documentText, question) {
  const chunks = documentText
    .split(/\n|\.|\?|!/)
    .map(chunk => chunk.replace(/\s+/g, " ").trim())
    .filter(chunk => chunk.length > 25);

  const stopWords = [
    "what", "when", "where", "who", "why", "how",
    "this", "that", "does", "with", "from", "about",
    "document", "tell", "give", "show", "me", "the",
    "and", "for", "are", "was", "were", "has", "have",
    "is", "to", "of", "in", "on", "a", "an"
  ];

  const questionWords = question
    .toLowerCase()
    .replace(/[^\w\s+#]/g, "")
    .split(/\s+/)
    .filter(word => word.length > 2);

const normalizedWords = questionWords.map(word => {
  if (word.endsWith("s")) {
    return word.slice(0, -1);
  }

  return word;
});



  if (
    question.toLowerCase().includes("summary") ||
    question.toLowerCase().includes("about")
  ) {
    const overview = chunks.slice(0, 3).map(chunk => `• ${chunk}`).join("<br><br>");

    return `
      <strong>Document overview:</strong><br><br>
      ${overview}
    `;
  }

  let bestMatches = [];

  chunks.forEach(chunk => {
    let score = 0;
    const lowerChunk = chunk.toLowerCase();

    normalizedWords.forEach(word => {
      if (lowerChunk.includes(word)) {
        score += 2;
      }
    });

    if (score > 0) {
      bestMatches.push({ chunk, score });
    }
  });

  bestMatches.sort((a, b) => b.score - a.score);

  if (bestMatches.length === 0) {
    return `
      <strong>I could not find a direct match.</strong><br><br>
      Try asking with specific words from the document, like a company name, technology, project name, topic, or section title.
    `;
  }

  const topAnswers = bestMatches
    .slice(0, 3)
    .map(match => `• ${match.chunk}`)
    .join("<br><br>");

  return `
    <strong>Best answer found:</strong><br><br>
    ${topAnswers}
  `;
}