# Phân Tích Dự Án InvoiceLib

## 📋 Tổng Quan

Đây là một **Google Apps Script library** được thiết kế để xử lý và trích xuất thông tin từ hóa đơn điện tử Việt Nam. Thư viện này hỗ trợ nhiều nhà cung cấp hóa đơn điện tử khác nhau (VNPT, Misa, FPT, Viettel, Petrolimex, v.v.) và có khả năng xử lý nhiều định dạng khác nhau (Email, PDF, XML).

---

## 🏗️ Cấu Trúc Dự Án

### 1. **Configuration.js** (674 dòng)
File cấu hình trung tâm chứa:
- **`getKeys()`**: Danh sách từ khóa tìm kiếm email (16 từ khóa)
- **`getParsers()`**: Cấu hình parser cho **100+ công ty/nhà cung cấp**
- **`getMappings()`**: Ánh xạ trường dữ liệu (15+ trường)

**Đặc điểm:**
- Hỗ trợ đa định dạng: Email, PDF, XML
- Mỗi công ty có thể có parser riêng hoặc dùng parser chung
- Sử dụng AI (Gemini) như parser mặc định cho nhiều trường hợp

### 2. **Parsers.js** (5,804 dòng - File lớn nhất)
Chứa **85+ hàm parser** được phân loại theo:

#### a) Parser theo nhà cung cấp:
- **VNPT**: `parseVnpt*` (10+ parsers)
- **Misa**: `parseMisa*` (5+ parsers)
- **FPT**: `parseFpt*`, `parseFast*` (5+ parsers)
- **Viettel**: `parseViettel*` (4+ parsers)
- **Petrolimex**: `parsePetrolimex*` (8+ parsers)
- **EasyInvoice**: `parseEasyInvoice*` (5+ parsers)
- **Bkav**: `parseBkav*` (2 parsers)
- **Titan, Grab, v.v.**

#### b) Parser theo định dạng:
- **Email parsers**: Xử lý nội dung email thông báo hóa đơn
- **PDF parsers**: Xử lý file PDF sau OCR
- **XML parsers**: Xử lý file XML cấu trúc
- **Text parsers**: Xử lý văn bản thô

#### c) Parser đặc biệt:
- **`parseWithGemini`**: Parser sử dụng AI (Gemini API) cho các trường hợp phức tạp
- **`parseDefault_XML`**: Parser mặc định cho XML
- **`parseDefault`**: Parser mặc định dùng mappings

### 3. **Code.js** (10 dòng)
File khởi tạo menu Google Sheets với 3 chức năng:
- Xuất cấu hình Parsers ra Code
- Xuất cấu hình Mappings ra Code
- Xuất cấu hình Từ khóa ra Code

### 4. **Utilis.js** (85 dòng)
Chứa các hàm tiện ích:
- **`copyEmail()`**: Sao chép email từ ô được chọn sang sheet khác
- **`isValidEmail()`**: Kiểm tra định dạng email

### 5. **CongCuTuTaoCodeChoLib.js** (153 dòng)
Công cụ tự động tạo code từ Google Sheets:
- **`generateConfigKeysForCopying()`**: Tạo code cho từ khóa từ sheet "Config"
- **`generateParserConfigForCopying()`**: Tạo code cho parsers từ sheet "Parsers"
- **`generateMappingsConfigForCopying()`**: Tạo code cho mappings từ sheet "Mappings"

---

## 📊 Thống Kê

### Số Lượng Parser
- **Tổng cộng**: 85+ hàm parser
- **Parser theo định dạng**:
  - Email: ~30 parsers
  - PDF: ~25 parsers
  - XML: ~35 parsers
  - Text: ~10 parsers

### Công Ty Được Hỗ Trợ
- **100+ công ty/nhà cung cấp** được cấu hình trong `getParsers()`
- Phân bố theo ngành:
  - Xăng dầu (Petrolimex, PVOIL, v.v.): ~40 công ty
  - Ô tô (Toyota, v.v.): ~5 công ty
  - Thương mại/Dịch vụ: ~30 công ty
  - Các ngành khác: ~25 công ty

