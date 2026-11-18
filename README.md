# PrinTee: web trưng bày mẫu in 3D

Web tĩnh (HTML/CSS/JS thuần, không thư viện). Mọi dữ liệu lấy từ file JSON, ảnh và video lấy từ thư mục, nên không cần sửa code khi thêm sản phẩm.

## Cấu trúc thư mục

```
PrinTee/
├── public/                  ← toàn bộ website (Vercel đăng thư mục này)
│   ├── site.json            ← tên web, khẩu hiệu, nút liên hệ, link mạng xã hội
│   ├── data/                ← MỖI FILE JSON = 1 TAB / DANH MỤC
│   │   ├── mo-hinh.json
│   │   ├── trang-tri.json
│   │   ├── tien-ich.json
│   │   └── _TEMPLATE.json   ← file mẫu (bắt đầu bằng "_" nên không hiện lên web)
│   ├── media/               ← ảnh/video, chia theo danh mục rồi theo sản phẩm
│   │   └── mo-hinh/                 (trùng tên file mo-hinh.json)
│   │       └── rong-khop-noi/       (trùng "id" của sản phẩm)
│   │           ├── 1.mp4            ← số 1 hiển thị đầu tiên
│   │           ├── 2.jpg
│   │           └── 3.jpg ...
│   ├── assets/              ← code giao diện + logo
│   └── manifest.json        ← TỰ SINH, đừng sửa tay
├── scripts/                 ← build.js (Vercel chạy) và dev.js (xem thử trên máy)
└── vercel.json
```

## Thêm một danh mục (tab) mới

1. Chép `public/data/_TEMPLATE.json` thành file mới, ví dụ `public/data/anime.json`.
   Tên file (không dấu, không cách) chính là mã danh mục.
2. Sửa `name` (tên hiện trên tab), `icon` (1 emoji), `order` (số nhỏ đứng trước).
3. Tạo thư mục `public/media/anime/`.

Tab mới tự hiện ở menu bên trái và hàng tab tròn.

## Thêm một sản phẩm

1. Mở file JSON của danh mục, thêm 1 khối vào mảng `products`:

```json
{
  "id": "inuyasha",
  "title": "Inuyasha [Không cần AMS]",
  "date": "2026-11-18",
  "price": "250.000đ",
  "featured": true,
  "tags": ["anime", "figure"],
  "specs": { "Kích thước": "25 cm", "Chất liệu": "PLA" },
  "profiles": [
    { "name": "0.16mm layer, 3 walls, 10% infill", "badge": "Khuyên dùng", "time": "31.3 h", "plates": 10 }
  ],
  "description": [
    "Mô hình chia part, cao 25cm, dễ lắp.",
    "",
    "## Lưu ý",
    "- Ưu tiên bố cục tách màu cho máy không có AMS"
  ]
}
```

2. Tạo thư mục `public/media/anime/inuyasha/` (trùng `id`) và bỏ ảnh/video vào, đặt tên theo số:
   `1.mp4`, `2.jpg`, `3.jpg`, `4.png`… File số 1 hiển thị đầu tiên. Ảnh thẻ (cover) là **ảnh đầu tiên**,
   video sẽ được bỏ qua khi chọn ảnh thẻ.

Lưu ý khi sửa JSON: các khối cách nhau bằng dấu phẩy, sau phần tử cuối thì **không** có dấu phẩy.
Nếu file JSON lỗi, lúc build sẽ báo rõ là file nào bị lỗi.

### Các trường của sản phẩm

| Trường | Bắt buộc | Ý nghĩa |
|---|---|---|
| `id` | nên có | Mã không dấu, cũng là tên thư mục ảnh và một phần đường link |
| `title` | có | Tên hiển thị |
| `date` | nên có | `YYYY-MM-DD`, dùng để sắp xếp "mới nhất" và hiện nhãn "Mới" trong 14 ngày |
| `price` | không | Giá tham khảo (chữ tự do) |
| `featured` | không | `true` thì hiện ở mục "Nổi bật" trang chủ |
| `tags` | không | Từ khoá cho tìm kiếm và gợi ý sản phẩm liên quan |
| `specs` | không | Bảng thông số tự do: `"Tên dòng": "giá trị"` |
| `profiles` | không | Các cấu hình in: `name`, `time`, `plates`, `badge`, `filament` |
| `links` | không | Các nút bấm `[{ "label": "...", "url": "..." }]`. Nếu bỏ trống thì dùng nút liên hệ trong `site.json` |
| `description` | không | Chuỗi hoặc mảng các dòng. Hỗ trợ `## tiêu đề`, `- gạch đầu dòng`, `1. đánh số`, `**đậm**`, `[link](url)`, `![ảnh](url)` |
| `hidden` | không | `true` để tạm ẩn sản phẩm |
| `folder` | không | Dùng khi tên thư mục ảnh khác với `id` |
| `media` | không | Liệt kê tay danh sách ảnh/video (ví dụ link ngoài) thay vì tự quét thư mục |

## Xem thử trên máy

Cần cài [Node.js](https://nodejs.org) (bản 18 trở lên). Mở Terminal tại thư mục `PrinTee` rồi chạy:

```bash
npm run dev
```

Mở http://localhost:3000. Sau khi sửa JSON hay thêm ảnh, chỉ cần F5.
(Mở trực tiếp file `index.html` bằng cách nháy đúp sẽ không chạy, vì trình duyệt chặn đọc file JSON.)

## Đưa lên Vercel

**Cách 1: qua GitHub (khuyên dùng, sau này push là tự cập nhật)**
1. Tạo repo trên GitHub và push cả thư mục `PrinTee` lên.
2. Vào vercel.com → **Add New… → Project** → chọn repo đó → **Deploy**.
   Không cần chỉnh gì, `vercel.json` đã khai báo sẵn lệnh build (`node scripts/build.js`) và thư mục `public`.
3. Từ giờ mỗi lần thêm sản phẩm chỉ cần commit và push, Vercel tự build lại.

**Cách 2: dùng Vercel CLI**
```bash
npm i -g vercel
vercel        # lần đầu: đăng nhập + tạo project
vercel --prod # đăng bản chính thức
```

### Mẹo về video và ảnh
- Nén video trước khi đăng (mp4 H.264, 720p, mỗi file nên dưới khoảng 10–20 MB) cho web load nhanh.
- Ảnh nên rộng khoảng 1200–1600px, định dạng jpg hoặc webp.
- Ảnh/video trong `public/media` hiện là **ảnh minh hoạ**, bạn xoá đi rồi thay bằng ảnh thật.

## Tuỳ chỉnh
- Tên web, khẩu hiệu, nút "Liên hệ đặt in", link Facebook/Zalo/TikTok/Shopee: sửa trong `public/site.json`.
  Các `type` có icon riêng: `facebook`, `zalo`, `messenger`, `tiktok`, `youtube`, `instagram`, `shopee`, `email`, `phone`, `website`.
- Màu chủ đạo: biến `--accent` ở đầu file `public/assets/css/style.css`.
- Logo: `public/assets/logo.svg` (favicon), còn logo trong giao diện nằm ở hằng `LOGO` trong `public/assets/js/app.js`.
