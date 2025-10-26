/**
 * Main application script - Barcode Scanner Mode
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    const videoRecorder = new VideoRecorder('videoFeed');
    
    // DOM elements
    const startRecordingBtn = document.getElementById('startRecordingBtn');
    const stopRecordingBtn = document.getElementById('stopRecordingBtn');
    const orderIdInput = document.getElementById('orderIdInput');
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
    const recordingOverlay = document.getElementById('recordingOverlay');
    const manualOrderInput = document.getElementById('manualOrderInput');
    const manualStartBtn = document.getElementById('manualStartBtn');
    
    // Variables
    let recordingInterval;
    let recordingSeconds = 0;
    let isRecording = false;
    let scanTimeout;
    let currentOrderId = '';
    let lastScanTime = 0;
    let scanCooldown = 2000; // 2 seconds cooldown between scans to prevent duplicates
    
    // Initialize camera for recording only
    navigator.mediaDevices.getUserMedia({
        video: {
            facingMode: 'environment',
            width: { ideal: 3840 },
            height: { ideal: 2160 }
        }
    })
    .then(stream => {
        document.getElementById('videoFeed').srcObject = stream;
        
        // Update camera status
        cameraStatusText.textContent = 'Camera sẵn sàng quay';
        cameraIndicator.className = 'bg-success rounded-circle me-2';
        cameraStatus.className = 'badge bg-success';
        cameraStatus.innerHTML = '<i class="fas fa-check-circle me-1"></i> Camera Ready';
        
        // Enable buttons
        startRecordingBtn.disabled = false;
        
        // Hide overlay since we're using barcode scanner
        const qrOverlay = document.getElementById('qrOverlay');
        if (qrOverlay) {
            qrOverlay.style.display = 'none';
        }
    })
    .catch(error => {
        console.error('Camera initialization error:', error);
        cameraStatusText.textContent = 'Camera error: ' + error.message;
        cameraIndicator.className = 'bg-danger rounded-circle me-2';
        cameraStatus.className = 'badge bg-danger';
        cameraStatus.innerHTML = '<i class="fas fa-times-circle me-1"></i> Camera Error';
    });
    
    // Focus on barcode scanner input only when needed
    function focusInput() {
        orderIdInput.focus();
    }
    
    // Focus input only on initial load
    focusInput();
    
    // Barcode scanner detection
    orderIdInput.addEventListener('input', function(e) {
        const orderId = e.target.value.trim();
        
        if (orderId.length > 0) {
            // Clear any existing timeout
            clearTimeout(scanTimeout);
            
            // Set timeout to detect when scanning is complete (after 100ms of no input)
            scanTimeout = setTimeout(() => {
                handleBarcodeScanned(orderId);
            }, 100);
        }
    });
    
    // Handle barcode scanned
    function handleBarcodeScanned(orderId) {
        // Check cooldown to prevent duplicate scans
        const currentTime = Date.now();
        if (currentTime - lastScanTime < scanCooldown) {
            console.log('Scan ignored - cooldown period');
            orderIdInput.value = ''; // Clear input to prevent re-processing
            return;
        }
        
        // Update last scan time
        lastScanTime = currentTime;
        
        if (!isRecording) {
            // First scan - start recording
            qrSuccessText.textContent = `Mã đơn hàng: ${orderId} - Bắt đầu quay`;
            qrSuccess.classList.add('show');
            
            setTimeout(() => {
                qrSuccess.classList.remove('show');
            }, 2000);
            
            startRecording();
        } else {
            // Second scan - stop recording
            qrSuccessText.textContent = `Hoàn thành đóng gói - Kết thúc quay`;
            qrSuccess.classList.add('show');
            
            setTimeout(() => {
                qrSuccess.classList.remove('show');
            }, 2000);
            
            stopRecording();
        }
    }
    
    // Handle manual start button
    function handleManualStart() {
        const orderId = manualOrderInput.value.trim();
        
        if (orderId === '') {
            alert('Vui lòng nhập mã đơn hàng');
            manualOrderInput.focus();
            return;
        }
        
        if (isRecording) {
            alert('Đang quay video. Vui lòng dừng lại trước khi bắt đầu mới');
            return;
        }
        
        // Set the order ID and start recording
        orderIdInput.value = orderId;
        
        qrSuccessText.textContent = `Mã đơn hàng: ${orderId} - Bắt đầu quay (Thủ công)`;
        qrSuccess.classList.add('show');
        
        setTimeout(() => {
            qrSuccess.classList.remove('show');
        }, 2000);
        
        startRecording();
    }
    
    // Manual start button event listener
    manualStartBtn.addEventListener('click', handleManualStart);
    
    // Allow Enter key in manual input
    manualOrderInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleManualStart();
        }
    });
    
    // Start recording button event
    startRecordingBtn.addEventListener('click', () => {
        if (orderIdInput.value.trim() === '') {
            alert('Vui lòng quét mã vạch để nhập mã đơn hàng');
            focusInput();
            return;
        }
        
        startRecording();
    });
    
    // Stop recording button event
    stopRecordingBtn.addEventListener('click', stopRecording);
    
    // Start recording function
    function startRecording() {
        if (isRecording) return;
        
        isRecording = true;
        
        // Store current order ID before clearing input
        currentOrderId = orderIdInput.value.trim();
        
        // Clear input for next scan
        orderIdInput.value = '';
        
        // Update recording overlay
        recordingOverlay.classList.add('recording');
        recordingOverlay.querySelector('.status-text').innerHTML = '<i class="fas fa-video me-2"></i><div>ĐANG QUAY VIDEO</div>';
        
        // Update UI
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        recordingIndicator.style.display = 'flex';
        recordingStatusText.textContent = 'Đang quay video';
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
        
        // Update recording overlay to processing state
        recordingOverlay.classList.remove('recording');
        recordingOverlay.querySelector('.status-text').innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i><div>Đang xử lý video...</div>';
        
        // Update UI
        startRecordingBtn.disabled = false;
        stopRecordingBtn.disabled = true;
        recordingIndicator.style.display = 'none';
        recordingStatusText.textContent = 'Chưa quay';
        recordingStatusIndicator.className = 'bg-secondary rounded-circle me-2';
        
        // Stop timer
        clearInterval(recordingInterval);
        
        // Stop recording and save video
        videoRecorder.stopRecording()
            .then(videoBlob => {
                const formData = new FormData();
                formData.append('video', videoBlob, 'recording.mp4');
                formData.append('order_id', currentOrderId);
                
                // Show saving status
                recordingStatusText.textContent = 'Đang lưu video...';
                
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
                    recordingStatusText.textContent = 'Đã lưu video';
                    
                    // Show last saved video link
                    lastSavedVideo.classList.remove('d-none');
                    lastVideoLink.textContent = data.order_id;
                    lastVideoLink.href = `/static/${data.file_path}`;
                    
                    // Hide success message after 5 seconds
                    setTimeout(() => {
                        savedVideoAlert.classList.add('d-none');
                    }, 5000);
                    
                    // Reset overlay to ready state
                    recordingOverlay.classList.remove('recording');
                    recordingOverlay.querySelector('.status-text').innerHTML = '<i class="fas fa-barcode me-2"></i><div>Quét mã vạch để bắt đầu quay</div>';
                    
                    // Reset for next order
                    currentOrderId = '';
                    orderIdInput.value = '';
                    manualOrderInput.value = '';
                    focusInput();
                    
                } else {
                    throw new Error(data.error || 'Error saving video');
                }
            })
            .catch(error => {
                console.error('Video saving error:', error);
                recordingStatusText.textContent = 'Lỗi khi lưu video';
                alert('Error saving video: ' + error.message);
                
                // Reset overlay to ready state even on error
                recordingOverlay.classList.remove('recording');
                recordingOverlay.querySelector('.status-text').innerHTML = '<i class="fas fa-barcode me-2"></i><div>Quét mã vạch để bắt đầu quay</div>';
                
                // Reset for next order even on error
                currentOrderId = '';
                orderIdInput.value = '';
                manualOrderInput.value = '';
                focusInput();
            });
    }
    
    // Update recording time display
    function updateRecordingTime() {
        const minutes = Math.floor(recordingSeconds / 60).toString().padStart(2, '0');
        const seconds = (recordingSeconds % 60).toString().padStart(2, '0');
        recordingTime.textContent = `${minutes}:${seconds}`;
    }
});
