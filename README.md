# LeetCode AI Agent 🤖

A powerful Chrome Extension that acts as your personal AI coding tutor directly within LeetCode. It helps you understand problems, visualize algorithms, and check your logic without just giving you the answer—unless verify you want it!

## ✨ Features

- **Context-Aware Assistance**: Automatically reads the current LeetCode problem description, title, and your current code in the editor to provide relevant help.
- **"Explain Like I'm 5" Mode**: One-click "Explain This Question" button that breaks down the problem with intuition, dry runs, and examples before discussing code.
- **Smart Code Integration**: 
  - **Language Detection**: Automatically detects which programming language you are using.
  - **1-Click Insert**: Directly insert AI-generated code snippets into the LeetCode editor.
  - **Copy-to-Clipboard**: Easy copy functionality for all code blocks.
- **Interactive Chat**: Ask follow-up questions, request hints, or debug your specific approach.
- **Premium UI**: Modern, clean design with rich markdown support, syntax highlighting, and smooth animations.

## 🚀 Installation

1. **Clone or Download** this repository to your local machine.
   ```bash
   git clone https://github.com/yourusername/leetcode-ai-agent.git
   ```
2. Open **Chrome** and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the directory where you downloaded this project.
5. The extension is now installed! Go to `leetcode.com` to see it in action.

## 🛠️ Usage

1. **Navigate to a Problem**: Open any coding problem on [LeetCode](https://leetcode.com/problems/).
2. **Open the Agent**: You'll see a floating **🤖 Robot Icon** locally in the bottom right, or you can open the Chrome Side Panel manually.
3. **Get Help**:
   - Click **"Explain This Question"** for a high-level overview and logic walkthrough.
   - Type your specific question in the chat box if you're stuck on a specific part.
4. **Use Code**: If the AI provides a code snippet, use the "Insert" button to place it directly into your editor or "Copy" to paste it yourself.

## ⚙️ Configuration

The extension uses the **OpenRouter API** to connect to powerful LLMs (like Llama 3, Claude, or specialized coding models).

*Note: Currently, the API Key and Model are configured directly in `sidepanel.js` for the MVP. You may need to update the `apiKey` variable in `sidepanel.js` with your own OpenRouter key.*

## 🏗️ Tech Stack

- **Frontend**: HTML5, Vanilla JavaScript, CSS3
- **Extension Platform**: Chrome Manifest V3
- **AI Provider**: OpenRouter API (Model: Xiaomi MiMo-V2-Flash)
- **Editor Integration**: Monaco Editor (LeetCode's editor) Injection

## 🧠 AI Model

We use **Xiaomi MiMo-V2-Flash** for its exceptional balance of speed and coding intelligence.

**Why this model?**
- **⚡ Ultra-Fast**: Optimized for low-latency chat, ensuring you get help instantly.
- **👨‍💻 Coding Optimized**: Strong performance on coding benchmarks (like SWE-Bench) and logical reasoning.
- **🧠 Efficient MoE**: Uses a Mixture-of-Experts architecture to deliver high-quality responses without the computational overhead of massive models.
- **📄 Large Context**: 256k context window ensures it never loses track of your problem or conversation history.

## 🔒 Permissions

This extension requires the following permissions to function:
- `sidePanel`: To display the chat interface.
- `activeTab` & `scripting`: To read the problem content and interact with the editor.
- `storage`: To save your preferences (planned).
- `host_permissions`: `leetcode.com` (to work on the site) and `openrouter.ai` (for AI responses).

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](issues).

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
