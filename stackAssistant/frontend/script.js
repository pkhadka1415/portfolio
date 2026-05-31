// Get DOM elements
const searchBtn = document.getElementById("searchBtn");
const questionInput = document.getElementById("questionInput");
const resultsDiv = document.getElementById("results");

// Track streaming state
let currentEventSource = null;

// Function to stop any ongoing stream
function stopStreaming() {
  if (currentEventSource) {
    currentEventSource.close();
    currentEventSource = null;
  }
}

// Function to render streaming answer
function renderStreamingAnswer(answerText, sources) {
  // Find or create answer container
  let answerContainer = document.getElementById("aiAnswerContainer");
  if (!answerContainer) {
    // Insert after search results
    const suggestionCard = document.querySelector(".suggestion-card");
    if (suggestionCard) {
      suggestionCard.insertAdjacentHTML('afterend', `
        <div id="aiAnswerContainer" class="ai-answer-container">
          <h2>🤖 AI-Powered Answer</h2>
          <div id="aiAnswerContent" class="ai-answer-content"></div>
          <div id="aiSourcesList" class="ai-sources"></div>
        </div>
      `);
      answerContainer = document.getElementById("aiAnswerContainer");
    }
  }
  
  const answerContent = document.getElementById("aiAnswerContent");
  const sourcesList = document.getElementById("aiSourcesList");
  
  if (answerContent && answerContent.innerHTML !== answerText) {
    answerContent.innerHTML = answerText;
  }
  
  if (sourcesList && sources.length > 0 && sourcesList.children.length === 0) {
    sourcesList.innerHTML = `
      <h3>📚 Sources</h3>
      ${sources.map(source => `
        <div class="source-item">
          <a href="${source.link}" target="_blank">${source.title}</a>
          <span class="source-score">Score: ${source.score}</span>
        </div>
      `).join('')}
    `;
  }
}

