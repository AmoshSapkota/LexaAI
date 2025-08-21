// AudioTranscriptionHelper.ts
import fs from "node:fs"
import path from "node:path"
import { OpenAI } from "openai"
import { configHelper } from "./ConfigHelper"

// Import Google Cloud Speech
const speech = require('@google-cloud/speech');

export interface TranscriptionResult {
  success: boolean;
  transcript?: string;
  error?: string;
}

export class AudioTranscriptionHelper {
  private openaiClient: OpenAI | null = null;
  private googleSpeechClient: any = null;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    const config = configHelper.loadConfig();
    
    // Initialize OpenAI client if using OpenAI
    if (config.apiProvider === "openai" && config.apiKey) {
      this.openaiClient = new OpenAI({ 
        apiKey: config.apiKey,
        timeout: 60000,
        maxRetries: 2   
      });
    }

    // Initialize Google Speech client if using Gemini and Google Cloud is configured
    if (config.apiProvider === "gemini" && config.googleCloudProjectId) {
      try {
        const clientConfig: any = {
          projectId: config.googleCloudProjectId,
        };
        
        // If key file is provided, use it
        if (config.googleCloudKeyFile && fs.existsSync(config.googleCloudKeyFile)) {
          clientConfig.keyFilename = config.googleCloudKeyFile;
        }
        
        this.googleSpeechClient = new speech.SpeechClient(clientConfig);
        console.log("Google Speech client initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Google Speech client:", error);
        this.googleSpeechClient = null;
      }
    }
  }

  /**
   * Transcribe audio using OpenAI Whisper API
   */
  private async transcribeWithOpenAI(audioBuffer: Buffer, recordingId: string): Promise<TranscriptionResult> {
    try {
      if (!this.openaiClient) {
        return {
          success: false,
          error: "OpenAI client not initialized. Please check your API key."
        };
      }

      console.log(`Starting OpenAI Whisper transcription for recording: ${recordingId}`);

      // Create a File-like object for the audio buffer
      const audioFile = new File([audioBuffer], `${recordingId}.wav`, { type: 'audio/wav' });

      // Call OpenAI Whisper API for transcription
      const transcription = await this.openaiClient.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en", // Can be made configurable
        response_format: "text"
      });

      console.log(`OpenAI Whisper transcription completed for recording: ${recordingId}`);

      return {
        success: true,
        transcript: transcription as string
      };

    } catch (error: any) {
      console.error("OpenAI Whisper transcription error:", error);
      
      // Handle specific OpenAI API errors
      if (error?.response?.status === 401) {
        return {
          success: false,
          error: "Invalid OpenAI API key. Please check your settings."
        };
      } else if (error?.response?.status === 429) {
        return {
          success: false,
          error: "OpenAI API rate limit exceeded. Please try again later."
        };
      } else if (error?.response?.status === 413) {
        return {
          success: false,
          error: "Audio file too large for transcription. Please use a shorter recording."
        };
      }

      return {
        success: false,
        error: error.message || "Failed to transcribe audio with OpenAI Whisper"
      };
    }
  }

  /**
   * Transcribe audio using Google Cloud Speech-to-Text API
   */
  private async transcribeWithGoogleSpeech(audioBuffer: Buffer, recordingId: string): Promise<TranscriptionResult> {
    try {
      if (!this.googleSpeechClient) {
        return {
          success: false,
          error: "Google Speech client not initialized. Please check your Google Cloud configuration in settings."
        };
      }

      console.log(`Starting Google Speech transcription for recording: ${recordingId}`);

      // Prepare the audio for Google Speech API
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'LINEAR16' as const,
          sampleRateHertz: 16000,
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: false,
          model: 'latest_short', // Optimized for short audio clips
        },
      };

      // Perform the transcription
      const [response] = await this.googleSpeechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        return {
          success: false,
          error: "No speech recognized in the audio file."
        };
      }

      // Extract the transcription from the response
      const transcription = response.results
        .map((result: any) => result.alternatives[0].transcript)
        .join(' ')
        .trim();

      console.log(`Google Speech transcription completed for recording: ${recordingId}`);

      return {
        success: true,
        transcript: transcription
      };

    } catch (error: any) {
      console.error("Google Speech transcription error:", error);
      
      // Handle specific Google Cloud API errors
      if (error.code === 7) { // PERMISSION_DENIED
        return {
          success: false,
          error: "Permission denied. Please check your Google Cloud service account key and permissions."
        };
      } else if (error.code === 3) { // INVALID_ARGUMENT
        return {
          success: false,
          error: "Invalid audio format or configuration. Please ensure audio is in the correct format."
        };
      } else if (error.code === 8) { // RESOURCE_EXHAUSTED
        return {
          success: false,
          error: "Google Cloud quota exceeded. Please check your usage limits."
        };
      }

      return {
        success: false,
        error: error.message || "Failed to transcribe audio with Google Speech"
      };
    }
  }

  /**
   * Anthropic doesn't support audio transcription - return appropriate error
   */
  private async transcribeWithAnthropic(audioBuffer: Buffer, recordingId: string): Promise<TranscriptionResult> {
    return {
      success: false,
      error: "Audio transcription is not available with Anthropic. Anthropic processes screenshots only. Switch to OpenAI or Gemini for audio features."
    };
  }

  /**
   * Main transcription method that routes to the appropriate provider
   */
  public async transcribeAudio(audioBuffer: Buffer, recordingId: string): Promise<TranscriptionResult> {
    const config = configHelper.loadConfig();

    try {
      switch (config.apiProvider) {
        case "openai":
          return await this.transcribeWithOpenAI(audioBuffer, recordingId);
        
        case "gemini":
          // Try Google Speech first, fallback to OpenAI if not configured
          if (this.googleSpeechClient) {
            return await this.transcribeWithGoogleSpeech(audioBuffer, recordingId);
          } else {
            return {
              success: false,
              error: "Google Cloud Speech not configured. Please add Google Cloud Project ID and optionally a service account key file in settings for audio transcription with Gemini."
            };
          }
        
        case "anthropic":
          return await this.transcribeWithAnthropic(audioBuffer, recordingId);
        
        default:
          return {
            success: false,
            error: "Unsupported API provider for audio transcription"
          };
      }
    } catch (error: any) {
      console.error("Audio transcription error:", error);
      return {
        success: false,
        error: error.message || "Failed to transcribe audio"
      };
    }
  }

  /**
   * Check if transcription is available for the current provider
   */
  public isTranscriptionAvailable(): { available: boolean; reason?: string } {
    const config = configHelper.loadConfig();

    switch (config.apiProvider) {
      case "openai":
        return { 
          available: !!this.openaiClient,
          reason: this.openaiClient ? undefined : "OpenAI API key not configured"
        };
      
      case "gemini":
        return {
          available: !!this.googleSpeechClient,
          reason: this.googleSpeechClient ? undefined : "Google Cloud Speech not configured. Please add Project ID and optionally service account key in settings."
        };
      
      case "anthropic":
        return {
          available: false,
          reason: "Audio transcription is not available with Anthropic. Anthropic processes screenshots only. Switch to OpenAI or Gemini for audio features."
        };
      
      default:
        return {
          available: false,
          reason: "Unsupported API provider for audio transcription"
        };
    }
  }

  /**
   * Reinitialize clients when configuration changes
   */
  public reinitialize(): void {
    this.openaiClient = null;
    this.googleSpeechClient = null;
    this.initializeClients();
  }
}