# DANH SÁCH LỖI CHI TIẾT

## 🔴 1. HÀM BỊ TRÙNG LẶP

### 1.1. parseVnptKimLong_Email
- **File:** `Parsers.js`
- **Vị trí 1:** Dòng 143-146 (STUB - cần xóa)
  ```javascript
  function parseVnptKimLong_Email(text, headers, meta = {}) {
  // ... (code của các parser cũ) ...
      return result;
  }
  ```
- **Vị trí 2:** Dòng 221-273 (IMPLEMENTATION - giữ lại)
- **Hành động:** Xóa hàm stub ở dòng 143-146

### 1.2. parseVnptFoodcosa_Email
- **File:** `Parsers.js`
- **Vị trí 1:** Dòng 152-155 (STUB - cần xóa)
  ```javascript
  function parseVnptFoodcosa_Email(text, headers, meta = {}) {
  // ... (code của các parser cũ) ...
      return result;
  }
  ```
- **Vị trí 2:** Dòng 278-335 (IMPLEMENTATION - giữ lại)
- **Hành động:** Xóa hàm stub ở dòng 152-155

### 1.3. parseHocMonTrading_XML
- **File:** `Parsers.js`
- **Vị trí 1:** Dòng 1920-1978
- **Vị trí 2:** Dòng 2348-2406
- **Hành động:** Cần so sánh 2 implementation, giữ lại một và xóa một

### 1.4. tryExtract
- **File:** `Parsers.js`
- **Vị trí 1:** Dòng 466-479
- **Vị trí 2:** Dòng 5460-5475
- **Hành động:** Xóa một trong hai, giữ lại hàm đầu tiên (dòng 466)

---

## 🔴 2. CẤU HÌNH TRÙNG LẶP TRONG Configuration.js

### 2.1. CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH

**Entry 1 (Dòng 55-61):**
```javascript
{ 
  name: "CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH", 
  mst: "0300559014", 
  email: "parseVnptFoodcosa_Email",
  pdf: "parseWithGemini",
  xml: "parseWithGemini",
  website: "https://foodcosa-tt78.vnpt-invoice.com.vn" 
}
```

**Entry 2 (Dòng 214-221):**
```javascript
{
  name: "CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH",
  mst: "0300559014",
  email: "parseVNPTGeneric",
  pdf: "parsePetrolimex_PDF",
  parse: "parseVNPTFoodcosa",
  xml: "parseDefault_XML",
  website: ""
}
```

**Vấn đề:**
- Cùng MST nhưng parser khác nhau
- Entry 2 có thêm trường `parse` không rõ mục đích
- Website khác nhau

**Hành động:** Xác định entry nào đúng, xóa entry còn lại

### 2.2. CÔNG TY XĂNG DẦU LONG AN

**Entry 1 (Dòng 516-522):**
```javascript
{ 
  name: "CÔNG TY XĂNG DẦU LONG AN", 
  mst: "1100108351", 
  email: "",
  pdf: "",
  xml: "parsePetrolimexLongAn_XML",
  website: "https://hoadon.petrolimex.com.vn" 
}
```

**Entry 2 (Dòng 524-530):**
```javascript
{ 
  name: "CÔNG TY XĂNG DẦU LONG AN", 
  mst: "1100108351", 
  email: "",
  pdf: "", 
  xml: "parsePetrolimexLongAn_XML",
  website: "https://hoadon.petrolimex.com.vn" 
}
```

**Vấn đề:** Trùng lặp hoàn toàn

**Hành động:** Xóa một trong hai entry

### 2.3. CÔNG TY TNHH XĂNG DẦU LÂM ĐỒNG

**Entry 1 (Dòng 337-343):**
```javascript
{
  name: "CÔNG TY TNHH XĂNG DẦU LÂM ĐỒNG",
  email: "parsePetrolimex",
  pdf: "parsePetrolimex_PDF",
  parse: "",
  xml: "parseDefault_XML",
  website: ""
}
```

**Entry 2 (Dòng 444-450):**
```javascript
{
  name: "CÔNG TY TNHH XĂNG DẦU LÂM ĐỒNG",
  email: "parsePetrolimex",
  pdf: "parsePetrolimex_PDF",
  parse: "",
  xml: "",
  website: "https://tracuuhd.smartsign.com.vn"
}
```

**Vấn đề:** 
- Trùng lặp gần như hoàn toàn
- Entry 2 có website, Entry 1 không có
- Entry 2 không có xml parser

**Hành động:** Merge 2 entry, giữ website từ entry 2

### 2.4. Entry thiếu thông tin

**Entry 1 (Dòng 206-212):**
```javascript
{
  mst: "0301147253",
  email: "parsePetrolimex",
  pdf: "parsePetrolimex_PDF",
  parse: "parsePetrolimex",
  xml: "parseDefault_XML",
  website: ""
}
```
- **Thiếu:** `name`
- **Hành động:** Tìm tên công ty tương ứng với MST `0301147253` và bổ sung

**Entry 2 (Dòng 468-474):**
```javascript
{
  mst: "0317139145",
  email: "",
  pdf: "",
  parse: "",
  xml: "",
  website: "https://0317139145hd.easyinvoice.com.vn/Search/Search"
}
```
- **Thiếu:** `name`
- **Hành động:** Tìm tên công ty tương ứng với MST `0317139145` và bổ sung

