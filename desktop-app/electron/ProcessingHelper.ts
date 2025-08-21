// ProcessingHelper.ts
import fs from "node:fs"
import path from "node:path"
import { ScreenshotHelper } from "./ScreenshotHelper"
import { IProcessingHelperDeps } from "./main"
import * as axios from "axios"
import { app, BrowserWindow, dialog } from "electron"
import { OpenAI } from "openai"
import { configHelper } from "./ConfigHelper"
import Anthropic from '@anthropic-ai/sdk';
import { AudioHelper } from "./AudioHelper"
import { AudioTranscriptionHelper } from "./AudioTranscriptionHelper"

// Interface for Gemini API requests
interface GeminiMessage {
  role: string;
  parts: Array<{
    text?: string;
    inlineData?: {
      mimeType: string;
      data: string;
    }
  }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
    finishReason: string;
  }>;
}
interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image';
    text?: string;
    source?: {
      type: 'base64';
      media_type: string;
      data: string;
    };
  }>;
}
export class ProcessingHelper {
  private deps: IProcessingHelperDeps
  private screenshotHelper: ScreenshotHelper
  private openaiClient: OpenAI | null = null
  private geminiApiKey: string | null = null
  private anthropicClient: Anthropic | null = null
  private audioTranscriptionHelper: AudioTranscriptionHelper

  // AbortControllers for API requests
  private currentProcessingAbortController: AbortController | null = null
  private currentExtraProcessingAbortController: AbortController | null = null

  constructor(deps: IProcessingHelperDeps) {
    this.deps = deps
    this.screenshotHelper = deps.getScreenshotHelper()
    
    // Initialize audio transcription helper
    this.audioTranscriptionHelper = new AudioTranscriptionHelper()
    
    // Initialize AI client based on config
    this.initializeAIClient();
    
    // Listen for config changes to re-initialize the AI client and audio transcription
    configHelper.on('config-updated', () => {
      this.initializeAIClient();
      this.audioTranscriptionHelper.reinitialize();
    });
  }
  
  /**
   * Initialize or reinitialize the AI client with current config
   */
  private initializeAIClient(): void {
    try {
      const config = configHelper.loadConfig();
      
      if (config.apiProvider === "openai") {
        if (config.apiKey) {
          this.openaiClient = new OpenAI({ 
            apiKey: config.apiKey,
            timeout: 60000, // 60 second timeout
            maxRetries: 2   // Retry up to 2 times
          });
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.log("OpenAI client initialized successfully");
        } else {
          this.openaiClient = null;
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.warn("No API key available, OpenAI client not initialized");
        }
      } else if (config.apiProvider === "gemini"){
        // Gemini client initialization
        this.openaiClient = null;
        this.anthropicClient = null;
        if (config.apiKey) {
          this.geminiApiKey = config.apiKey;
          console.log("Gemini API key set successfully");
        } else {
          this.openaiClient = null;
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.warn("No API key available, Gemini client not initialized");
        }
      } else if (config.apiProvider === "anthropic") {
        // Reset other clients
        this.openaiClient = null;
        this.geminiApiKey = null;
        if (config.apiKey) {
          this.anthropicClient = new Anthropic({
            apiKey: config.apiKey,
            timeout: 60000,
            maxRetries: 2
          });
          console.log("Anthropic client initialized successfully");
        } else {
          this.openaiClient = null;
          this.geminiApiKey = null;
          this.anthropicClient = null;
          console.warn("No API key available, Anthropic client not initialized");
        }
      }
    } catch (error) {
      console.error("Failed to initialize AI client:", error);
      this.openaiClient = null;
      this.geminiApiKey = null;
      this.anthropicClient = null;
    }
  }

  private async waitForInitialization(
    mainWindow: BrowserWindow
  ): Promise<void> {
    let attempts = 0
    const maxAttempts = 50 // 5 seconds total

    while (attempts < maxAttempts) {
      const isInitialized = await mainWindow.webContents.executeJavaScript(
        "window.__IS_INITIALIZED__"
      )
      if (isInitialized) return
      await new Promise((resolve) => setTimeout(resolve, 100))
      attempts++
    }
    throw new Error("App failed to initialize after 5 seconds")
  }

  private async getCredits(): Promise<number> {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return 999 // Unlimited credits in this version

    try {
      await this.waitForInitialization(mainWindow)
      return 999 // Always return sufficient credits to work
    } catch (error) {
      console.error("Error getting credits:", error)
      return 999 // Unlimited credits as fallback
    }
  }

  private async getLanguage(): Promise<string> {
    try {
      // Get language from config
      const config = configHelper.loadConfig();
      if (config.language) {
        return config.language;
      }
      
      // Fallback to window variable if config doesn't have language
      const mainWindow = this.deps.getMainWindow()
      if (mainWindow) {
        try {
          await this.waitForInitialization(mainWindow)
          const language = await mainWindow.webContents.executeJavaScript(
            "window.__LANGUAGE__"
          )

          if (
            typeof language === "string" &&
            language !== undefined &&
            language !== null
          ) {
            return language;
          }
        } catch (err) {
          console.warn("Could not get language from window", err);
        }
      }
      
      // Default fallback
      return "python";
    } catch (error) {
      console.error("Error getting language:", error)
      return "python"
    }
  }

