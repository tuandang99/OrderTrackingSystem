from app import db
from datetime import datetime

class OrderVideo(db.Model):
    """Model for order packaging videos"""
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(128), nullable=False, index=True)
    file_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<OrderVideo {self.order_id}>'