### Nhà Cung Cấp Hóa Đơn Điện Tử
1. **VNPT Invoice** (vnpt-invoice.com.vn)
2. **Misa/MeInvoice** (meinvoice.vn)
3. **FPT** (einvoice.fpt.com.vn)
4. **Viettel** (vinvoice.viettel.vn)
5. **Petrolimex** (hoadon.petrolimex.com.vn)
6. **EasyInvoice** (easyinvoice.com.vn)
7. **Bkav** (ehoadon.vn)
8. **SmartSign** (smartsign.com.vn)
9. **Grab** (einvoice.grab.com)
10. **Xanh SM** (xanhsm.com)

---

## 🔍 Phân Tích Chi Tiết

### Điểm Mạnh

1. **Tính Mở Rộng Cao**
   - Dễ dàng thêm parser mới vào `getParsers()`
   - Hỗ trợ nhiều định dạng và nhà cung cấp

2. **Sử Dụng AI Thông Minh**
   - Sử dụng Gemini API như parser fallback
   - Giảm bớt công việc phát triển parser thủ công

3. **Công Cụ Hỗ Trợ**
   - Có công cụ tự động tạo code từ Google Sheets
   - Menu trong Google Sheets để dễ sử dụng

4. **Xử Lý Đa Dạng**
   - Email, PDF (OCR), XML
   - Nhiều nhà cung cấp khác nhau

### Điểm Cần Cải Thiện

1. **Cấu Trúc File**
   - **Parsers.js quá lớn** (5,804 dòng) → Khó maintain
   - Nên tách thành nhiều file theo nhà cung cấp hoặc định dạng

2. **Trùng Lặp Code**
   - Có một số parser trùng tên (ví dụ: `parseHocMonTrading_XML` xuất hiện 2 lần)
   - Nhiều parser có logic tương tự nhau

3. **Cấu Hình**
   - Có entry parser mặc định rỗng (dòng 21-28)
   - Một số công ty có cấu hình không đầy đủ (thiếu MST, website)

4. **Tài Liệu**
   - Thiếu JSDoc cho nhiều hàm
   - README.md chỉ có thông tin cơ bản

5. **Lỗi Tiềm Ẩn**
   - Một số parser hardcode MST thay vì lấy từ cấu hình
   - Thiếu validation cho input

---

## 🎯 Đề Xuất Cải Tiến

### 1. Refactoring Cấu Trúc
```
invoicelib/
├── Configuration.js (giữ nguyên)
├── Parsers/
│   ├── VNPT/
│   │   ├── Email.js
│   │   ├── PDF.js
│   │   └── XML.js
│   ├── Misa/
│   ├── FPT/
│   └── Common/
│       ├── parseWithGemini.js
│       └── parseDefault.js
├── Utils/
│   ├── copyEmail.js
│   └── validators.js
└── Tools/
    └── codeGenerator.js
```

### 2. Tối Ưu Hóa
- Tạo base parser class để giảm code trùng lặp
- Sử dụng factory pattern để tạo parser
- Cache các parser đã load

### 3. Cải Thiện Error Handling
- Thêm try-catch cho tất cả parser
- Logging chi tiết hơn
- Fallback mechanism tốt hơn

### 4. Testing
- Tạo unit tests cho các parser quan trọng
- Test với nhiều mẫu hóa đơn khác nhau

### 5. Documentation
- Thêm JSDoc đầy đủ
- Tạo guide sử dụng chi tiết
- Document các pattern parser

---

## 📝 Kết Luận

Đây là một dự án **quy mô lớn** và **đầy đủ tính năng** với khả năng xử lý hóa đơn từ nhiều nhà cung cấp khác nhau. Tuy nhiên, cần **refactoring** để cải thiện khả năng bảo trì và mở rộng trong tương lai.

**Đánh giá tổng thể**: ⭐⭐⭐⭐ (4/5)
- Tính năng: ⭐⭐⭐⭐⭐
- Cấu trúc: ⭐⭐⭐
- Khả năng bảo trì: ⭐⭐⭐
- Tài liệu: ⭐⭐

