// AudioHelper.ts
import fs from "node:fs"
import path from "node:path"
import { app } from "electron"
import { EventEmitter } from "events"
// Conditional import for PvRecorder to handle missing native modules
let PvRecorder: any = null;
try {
  PvRecorder = require("@picovoice/pvrecorder-node").PvRecorder;
} catch (error) {
  console.warn("PvRecorder not available - audio recording disabled:", error.message);
}
import { WaveFile } from "wavefile"

export interface AudioRecording {
  id: string;
  filePath: string;
  duration: number;
  timestamp: number;
}

export class AudioHelper extends EventEmitter {
  private audioDir: string;
  private isCurrentlyRecording: boolean = false;
  private currentRecordingId: string | null = null;
  private currentRecordingPath: string | null = null;
  private recordingStartTime: number = 0;
  private recorder: PvRecorder | null = null;
  private audioData: Int16Array = new Int16Array(0);

  constructor() {
    super();

    // Create recordings directory in user data
    try {
      this.audioDir = path.join(app.getPath('userData'), 'recordings');
      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
      }
    } catch (err) {
      console.warn('Could not create recordings directory, using fallback');
      this.audioDir = path.join(process.cwd(), 'recordings');
      if (!fs.existsSync(this.audioDir)) {
        fs.mkdirSync(this.audioDir, { recursive: true });
      }
    }