  public async processScreenshots(): Promise<void> {
    const mainWindow = this.deps.getMainWindow()
    if (!mainWindow) return

    const config = configHelper.loadConfig();
    
    // First verify we have a valid AI client
    if (config.apiProvider === "openai" && !this.openaiClient) {
      this.initializeAIClient();
      
      if (!this.openaiClient) {
        console.error("OpenAI client not initialized");
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.API_KEY_INVALID
        );
        return;
      }
    } else if (config.apiProvider === "gemini" && !this.geminiApiKey) {
      this.initializeAIClient();
      
      if (!this.geminiApiKey) {
        console.error("Gemini API key not initialized");
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.API_KEY_INVALID
        );
        return;
      }
    } else if (config.apiProvider === "anthropic" && !this.anthropicClient) {
      // Add check for Anthropic client
      this.initializeAIClient();
      
      if (!this.anthropicClient) {
        console.error("Anthropic client not initialized");
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.API_KEY_INVALID
        );
        return;
      }
    }

    const view = this.deps.getView()
    console.log("Processing screenshots in view:", view)

    if (view === "queue") {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_START)
      const screenshotQueue = this.screenshotHelper.getScreenshotQueue()
      console.log("Processing main queue screenshots:", screenshotQueue)
      
      // Check if the queue is empty
      if (!screenshotQueue || screenshotQueue.length === 0) {
        console.log("No screenshots found in queue");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        return;
      }

      // Check that files actually exist
      const existingScreenshots = screenshotQueue.filter(path => fs.existsSync(path));
      if (existingScreenshots.length === 0) {
        console.log("Screenshot files don't exist on disk");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        return;
      }

      try {
        // Initialize AbortController
        this.currentProcessingAbortController = new AbortController()
        const { signal } = this.currentProcessingAbortController

        const screenshots = await Promise.all(
          existingScreenshots.map(async (path) => {
            try {
              return {
                path,
                preview: await this.screenshotHelper.getImagePreview(path),
                data: fs.readFileSync(path).toString('base64')
              };
            } catch (err) {
              console.error(`Error reading screenshot ${path}:`, err);
              return null;
            }
          })
        )

        // Filter out any nulls from failed screenshots
        const validScreenshots = screenshots.filter(Boolean);
        
        if (validScreenshots.length === 0) {
          throw new Error("Failed to load screenshot data");
        }

        const result = await this.processScreenshotsHelper(validScreenshots, signal)

        if (!result.success) {
          console.log("Processing failed:", result.error)
          if (result.error?.includes("API Key") || result.error?.includes("OpenAI") || result.error?.includes("Gemini")) {
            mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS.API_KEY_INVALID
            )
          } else {
            mainWindow.webContents.send(
              this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
              result.error
            )
          }
          // Reset view back to notes on error
          console.log("Resetting view to queue due to error")
          this.deps.setView("queue")
          return
        }

        // Only set view to teleprompter if processing succeeded
        console.log("Setting view to teleprompter after successful processing")
        // Set view BEFORE sending the success event so the Teleprompter component is mounted
        this.deps.setView("solutions")
        
        // Small delay to ensure view change is processed before sending data
        setTimeout(() => {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS,
            result.data
          )
          console.log("SOLUTION_SUCCESS event sent after view change")
        }, 100)

        
      } catch (error: any) {
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
          error
        )
        console.error("Processing error:", error)
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            "Processing was canceled by the user."
          )
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            error.message || "Server error. Please try again."
          )
        }
        // Reset view back to notes on error
        console.log("Resetting view to queue due to error")
        this.deps.setView("queue")
      } finally {
        this.currentProcessingAbortController = null
      }
    } else {
      // view == 'solutions'
      const extraScreenshotQueue =
        this.screenshotHelper.getExtraScreenshotQueue()
      console.log("Processing extra queue screenshots:", extraScreenshotQueue)
      
      // Check if the extra queue is empty
      if (!extraScreenshotQueue || extraScreenshotQueue.length === 0) {
        console.log("No extra screenshots found in queue");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        
        return;
      }

      // Check that files actually exist
      const existingExtraScreenshots = extraScreenshotQueue.filter(path => fs.existsSync(path));
      if (existingExtraScreenshots.length === 0) {
        console.log("Extra screenshot files don't exist on disk");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        return;
      }
      
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.DEBUG_START)

      // Initialize AbortController
      this.currentExtraProcessingAbortController = new AbortController()
      const { signal } = this.currentExtraProcessingAbortController

      try {
        // Get all screenshots (both main and extra) for processing
        const allPaths = [
          ...this.screenshotHelper.getScreenshotQueue(),
          ...existingExtraScreenshots
        ];
        
        const screenshots = await Promise.all(
          allPaths.map(async (path) => {
            try {
              if (!fs.existsSync(path)) {
                console.warn(`Screenshot file does not exist: ${path}`);
                return null;
              }
              
              return {
                path,
                preview: await this.screenshotHelper.getImagePreview(path),
                data: fs.readFileSync(path).toString('base64')
              };
            } catch (err) {
              console.error(`Error reading screenshot ${path}:`, err);
              return null;
            }
          })
        )
        
        // Filter out any nulls from failed screenshots
        const validScreenshots = screenshots.filter(Boolean);
        
        if (validScreenshots.length === 0) {
          throw new Error("Failed to load screenshot data for debugging");
        }
        
        console.log(
          "Combined screenshots for processing:",
          validScreenshots.map((s) => s.path)
        )

        const result = await this.processExtraScreenshotsHelper(
          validScreenshots,
          signal
        )

        if (result.success) {
          this.deps.setHasDebugged(true)
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_SUCCESS,
            result.data
          )
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            result.error
          )
        }
      } catch (error: any) {
        if (axios.isCancel(error)) {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            "Extra processing was canceled by the user."
          )
        } else {
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.DEBUG_ERROR,
            error.message
          )
        }
      } finally {
        this.currentExtraProcessingAbortController = null
      }
    }
  }

  private async processScreenshotsHelper(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal
  ) {
    try {
      const config = configHelper.loadConfig();
      const language = await this.getLanguage();
      const mainWindow = this.deps.getMainWindow();
      
      // Step 1: Extract problem info using AI Vision API (OpenAI or Gemini)
      const imageDataList = screenshots.map(screenshot => screenshot.data);
      
      // Update the user on progress
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Analyzing problem from screenshots...",
          progress: 20
        });
      }

      let problemInfo;
      
      if (config.apiProvider === "openai") {
        // Verify OpenAI client
        if (!this.openaiClient) {
          this.initializeAIClient(); // Try to reinitialize
          
          if (!this.openaiClient) {
            return {
              success: false,
              error: "OpenAI API key not configured or invalid. Please check your settings."
            };
          }
        }

        // Use OpenAI for processing
        const messages = [
          {
            role: "system" as const, 
            content: "You are a coding challenge interpreter. Analyze the screenshot of the coding problem and extract all relevant information. Return the information in JSON format with these fields: problem_statement, constraints, example_input, example_output. Just return the structured JSON without any other text."
          },
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const, 
                text: `Extract the coding problem details from these screenshots. Return in JSON format. Preferred coding language we gonna use for this problem is ${language}.`
              },
              ...imageDataList.map(data => ({
                type: "image_url" as const,
                image_url: { url: `data:image/png;base64,${data}` }
              }))
            ]
          }
        ];

        // Send to OpenAI Vision API
        const extractionResponse = await this.openaiClient.chat.completions.create({
          model: config.extractionModel || "gpt-4o",
          messages: messages,
          max_tokens: 4000,
          temperature: 0.2
        });

        // Parse the response
        try {
          const responseText = extractionResponse.choices[0].message.content;
          // Handle when OpenAI might wrap the JSON in markdown code blocks
          const jsonText = responseText.replace(/```json|```/g, '').trim();
          problemInfo = JSON.parse(jsonText);
        } catch (error) {
          console.error("Error parsing OpenAI response:", error);
          return {
            success: false,
            error: "Failed to parse problem information. Please try again or use clearer screenshots."
          };
        }
      } else if (config.apiProvider === "gemini")  {
        // Use Gemini API
        if (!this.geminiApiKey) {
          return {
            success: false,
            error: "Gemini API key not configured. Please check your settings."
          };
        }

        try {
          // Create Gemini message structure
          const geminiMessages: GeminiMessage[] = [
            {
              role: "user",
              parts: [
                {
                  text: `You are a coding challenge interpreter. Analyze the screenshots of the coding problem and extract all relevant information. Return the information in JSON format with these fields: problem_statement, constraints, example_input, example_output. Just return the structured JSON without any other text. Preferred coding language we gonna use for this problem is ${language}.`
                },
                ...imageDataList.map(data => ({
                  inlineData: {
                    mimeType: "image/png",
                    data: data
                  }
                }))
              ]
            }
          ];

          // Make API request to Gemini
          const response = await axios.default.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.extractionModel || "gemini-2.0-flash"}:generateContent?key=${this.geminiApiKey}`,
            {
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4000
              }
            },
            { signal }
          );

          const responseData = response.data as GeminiResponse;
          
          if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error("Empty response from Gemini API");
          }
          
          const responseText = responseData.candidates[0].content.parts[0].text;
          
          // Handle when Gemini might wrap the JSON in markdown code blocks
          const jsonText = responseText.replace(/```json|```/g, '').trim();
          problemInfo = JSON.parse(jsonText);
        } catch (error) {
          console.error("Error using Gemini API:", error);
          return {
            success: false,
            error: "Failed to process with Gemini API. Please check your API key or try again later."
          };
        }
      } else if (config.apiProvider === "anthropic") {
        if (!this.anthropicClient) {
          return {
            success: false,
            error: "Anthropic API key not configured. Please check your settings."
          };
        }

        try {
          const messages = [
            {
              role: "user" as const,
              content: [
                {
                  type: "text" as const,
                  text: `Extract the coding problem details from these screenshots. Return in JSON format with these fields: problem_statement, constraints, example_input, example_output. Preferred coding language is ${language}.`
                },
                ...imageDataList.map(data => ({
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "image/png" as const,
                    data: data
                  }
                }))
              ]
            }
          ];

          const response = await this.anthropicClient.messages.create({
            model: config.extractionModel || "claude-3-7-sonnet-20250219",
            max_tokens: 4000,
            messages: messages,
            temperature: 0.2
          });

          const responseText = (response.content[0] as { type: 'text', text: string }).text;
          const jsonText = responseText.replace(/```json|```/g, '').trim();
          problemInfo = JSON.parse(jsonText);
        } catch (error: any) {
          console.error("Error using Anthropic API:", error);

          // Add specific handling for Claude's limitations
          if (error.status === 429) {
            return {
              success: false,
              error: "Claude API rate limit exceeded. Please wait a few minutes before trying again."
            };
          } else if (error.status === 413 || (error.message && error.message.includes("token"))) {
            return {
              success: false,
              error: "Your screenshots contain too much information for Claude to process. Switch to OpenAI or Gemini in settings which can handle larger inputs."
            };
          }

          return {
            success: false,
            error: "Failed to process with Anthropic API. Please check your API key or try again later."
          };
        }
      }
      
      // Update the user on progress
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Problem analyzed successfully. Preparing to generate solution...",
          progress: 40
        });
      }

      // Store problem info in AppState
      this.deps.setProblemInfo(problemInfo);

      // Send first success event
      if (mainWindow) {
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.PROBLEM_EXTRACTED,
          problemInfo
        );

        // Generate solutions after successful extraction
        console.log("Starting solution generation...");
        const solutionsResult = await this.generateSolutionsHelper(signal);
        console.log("Solution generation completed:", solutionsResult.success);
        
        if (solutionsResult.success) {
          console.log("Solution generated successfully, preparing response...");
          // Clear any existing extra screenshots before transitioning to solutions view
          this.screenshotHelper.clearExtraScreenshotQueue();
          
          // Final progress update
          mainWindow.webContents.send("processing-status", {
            message: "Solution generated successfully",
            progress: 100
          });
          
          console.log("Sending SOLUTION_SUCCESS event to renderer...");
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS,
            solutionsResult.data
          );
          console.log("SOLUTION_SUCCESS event sent successfully");
          
          // Clear old audio files but keep recording continuous
          console.log("Clearing old audio files but keeping recording continuous");
          const audioHelper = this.deps.getAudioHelper?.();
          if (audioHelper) {
            // Only clear old recordings, don't stop current recording
            const recordings = audioHelper.getRecordings();
            const currentRecording = audioHelper.getCurrentRecording();
            
            // Delete old recordings except the current one
            for (const recording of recordings) {
              if (!currentRecording || recording.id !== currentRecording.id) {
                audioHelper.deleteRecording(recording.id);
              }
            }
            console.log("Old audio recordings cleared, current recording continues");
          }
        } else {
          console.error("Solution generation failed:", solutionsResult.error);
          mainWindow.webContents.send("processing-status", {
            message: "Solution generation failed",
            progress: 0
          });
          
          mainWindow.webContents.send(
            this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR,
            solutionsResult.error || "Failed to generate solution"
          );
          throw new Error(solutionsResult.error || "Failed to generate solution");
        }

        

        return { success: true, data: solutionsResult.data };
      } else {
        throw new Error("Failed to extract problem information from screenshots");
      }
    } catch (error: any) {
      // If the request was cancelled, don't retry
      if (axios.isCancel(error)) {
        return {
          success: false,
          error: "Processing was canceled by the user."
        };
      }
      
      // Handle OpenAI API errors specifically
      if (error?.response?.status === 401) {
        return {
          success: false,
          error: "Invalid OpenAI API key. Please check your settings."
        };
      } else if (error?.response?.status === 429) {
        return {
          success: false,
          error: "OpenAI API rate limit exceeded or insufficient credits. Please try again later."
        };
      } else if (error?.response?.status === 500) {
        return {
          success: false,
          error: "OpenAI server error. Please try again later."
        };
      }

      console.error("API Error Details:", error);
      return { 
        success: false, 
        error: error.message || "Failed to process screenshots. Please try again." 
      };
    }
  }

  private async generateSolutionsHelper(signal: AbortSignal) {
    console.log("=== generateSolutionsHelper started ===");
    try {
      const problemInfo = this.deps.getProblemInfo();
      const language = await this.getLanguage();
      const config = configHelper.loadConfig();
      const mainWindow = this.deps.getMainWindow();

      console.log("Problem info available:", !!problemInfo);
      console.log("Language:", language);
      console.log("API Provider:", config.apiProvider);

      if (!problemInfo) {
        console.error("No problem info available for solution generation");
        throw new Error("No problem info available");
      }

      // Update progress status
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Generating speaking prompts and teleprompter content...",
          progress: 60
        });
      }

      // Create prompt for teleprompter content generation
      const promptText = `
Analyze the following content and generate speaking assistance for presentations or discussions:

CONTENT DESCRIPTION:
${problemInfo.problem_statement}

ADDITIONAL CONTEXT:
${problemInfo.constraints || "No additional context provided."}

EXAMPLE/REFERENCE:
${problemInfo.example_input || "No examples provided."}

EXPECTED OUTCOME:
${problemInfo.example_output || "No expected outcomes provided."}

PRESENTATION CONTEXT: ${language}

I need the response in the following format:
1. Keywords: 5-8 key terms or concepts that should be emphasized
2. Bullet Points: 4-6 main talking points to guide the presentation
3. Speaking Tips: Practical advice for confident delivery
4. Key Messages: Main takeaways the audience should remember

For speaking tips, focus on practical advice like: "Start with the problem context to engage your audience" or "Use specific examples to illustrate abstract concepts" or "Pause after key points to let the information sink in."

Your response should help build confidence and provide clear structure for speaking about this content.
`;

      let responseContent;
      
      if (config.apiProvider === "openai") {
        // OpenAI processing
        if (!this.openaiClient) {
          return {
            success: false,
            error: "OpenAI API key not configured. Please check your settings."
          };
        }
        
        // Send to OpenAI API with timeout
        console.log("Sending request to OpenAI for solution generation...");
        const solutionResponse = await Promise.race([
          this.openaiClient.chat.completions.create({
            model: config.solutionModel || "gpt-4o",
            messages: [
              { role: "system", content: "You are a coding interview assistant. Analyze the provided screenshots and help solve coding problems. Provide detailed explanations, code solutions, and approach strategies." },
              { role: "user", content: promptText }
            ],
            max_tokens: 4000,
            temperature: 0.2
          }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error("OpenAI API request timeout after 120 seconds")), 120000)
          )
        ]);

        console.log("Received response from OpenAI");
        responseContent = (solutionResponse as any).choices[0].message.content;
      } else if (config.apiProvider === "gemini")  {
        // Gemini processing
        if (!this.geminiApiKey) {
          return {
            success: false,
            error: "Gemini API key not configured. Please check your settings."
          };
        }
        
        try {
          // Create Gemini message structure
          const geminiMessages = [
            {
              role: "user",
              parts: [
                {
                  text: `You are a coding interview assistant. Analyze the provided screenshots and help solve coding problems. Provide detailed explanations, code solutions, and approach strategies:\n\n${promptText}`
                }
              ]
            }
          ];

          // Make API request to Gemini with timeout
          console.log("Sending request to Gemini for solution generation...");
          const response = await Promise.race([
            axios.default.post(
              `https://generativelanguage.googleapis.com/v1beta/models/${config.solutionModel || "gemini-2.0-flash"}:generateContent?key=${this.geminiApiKey}`,
              {
                contents: geminiMessages,
                generationConfig: {
                  temperature: 0.2,
                  maxOutputTokens: 4000
                }
              },
              { 
                signal,
                timeout: 120000 // 120 second timeout
              }
            ),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Gemini API request timeout after 120 seconds")), 120000)
            )
          ]);

          console.log("Received response from Gemini");
          const responseData = (response as any).data as GeminiResponse;
          
          if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error("Empty response from Gemini API");
          }
          
          responseContent = responseData.candidates[0].content.parts[0].text;
        } catch (error) {
          console.error("Error using Gemini API for solution:", error);
          return {
            success: false,
            error: "Failed to generate solution with Gemini API. Please check your API key or try again later."
          };
        }
      } else if (config.apiProvider === "anthropic") {
        // Anthropic processing
        if (!this.anthropicClient) {
          return {
            success: false,
            error: "Anthropic API key not configured. Please check your settings."
          };
        }
        
        try {
          const messages = [
            {
              role: "user" as const,
              content: [
                {
                  type: "text" as const,
                  text: `You are a coding interview assistant. Analyze the provided screenshots and help solve coding problems. Provide detailed explanations, code solutions, and approach strategies:\n\n${promptText}`
                }
              ]
            }
          ];

          // Send to Anthropic API with timeout
          console.log("Sending request to Anthropic for solution generation...");
          const response = await Promise.race([
            this.anthropicClient.messages.create({
              model: config.solutionModel || "claude-3-7-sonnet-20250219",
              max_tokens: 4000,
              messages: messages,
              temperature: 0.2
            }),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Anthropic API request timeout after 120 seconds")), 120000)
            )
          ]);

          console.log("Received response from Anthropic");
          responseContent = ((response as any).content[0] as { type: 'text', text: string }).text;
        } catch (error: any) {
          console.error("Error using Anthropic API for solution:", error);

          // Add specific handling for Claude's limitations
          if (error.status === 429) {
            return {
              success: false,
              error: "Claude API rate limit exceeded. Please wait a few minutes before trying again."
            };
          } else if (error.status === 413 || (error.message && error.message.includes("token"))) {
            return {
              success: false,
              error: "Your screenshots contain too much information for Claude to process. Switch to OpenAI or Gemini in settings which can handle larger inputs."
            };
          }

          return {
            success: false,
            error: "Failed to generate solution with Anthropic API. Please check your API key or try again later."
          };
        }
      }
      
      // Extract coding solution components
      // Extract explanation
      const explanationRegex = /(?:Explanation|Analysis|Problem Analysis):[\s\S]*?(?=(?:Code|Solution|Approach|Time Complexity)|$)/i;
      const explanationMatch = responseContent.match(explanationRegex);
      const explanation = explanationMatch ? explanationMatch[0].replace(/^.*?:/, '').trim() : responseContent;
      
      // Extract code solution
      const codeRegex = /```(?:\w+)?\s*([\s\S]*?)```/;
      const codeMatch = responseContent.match(codeRegex);
      const code = codeMatch ? codeMatch[1].trim() : '';
      
      // Extract language
      const langRegex = /```(\w+)/;
      const langMatch = responseContent.match(langRegex);
      const detectedLanguage = langMatch ? langMatch[1] : 'javascript';
      
      // Extract approach
      const approachRegex = /(?:Approach|Strategy|Method):[\s\S]*?(?=(?:Code|Solution|Time Complexity|Space Complexity)|$)/i;
      const approachMatch = responseContent.match(approachRegex);
      const approach = approachMatch ? approachMatch[0].replace(/^.*?:/, '').trim() : '';
      
      // Extract time complexity
      const timeComplexityRegex = /(?:Time Complexity|Time):[\s\S]*?(?=(?:Space Complexity|Space|$))/i;
      const timeComplexityMatch = responseContent.match(timeComplexityRegex);
      const time_complexity = timeComplexityMatch ? timeComplexityMatch[0].replace(/^.*?:/, '').trim() : '';
      
      // Extract space complexity
      const spaceComplexityRegex = /(?:Space Complexity|Space):[\s\S]*?$/i;
      const spaceComplexityMatch = responseContent.match(spaceComplexityRegex);
      const space_complexity = spaceComplexityMatch ? spaceComplexityMatch[0].replace(/^.*?:/, '').trim() : '';

      const formattedResponse = {
        explanation: explanation || "AI analysis of the provided code or problem.",
        code: code || "// No code solution provided",
        language: detectedLanguage,
        approach: approach || "Step-by-step problem solving approach.",
        time_complexity: time_complexity || "O(n) - Analysis pending",
        space_complexity: space_complexity || "O(1) - Analysis pending",
        // Keep legacy field for compatibility
        thoughts: explanation ? [explanation] : ["AI analysis of the provided content"]
      };

      console.log("=== generateSolutionsHelper completed successfully ===");
      console.log("Response data:", formattedResponse);
      console.log("Generated response data:", formattedResponse); // Add this line
      return { success: true, data: formattedResponse };
    } catch (error: any) {
      console.error("=== generateSolutionsHelper failed ===");
      console.error("Error details:", error);
      
      if (axios.isCancel(error)) {
        console.log("Request was canceled by user");
        return {
          success: false,
          error: "Processing was canceled by the user."
        };
      }
      
      if (error?.response?.status === 401) {
        return {
          success: false,
          error: "Invalid OpenAI API key. Please check your settings."
        };
      } else if (error?.response?.status === 429) {
        return {
          success: false,
          error: "OpenAI API rate limit exceeded or insufficient credits. Please try again later."
        };
      }
      
      console.error("Solution generation error:", error);
      return { success: false, error: error.message || "Failed to generate solution" };
    }
  }

  private async processExtraScreenshotsHelper(
    screenshots: Array<{ path: string; data: string }>,
    signal: AbortSignal
  ) {
    try {
      const problemInfo = this.deps.getProblemInfo();
      const language = await this.getLanguage();
      const config = configHelper.loadConfig();
      const mainWindow = this.deps.getMainWindow();

      if (!problemInfo) {
        throw new Error("No problem info available");
      }

      // Update progress status
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Processing debug screenshots...",
          progress: 30
        });
      }

      // Prepare the images for the API call
      const imageDataList = screenshots.map(screenshot => screenshot.data);
      
      let debugContent;
      
      if (config.apiProvider === "openai") {
        if (!this.openaiClient) {
          return {
            success: false,
            error: "OpenAI API key not configured. Please check your settings."
          };
        }
        
        const messages = [
          {
            role: "system" as const, 
            content: `You are a coding interview assistant specialized in debugging and optimization. Analyze these screenshots and help debug code or improve solutions.

