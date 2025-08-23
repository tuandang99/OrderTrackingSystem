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
                // Create MediaRecorder with options for 4K quality
                this.mediaRecorder = new MediaRecorder(this.videoElement.srcObject, {
                    mimeType: this.getSupportedMimeType(),
                    videoBitsPerSecond: 15000000 // 15 Mbps for 4K quality
                });
                
                // Event handler for recorded data
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.recordedChunks.push(event.data);
                    }
                };
                
                // Event handler for recording stop
                this.mediaRecorder.onstop = () => {
                    this.isRecording = false;
                };
                
                // Start recording
                this.mediaRecorder.start();
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
                reject(new Error('Not recording'));
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
                    
                    resolveStop(videoBlob);
                };
            });
            
            // Stop recording
            this.mediaRecorder.stop();
            
            // Wait for recording to stop and return video blob
            stopPromise.then(resolve).catch(reject);
        });
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
