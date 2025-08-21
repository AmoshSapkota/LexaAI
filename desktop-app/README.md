# LexaAI 🤖

**AI-Powered Coding Assistant with Teleprompter Functionality**

LexaAI is an intelligent desktop application that assists developers during coding sessions and interviews. It combines screenshot analysis with audio transcription to provide contextual help and maintains a teleprompter functionality for reviewing conversations and transcripts.

## 🌟 Features

### 🖥️ **Screenshot Analysis**
- **Instant Capture**: Press `Ctrl+H` to capture screenshots
- **AI Analysis**: Automatically analyzes code, errors, and technical content
- **Multiple AI Providers**: Support for OpenAI, Google Gemini, and Anthropic Claude
- **Context Understanding**: Recognizes coding patterns, error messages, and technical diagrams

### 🎙️ **Audio Transcription & Teleprompter**
- **Continuous Recording**: Records audio throughout sessions
- **Real-time Transcription**: Converts speech to text for later review
- **Session Playback**: Review transcribed conversations after interviews
- **Audio Archives**: Save and organize transcription sessions

### 🔧 **Development Features**
- **Always-on-Top**: Stay visible while coding
- **Global Hotkeys**: Quick access without switching windows
- **Multi-View System**: Queue, Solutions, and Debug modes
- **Cross-Platform**: Works on Windows, macOS, and Linux

## 🎯 **Perfect For**

- **Coding Interviews**: Get assistance with technical questions
- **Debugging Sessions**: Analyze error messages and code
- **Learning**: Understanding complex code patterns
- **Code Reviews**: Get insights on code structure and improvements
- **Technical Conversations**: Record and review discussions

## 🛠️ **Installation**

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Quick Start
```bash
# Clone the repository
git clone https://github.com/lexaai/lexaai.git
cd lexaai

# Install dependencies
npm install

# Start development
npm run dev

# Build for production
npm run build
```

## 📋 **Usage**

### Basic Workflow
1. **Launch LexaAI** - The app starts with continuous audio recording
2. **Capture Screenshots** - Press `Ctrl+H` to capture code or error messages
3. **Get AI Analysis** - Press `Ctrl+Enter` to analyze captured content
4. **Review Solutions** - View AI-generated explanations and suggestions
5. **Access Transcripts** - Use teleprompter to review recorded conversations

### Keyboard Shortcuts
- `Ctrl+H` / `Cmd+H` - Capture screenshot
- `Ctrl+Enter` / `Cmd+Enter` - Process screenshots with AI
- `Ctrl+R` / `Cmd+R` - Reset and clear all content
- `Ctrl+B` / `Cmd+B` - Toggle window visibility
- `Ctrl+L` / `Cmd+L` - Delete last screenshot

## 🧠 **AI Integration**

LexaAI supports multiple AI providers:
- **OpenAI GPT-4** - Advanced code understanding
- **Google Gemini** - Multi-modal analysis
- **Anthropic Claude** - Detailed technical explanations

Configure your preferred AI provider in the settings dialog.

## 🏗️ **Architecture**

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Electron + Node.js
- **AI**: OpenAI, Google Gemini, Anthropic Claude APIs
- **Audio**: PvRecorder for continuous audio capture
- **Screenshots**: Cross-platform screenshot capture

---

**Enhance your coding journey with AI assistance.** 🤖✨