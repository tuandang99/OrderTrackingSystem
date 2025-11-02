/**
 * Video Recording class
 * Handles recording video from webcam using MediaRecorder API
 */
class VideoRecorder {
    /**
     * Create a video recorder
     * @param {string} videoElementId - ID of the video element for camera feed
     */
    constructor(videoElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.stream = null;
        this.onError = null; // Callback for errors
        this.onStreamEnd = null; // Callback when stream ends unexpectedly
    }
    
    /**
     * Start recording video
     * @returns {Promise} Promise that resolves when recording starts
     */
    startRecording() {
        return new Promise((resolve, reject) => {
            if (this.isRecording) {
                reject(new Error('Already recording'));
                return;
            }
            
            if (!this.videoElement || !this.videoElement.srcObject) {
                reject(new Error('Video stream not available'));
                return;
            }
            
            // Clear previous recording data
            this.recordedChunks = [];
            
            try {
                this.stream = this.videoElement.srcObject;
                
                // Create MediaRecorder with options for 4K quality
                this.mediaRecorder = new MediaRecorder(this.stream, {
                    mimeType: this.getSupportedMimeType(),
                    videoBitsPerSecond: 15000000 // 15 Mbps for 4K quality
                });
                
                // Event handler for recorded data - receives chunks every second
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.recordedChunks.push(event.data);
                        console.log(`Recorded chunk: ${event.data.size} bytes, total chunks: ${this.recordedChunks.length}`);
                    }
                };
                
                // Event handler for recording stop
                this.mediaRecorder.onstop = () => {
                    this.isRecording = false;
                };
                
                // Event handler for errors
                this.mediaRecorder.onerror = (event) => {
                    console.error('MediaRecorder error:', event.error);
                    this.isRecording = false;
                    if (this.onError) {
                        this.onError(event.error);
                    }
                };
                
                // Monitor stream tracks for unexpected end
                this.stream.getTracks().forEach(track => {
                    track.onended = () => {
                        console.warn('Track ended unexpectedly');
                        if (this.isRecording && this.onStreamEnd) {
                            this.onStreamEnd();
                        }
                    };
                });
                
                // Start recording with timeslice of 1000ms (1 second)
                // This ensures data is captured every second, so we don't lose everything if there's an error
                this.mediaRecorder.start(1000);
                this.isRecording = true;
                resolve();
            } catch (error) {
                reject(error);
            }
        });
    }
    
    /**
     * Stop recording video
     * @returns {Promise<Blob>} Promise that resolves with the recorded video blob
     */
    stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.isRecording || !this.mediaRecorder) {
                // If not recording but we have chunks, return them anyway (error recovery)
                if (this.recordedChunks.length > 0) {
                    console.log('Recovering video from chunks despite not recording state');
                    const videoBlob = new Blob(this.recordedChunks, {
                        type: this.getSupportedMimeType()
                    });
                    resolve(videoBlob);
                } else {
                    reject(new Error('Not recording'));
                }
                return;
            }
            
            // Create promise that resolves when recording stops
            const stopPromise = new Promise(resolveStop => {
                this.mediaRecorder.onstop = () => {
                    this.isRecording = false;
                    
                    // Create video blob from recorded chunks
                    const videoBlob = new Blob(this.recordedChunks, {
                        type: this.getSupportedMimeType()
                    });
                    
                    console.log(`Final video: ${videoBlob.size} bytes from ${this.recordedChunks.length} chunks`);
                    resolveStop(videoBlob);
                };
            });
            
            try {
                // Stop recording
                this.mediaRecorder.stop();
                
                // Wait for recording to stop and return video blob
                stopPromise.then(resolve).catch(reject);
            } catch (error) {
                // If stop fails, try to recover chunks anyway
                console.error('Error stopping recording, attempting recovery:', error);
                if (this.recordedChunks.length > 0) {
                    const videoBlob = new Blob(this.recordedChunks, {
                        type: this.getSupportedMimeType()
                    });
                    resolve(videoBlob);
                } else {
                    reject(error);
                }
            }
        });
    }
    
    /**
     * Force save current recording (emergency save)
     * @returns {Blob|null} Video blob if chunks are available
     */
    emergencySave() {
        if (this.recordedChunks.length > 0) {
            console.log(`Emergency save: ${this.recordedChunks.length} chunks`);
            return new Blob(this.recordedChunks, {
                type: this.getSupportedMimeType()
            });
        }
        return null;
    }
    
    /**
     * Get supported MIME type for video recording
     * @returns {string} Supported MIME type
     */
    getSupportedMimeType() {
        // Try different MIME types in order of preference
        const mimeTypes = [
            'video/webm;codecs=h264',
            'video/webm;codecs=vp9',
            'video/webm',
            'video/mp4'
        ];
        
        for (const mimeType of mimeTypes) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }
        
        // Fallback to generic video
        return 'video/webm';
    }
}
