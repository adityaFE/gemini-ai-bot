const TEST_MODE = false; // Set to true to enable test mode

//hardcoding some random sentences
const testResponse= `
This home office setup aims for functionality and comfort under a $1000 budget. Prices are estimates and may vary based on sales and location.

I. Essential Items (approx. $600 - $700):

* Desk ($150 - $250): A sturdy desk is crucial. Consider:
* Standing desk converter: ($100-$150) Allows you to switch between sitting and standing, promoting better posture and health. This is a great investment if you plan to use your home office frequently. Alternatively, a simple, but sturdy, desk from IKEA or a similar retailer can suffice.
* Traditional desk: ($50-$150) Look for a simple, rectangular desk with ample surface area.

* Chair ($150 - $250): Invest in a comfortable chair to prevent back pain. Look for ergonomic features like lumbar support and adjustable height. Consider a used office chair from sites like Facebook Marketplace or Craigslist for potential savings.

* Computer (if needed, $200 - $400): If you don't already have a suitable laptop or desktop, this is a significant portion of the budget. Consider refurbished options or looking for sales to stay within budget.

* Monitor (if needed, $100 - $150): A second monitor significantly improves productivity. A 24-inch monitor is a good starting point. Again, consider refurbished options or sales to save money.

II. Important Accessories (approx. $100 - $200):

* Keyboard and Mouse ($30 - $50): Choose a comfortable keyboard and mouse. Ergonomic options are beneficial for long hours of work.
* Headset ($30 - $50): Essential for calls and online meetings. A decent USB headset will suffice.
* Webcam ($20 - $40): If your laptop doesn't have a good built-in webcam, this is necessary for video calls.
* Lighting ($20 - $40): A good desk lamp is crucial for reducing eye strain. Consider a LED desk lamp for energy efficiency.

III. Optional but Recommended Items (approx. $100 - $200):

* Printer/Scanner (if needed, $50 - $100): An all-in-one printer/scanner can be very useful, but not strictly necessary if you rarely need to print.
* Surge Protector ($10 - $20): Protects your electronics from power surges.
* Filing Cabinet/Storage ($30 - $80): Keeps your workspace organized. Repurpose existing items to save costs.


Budget Breakdown Example:

* Desk: $100 (IKEA)
* Chair: $150 (Used, good condition)
* Monitor: $120 (Refurbished)
* Keyboard & Mouse: $40
* Headset: $30
* Webcam: $20
* Desk Lamp: $30
* Surge Protector: $10
* Total: $600

This leaves you with $400 for a computer (if needed), a printer/scanner (if needed), or other accessories like a document holder, extra storage, or to upgrade certain items to higher quality.


Tips for Staying Within Budget:

* Shop around: Compare prices from different retailers, both online and offline.
* Look for sales and discounts: Check for deals on Black Friday, Cyber Monday, or other holiday sales.
* Consider refurbished or used items: You can often find excellent deals on gently used office furniture and electronics.
* Prioritize your needs: Focus on the essential items first, and then add optional items as your budget allows.
* DIY: You can save money by building your own desk or creating your own storage solutions.


Remember, this is a sample budget and you can adjust it based on your specific needs and preferences. The key is to prioritize functionality and comfort while staying within your budget.
`
const container = document.querySelector(".container");
const chatsContainer = document.querySelector(".chats-container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileInput = promptForm.querySelector("#file-input");
const fileUploadWrapper = promptForm.querySelector(".file-upload-wrapper");
const themeToggle = document.querySelector("#theme-toggle-btn");

const apiKeyInput = document.querySelector("#api-key-input");
const submitApiKey = document.querySelector("#api-key-submit");
const warningMessage = document.querySelector("#warning-message");
let API_KEY = "";
let API_URL = "";
let scrollAutomatically = true;

submitApiKey.addEventListener("click", () => {
  API_KEY = apiKeyInput.value.trim();
  if (!API_KEY) {
    warningMessage.style.display = "block";
    return;
  }

  warningMessage.style.display = "none";
  API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

  if (confirm(`Your API key is: ${API_KEY}. Do you want to proceed?`)) {
    document.querySelector("#api-key-entry").style.display = "none";
    container.style.display = "block";
  }
});

let typingInterval, controller;
const chatHistory = [];
const userData = { message: "", file: {} };

const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

const scrollToBottom = () => {
  const chatsContainer = document.querySelector(".chats-container");
  ["wheel", "touchstart", "touchmove", "touchend"].forEach((eventType) => {
    chatsContainer.addEventListener(eventType, () => {
      scrollAutomatically = false;
    });
  });

  if (scrollAutomatically) {
    container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }
};

const typingEffect = (text, textElement, botMsgDiv) => {
  scrollAutomatically = true;
  textElement.textContent = "";
  const words = text.split(" ");
  let wordIndex = 0;
  typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent += (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      botMsgDiv.classList.remove("loading");
      document.body.classList.add("bot-responding");
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      botMsgDiv.classList.remove("loading");
      document.body.classList.remove("bot-responding");
    }
  }, 40);
};

