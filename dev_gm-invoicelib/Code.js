function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("🤖 Hóa đơn OCR")
    // ... các mục menu khác của bạn ...
    .addSeparator()
    .addItem("🚀 Xuất Cấu hình Parsers ra Code", "generateParserConfigForCopying")
    .addItem("🚀 Xuất Cấu hình Mappings ra Code", "generateMappingsConfigForCopying")
    .addItem("🚀 Xuất Cấu hình Từ khóa ra Code", "generateConfigKeysForCopying") // <-- THÊM DÒNG NÀY
    .addToUi();
}