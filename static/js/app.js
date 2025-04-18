/**
 * Main application script - Initialize components and handle events
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    const qrScanner = new QRScanner('videoFeed', 'qrOverlay');
    const videoRecorder = new VideoRecorder('videoFeed');
    
    // DOM elements
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    const orderIdInput = document.getElementById('orderIdInput');
    const scanButton = document.getElementById('scanButton');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const cameraStatusText = document.getElementById('cameraStatusText');
    const cameraIndicator = document.getElementById('cameraIndicator');
    const recordingStatusText = document.getElementById('recordingStatusText');
    const recordingStatusIndicator = document.getElementById('recordingStatusIndicator');
    const recordingTime = document.getElementById('recordingTime');
    const savedVideoAlert = document.getElementById('savedVideoAlert');
    const lastSavedVideo = document.getElementById('lastSavedVideo');
    const lastVideoLink = document.getElementById('lastVideoLink');
    const qrSuccess = document.getElementById('qrSuccess');
    const qrSuccessText = document.getElementById('qrSuccessText');
    const cameraStatus = document.getElementById('cameraStatus');
    
    // Variables
    let recordingInterval;
    let recordingSeconds = 0;
    let isRecording = false;
    
    // Initialize camera
    qrScanner.initCamera()
        .then(() => {
            // Update camera status
            cameraStatusText.textContent = 'Camera ready';
            cameraIndicator.className = 'bg-success rounded-circle me-2';
            cameraStatus.className = 'badge bg-success';
            cameraStatus.innerHTML = '<i class="fas fa-check-circle me-1"></i> Camera Ready';
            
            // Enable buttons
            startRecordingBtn.disabled = false;
            
            // Start QR scanning
            qrScanner.startScanning();
        })
        .catch(error => {
            console.error('Camera initialization error:', error);
            cameraStatusText.textContent = 'Camera error: ' + error.message;
            cameraIndicator.className = 'bg-danger rounded-circle me-2';
            cameraStatus.className = 'badge bg-danger';
            cameraStatus.innerHTML = '<i class="fas fa-times-circle me-1"></i> Camera Error';
        });
    
    // QR code detected event
    qrScanner.onQRCodeDetected = (qrData) => {
        // Set the order ID
        orderIdInput.value = qrData;
        
        // Show success notification
        qrSuccessText.textContent = `QR Code Detected: ${qrData}`;
        qrSuccess.classList.add('show');
        
        setTimeout(() => {
            qrSuccess.classList.remove('show');
        }, 3000);
        
        // Automatically start recording if not already recording
        if (!isRecording && orderIdInput.value) {
            startRecording();
        }
    };
    
    // Start recording button event
    startRecordingBtn.addEventListener('click', () => {
        if (orderIdInput.value.trim() === '') {
            alert('Please scan a QR code or enter an Order ID');
            return;
        }
        
        startRecording();
    });
    
    // Stop recording button event
    stopRecordingBtn.addEventListener('click', stopRecording);
    
    // Scan QR button event
    scanButton.addEventListener('click', () => {
        qrScanner.startScanning();
    });
    
    // Start recording function
    function startRecording() {
        if (isRecording) return;
        
        isRecording = true;
        
        // Update UI
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        recordingIndicator.style.display = 'flex';
        recordingStatusText.textContent = 'Recording in progress';
        recordingStatusIndicator.className = 'bg-danger rounded-circle me-2';
        
        // Reset timer
        recordingSeconds = 0;
        updateRecordingTime();
        
        // Start timer
        recordingInterval = setInterval(() => {
            recordingSeconds++;
            updateRecordingTime();
        }, 1000);
        
        // Start recording
        videoRecorder.startRecording()
            .catch(error => {
                console.error('Recording error:', error);
                stopRecording();
                alert('Recording error: ' + error.message);
            });
    }
    
    // Stop recording function
    function stopRecording() {
        if (!isRecording) return;
        
        isRecording = false;
        
        // Update UI
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        recordingIndicator.style.display = 'none';
        recordingStatusText.textContent = 'Not recording';
        recordingStatusIndicator.className = 'bg-secondary rounded-circle me-2';
        
        // Stop timer
        clearInterval(recordingInterval);
        
        // Stop recording and save video
        videoRecorder.stopRecording()
            .then(videoBlob => {
                const formData = new FormData();
                formData.append('video', videoBlob, 'recording.mp4');
                formData.append('order_id', orderIdInput.value);
                
                // Show saving status
                recordingStatusText.textContent = 'Saving video...';
                
                // Upload video to server
                return fetch('/save-video', {
                    method: 'POST',
                    body: formData
                });
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success message
                    savedVideoAlert.classList.remove('d-none');
                    recordingStatusText.textContent = 'Video saved';
                    
                    // Show last saved video link
                    lastSavedVideo.classList.remove('d-none');
                    lastVideoLink.textContent = data.order_id;
                    lastVideoLink.href = `/static/${data.file_path}`;
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        savedVideoAlert.classList.add('d-none');
                    }, 5000);
                } else {
                    throw new Error(data.error || 'Error saving video');
                }
            })
            .catch(error => {
                console.error('Video saving error:', error);
                recordingStatusText.textContent = 'Error saving video';
                alert('Error saving video: ' + error.message);
            });
    }
    
    // Update recording time display
    function updateRecordingTime() {
        const minutes = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
        const seconds = (recordingSeconds % 60).toString().padStart(2, '0');
        recordingTime.textContent = `${minutes}:${seconds}`;
    }
});