Your response MUST follow this exact structure with these section headers (use ### for headers):
### Issues Identified
- List each issue as a bullet point with clear explanation

### Specific Improvements and Corrections
- List specific code changes needed as bullet points

### Optimizations
- List any performance optimizations if applicable

### Explanation of Changes Needed
Here provide a clear explanation of why the changes are needed

### Key Points
- Summary bullet points of the most important takeaways

If you include code examples, use proper markdown code blocks with language specification (e.g. \`\`\`java).`
          },
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const, 
                text: `I'm solving this coding problem: "${problemInfo.problem_statement}" in ${language}. I need help with debugging or improving my solution. Here are screenshots of my code, the errors or test cases. Please provide a detailed analysis with:
1. What issues you found in my code
2. Specific improvements and corrections
3. Any optimizations that would make the solution better
4. A clear explanation of the changes needed` 
              },
              ...imageDataList.map(data => ({
                type: "image_url" as const,
                image_url: { url: `data:image/png;base64,${data}` }
              }))
            ]
          }
        ];

        if (mainWindow) {
          mainWindow.webContents.send("processing-status", {
            message: "Analyzing code and generating debug feedback...",
            progress: 60
          });
        }

        const debugResponse = await this.openaiClient.chat.completions.create({
          model: config.debuggingModel || "gpt-4o",
          messages: messages,
          max_tokens: 4000,
          temperature: 0.2
        });
        
        debugContent = debugResponse.choices[0].message.content;
      } else if (config.apiProvider === "gemini")  {
        if (!this.geminiApiKey) {
          return {
            success: false,
            error: "Gemini API key not configured. Please check your settings."
          };
        }
        
        try {
          const debugPrompt = `
You are a coding interview assistant specialized in debugging and optimization. Analyze these screenshots and help debug code or improve solutions.

I'm solving this coding problem: "${problemInfo.problem_statement}" in ${language}. I need help with debugging or improving my solution.

YOUR RESPONSE MUST FOLLOW THIS EXACT STRUCTURE WITH THESE SECTION HEADERS:
### Issues Identified
- List each issue as a bullet point with clear explanation

### Specific Improvements and Corrections
- List specific code changes needed as bullet points

### Optimizations
- List any performance optimizations if applicable

### Explanation of Changes Needed
Here provide a clear explanation of why the changes are needed

### Key Points
- Summary bullet points of the most important takeaways

If you include code examples, use proper markdown code blocks with language specification (e.g. \`\`\`java).
`;

          const geminiMessages = [
            {
              role: "user",
              parts: [
                { text: debugPrompt },
                ...imageDataList.map(data => ({
                  inlineData: {
                    mimeType: "image/png",
                    data: data
                  }
                }))
              ]
            }
          ];

          if (mainWindow) {
            mainWindow.webContents.send("processing-status", {
              message: "Analyzing code and generating debug feedback with Gemini...",
              progress: 60
            });
          }

          const response = await axios.default.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.debuggingModel || "gemini-2.0-flash"}:generateContent?key=${this.geminiApiKey}`,
            {
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4000
              }
            },
            { signal }
          );

          const responseData = response.data as GeminiResponse;
          
          if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error("Empty response from Gemini API");
          }
          
          debugContent = responseData.candidates[0].content.parts[0].text;
        } catch (error) {
          console.error("Error using Gemini API for debugging:", error);
          return {
            success: false,
            error: "Failed to process debug request with Gemini API. Please check your API key or try again later."
          };
        }
      } else if (config.apiProvider === "anthropic") {
        if (!this.anthropicClient) {
          return {
            success: false,
            error: "Anthropic API key not configured. Please check your settings."
          };
        }
        
        try {
          const debugPrompt = `
You are a coding interview assistant specialized in debugging and optimization. Analyze these screenshots and help debug code or improve solutions.

I'm solving this coding problem: "${problemInfo.problem_statement}" in ${language}. I need help with debugging or improving my solution.

YOUR RESPONSE MUST FOLLOW THIS EXACT STRUCTURE WITH THESE SECTION HEADERS:
### Issues Identified
- List each issue as a bullet point with clear explanation

### Specific Improvements and Corrections
- List specific code changes needed as bullet points

### Optimizations
- List any performance optimizations if applicable

### Explanation of Changes Needed
Here provide a clear explanation of why the changes are needed

### Key Points
- Summary bullet points of the most important takeaways

If you include code examples, use proper markdown code blocks with language specification.
`;

          const messages = [
            {
              role: "user" as const,
              content: [
                {
                  type: "text" as const,
                  text: debugPrompt
                },
                ...imageDataList.map(data => ({
                  type: "image" as const,
                  source: {
                    type: "base64" as const,
                    media_type: "image/png" as const, 
                    data: data
                  }
                }))
              ]
            }
          ];

          if (mainWindow) {
            mainWindow.webContents.send("processing-status", {
              message: "Analyzing code and generating debug feedback with Claude...",
              progress: 60
            });
          }

          const response = await this.anthropicClient.messages.create({
            model: config.debuggingModel || "claude-3-7-sonnet-20250219",
            max_tokens: 4000,
            messages: messages,
            temperature: 0.2
          });
          
          debugContent = (response.content[0] as { type: 'text', text: string }).text;
        } catch (error: any) {
          console.error("Error using Anthropic API for debugging:", error);
          
          // Add specific handling for Claude's limitations
          if (error.status === 429) {
            return {
              success: false,
              error: "Claude API rate limit exceeded. Please wait a few minutes before trying again."
            };
          } else if (error.status === 413 || (error.message && error.message.includes("token"))) {
            return {
              success: false,
              error: "Your screenshots contain too much information for Claude to process. Switch to OpenAI or Gemini in settings which can handle larger inputs."
            };
          }
          
          return {
            success: false,
            error: "Failed to process debug request with Anthropic API. Please check your API key or try again later."
          };
        }
      }
      
      
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Debug analysis complete",
          progress: 100
        });
      }

      let extractedCode = "// Debug mode - see analysis below";
      const codeMatch = debugContent.match(/```(?:[a-zA-Z]+)?([\s\S]*?)```/);
      if (codeMatch && codeMatch[1]) {
        extractedCode = codeMatch[1].trim();
      }

      let formattedDebugContent = debugContent;
      
      if (!debugContent.includes('# ') && !debugContent.includes('## ')) {
        formattedDebugContent = debugContent
          .replace(/issues identified|problems found|bugs found/i, '## Issues Identified')
          .replace(/code improvements|improvements|suggested changes/i, '## Code Improvements')
          .replace(/optimizations|performance improvements/i, '## Optimizations')
          .replace(/explanation|detailed analysis/i, '## Explanation');
      }

      const bulletPoints = formattedDebugContent.match(/(?:^|\n)[ ]*(?:[-*•]|\d+\.)[ ]+([^\n]+)/g);
      const thoughts = bulletPoints 
        ? bulletPoints.map(point => point.replace(/^[ ]*(?:[-*•]|\d+\.)[ ]+/, '').trim()).slice(0, 5)
        : ["Debug analysis based on your screenshots"];
      
      const response = {
        code: extractedCode,
        debug_analysis: formattedDebugContent,
        thoughts: thoughts,
        time_complexity: "N/A - Debug mode",
        space_complexity: "N/A - Debug mode"
      };

      return { success: true, data: response };
    } catch (error: any) {
      console.error("Debug processing error:", error);
      return { success: false, error: error.message || "Failed to process debug request" };
    }
  }

  public cancelOngoingRequests(): void {
    let wasCancelled = false

    if (this.currentProcessingAbortController) {
      this.currentProcessingAbortController.abort()
      this.currentProcessingAbortController = null
      wasCancelled = true
    }

    if (this.currentExtraProcessingAbortController) {
      this.currentExtraProcessingAbortController.abort()
      this.currentExtraProcessingAbortController = null
      wasCancelled = true
    }

    this.deps.setHasDebugged(false)

    this.deps.setProblemInfo(null)

    const mainWindow = this.deps.getMainWindow()
    if (wasCancelled && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS)
    }
  }

  /**
   * Transcribe audio recording using the appropriate transcription service
   */
  public async transcribeAudio(audioHelper: AudioHelper, recordingId: string): Promise<{ success: boolean; transcript?: string; error?: string }> {
    try {
      // Check if transcription is available for the current provider
      const availability = this.audioTranscriptionHelper.isTranscriptionAvailable();
      if (!availability.available) {
        return {
          success: false,
          error: availability.reason || "Audio transcription not available for current configuration"
        };
      }

      // Get audio buffer from the recording
      const audioBuffer = audioHelper.getAudioBuffer(recordingId);
      if (!audioBuffer) {
        return {
          success: false,
          error: "Audio file not found or could not be read."
        };
      }

      console.log(`Starting transcription for recording: ${recordingId}`);

      // Use the AudioTranscriptionHelper to transcribe with the appropriate provider
      const result = await this.audioTranscriptionHelper.transcribeAudio(audioBuffer, recordingId);

      if (result.success) {
        console.log(`Transcription completed for recording: ${recordingId}`);
      }

      return result;

    } catch (error: any) {
      console.error("Audio transcription error:", error);
      return {
        success: false,
        error: error.message || "Failed to transcribe audio"
      };
    }
  }

  /**
   * Process audio alongside screenshots for enhanced analysis
   */
  public async processWithAudio(
    screenshots: Array<{ path: string; data: string }>,
    audioTranscript: string,
    signal: AbortSignal
  ) {
    try {
      const config = configHelper.loadConfig();
      const language = await this.getLanguage();
      const mainWindow = this.deps.getMainWindow();
      
      // Step 1: Extract problem info using both screenshots and audio transcript
      const imageDataList = screenshots.map(screenshot => screenshot.data);
      
      // Update the user on progress
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Analyzing problem from screenshots and audio...",
          progress: 20
        });
      }

      let problemInfo;
      
      if (config.apiProvider === "openai") {
        if (!this.openaiClient) {
          this.initializeAIClient();
          if (!this.openaiClient) {
            return {
              success: false,
              error: "OpenAI API key not configured or invalid. Please check your settings."
            };
          }
        }

        // Enhanced prompt that includes audio context
        const enhancedPrompt = `You are a coding challenge interpreter. Analyze the screenshot of the coding problem and the accompanying audio transcript to extract all relevant information. 

AUDIO TRANSCRIPT: "${audioTranscript}"

Use both the visual information from the screenshots and the audio context to better understand the problem. The audio might contain:
- Additional clarifications about the problem
- Constraints or requirements not visible in the screenshot
- Examples or hints from the interviewer
- Questions or discussions about the problem

Return the information in JSON format with these fields: problem_statement, constraints, example_input, example_output, audio_context. 
Include an audio_context field that summarizes any additional insights from the audio that aren't visible in the screenshots.
Just return the structured JSON without any other text.`;

        const messages = [
          {
            role: "system" as const, 
            content: enhancedPrompt
          },
          {
            role: "user" as const,
            content: [
              {
                type: "text" as const, 
                text: `Extract the coding problem details from these screenshots and audio transcript. Return in JSON format. Preferred coding language: ${language}.`
              },
              ...imageDataList.map(data => ({
                type: "image_url" as const,
                image_url: { url: `data:image/png;base64,${data}` }
              }))
            ]
          }
        ];

        const extractionResponse = await this.openaiClient.chat.completions.create({
          model: config.extractionModel || "gpt-4o",
          messages: messages,
          max_tokens: 4000,
          temperature: 0.2
        });

        try {
          const responseText = extractionResponse.choices[0].message.content;
          const jsonText = responseText.replace(/```json|```/g, '').trim();
          problemInfo = JSON.parse(jsonText);
        } catch (error) {
          console.error("Error parsing OpenAI response:", error);
          return {
            success: false,
            error: "Failed to parse problem information. Please try again or use clearer screenshots."
          };
        }
      } else if (config.apiProvider === "gemini") {
        // Enhanced Gemini processing with audio context
        if (!this.geminiApiKey) {
          return {
            success: false,
            error: "Gemini API key not configured. Please check your settings."
          };
        }

        try {
          // Enhanced prompt for Gemini with audio context
          const enhancedPrompt = `You are a coding challenge interpreter. Analyze the screenshots of the coding problem and the accompanying audio transcript to extract all relevant information. 

AUDIO TRANSCRIPT: "${audioTranscript}"

Use both the visual information from the screenshots and the audio context to better understand the problem. The audio might contain:
- Additional clarifications about the problem
- Constraints or requirements not visible in the screenshot
- Examples or hints from the interviewer
- Questions or discussions about the problem

Return the information in JSON format with these fields: problem_statement, constraints, example_input, example_output, audio_context. 
Include an audio_context field that summarizes any additional insights from the audio that aren't visible in the screenshots.
Just return the structured JSON without any other text. Preferred coding language: ${language}.`;

          const geminiMessages = [
            {
              role: "user",
              parts: [
                { text: enhancedPrompt },
                ...imageDataList.map(data => ({
                  inlineData: {
                    mimeType: "image/png",
                    data: data
                  }
                }))
              ]
            }
          ];

          const response = await axios.default.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${config.extractionModel || "gemini-2.0-flash"}:generateContent?key=${this.geminiApiKey}`,
            {
              contents: geminiMessages,
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 4000
              }
            },
            { signal }
          );

          const responseData = response.data as GeminiResponse;
          
          if (!responseData.candidates || responseData.candidates.length === 0) {
            throw new Error("Empty response from Gemini API");
          }
          
          const responseText = responseData.candidates[0].content.parts[0].text;
          const jsonText = responseText.replace(/```json|```/g, '').trim();
          problemInfo = JSON.parse(jsonText);
        } catch (error) {
          console.error("Error using Gemini API with audio:", error);
          return {
            success: false,
            error: "Failed to process with Gemini API and audio context. Please check your API key or try again later."
          };
        }
      } else {
        // For Anthropic and other providers, fall back to regular screenshot processing
        console.log("Using regular screenshot processing (no audio support for this provider)");
        return await this.processScreenshotsHelper(screenshots, signal);
      }
      
      // Update progress and continue with solution generation
      if (mainWindow) {
        mainWindow.webContents.send("processing-status", {
          message: "Problem analyzed with audio context. Generating solution...",
          progress: 40
        });
      }

      // Store enhanced problem info
      this.deps.setProblemInfo(problemInfo);

      // Send success event and generate solutions
      if (mainWindow) {
        mainWindow.webContents.send(
          this.deps.PROCESSING_EVENTS.PROBLEM_EXTRACTED,
          problemInfo
        );

        const solutionsResult = await this.generateSolutionsHelper(signal);
        if (solutionsResult.success) {
          mainWindow.webContents.send("processing-status", {
            message: "Solution generated with audio enhancement",
            progress: 100
          });
          
          return { success: true, data: solutionsResult.data };
        } else {
          throw new Error(solutionsResult.error || "Failed to generate solutions");
        }
      }

      return { success: false, error: "Failed to process with audio" };
    } catch (error: any) {
      console.error("Audio-enhanced processing error:", error);
      return { success: false, error: error.message || "Failed to process with audio" };
    }
  }

  /**
   * Process audio-only without screenshots
   */
  private async processAudioOnly(transcript: string, signal: AbortSignal): Promise<void> {
    const config = configHelper.loadConfig();
    const mainWindow = this.deps.getMainWindow();

    if (!mainWindow) {
      console.error("No main window available for processing");
      return;
    }

    try {
      console.log("Processing audio-only transcript");
      
      // Send initial processing event
      this.deps.setView("solutions");
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_START);

      // Send progress update
      mainWindow.webContents.send("processing-status", {
        message: "Analyzing audio transcript for coding problem...",
        progress: 20
      });

      // Create a simple problem analysis from the transcript
      const problemInfo = {
        problem_statement: `Based on audio transcript: ${transcript}`,
        constraints: "Derived from audio analysis",
        examples: [],
        timestamp: Date.now()
      };

      this.deps.setProblemInfo(problemInfo);

      // Send problem extracted event
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.PROBLEM_EXTRACTED, problemInfo);

      // Generate solutions based on the transcript
      await this.generateSolutionsFromAudioOnly(transcript, signal);

    } catch (error: any) {
      console.error("Error in audio-only processing:", error);
      
      if (mainWindow && !signal.aborted) {
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR);
      }
    }
  }

  /**
   * Generate solutions from audio transcript only
   */
  private async generateSolutionsFromAudioOnly(transcript: string, signal: AbortSignal): Promise<void> {
    const config = configHelper.loadConfig();
    const mainWindow = this.deps.getMainWindow();

    if (!mainWindow) return;

    try {
      // Send progress update
      mainWindow.webContents.send("processing-status", {
        message: "Generating solution from audio description...",
        progress: 60
      });

      const language = await this.getLanguage();
      
      // Create prompt for audio-only solution generation
      const promptText = `
Based on this audio transcript of a coding problem discussion, please:

1. Identify the core coding problem being described
2. Provide a complete solution with detailed explanation
3. Include time/space complexity analysis
4. Add relevant examples and test cases

AUDIO TRANSCRIPT:
${transcript}

Please provide:
- Clear problem statement interpretation
- Step-by-step solution approach
- Complete code implementation in ${language}
- Complexity analysis
- Example walkthrough

Format your response with clear sections and code blocks.
`;

      let response: string = "";

      // Process based on the selected provider
      if (config.apiProvider === "openai") {
        const solutionResponse = await this.openaiClient.chat.completions.create({
          model: config.solutionModel || "gpt-4o",
          messages: [{ role: "user", content: promptText }],
          max_tokens: 4000,
          temperature: 0.1
        }, { signal });

        response = solutionResponse.choices[0]?.message?.content || "No solution generated";
      } else if (config.apiProvider === "gemini") {
        const geminiResponse = await axios.default.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${config.solutionModel || "gemini-1.5-flash"}:generateContent?key=${config.apiKey}`,
          {
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              maxOutputTokens: 4000,
              temperature: 0.1
            }
          },
          { signal }
        );

        response = geminiResponse.data.candidates?.[0]?.content?.parts?.[0]?.text || "No solution generated";
      } else if (config.apiProvider === "anthropic") {
        const anthropicResponse = await this.anthropicClient.messages.create({
          model: config.solutionModel || "claude-3-sonnet-20240229",
          max_tokens: 4000,
          temperature: 0.1,
          messages: [{ role: "user", content: promptText }]
        }, { signal });

        const textContent = anthropicResponse.content.find(c => c.type === 'text');
        response = textContent?.text || "No solution generated";
      }

      if (signal.aborted) return;

      // Send success event with the generated solution
      mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.SOLUTION_SUCCESS, {
        solutions: [response],
        fromAudio: true
      });

      // Send final progress update
      mainWindow.webContents.send("processing-status", {
        message: "Audio-only processing complete!",
        progress: 100
      });

      

    } catch (error: any) {
      console.error("Error generating solutions from audio:", error);
      
      if (mainWindow && !signal.aborted) {
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR);
      }
    }
  }

  /**
   * Enhanced processScreenshots method that automatically includes the most recent audio recording if available
   */
  public async processScreenshotsWithAudio(): Promise<void> {
    const config = configHelper.loadConfig();
    const mainWindow = this.deps.getMainWindow();

    if (!mainWindow) {
      console.error("No main window available for processing");
      return;
    }

    // Prevent multiple simultaneous processing attempts
    if (this.currentProcessingAbortController) {
      console.log("Processing already in progress, cancelling previous attempt");
      this.currentProcessingAbortController.abort();
    }

    // Check what we have available for processing
    const screenshotQueue = this.deps.getScreenshotQueue();
    const hasScreenshots = screenshotQueue.length > 0;

    try {
      // Send initial processing status
      mainWindow.webContents.send("processing-status", {
        message: "Initializing processing...",
        progress: 1
      });

      // Check if audio transcription is available for current provider
      const availability = this.audioTranscriptionHelper.isTranscriptionAvailable();
      
      // If audio is available, try to get the most recent recording or stop ongoing recording
      if (availability.available) {
        try {
          // We need to get the audio helper from main process to check for recordings
          const audioHelper = this.deps.getAudioHelper?.();
          if (audioHelper) {
            let recordingToUse: any = null;
            
            // Check if there's an ongoing recording and stop it first
            if (audioHelper.isRecording()) {
              console.log("Stopping ongoing recording for immediate processing...");
              
              // Send status update
              mainWindow.webContents.send("processing-status", {
                message: "Stopping recording and processing with audio...",
                progress: 5
              });
              
              // Add timeout to prevent hanging
              const stopResult = await Promise.race([
                audioHelper.stopRecording(),
                new Promise<{ success: boolean; error: string }>((_, reject) => 
                  setTimeout(() => reject(new Error("Stop recording timeout")), 5000)
                )
              ]) as { success: boolean; recording?: any; error?: string };
              
              if (stopResult.success && stopResult.recording) {
                recordingToUse = stopResult.recording;
                console.log(`Using just-stopped recording: ${recordingToUse.id}`);
                
                // Notify UI that recording was stopped
                mainWindow.webContents.send("audio-recording-stopped", stopResult.recording);
              } else {
                console.log(`Failed to stop recording: ${stopResult.error}, checking for recent recordings`);
              }
            }
            
            // If no recording was just stopped, look for recent recordings
            if (!recordingToUse) {
              const recordings = audioHelper.getRecordings();
              
              if (recordings.length > 0) {
                // Use the most recent recording (recordings are sorted by timestamp, newest first)
                const mostRecentRecording = recordings[0];
                const recordingAge = Date.now() - mostRecentRecording.timestamp;
                
                // Only use recordings from the last 10 minutes to avoid using old recordings
                const TEN_MINUTES = 10 * 60 * 1000;
                
                if (recordingAge <= TEN_MINUTES) {
                  recordingToUse = mostRecentRecording;
                  console.log(`Using recent audio recording: ${recordingToUse.id} (${Math.floor(recordingAge / 1000)}s ago)`);
                } else {
                  console.log(`Most recent recording is too old (${Math.floor(recordingAge / 60000)} minutes), using screenshot-only processing`);
                }
              } else {
                console.log("No audio recordings available, using screenshot-only processing");
              }
            }
            
            // Process with the selected recording
            if (recordingToUse) {
              // Send status update
              if (mainWindow) {
                mainWindow.webContents.send("processing-status", {
                  message: "Processing with audio enhancement...",
                  progress: 10
                });
              }

              // Get the audio transcript
              const transcriptionResult = await this.transcribeAudio(audioHelper, recordingToUse.id);
              
              if (transcriptionResult.success && transcriptionResult.transcript) {
                // Prepare screenshots data (if any)
                const screenshots = hasScreenshots ? await Promise.all(
                  screenshotQueue.map(async (path) => {
                    try {
                      const data = fs.readFileSync(path).toString('base64');
                      return { path, data };
                    } catch (err) {
                      console.error(`Error reading screenshot ${path}:`, err);
                      return null;
                    }
                  })
                ) : [];

                const validScreenshots = screenshots.filter(Boolean);
                
                // Process with audio (with or without screenshots)
                const abortController = new AbortController();
                this.currentProcessingAbortController = abortController;
                
                if (validScreenshots.length > 0) {
                  console.log(`Processing with ${validScreenshots.length} screenshots + audio`);
                  await this.processWithAudio(validScreenshots, transcriptionResult.transcript, abortController.signal);
                } else {
                  console.log("Processing audio-only (no screenshots)");
                  await this.processAudioOnly(transcriptionResult.transcript, abortController.signal);
                }
                return;
              } else {
                console.log(`Audio transcription failed: ${transcriptionResult.error}`);
                if (!hasScreenshots) {
                  // No screenshots and no audio - can't process
                  mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
                  return;
                }
                console.log("Falling back to screenshot-only processing");
              }
            }
          }
        } catch (error) {
          console.error("Error trying to use audio recording:", error);
        }
      } else {
        console.log(`Audio not available for ${config.apiProvider}: ${availability.reason}`);
      }

      // Fall back to regular screenshot processing (only if we have screenshots)
      if (hasScreenshots) {
        console.log("Processing screenshots without audio");
        await this.processScreenshots();
      } else {
        console.log("No screenshots or audio available for processing");
        mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
      }

    } catch (error: any) {
      console.error("Error in enhanced processing:", error);
      
      // Fall back to regular processing (only if we have screenshots)
      if (hasScreenshots) {
        try {
          await this.processScreenshots();
        } catch (fallbackError) {
          console.error("Fallback processing also failed:", fallbackError);
          if (mainWindow) {
            mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.INITIAL_SOLUTION_ERROR);
          }
        }
      } else {
        console.log("No screenshots available for fallback processing");
        if (mainWindow) {
          mainWindow.webContents.send(this.deps.PROCESSING_EVENTS.NO_SCREENSHOTS);
        }
      }
    }
  }
}
