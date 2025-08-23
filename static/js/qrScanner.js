/**
 * QR Code Scanner class
 * Handles camera initialization and QR code detection
 */
class QRScanner {
    /**
     * Create a QR scanner
     * @param {string} videoElementId - ID of the video element for camera feed
     * @param {string} overlayElementId - ID of the overlay element for status
     */
    constructor(videoElementId, overlayElementId) {
        this.videoElement = document.getElementById(videoElementId);
        this.overlayElement = document.getElementById(overlayElementId);
        this.stream = null;
        this.isScanning = false;
        this.scanInterval = null;
        this.onQRCodeDetected = null; // Callback function
    }
    
    /**
     * Initialize the camera
     * @returns {Promise} Promise that resolves when camera is initialized
     */
    initCamera() {
        return new Promise((resolve, reject) => {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                reject(new Error('Camera API is not supported in this browser'));
                return;
            }
            
            // Request camera with constraints for 4K recording
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 3840 },
                    height: { ideal: 2160 }
                }
            })
            .then(stream => {
                this.stream = stream;
                this.videoElement.srcObject = stream;
                
                // Wait for video to be ready
                this.videoElement.onloadedmetadata = () => {
                    resolve();
                };
            })
            .catch(error => {
                reject(error);
            });
        });
    }
    
    /**
     * Start scanning for QR codes
     */
    startScanning() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.overlayElement.style.display = 'flex';
        
        // Scan for QR codes every 500ms
        this.scanInterval = setInterval(() => {
            this.scanQRCode();
        }, 500);
    }
    
    /**
     * Stop scanning for QR codes
     */
    stopScanning() {
        if (!this.isScanning) return;
        
        this.isScanning = false;
        clearInterval(this.scanInterval);
    }
    
    /**
     * Scan for QR codes in the current video frame
     */
    scanQRCode() {
        if (!this.videoElement || !this.videoElement.videoWidth) return;
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size to match video
        canvas.width = this.videoElement.videoWidth;
        canvas.height = this.videoElement.videoHeight;
        
        // Draw current video frame to canvas
        context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
        
        // Convert canvas to blob for sending to server
        canvas.toBlob(blob => {
            const formData = new FormData();
            formData.append('image', blob);
            
            // Send to server for QR code detection
            fetch('/decode-qr', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data) {
                    // QR code detected, call callback with data
                    if (this.onQRCodeDetected) {
                        this.onQRCodeDetected(data.data);
                    }
                    
                    // Hide overlay
                    this.overlayElement.style.display = 'none';
                    
                    // Stop scanning after successful detection
                    this.stopScanning();
                }
            })
            .catch(error => {
                console.error('QR code scanning error:', error);
            });
        }, 'image/jpeg');
    }
    
    /**
     * Release camera resources
     */
    releaseCamera() {
        this.stopScanning();
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
    }
}