---

## ⚠️ 3. CÁC VẤN ĐỀ KHÁC

### 3.1. Trường `parse` không rõ ràng
Nhiều entry có trường `parse` nhưng không được document:
- Không rõ khi nào sử dụng `parse` vs `email`/`pdf`/`xml`
- Một số entry có `parse` trùng với `email`/`pdf`
- **Ví dụ:** Dòng 147-150 có `parse: "parseViettelFuelInvoice"` và `pdf: "parseViettelFuelInvoice"`

**Hành động:** 
- Xác định mục đích của trường `parse`
- Nếu không cần thiết, xóa khỏi tất cả entries
- Nếu cần, document rõ ràng

### 3.2. Parser không tồn tại (Cần kiểm tra)
Cần kiểm tra xem các parser sau có tồn tại trong `Parsers.js`:
- `parseVNPTGeneric` - ✅ Tồn tại (dòng 4140)
- `parsePetrolimex_PDF` - ✅ Tồn tại (dòng 3882)
- `parseDefault_XML` - ✅ Tồn tại (dòng 3449)
- `parseVNPTFoodcosa` - ✅ Tồn tại (dòng 4535)
- `parsePetrolimex` - ✅ Tồn tại (dòng 4593)
- `parseMeInvoice` - ✅ Tồn tại (dòng 5238)
- `parseDefault` - ✅ Tồn tại (dòng 5294)

### 3.3. Hardcoded API Key
**File:** `Parsers.js`, dòng 1229
```javascript
const GEMINI_API_KEY = "AIzaSyC2AMBNftrGnSJ-Yo6IsBEjfQG-8RITjqk";
```
**Vấn đề:** API key bị hardcode trong source code
**Hành động:** 
- Di chuyển API key vào Properties Service của Apps Script
- Hoặc sử dụng Script Properties

### 3.4. Hardcoded MST
**File:** `Parsers.js`, dòng 39 trong `parseVnptSamco_Email`
```javascript
value = '0300481551'; // <-- SỬA LỖI: Cập nhật MST chính xác
```
**Vấn đề:** MST bị hardcode thay vì lấy từ configuration
**Hành động:** Lấy MST từ configuration hoặc từ parsed text

---

## 📊 TỔNG HỢP

### Số lượng lỗi:
- **Hàm trùng lặp:** 4
- **Cấu hình trùng lặp:** 4 công ty
- **Entry thiếu thông tin:** 2
- **Vấn đề khác:** 4

### Ưu tiên sửa:
1. 🔴 **Cao:** Xóa các hàm stub trùng lặp
2. 🔴 **Cao:** Xóa cấu hình trùng lặp
3. 🟡 **Trung bình:** Bổ sung thông tin thiếu
4. 🟡 **Trung bình:** Xử lý hardcoded API key
5. 🟢 **Thấp:** Refactor hardcoded MST

---

## 🔧 SCRIPT KIỂM TRA

Để kiểm tra các parser có tồn tại hay không, có thể chạy script sau trong Apps Script:

```javascript
function validateAllParsers() {
  const parsers = getParsers();
  const allParserNames = new Set();
  const missingParsers = [];
  const duplicateConfigs = [];
  const configKeys = new Map();
  
  // Collect all parser function names
  parsers.forEach((config, index) => {
    const key = `${config.name || ''}_${config.mst || ''}`;
    
    // Check for duplicate configs
    if (configKeys.has(key)) {
      duplicateConfigs.push({
        index: index + 1,
        key: key,
        existing: configKeys.get(key)
      });
    } else {
      configKeys.set(key, index + 1);
    }
    
    // Check parser functions
    ['email', 'pdf', 'xml', 'parse'].forEach(type => {
      const parserName = config[type];
      if (parserName && parserName.trim() !== '') {
        allParserNames.add(parserName);
      }
    });
  });
  
  // Check if parser functions exist
  allParserNames.forEach(parserName => {
    if (typeof globalThis[parserName] !== 'function') {
      missingParsers.push(parserName);
    }
  });
  
  // Report
  Logger.log('=== VALIDATION REPORT ===');
  Logger.log(`Total parsers: ${parsers.length}`);
  Logger.log(`Total unique parser functions: ${allParserNames.size}`);
  Logger.log(`Missing parsers: ${missingParsers.length}`);
  if (missingParsers.length > 0) {
    Logger.log('Missing parser functions:');
    missingParsers.forEach(p => Logger.log(`  - ${p}`));
  }
  Logger.log(`Duplicate configs: ${duplicateConfigs.length}`);
  if (duplicateConfigs.length > 0) {
    Logger.log('Duplicate configurations:');
    duplicateConfigs.forEach(d => Logger.log(`  - Index ${d.index}: ${d.key} (duplicate of index ${d.existing})`));
  }
  
  return {
    totalParsers: parsers.length,
    uniqueParserFunctions: allParserNames.size,
    missingParsers: missingParsers,
    duplicateConfigs: duplicateConfigs
  };
}
```

