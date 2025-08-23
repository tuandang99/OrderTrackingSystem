# Order Packaging Video Recorder

## Overview

A Flask-based web application for recording packaging videos of orders using QR code scanning. The system allows users to scan QR codes to identify orders and record videos of the packaging process, storing them for later viewing and download. Built with a focus on 4K video quality recording and real-time QR code detection.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Single Page Application Design**: Uses Jinja2 templates with Bootstrap for responsive UI
- **Modular JavaScript Components**: Separate classes for QR scanning (`QRScanner`), video recording (`VideoRecorder`), and video playback functionality
- **Real-time Video Processing**: Utilizes browser's MediaRecorder API for 4K video recording and getUserMedia for camera access
- **Progressive Enhancement**: Core functionality works without JavaScript, enhanced features require it

### Backend Architecture
- **Flask Web Framework**: Lightweight WSGI application with minimal dependencies
- **SQLAlchemy ORM**: Database abstraction layer using DeclarativeBase for modern SQLAlchemy patterns
- **File-based Storage**: Videos stored directly in filesystem under static/videos directory
- **RESTful API Design**: Clean separation between data endpoints and template rendering

### Data Storage Solutions
- **SQLite Database**: Default lightweight database for development and small deployments
- **Database Model**: Simple `OrderVideo` model tracking order ID, file path, and creation timestamp
- **File System Storage**: Videos stored as static files for direct serving and download
- **Environment-based Configuration**: Supports DATABASE_URL override for production databases

### Authentication and Authorization
- **Session Management**: Flask session handling with configurable secret key
- **No User Authentication**: Current implementation focuses on internal use without user accounts
- **Proxy-aware Configuration**: ProxyFix middleware for deployment behind reverse proxies

### External Dependencies
- **OpenCV (cv2)**: Computer vision library for potential image processing (imported but not actively used)
- **Bootstrap CSS Framework**: UI styling via CDN with dark theme
- **Font Awesome Icons**: Icon library for enhanced user interface
- **Video.js Player**: Professional video playback with controls and playback speed options
- **MediaDevices API**: Browser API for camera access and media recording
- **No External APIs**: Self-contained system without third-party service dependencies

The architecture prioritizes simplicity and local operation, making it suitable for warehouse or packaging environments where internet connectivity might be limited. The modular frontend design allows for easy extension of QR scanning and video recording capabilities.