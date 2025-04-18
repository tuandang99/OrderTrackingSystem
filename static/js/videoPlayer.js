/**
 * Video player functionality for the videos page
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Video.js player
    let player = null;
    
    // DOM elements
    const videoPreviewModal = document.getElementById('videoPreviewModal');
    const previewOrderId = document.getElementById('previewOrderId');
    const downloadVideoBtn = document.getElementById('downloadVideoBtn');
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    
    // Current video being deleted
    let currentVideoId = null;
    
    // Initialize modals
    const videoModal = new bootstrap.Modal(videoPreviewModal);
    const deleteModal = new bootstrap.Modal(deleteConfirmModal);
    
    // Handle video preview button clicks
    document.querySelectorAll('.preview-btn').forEach(button => {
        button.addEventListener('click', function() {
            const videoSrc = this.getAttribute('data-video-src');
            const orderId = this.getAttribute('data-order-id');
            
            // Set modal content
            previewOrderId.textContent = orderId;
            downloadVideoBtn.href = videoSrc;
            
            // Initialize or update video player
            if (player) {
                player.src({ src: videoSrc, type: 'video/mp4' });
            } else {
                player = videojs('videoPlayer', {
                    controls: true,
                    autoplay: false,
                    preload: 'auto',
                    fluid: true,
                    playbackRates: [0.5, 1, 1.5, 2]
                });
                
                player.src({ src: videoSrc, type: 'video/mp4' });
            }
            
            // Show modal
            videoModal.show();
        });
    });
    
    // Handle video player modal close
    videoPreviewModal.addEventListener('hidden.bs.modal', function() {
        if (player) {
            player.pause();
        }
    });
    
    // Handle delete button clicks
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            currentVideoId = this.getAttribute('data-video-id');
            deleteModal.show();
        });
    });
    
    // Handle delete confirmation
    confirmDeleteBtn.addEventListener('click', function() {
        if (!currentVideoId) return;
        
        // Send delete request to server
        fetch(`/delete-video/${currentVideoId}`, {
            method: 'POST'
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Hide modal
                deleteModal.hide();
                
                // Reload page to show updated list
                window.location.reload();
            } else {
                throw new Error(data.error || 'Error deleting video');
            }
        })
        .catch(error => {
            console.error('Delete error:', error);
            alert('Error deleting video: ' + error.message);
            deleteModal.hide();
        });
    });
});