const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  controller = new AbortController();

  if (TEST_MODE) {
    // hardcoded test responses
    const testResponses = [
      testResponse,
      testResponse,
      testResponse,
      testResponse,
    ];
    const responseText = testResponses[Math.floor(Math.random() * testResponses.length)];
    
    setTimeout(() => {
      typingEffect(responseText, textElement, botMsgDiv);
    }, 1000);
    
    return;
  }

  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(userData.file),
            },
          ]
        : []),
    ],
  });

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
      signal: controller.signal,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    const responseText = data.candidates[0].content.parts[0].text.replace(/\*\*([^*]+)\*\*/g, "$1").trim();
    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });
  } catch (error) {
    textElement.style.color = "#d62939";
    textElement.textContent =
      error.name === "AbortError"
        ? "Request cancelled"
        : error.message + " Please refresh the page to re-enter the API KEY or try again later.";
    botMsgDiv.classList.remove("loading");
    document.body.classList.remove("bot-responding");
    scrollToBottom();
  } finally {
    userData.file = {};
  }
};

const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();

  if (!userMessage || document.body.classList.contains("bot-responding")) return;

  promptInput.value = "";
  userData.message = userMessage;
  document.body.classList.add("bot-responding", "chats-active");
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

  const userMsgHTML = `
    <p class="message-text"></p>
    ${
      userData.file.data
        ? userData.file.isImage
          ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
          : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`
        : ""
    }
  `;

  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);

  scrollAutomatically = true;
  scrollToBottom();

  setTimeout(() => {
    const botMsgHTML = `
      <div class="image-wrapper">
        <img src="gemini.svg" alt="gemini logo" class="avatar">
      </div>
      <div class="message-text-wrapper">
        <p class="message-text">Just a sec .....</p>
      </div>
    `;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    
    scrollToBottom();  
    generateResponse(botMsgDiv);
  }, 1000);
};

fileInput.addEventListener('change', (e) => {
  const file = fileInput.files[0]
  if (!file) return

  const isImage = file.type.startsWith('image/')
  const reader = new FileReader()
  reader.readAsDataURL(file)

  reader.onload = () => {
    fileInput.value = ""
    const base64String = reader.result.split(",")[1]
    fileUploadWrapper.querySelector('.file-preview').src = reader.result
    fileUploadWrapper.classList.add('active', isImage ? 'img-attached' : 'file-attached')

    userData.file = {fileName: file.name, data: base64String, mime_type: file.type, isImage}
  }
})

document.querySelector("#cancel-file-btn").addEventListener('click', () => {
  userData.file = {}
  fileUploadWrapper.classList.remove('active', 'img-attached', 'file-attached')
})

document.querySelector("#stop-response-btn").addEventListener('click', () => {
  userData.file = {}
  controller?.abort()
  clearInterval(typingInterval)
  const loadingBotMsg = chatsContainer.querySelector(".bot-message.loading");
  if (loadingBotMsg) {
    loadingBotMsg.classList.remove('loading');
  }

  document.body.classList.remove("bot-responding");
})

document.querySelector("#delete-chats-btn").addEventListener('click', () => {
  chatHistory.length = 0
  chatsContainer.innerHTML = ""
  document.body.classList.remove("bot-responding", "chats-active")
})

document.querySelectorAll(".suggestions-item").forEach(item => {
  item.addEventListener('click', () => {
    promptInput.value = item.querySelector(".text").textContent
    promptForm.dispatchEvent(new Event('submit'))
  })
})

document.addEventListener('click', ({target}) => {
  const wrapper = document.querySelector('.prompt-wrapper')
  const shouldHide = target.classList.contains('prompt-input') || (wrapper.classList.contains('hide-controls') &&
    (target.id === 'add-file-btn' || target.id === 'stop-response-btn'))
  wrapper.classList.toggle('hide-controls', shouldHide)
})

themeToggle.addEventListener('click', () => {
  const isLightTheme = document.body.classList.toggle('light-theme')
  localStorage.setItem("themeColor", isLightTheme ? "light_mode" : "dark_mode")
  themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode"
})

const isLightTheme = localStorage.getItem("themeColor") === "light_mode"
document.body.classList.toggle('light-theme', isLightTheme)
themeToggle.textContent = isLightTheme ? "dark_mode" : "light_mode"

promptForm.addEventListener('submit', handleFormSubmit)
promptForm.querySelector('#add-file-btn').addEventListener('click', () => fileInput.click())
