/**
 * Sao chép giá trị email từ một ô được chỉ định sang một ô đích,
 * dựa trên cấu hình được cung cấp.
 *
 * @param {GoogleAppsScript.Spreadsheet.Spreadsheet} spreadsheet Đối tượng bảng tính để làm việc.
 * @param {GoogleAppsScript.Spreadsheet.Range} range Ô đã được chọn để xử lý.
 * @param {object} userConfig Đối tượng cấu hình.
 * @returns {boolean} Trả về true nếu thành công.
 * @throws {Error} Ném ra lỗi nếu có vấn đề xảy ra.
 */
function copyEmail(spreadsheet, range, userConfig = {}) {
  // --- Cấu hình mặc định ---
  const DEFAULTS = {
    headerNameToCheck: "Mail nhan hoa don",
    targetSheetName: "TT_XuatHoaDon",
    targetCellAddress: "A2",
    actionColumnName: "Hành động",
    successMessage: "Đã tạo TT_XuatHoaDon"
  };
  
  // Kết hợp cấu hình người dùng và mặc định
  const config = { ...DEFAULTS, ...userConfig };

  // --- Logic xử lý ---
  if (!range || range.getNumRows() > 1 || range.getNumColumns() > 1) {
    // Không làm gì nếu chọn nhiều ô hoặc không chọn ô nào
    return false;
  }

  const activeSheet = range.getSheet();
  const selectedRow = range.getRow();
  const selectedCol = range.getColumn();

  if (selectedRow <= 1) {
    // Không làm gì nếu chọn ô trên hàng tiêu đề
    return false;
  }

  const headers = activeSheet.getRange(1, 1, 1, activeSheet.getLastColumn()).getValues()[0];
  const headerColumnIndex = headers.indexOf(config.headerNameToCheck) + 1;

  if (headerColumnIndex === 0 || selectedCol !== headerColumnIndex) {
    // Không làm gì nếu không chọn đúng cột email
    return false;
  }

  const cellValue = range.getValue();

  if (isValidEmail(cellValue)) {
    const targetSheet = spreadsheet.getSheetByName(config.targetSheetName);

    if (!targetSheet) {
      // Ném lỗi nếu không tìm thấy sheet đích
      throw new Error(`Không tìm thấy sheet có tên "${config.targetSheetName}".`);
    }

    // 1. Thực hiện sao chép giá trị
    targetSheet.getRange(config.targetCellAddress).setValue(cellValue);

    // 2. Ghi lại hành động
    const actionColumnIndex = headers.indexOf(config.actionColumnName) + 1;
    if (actionColumnIndex > 0) {
      activeSheet.getRange(selectedRow, actionColumnIndex).setValue(config.successMessage);
    }
    
    // 3. Kích hoạt sheet đích để người dùng thấy
    spreadsheet.setActiveSheet(targetSheet);

    return true; // Trả về true để báo hiệu thành công
  }
  
  return false;
}

/**
 * Hàm phụ để kiểm tra định dạng email đơn giản.
 * @private
 */
function isValidEmail(email) {
  if (typeof email !== 'string' || email.trim() === '') {
    return false;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}