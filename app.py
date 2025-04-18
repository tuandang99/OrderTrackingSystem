import os
import logging
from datetime import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix
import cv2
import numpy as np

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class Base(DeclarativeBase):
    pass

# Create app and configure
db = SQLAlchemy(model_class=Base)
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)

# Configure the SQLite database (using a file-based database for simplicity)
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///ordervideos.db")
app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)

# Ensure videos directory exists
VIDEOS_DIR = os.path.join(app.static_folder, 'videos')
if not os.path.exists(VIDEOS_DIR):
    os.makedirs(VIDEOS_DIR)

# Import models
with app.app_context():
    from models import OrderVideo
    db.create_all()

@app.route('/')
def index():
    """Main page for QR scanning and recording"""
    return render_template('index.html', now=datetime.now())

@app.route('/videos')
def videos():
    """Page to view recorded videos"""
    all_videos = OrderVideo.query.order_by(OrderVideo.created_at.desc()).all()
    return render_template('videos.html', videos=all_videos, now=datetime.now())

@app.route('/search')
def search():
    """Search videos by order ID or date"""
    order_id = request.args.get('order_id', '')
    date_str = request.args.get('date', '')
    
    query = OrderVideo.query
    
    # Filter by order ID if provided
    if order_id:
        query = query.filter(OrderVideo.order_id.contains(order_id))
    
    # Filter by date if provided
    if date_str:
        try:
            search_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            query = query.filter(db.func.date(OrderVideo.created_at) == search_date)
        except ValueError:
            logger.error(f"Invalid date format: {date_str}")
    
    videos = query.order_by(OrderVideo.created_at.desc()).all()
    return render_template('videos.html', videos=videos, search_term=order_id, search_date=date_str, now=datetime.now())

@app.route('/save-video', methods=['POST'])
def save_video():
    """Save recorded video blob and associate with order ID"""
    try:
        order_id = request.form.get('order_id')
        
        if not order_id:
            return jsonify({'error': 'Order ID is required'}), 400
            
        # Check if video file was uploaded
        if 'video' not in request.files:
            return jsonify({'error': 'No video file provided'}), 400
            
        video_file = request.files['video']
        if video_file.filename == '':
            return jsonify({'error': 'Empty video file'}), 400
        
        # Create date-based directory structure
        today = datetime.now().strftime('%Y-%m-%d')
        date_dir = os.path.join(VIDEOS_DIR, today)
        
        if not os.path.exists(date_dir):
            os.makedirs(date_dir)
        
        # Generate unique filename using timestamp and order ID
        timestamp = datetime.now().strftime('%H-%M-%S')
        filename = f"{order_id}_{timestamp}.mp4"
        filepath = os.path.join(date_dir, filename)
        
        # Save the video file
        video_file.save(filepath)
        
        # Store in database
        relative_path = os.path.join('videos', today, filename)
        new_video = OrderVideo(
            order_id=order_id,
            file_path=relative_path
        )
        db.session.add(new_video)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Video saved successfully',
            'order_id': order_id,
            'file_path': relative_path
        })
        
    except Exception as e:
        logger.error(f"Error saving video: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/decode-qr', methods=['POST'])
def decode_qr():
    """Decode QR code from image data"""
    try:
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400
            
        file = request.files['image']
        
        # Read image
        nparr = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # QR code detector
        qr_detector = cv2.QRCodeDetector()
        data, bbox, _ = qr_detector.detectAndDecode(img)
        
        if data:
            return jsonify({'success': True, 'data': data})
        else:
            return jsonify({'success': False, 'message': 'No QR code detected'})
    
    except Exception as e:
        logger.error(f"Error decoding QR code: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/delete-video/<int:video_id>', methods=['POST'])
def delete_video(video_id):
    """Delete a recorded video"""
    try:
        video = OrderVideo.query.get_or_404(video_id)
        
        # Delete file from filesystem
        file_path = os.path.join(app.static_folder, video.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Delete from database
        db.session.delete(video)
        db.session.commit()
        
        return jsonify({'success': True, 'message': 'Video deleted successfully'})
    
    except Exception as e:
        logger.error(f"Error deleting video: {str(e)}")
        return jsonify({'error': str(e)}), 500