    console.log('Recordings directory:', this.audioDir);
  }

  /**
   * Start recording audio
   */
  public async startRecording(): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      if (!PvRecorder) {
        return { success: false, error: "PvRecorder not available - audio recording disabled" };
      }

      if (this.isCurrentlyRecording) {
        return { success: false, error: "Recording already in progress" };
      }

      this.currentRecordingId = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.currentRecordingPath = path.join(this.audioDir, `${this.currentRecordingId}.wav`);
      this.recordingStartTime = Date.now();
      this.audioData = new Int16Array(0);

      this.recorder = new PvRecorder(512);
      this.recorder.start();
      this.isCurrentlyRecording = true;

      console.log(`Started audio recording: ${this.currentRecordingId}`);
      this.emit('recording-started', { id: this.currentRecordingId });

      // Start background reading loop
      this.startReadingLoop();

      return { success: true, id: this.currentRecordingId };
    } catch (error: any) {
      console.error('Error starting audio recording:', error);
      this.isCurrentlyRecording = false;
      this.cleanup();
      return { success: false, error: error.message || 'Failed to start recording' };
    }
  }

  /**
   * Background loop to read audio frames
   */
  private async startReadingLoop(): Promise<void> {
    try {
      while (this.isCurrentlyRecording && this.recorder) {
        try {
          const frame = await this.recorder.read();
          if (frame && frame.length > 0) {
            const newAudioData = new Int16Array(this.audioData.length + frame.length);
            newAudioData.set(this.audioData, 0);
            newAudioData.set(frame, this.audioData.length);
            this.audioData = newAudioData;
          }
        } catch (readError) {
          console.error('Error reading audio frame:', readError);
          // Continue reading unless we're stopping
          if (!this.isCurrentlyRecording) {
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error in audio reading loop:', error);
      this.isCurrentlyRecording = false;
    }
  }

  /**
   * Stop recording audio
   */
  public async stopRecording(): Promise<{ success: boolean; recording?: AudioRecording; error?: string }> {
    try {
      if (!this.isCurrentlyRecording || !this.currentRecordingId || !this.currentRecordingPath) {
        return { success: false, error: "No recording in progress" };
      }

      // Stop the recording first
      this.isCurrentlyRecording = false;

      // Give a moment for the reading loop to finish
      await new Promise(resolve => setTimeout(resolve, 100));

      if (this.recorder) {
        this.recorder.stop();
      }

      const duration = Date.now() - this.recordingStartTime;

      // Check if we have audio data
      if (this.audioData.length === 0) {
        console.warn('No audio data captured during recording');
        this.cleanup();
        return { success: false, error: "No audio data captured" };
      }

      const wav = new WaveFile();
      wav.fromScratch(1, this.recorder?.sampleRate || 16000, '16', this.audioData);
      fs.writeFileSync(this.currentRecordingPath, wav.toBuffer());

      const recording: AudioRecording = {
        id: this.currentRecordingId,
        filePath: this.currentRecordingPath,
        duration,
        timestamp: this.recordingStartTime
      };

      console.log(`Stopped audio recording: ${this.currentRecordingId}, duration: ${duration}ms, data length: ${this.audioData.length}`);

      // Store the recording for return before cleanup
      const recordingToReturn = { ...recording };

      // Clean up
      this.cleanup();

      this.emit('recording-stopped', recordingToReturn);

      return { success: true, recording: recordingToReturn };
    } catch (error: any) {
      console.error('Error stopping audio recording:', error);
      this.cleanup();
      return { success: false, error: error.message || 'Failed to stop recording' };
    }
  }

  /**
   * Clean up recording resources
   */
  private cleanup(): void {
    try {
      if (this.recorder) {
        this.recorder.release();
        this.recorder = null;
      }
    } catch (error) {
      console.error('Error during recorder cleanup:', error);
    }

    this.isCurrentlyRecording = false;
    this.currentRecordingId = null;
    this.currentRecordingPath = null;
    this.recordingStartTime = 0;
    this.audioData = new Int16Array(0);
  }

  /**
   * Check if currently recording
   */
  public isRecording(): boolean {
    return this.isCurrentlyRecording;
  }

  /**
   * Get current recording info
   */
  public getCurrentRecording(): { id: string; duration: number } | null {
    if (!this.currentRecordingId || !this.recordingStartTime) {
      return null;
    }

    return {
      id: this.currentRecordingId,
      duration: Date.now() - this.recordingStartTime
    };
  }

  /**
   * Get all audio recordings
   */
  public getRecordings(): AudioRecording[] {
    try {
      const files = fs.readdirSync(this.audioDir);
      const audioFiles = files.filter(file => file.endsWith('.wav'));

      return audioFiles.map(file => {
        const filePath = path.join(this.audioDir, file);
        const stats = fs.statSync(filePath);
        const id = path.basename(file, '.wav');

        return {
          id,
          filePath,
          duration: 0, // We'll need to calculate this if needed
          timestamp: stats.mtime.getTime()
        };
      }).sort((a, b) => b.timestamp - a.timestamp); // Sort by newest first
    } catch (error) {
      console.error('Error getting recordings:', error);
      return [];
    }
  }

  /**
   * Delete a recording
   */
  public deleteRecording(id: string): { success: boolean; error?: string } {
    try {
      const filePath = path.join(this.audioDir, `${id}.wav`);

      if (!fs.existsSync(filePath)) {
        return { success: false, error: "Recording file not found" };
      }

      fs.unlinkSync(filePath);
      console.log(`Deleted audio recording: ${id}`);

      this.emit('recording-deleted', { id });

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting recording:', error);
      return { success: false, error: error.message || 'Failed to delete recording' };
    }
  }

  /**
   * Clear all recordings
   */
  public async clearAllRecordings(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("Starting clearAllRecordings...");

      // Stop any ongoing recording first with proper cleanup
      if (this.isCurrentlyRecording) {
        console.log("Stopping ongoing recording before clearing all...");
        await this.stopRecording(); // Use stopRecording to ensure graceful shutdown
      }

      const recordings = this.getRecordings();
      console.log(`Found ${recordings.length} recordings to clear`);

      // Note: recordings are stored as files, not in memory

      // Delete recording files
      for (const recording of recordings) {
        try {
          if (fs.existsSync(recording.filePath)) {
            fs.unlinkSync(recording.filePath);
            console.log(`Deleted recording: ${recording.filePath}`);
          }
        } catch (deleteError) {
          console.error(`Error deleting recording ${recording.filePath}:`, deleteError);
          // Continue with other files even if one fails
        }
      }

      // Also clean up any orphaned files directly from the audio directory
      try {
        if (fs.existsSync(this.audioDir)) {
          const audioFiles = fs.readdirSync(this.audioDir).filter(file => file.endsWith('.wav'));
          console.log(`Found ${audioFiles.length} audio files to clean up`);

          for (const file of audioFiles) {
            const filePath = path.join(this.audioDir, file);
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted orphaned audio file: ${filePath}`);
            } catch (deleteError) {
              console.error(`Error deleting audio file ${filePath}:`, deleteError);
              // Continue with other files even if one fails
            }
          }
        }
      } catch (dirError) {
        console.error('Error reading audio directory:', dirError);
      }

      // Reset current recording references
      this.currentRecordingId = null;
      this.currentRecordingPath = null;

      console.log(`Successfully cleared all audio recordings and files`);
      this.emit('recordings-cleared');

      return { success: true };
    } catch (error: any) {
      console.error('Error clearing recordings:', error);
      return { success: false, error: error.message || 'Failed to clear recordings' };
    }
  }

  /**
   * Get audio file as base64 for API calls
   */
  public getAudioAsBase64(id: string): string | null {
    try {
      const filePath = path.join(this.audioDir, `${id}.wav`);

      if (!fs.existsSync(filePath)) {
        console.error(`Audio file not found: ${filePath}`);
        return null;
      }

      const audioBuffer = fs.readFileSync(filePath);
      return audioBuffer.toString('base64');
    } catch (error) {
      console.error('Error reading audio file:', error);
      return null;
    }
  }

  /**
   * Get audio file buffer for transcription
   */
  public getAudioBuffer(id: string): Buffer | null {
    try {
      const filePath = path.join(this.audioDir, `${id}.wav`);

      if (!fs.existsSync(filePath)) {
        console.error(`Audio file not found: ${filePath}`);
        return null;
      }

      return fs.readFileSync(filePath);
    } catch (error) {
      console.error('Error reading audio file buffer:', error);
      return null;
    }
  }

  /**
   * Clean up old recordings automatically (older than 1 hour)
   */
  public cleanupOldRecordings(): { success: boolean; cleaned: number; error?: string } {
    try {
      console.log("Starting automatic cleanup of old recordings...");

      const recordings = this.getRecordings();
      const ONE_HOUR = 60 * 60 * 1000;
      const now = Date.now();
      let cleanedCount = 0;

      for (const recording of recordings) {
        const age = now - recording.timestamp;

        if (age > ONE_HOUR) {
          try {
            if (fs.existsSync(recording.filePath)) {
              fs.unlinkSync(recording.filePath);
              console.log(`Cleaned up old recording: ${recording.id} (${Math.floor(age / 60000)} minutes old)`);
              cleanedCount++;
            }
          } catch (deleteError) {
            console.error(`Error deleting old recording ${recording.filePath}:`, deleteError);
          }
        }
      }

      // Also clean up any orphaned files in the audio directory
      try {
        if (fs.existsSync(this.audioDir)) {
          const audioFiles = fs.readdirSync(this.audioDir).filter(file => file.endsWith('.wav'));

          for (const file of audioFiles) {
            const filePath = path.join(this.audioDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtime.getTime();

            if (fileAge > ONE_HOUR) {
              try {
                fs.unlinkSync(filePath);
                console.log(`Cleaned up orphaned audio file: ${file}`);
                cleanedCount++;
              } catch (deleteError) {
                console.error(`Error deleting orphaned file ${filePath}:`, deleteError);
              }
            }
          }
        }
      } catch (dirError) {
        console.error('Error during orphaned file cleanup:', dirError);
      }

      if (cleanedCount > 0) {
        console.log(`Cleanup completed: removed ${cleanedCount} old recordings`);
        this.emit('recordings-cleaned', { count: cleanedCount });
      }

      return { success: true, cleaned: cleanedCount };
    } catch (error: any) {
      console.error('Error during automatic cleanup:', error);
      return { success: false, cleaned: 0, error: error.message || 'Cleanup failed' };
    }
  }
}
