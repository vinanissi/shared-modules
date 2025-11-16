/**
 * [NEW UTILITY] Đọc sheet "Config" và tạo ra một khối mã nguồn để người dùng sao chép.
 */
function generateConfigKeysForCopying() {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Config");

    if (!sheet) {
        ui.alert("Lỗi: Không tìm thấy sheet 'Config'.");
        return;
    }

    // Lấy tất cả giá trị từ cột A, bắt đầu từ hàng 2
    const data = sheet.getRange("A2:A" + sheet.getLastRow()).getValues();
    if (data.length < 1) {
        ui.alert("Sheet 'Config' không có dữ liệu để xử lý.");
        return;
    }

    // Bắt đầu xây dựng chuỗi mã nguồn
    let codeString = 'getKeys: function() {\n  return [\n';

    // Duyệt qua từng dòng dữ liệu, lọc bỏ ô trống và tạo chuỗi JSON
    const keys = data.flat().filter(key => String(key).trim() !== '');
    
    keys.forEach((key, index) => {
        // Thêm dấu phẩy cho tất cả các dòng trừ dòng cuối cùng
        const comma = index < keys.length - 1 ? ',' : '';
        // Thêm dấu nháy kép và thụt lề
        codeString += `    "${String(key).replace(/"/g, '\\"')}"${comma}\n`;
    });

    codeString += '  ];\n}';

    // Hiển thị kết quả trong một hộp thoại có vùng văn bản để dễ sao chép
    const htmlOutput = HtmlService.createHtmlOutput(`<p>Sao chép khối mã dưới đây và dán vào thư viện của bạn:</p><textarea style="width: 95%; height: 300px;">${codeString}</textarea>`)
        .setWidth(700)
        .setHeight(450);

    ui.showModalDialog(htmlOutput, "Mã nguồn Cấu hình Từ khóa");
}
/**
 * [NEW UTILITY] Đọc sheet "Parsers" và tạo ra một khối mã nguồn để người dùng sao chép.
 * Giúp dễ dàng di chuyển cấu hình từ Sheet vào thư viện trong code.
 */
function generateParserConfigForCopying() {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Parsers");

    if (!sheet) {
        ui.alert("Lỗi: Không tìm thấy sheet 'Parsers'.");
        return;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
        ui.alert("Sheet 'Parsers' không có dữ liệu để xử lý.");
        return;
    }

    const headers = data.shift().map(h => h.toUpperCase());
    
    // Tìm vị trí các cột cần thiết
    const nameCol = headers.findIndex(h => h.includes('TÊN BÁN'));
    const mstCol = headers.findIndex(h => h.startsWith('MST'));
    const emailCol = headers.findIndex(h => h === 'MODULE_EMAIL');
    const pdfCol = headers.findIndex(h => h === 'MODULE_PDF');
    const parseCol = headers.findIndex(h => h === 'MODULE_PARSE');
    const xmlCol = headers.findIndex(h => h === 'MODULE_XML');
    const websiteCol = headers.findIndex(h => h.includes('LINK TRA CỨU') || h === 'WEBSITE');

    if (nameCol === -1 || mstCol === -1) {
        ui.alert("Lỗi: Sheet 'Parsers' phải có cột 'TÊN BÁN' và 'MST'.");
        return;
    }

    // Bắt đầu xây dựng chuỗi mã nguồn
    let codeString = 'function getParsers() {\n  return [\n';

    // Duyệt qua từng dòng dữ liệu và tạo đối tượng JSON
    data.forEach(row => {
        const name = String(row[nameCol] || '').replace(/"/g, '\\"');
        const mst = String(row[mstCol] || '');
        
        if (name || mst) {
            codeString += '    {\n';
            if (name) codeString += `      name: "${name}",\n`;
            if (mst) codeString += `      mst: "${mst}",\n`;
            if (emailCol !== -1) codeString += `      email: "${String(row[emailCol] || '')}",\n`;
            if (pdfCol !== -1) codeString += `      pdf: "${String(row[pdfCol] || '')}",\n`;
            if (parseCol !== -1) codeString += `      parse: "${String(row[parseCol] || '')}",\n`;
            if (xmlCol !== -1) codeString += `      xml: "${String(row[xmlCol] || '')}",\n`;
            if (websiteCol !== -1) codeString += `      website: "${String(row[websiteCol] || '')}"\n`;
            codeString += '    },\n';
        }
    });

    codeString += '  ];\n}';

    // Hiển thị kết quả trong một hộp thoại có vùng văn bản để dễ sao chép
    const htmlOutput = HtmlService.createHtmlOutput(`<p>Sao chép khối mã dưới đây và dán vào thư viện của bạn:</p><textarea style="width: 95%; height: 300px;">${codeString}</textarea>`)
        .setWidth(700)
        .setHeight(450);

    ui.showModalDialog(htmlOutput, "Mã nguồn Cấu hình Parsers");
}

/**
 * [NEW UTILITY] Đọc sheet "Mappings" và tạo ra một khối mã nguồn để người dùng sao chép.
 * Giúp dễ dàng di chuyển cấu hình từ Sheet vào thư viện trong code.
 */
function generateMappingsConfigForCopying() {
    const ui = SpreadsheetApp.getUi();
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Mappings");

    if (!sheet) {
        ui.alert("Lỗi: Không tìm thấy sheet 'Mappings'.");
        return;
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 1) { // Chỉ cần 1 dòng là đủ
        ui.alert("Sheet 'Mappings' không có dữ liệu để xử lý.");
        return;
    }

    // Bắt đầu xây dựng chuỗi mã nguồn
    let codeString = 'getMappings: function() {\n  return {\n';

    // Duyệt qua từng dòng dữ liệu và tạo đối tượng JSON
    data.forEach(row => {
        const key = String(row[0] || '').trim();
        if (key) {
            // Lấy tất cả các giá trị từ cột B trở đi, lọc bỏ ô trống
            const values = row.slice(1).filter(v => String(v).trim() !== '');
            
            // Chuyển mảng các giá trị thành chuỗi JSON, ví dụ: ["Nhãn 1", "Nhãn 2"]
            const valuesString = JSON.stringify(values);

            // Thêm vào chuỗi code, đảm bảo dấu " được thoát đúng cách
            codeString += `    "${key.replace(/"/g, '\\"')}": ${valuesString},\n`;
        }
    });

    codeString += '  };\n}';

    // Hiển thị kết quả trong một hộp thoại có vùng văn bản để dễ sao chép
    const htmlOutput = HtmlService.createHtmlOutput(`<p>Sao chép khối mã dưới đây và dán vào thư viện của bạn:</p><textarea style="width: 95%; height: 300px;">${codeString}</textarea>`)
        .setWidth(700)
        .setHeight(450);

    ui.showModalDialog(htmlOutput, "Mã nguồn Cấu hình Mappings");
}