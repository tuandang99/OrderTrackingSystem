# Order Packaging Video Recorder

Ứng dụng web Flask để quay video đóng gói đơn hàng sử dụng quét QR code. Hệ thống cho phép người dùng quét mã QR để nhận diện đơn hàng và quay video quá trình đóng gói với chất lượng 4K.

## Tính năng chính

- 🎥 **Quay video 4K**: Hỗ trợ quay video với độ phân giải 3840x2160
- 📱 **Quét QR code**: Tự động nhận diện đơn hàng qua QR code
- 🗄️ **Quản lý video**: Lưu trữ, xem, tải xuống và xóa video
- 🧹 **Tự động dọn dẹp**: Tự động xóa video cũ hơn 20 ngày
- 🔍 **Tìm kiếm**: Tìm kiếm video theo mã đơn hàng hoặc ngày
- 💾 **Lưu trữ an toàn**: Tổ chức video theo cấu trúc thư mục ngày tháng

## Yêu cầu hệ thống

- Python 3.11 trở lên
- Camera/webcam hỗ trợ độ phân giải 4K (khuyến nghị)
- Trình duyệt web hiện đại hỗ trợ WebRTC
- Ít nhất 2GB RAM và 10GB dung lượng ổ cứng

## Cài đặt

### 1. Clone repository (nếu có)
```bash
git clone <repository-url>
cd order-packaging-video-recorder
```

### 2. Cài đặt dependencies
```bash
# Sử dụng uv (khuyến nghị)
uv sync

# Hoặc sử dụng pip
pip install -r requirements.txt
```

### 3. Thiết lập biến môi trường (tùy chọn)
Tạo file `.env` hoặc thiết lập các biến môi trường:

```bash
# Khóa bí mật cho session (tự động tạo nếu không có)
SESSION_SECRET=your-secret-key-here

# URL database (mặc định sử dụng SQLite)
DATABASE_URL=sqlite:///ordervideos.db

# Hoặc sử dụng PostgreSQL
# DATABASE_URL=postgresql://user:password@localhost/dbname
```

## Chạy ứng dụng

### Chế độ development
```bash
python main.py
```

### Chế độ production (sử dụng Gunicorn)
```bash
gunicorn --bind 0.0.0.0:5000 --reuse-port --reload main:app
```

Sau khi chạy, truy cập ứng dụng tại: `http://localhost:5000`

## Cấu trúc dự án

```
├── app.py                 # Ứng dụng Flask chính
├── main.py               # Entry point
├── models.py             # Models database
├── static/               # File tĩnh
│   ├── css/
│   │   └── style.css     # Styles tùy chỉnh
│   ├── js/
│   │   ├── app.js        # Logic ứng dụng chính
│   │   ├── qrScanner.js  # Xử lý quét QR code
│   │   ├── videoRecording.js # Xử lý quay video
│   │   └── videoPlayer.js    # Xử lý phát video
│   └── videos/           # Thư mục lưu video
│       └── YYYY-MM-DD/   # Tổ chức theo ngày
├── templates/            # Templates HTML
│   ├── layout.html       # Template chính
│   ├── index.html        # Trang quay video
│   └── videos.html       # Trang xem video
├── instance/
│   └── ordervideos.db    # Database SQLite
└── README.md            # File hướng dẫn này
```

## Hướng dẫn sử dụng

### 1. Quay video mới
1. Truy cập trang chủ (`/`)
2. Cho phép truy cập camera khi được yêu cầu
3. Quét QR code của đơn hàng hoặc nhập mã đơn hàng thủ công
4. Nhấn "Start Recording" hoặc quay video sẽ tự động bắt đầu sau khi quét QR
5. Đóng gói đơn hàng trong khi quay video
6. Nhấn "Stop Recording" khi hoàn thành
7. Video sẽ được lưu tự động

### 2. Xem và quản lý video
1. Truy cập trang Videos (`/videos`)
2. Sử dụng tính năng tìm kiếm theo mã đơn hàng hoặc ngày
3. Preview video bằng cách nhấn nút "Preview"
4. Tải xuống video bằng nút "Download"
5. Xóa video không cần thiết bằng nút "Delete"

### 3. Dọn dẹp video cũ
- **Tự động**: Ứng dụng tự động xóa video cũ hơn 20 ngày khi khởi động
- **Thủ công**: Nhấn nút "Clean Old Videos (>20 days)" trên trang Videos

## API Endpoints

### Quay video và QR
- `POST /save-video` - Lưu video đã quay
- `POST /decode-qr` - Giải mã QR code từ hình ảnh

### Quản lý video
- `GET /videos` - Hiển thị danh sách video
- `GET /search` - Tìm kiếm video
- `POST /delete-video/<id>` - Xóa video cụ thể
- `POST /cleanup-videos` - Dọn dẹp video cũ

## Công nghệ sử dụng

### Backend
- **Flask**: Web framework
- **SQLAlchemy**: ORM cho database
- **OpenCV**: Xử lý QR code
- **Gunicorn**: WSGI server cho production

### Frontend
- **Bootstrap 5**: CSS framework
- **Font Awesome**: Icon library
- **Video.js**: Video player
- **MediaRecorder API**: Quay video trong browser
- **getUserMedia API**: Truy cập camera

### Database
- **SQLite**: Database mặc định
- **PostgreSQL**: Hỗ trợ cho production

## Cấu hình Camera

Để có chất lượng video tốt nhất:

1. **Độ phân giải**: Ứng dụng yêu cầu camera 4K (3840x2160)
2. **Bitrate**: 15 Mbps cho chất lượng 4K
3. **Format**: Ưu tiên H.264, fallback về VP9/WebM
4. **Camera**: Sử dụng camera sau (environment) nếu có sẵn

## Xử lý lỗi

### Camera không hoạt động
- Kiểm tra quyền truy cập camera trong trình duyệt
- Đảm bảo camera không được sử dụng bởi ứng dụng khác
- Thử refresh trang hoặc khởi động lại trình duyệt

### QR code không được nhận diện
- Đảm bảo QR code rõ nét và đủ sáng
- Giữ QR code ổn định trước camera
- Kiểm tra kết nối mạng đến server

### Video không lưu được
- Kiểm tra dung lượng ổ cứng còn trống
- Đảm bảo thư mục static/videos có quyền ghi
- Kiểm tra kết nối database

## Bảo trì

### Backup dữ liệu
```bash
# Backup database SQLite
cp instance/ordervideos.db backup/ordervideos_$(date +%Y%m%d).db

# Backup video files
tar -czf backup/videos_$(date +%Y%m%d).tar.gz static/videos/
```

### Theo dõi dung lượng
```bash
# Kiểm tra dung lượng thư mục video
du -sh static/videos/

# Kiểm tra số lượng video
find static/videos -name "*.mp4" | wc -l
```

## Hỗ trợ

Nếu gặp vấn đề:
1. Kiểm tra log của ứng dụng
2. Đảm bảo tất cả dependencies đã được cài đặt
3. Kiểm tra quyền truy cập file và camera
4. Xem phần xử lý lỗi ở trên

## Phiên bản

- **v1.0.0**: Phiên bản đầu tiên với đầy đủ tính năng
  - Quay video 4K
  - Quét QR code tự động
  - Quản lý video
  - Tự động dọn dẹp video cũ