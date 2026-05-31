const hiddenElements = document.querySelectorAll(".hidden");

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {

    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    }

  });
});

hiddenElements.forEach((el) => observer.observe(el));

function sendMessage() {
  const input = document.getElementById("userInput");
  const chatBody = document.getElementById("chatBody");
  const userText = input.value.trim();

  if (userText === "") return;

  chatBody.innerHTML += `<div class="user-message">${userText}</div>`;

  let reply = getBotReply(userText.toLowerCase());

  setTimeout(() => {
    chatBody.innerHTML += `<div class="bot-message">${reply}</div>`;
    chatBody.scrollTop = chatBody.scrollHeight;
  }, 500);

  input.value = "";
}

function getBotReply(message) {
  if (message.includes("hi") || message.includes("hello")) {
    return "Hi! I’m Prakash’s portfolio assistant. Ask me about his skills, projects, or contact info.";
  }

  if (message.includes("skill")) {
    return "Prakash works with HTML, CSS, JavaScript, Python, Java, C++, GitHub, and AI tools.";
  }

  if (message.includes("project")) {
    return "Prakash is building projects like an AI PDF Assistant, AI Resume Analyzer, and Student Productivity App.";
  }

  if (message.includes("contact") || message.includes("email")) {
    return "You can contact Prakash through the contact section below or by email.";
  }

  if (message.includes("internship") || message.includes("hire")) {
    return "Yes, Prakash is open to internships, software engineering roles, and AI-related opportunities.";
  }

  if (message.includes("resume")) {
    return "You can find Prakash’s resume from the portfolio once the resume button is added.";
  }

  return "I can answer questions about Prakash’s skills, projects, resume, contact, or internship availability.";
}

const inputField = document.getElementById("userInput");

inputField.addEventListener("keypress", function(event) {

  if (event.key === "Enter") {
    sendMessage();
  }

});

function toggleChat() {

  const chatbot = document.getElementById("chatbot");

  if (chatbot.style.display === "block") {
    chatbot.style.display = "none";
  }

  else {
    chatbot.style.display = "block";
  }

}