// Main search function with streaming
searchBtn.addEventListener("click", async function() {
  const query = questionInput.value.trim();
  
  if (query === "") {
    resultsDiv.innerHTML = `
      <h2>Results</h2>
      <p class="empty">Please enter a coding question.</p>
    `;
    return;
  }
  
  // Stop any existing stream
  stopStreaming();
  
  // Clear previous results
  resultsDiv.innerHTML = `
    <h2>Searching Stack Overflow...</h2>
    <p class="empty">🔍 Finding relevant threads and generating AI answer...</p>
  `;
  
  // Remove old AI container if exists
  const oldContainer = document.getElementById("aiAnswerContainer");
  if (oldContainer) oldContainer.remove();
  
  try {
    // Step 1: Search Stack Overflow (direct API call - note: will have CORS issues)
    // For production, you should route this through your backend
    const searchResponse = await fetch(
      `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow`
    );
    
    const searchData = await searchResponse.json();
    
    if (!searchData.items || searchData.items.length === 0) {
      resultsDiv.innerHTML = `
        <h2>Results</h2>
        <p class="empty">No matching Stack Overflow results found.</p>
      `;
      return;
    }
    
    const topResults = searchData.items.slice(0, 5);
    const bestResult = topResults[0];
    
    // Extract common tags
    const allTags = topResults.flatMap(item => item.tags || []);
    const tagCounts = {};
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
    const commonTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(item => item[0]);
    
    // Display Stack Overflow results
    resultsDiv.innerHTML = `
      <h2>📋 Stack Overflow Results</h2>
      
      <div class="suggestion-card">
        <h3>🏆 Top Result: ${escapeHtml(bestResult.title)}</h3>
        <div class="reason-grid">
          <div>Score: <strong>${bestResult.score}</strong></div>
          <div>Answers: <strong>${bestResult.answer_count}</strong></div>
          <div>Views: <strong>${bestResult.view_count}</strong></div>
          <div>Accepted: <strong>${bestResult.is_answered ? "✅ Yes" : "❌ No"}</strong></div>
        </div>
        <p><strong>🏷️ Common topics:</strong> ${commonTags.join(", ")}</p>
        <a href="${bestResult.link}" target="_blank" class="so-link">🔗 Open on Stack Overflow</a>
      </div>
      
      <h2>📚 Related Threads</h2>
      ${topResults.slice(1).map(item => `
        <div class="result-card">
          <h3><a href="${item.link}" target="_blank">${escapeHtml(item.title)}</a></h3>
          <div class="meta">Score: ${item.score} | Answers: ${item.answer_count} | Views: ${item.view_count}</div>
          <div class="tags">${(item.tags || []).map(tag => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
      `).join("")}
      
      <div id="aiStreamingStatus" class="streaming-status">
        <div class="loading-spinner"></div>
        <span>🤖 Generating AI answer from Stack Overflow content...</span>
      </div>
    `;
    
    // Step 2: Start SSE stream for AI answer
    // For this to work, you need a backend. Here's how you'd connect it:
    
    const backendUrl = 'http://localhost:8000/api/search'; // Your FastAPI/Express backend
    const streamUrl = `${backendUrl}?q=${encodeURIComponent(query)}`;
    
    // For DEMO without backend - show a message
    const statusDiv = document.getElementById("aiStreamingStatus");
    if (statusDiv) {
      statusDiv.innerHTML = `
        <div class="info-message">
          💡 <strong>AI Streaming Ready!</strong><br>
          To enable real AI answers, start your backend server (FastAPI/Express) 
          with Claude API integration. Then this will stream AI answers live!
        </div>
        <div class="demo-fallback">
          <h3>🎯 What the AI would tell you:</h3>
          <p>Based on the Stack Overflow threads above, the solution involves checking your code for common issues related to ${commonTags.slice(0, 3).join(", ")}.</p>
          <p><strong>Quick tip:</strong> The top-voted answer in the "Top Result" thread is your best bet for a working solution.</p>
        </div>
      `;
    }
    
    // UNCOMMENT THIS when your backend is running:
    /*
    currentEventSource = new EventSource(streamUrl);
    
    let aiAnswerText = "";
    
    currentEventSource.onmessage = function(event) {
      try {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
          case 'status':
            const statusDiv = document.getElementById("aiStreamingStatus");
            if (statusDiv) {
              statusDiv.innerHTML = `<div class="status-message">${data.message}</div>`;
            }
            break;
            
          case 'token':
            aiAnswerText += data.content;
            renderStreamingAnswer(aiAnswerText, []);
            break;
            
          case 'sources':
            renderStreamingAnswer(aiAnswerText, data.sources);
            break;
            
          case 'done':
            if (currentEventSource) {
              currentEventSource.close();
              currentEventSource = null;
            }
            const statusDiv = document.getElementById("aiStreamingStatus");
            if (statusDiv) statusDiv.remove();
            break;
            
          case 'error':
            console.error("Stream error:", data.message);
            if (currentEventSource) {
              currentEventSource.close();
              currentEventSource = null;
            }
            const errorDiv = document.getElementById("aiStreamingStatus");
            if (errorDiv) {
              errorDiv.innerHTML = `<div class="error-message">⚠️ Error: ${data.message}</div>`;
            }
            break;
        }
      } catch (e) {
        console.error("Parse error:", e);
      }
    };
    
    currentEventSource.onerror = function(error) {
      console.error("EventSource failed:", error);
      if (currentEventSource) {
        currentEventSource.close();
        currentEventSource = null;
      }
      const statusDiv = document.getElementById("aiStreamingStatus");
      if (statusDiv) {
        statusDiv.innerHTML = `
          <div class="error-message">
            ⚠️ Connection to AI backend failed. Make sure your backend is running on port 8000.
          </div>
        `;
      }
    };
    */
    
  } catch (error) {
    console.error("Error:", error);
    resultsDiv.innerHTML = `
      <h2>Results</h2>
      <p class="empty">
        ⚠️ Error: ${error.message}<br><br>
        <small>Note: For production, you need a backend proxy to avoid CORS issues.</small>
      </p>
    `;
  }
});

// Helper function to escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
  if (currentEventSource) {
    currentEventSource.close();
  }
});