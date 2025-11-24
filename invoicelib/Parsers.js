// =================================================================
// IV. CÁC HÀM PARSER CHI TIẾT
// =================================================================
/**
 * [NEW] Parser cho hóa đơn dạng text của CÔNG TY TNHH TM & DV SAGRI BAZAN (VNPT).
 * Xử lý nội dung text từ OCR.
 */
function parseVnptSagriBazan_Text(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH TM & DV SAGRI BAZAN";
    // Tìm MST nằm gần tên công ty hoặc số cụ thể
    const sellerMst = tryExtract(cleanedText, [/SAGRI BAZAN\s*(\d{10,13})/i, /Mã số thuế:\s*(\d{10,13})/i]); 
    
    const buyerName = tryExtract(cleanedText, [/Họ tên người mua hàng:.*?(HỢP TÁC XÃ.*?)\s*Ký hiệu/i, /Tên đơn vị mua hàng:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/HỢP TÁC XÃ.*?(\d{10,13})/i, /Mã số thuế:\s*(\d{10,13})\s*Ký hiệu/i]);
    
    // Ngày hóa đơn
    let invoiceDate = "";
    const dateMatch = cleanedText.match(/Ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
    if (dateMatch) {
        invoiceDate = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`;
    } else if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:([A-Z0-9]+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại website:(https?:\/\/[^\s]+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : "'6400446946"; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            // Các trường không có trong OCR hoặc cần logic phức tạp hơn để lấy
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [CẬP NHẬT] Parser cho email thông báo hóa đơn của TỔNG CÔNG TY CƠ KHÍ GTVT SÀI GÒN (SAMCO).
 * - Sửa lại MST hardcode cho chính xác.
 * - Đảm bảo logic lấy ngày email nếu "ký ngày" trống.
 */
function parseVnptSamco_Email(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Kính gửi Quý khách hàng,\s*(.*?)\s*đã phát hành Hóa đơn/i]);
    const buyerName = tryExtract(cleanedText, [/phát hành Hóa đơn điện tử cho Quý khách với các thông tin như sau:\s*(.*?)\s*Mã số thuế:/i]);
    const buyerMst = tryExtract(cleanedText, [/Mã số thuế:\s*([0-9-]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn\/ Invoice No:\s*(\d+)/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn\/ Invoice Serial:\s*([A-Z0-9\/]+)/i]);
    const lookupCode = tryExtract(cleanedText, [/mã tra cứu sau:\s*([A-Z0-9-]+)/i]); // Đã sửa regex để khớp cả dấu gạch ngang
    const website = tryExtract(cleanedText, [/Quý khách cũng có thể vào hệ thống\s*(https?:\/\/[^\s]+)\s*xem hóa đơn/i]);

    let invoiceDate = "";
    // Email này không có ngày lập hóa đơn, dùng ngày nhận email
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break; // Luôn lấy ngày email
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': 
                value = '0300481551'; // <-- SỬA LỖI: Cập nhật MST chính xác
                if (value) value = `'${value}`;
                break; 
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            // Các trường tiền tệ không có trong email, sẽ để trống (null)
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
            case 'địa chỉ bên mua':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho hóa đơn XML của DNTN TM DV TRƯỜNG VẠN LÝ (MISA).
 * - Sử dụng phương pháp "vét cạn" (lặp) để tìm "Mã số bí mật" (TransactionID).
 */
function parseMisaTruongVanLy_XML(text, headers) {
    const result = [];
    
    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];
    
    // === Logic "Vét cạn" để tìm TransactionID ===
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ==========================================
    
    const website = "https://meinvoice.vn/tra-cuu"; // Website tra cứu chung của MISA

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo hóa đơn của DNTN THƯƠNG MẠI KIM LONG (VNPT).
 * Xử lý nội dung text từ email.
 */
function parseVnptKimLong_Email(text, headers, meta = {}) {
// ... (code của các parser cũ) ...
    return result;
}

/**
 * [NEW] Parser cho email thông báo hóa đơn của CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH (VNPT).
 * Xử lý nội dung text từ email.
 */
function parseVnptFoodcosa_Email(text, headers, meta = {}) {
// ... (code của các parser cũ) ...
    return result;
}

/**
 * [NEW] Parser cho hóa đơn dạng text của CÔNG TY CỔ PHẦN MOVEO BÌNH DƯƠNG (FPT).
 * Xử lý nội dung text từ OCR.
 */
function parseFptMoveoBinhDuong_Text(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị bán:\s*\*(.*?)\*/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế:\s*\*(\d+)\*/i]);
    const buyerName = tryExtract(cleanedText, [/Đơn vị mua:\s*\*(.*?)\*/i]);
    const buyerMst = tryExtract(cleanedText, [/Mã số thuế:\s*\*(\d+)\*/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ngày lập :\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*\*([a-zA-Z0-9]+)\*/i]);
    const website = tryExtract(cleanedText, [/Để tra cứu hóa đơn truy cập địa chỉ:\s*(https?:\/\/[^\s]+)\//i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày':
                // *** LOGIC MỚI: ƯU TIÊN NGÀY EMAIL NẾU TRỐNG ***
                if (!invoiceDate && meta && meta.date) {
                    invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                }
                value = invoiceDate;
                // **********************************************
                break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            // Các trường không có trong email, sẽ để trống (null)
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo hóa đơn của DNTN THƯƠNG MẠI KIM LONG (VNPT).
 * Xử lý nội dung text từ email.
 */
function parseVnptKimLong_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị\s*(DNTN THƯƠNG MẠI KIM LONG)\s*vừa phát hành/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế đơn vị phát hành:\s*([0-9-]+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên khách hàng:\s*(.*?)\s*2\. Ðể xem/i]);
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*([a-zA-Z0-9-]+)/i]);
    const website = tryExtract(cleanedText, [/tra cứu hóa đơn:\s*(https?:\/\/[^\s]+)/i]);

    // Ngày hóa đơn không có trong nội dung email, lấy ngày nhận email làm ngày ký
    let invoiceDate = "";
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break; // Đã có logic fallback
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email, sẽ để trống (null)
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo hóa đơn của CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH (VNPT).
 * Xử lý nội dung text từ email.
 */
function parseVnptFoodcosa_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị\s*(CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH)\s*vừa phát hành/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế đơn vị phát hành:\s*([0-9-]+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên khách hàng:\s*(.*?)\s*2\. Ðể xem/i]);
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*([a-f0-9-]+)/i]);
    const website = tryExtract(cleanedText, [/tra cứu hóa đơn:\s*(https?:\/\/[^\s]+)/i]);

    // Ngày hóa đơn không có trong nội dung email, lấy ngày nhận email làm ngày ký
    let invoiceDate = "";
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break; // Đã có logic fallback
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email, sẽ để trống (null)
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [CẬP NHẬT] Parser cho email thông báo hóa đơn của TỔNG CÔNG TY DẦU VIỆT NAM (PVOIL).
 * - Sửa lỗi: Logic lấy "Tổng số tiền" bị sai, đã sửa để loại bỏ dấu phẩy và phần thập phân .00.
 * - Đảm bảo logic lấy ngày email nếu "ký ngày" trống.
 */
function parsePvoil_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/dịch vụ của\/\s*Our sincere thanks for using the service of:\s*(.*?)\s*\//i]);
    const buyerName = tryExtract(cleanedText, [/Kính gửi Quý khách hàng\/ Dear Valued Customer:\s*(.*?)\s*Xin trân trọng cảm ơn/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn\/ Invoice number:\s*(\d+)/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn\/ Invoice serial:\s*([A-Z0-9]+)/i]);
    
    // [FIX] Sửa logic lấy tổng số tiền
    const totalAmountStr = tryExtract(cleanedText, [/Tổng số tiền\/ Total amount:\s*([\d.,]+)/i])
                            .replace(/,/g, '') // Loại bỏ dấu phẩy (vd: 500,000.00 -> 500000.00)
                            .split('.')[0];     // Loại bỏ phần thập phân (vd: 500000.00 -> 500000)
                            
    const lookupCode = tryExtract(cleanedText, [/mã tra cứu\/ Look up at.*?lookup code:\s*([A-Z0-9]+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại\s*(https?:\/\/[^\s]+)\s*bằng tài khoản/i]);
    
    let invoiceDate = "";
    // Ưu tiên ngày email
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";
        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break; // Luôn lấy ngày email
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': 
                value = '0301293029'; // MST PVOIL
                if (value) value = `'${value}`;
                break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho email thông báo hóa đơn của CÔNG TY CỔ PHẦN CƠ KHÍ XĂNG DẦU (FAST).
 * Xử lý nội dung text từ email.
 */
function parseFastCoKhiXangDau_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý, giữ lại dấu *
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    // Lấy tên người bán từ cuối email hoặc đầu email
    const sellerNameMatch = cleanedText.match(/(CÔNG TY CỔ PHẦN CƠ KHÍ XĂNG DẦU)\s*xin gửi cho Quý khách/i) 
                           || cleanedText.match(/Trân trọng kính chào.*?\*(CÔNG TY CỔ PHẦN CƠ KHÍ XĂNG DẦU)\*/i);
    const sellerName = sellerNameMatch ? (sellerNameMatch[1] || sellerNameMatch[2]).trim() : "";
    
    const buyerName = tryExtract(cleanedText, [/Kính gửi \*(Dear)\*:\s*(.*?)\s*CÔNG TY CỔ PHẦN CƠ KHÍ XĂNG DẦU/i]);
    
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn \*(Invoice Number)\*:\s*\*(\d+)\*/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn \*(Serial Number)\*:\s*\*([A-Z0-9 ]+)\*/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã số để tra cứu hóa đơn là \*(Secure Key for searching)\*:\s*\*(.*?)\*/i]);
    const websiteMatch = cleanedText.match(/(https?:\/\/einvoice\.fast\.com\.vn)/i);
    const website = websiteMatch ? websiteMatch[1] : "https://einvoice.fast.com.vn";

    // Ngày hóa đơn không có trong nội dung email, lấy ngày nhận email làm ngày ký
    let invoiceDate = "";
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            // MST bên bán không có trong email, sẽ được hardcode trong config
            case 'mã số thuế bên bán': value = '0302259646'; break; // Hardcode MST
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email, sẽ để trống (null)
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}

// =========================================================================
// Các hàm parser khác đã có... (bao gồm tryExtract, parseWithGemini_AI, etc.)
// =========================================================================
// ... (Đảm bảo hàm tryExtract tồn tại trong file này) ...
/**
 * [HÀM TIỆN ÍCH] Thử nhiều mẫu regex và trả về kết quả đầu tiên.
 */
function tryExtract(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}


/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY TNHH MTV XĂNG DẦU VĨNH THÀNH (EasyInvoice).
 */
function parseEasyInvoiceVinhThanh_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ Fkey
    const lookupCode = tryExtract(text, [/<TTin>(?=.*?<TTruong>Fkey<\/TTruong>)<DLieu>(.*?)<\/DLieu>.*?<\/TTin>/i]);
    // Lấy Website từ thẻ PortalLink
    const website = tryExtract(text, [/<TTin>(?=.*?<TTruong>PortalLink<\/TTruong>)<DLieu>(.*?)<\/DLieu>.*?<\/TTin>/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}

/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY TNHH THƯƠNG MẠI XĂNG DẦU PHÚC KHANG (VNPT).
 */
function parseVnptPhucKhang_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    // Suy đoán website dựa trên MST
    const website = sellerMst ? `https://${sellerMst}-tt78.vnpt-invoice.com.vn` : ""; 

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ BIÊN KHOA (MISA).
 * - Sử dụng phương pháp "vét cạn" (lặp) để tìm "Mã số bí mật" (TransactionID).
 */
function parseMisaBienKhoa_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === Lấy Mã số bí mật bằng cách quét các khối <TTin> ===
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            // Tìm chính xác thẻ <TTruong>TransactionID</TTruong>
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ========================================================
    
    const website = "https://meinvoice.vn/tra-cuu"; // Website tra cứu chung của MISA

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho hóa đơn XML của TỔNG CÔNG TY CƠ KHÍ GTVT SÀI GÒN (SAMCO) - VNPT.
 */
function parseVnptSamco_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = "https://samco-tt78.vnpt-invoice.com.vn"; // Lấy từ email trước đó

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}

/**
 * [NEW] Parser cho hóa đơn XML của CTY CP TM-DV-XNK TRƯỜNG PHÁT (MISA).
 * - Sử dụng phương pháp "vét cạn" (lặp) để tìm "Mã số bí mật" (TransactionID).
 */
function parseMisaTruongPhat_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === CẢI TIẾN: Sử dụng phương pháp "vét cạn" (lặp) ===
    let lookupCode = "";
    // 1. Lấy tất cả các khối <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Lặp qua từng khối
        for (const block of ttinBlocks) {
            // 3. Kiểm tra xem khối này có chứa đúng <TTruong> ta cần không
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                // 4. Nếu đúng, trích xuất <DLieu> từ chính khối này
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // 5. Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // =======================================================
    
    const website = "https://meinvoice.vn/tra-cuu"; // Website tra cứu chung của MISA

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo hóa đơn của CTY TNHH CƠ KHÍ XD VÀ TM TIÊN TIẾN (FAST).
 * Xử lý nội dung text từ email.
 */
function parseFastTienTien_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý, giữ lại dấu *
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/(CHI NHÁNH CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ THƯƠNG MẠI TIÊN TIẾN.*?)\s*xin gửi cho Quý khách/i]);
    const buyerName = tryExtract(cleanedText, [/Kính gửi \*(Dear)\*:\s*(.*?)\s*CHI NHÁNH CÔNG TY/i]);
    
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn \*(Invoice Number)\*:\s*\*(\d+)\*/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn \*(Serial Number)\*:\s*\*([A-Z0-9 ]+)\*/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã số để tra cứu hóa đơn là \*(Secure Key for searching)\*:\s*\*(.*?)\*/i]);
    const websiteMatch = cleanedText.match(/(https?:\/\/einvoice\.fast\.com\.vn)/i);
    const website = websiteMatch ? websiteMatch[1] : "https://einvoice.fast.com.vn";

    // Ngày hóa đơn không có trong nội dung email, lấy ngày nhận email làm ngày ký
    let invoiceDate = "";
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            // MST bên bán không có trong email, sẽ được hardcode trong config
            case 'mã số thuế bên bán': value = '0302325064-001'; break; // Hardcode MST
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email, sẽ để trống (null)
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho email thông báo hóa đơn của CTY TNHH SX ĐT XD TM DV MIỀN ĐÔNG (VNPT).
 * Xử lý nội dung text từ email.
 */
function parseVnptMienDong_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị\s*(.*?)\s*vừa phát hành hóa đơn/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế đơn vị phát hành:\s*([0-9-]+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên khách hàng:\s*(.*?)\s*2\. Ðể xem/i]);
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*([a-f0-9]+)/i]);
    const website = tryExtract(cleanedText, [/tra cứu hóa đơn:\s*(https?:\/\/[^\s]+)/i]);

    // Ngày hóa đơn không có trong nội dung email, lấy ngày nhận email làm ngày ký
    let invoiceDate = "";
    if (meta && meta.date) {
        invoiceDate = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
    }

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email, sẽ để trống (null)
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
                value = null;
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho email thông báo hóa đơn của CTY TNHH THƯƠNG MẠI BÌNH PHONG PHÚ (Bkav).
 * Xử lý nội dung text từ email.
 */
function parseBkavBinhPhongPhu_Email(text, headers, meta = {}) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Cảm ơn quý khách hàng đã mua hàng tại\*(.*?)\*/i]);
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu là:\* ([A-Z0-9]+)/i]);
    const websiteMatch = cleanedText.match(/Tra cứu và sử dụng Hóa đơn điện tử tại ([^\s]+)/i);
    const website = websiteMatch ? websiteMatch[1] : "tracuu.ehoadon.vn";
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số Hóa đơn:\s*(\d+)/i]);
    const invoiceDate = tryExtract(cleanedText, [/Ngày Hóa đơn:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const totalAmountStr = tryExtract(cleanedText, [/Tổng thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    // Lấy MST bên mua từ link
    const buyerMstMatch = cleanedText.match(/BTaxCode=([0-9-]+)/i);
    const buyerMst = buyerMstMatch ? buyerMstMatch[1] : "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            // MST bên bán không có trong email, sẽ được hardcode trong config
            case 'mã số thuế bên bán': value = '0313936881-002'; break; 
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            
            // Thông tin bên mua và tiền tệ chi tiết không có
            case 'đơn vị mua': value = null; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = null; break;
            case 'cộng tiền hàng': value = null; break;
            case 'thuế suất gtgt số tiền': value = null; break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY XĂNG DẦU QUÂN ĐỘI KHU VỤC 4 (Viettel).
 * - Sử dụng phương pháp "vét cạn" (lặp) để tìm "Mã số bí mật".
 */
function parseViettelXangDauQuanDoi4_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === CẢI TIẾN: Sử dụng phương pháp "vét cạn" (lặp) ===
    let lookupCode = "";
    // 1. Lấy tất cả các khối <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Lặp qua từng khối
        for (const block of ttinBlocks) {
            // 3. Kiểm tra xem khối này có chứa đúng <TTruong> ta cần không
            if (block.includes("<TTruong>Mã số bí mật</TTruong>")) {
                // 4. Nếu đúng, trích xuất <DLieu> từ chính khối này
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // 5. Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // =======================================================
    
    const website = "https://vinvoice.viettel.vn/tra-cuu"; // Website tra cứu chung của Viettel

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [FIXED] Parser cho hóa đơn XML của CTY CP DI CHUYỂN XANH VÀ THÔNG MINH GSM.
 * - Cập nhật: Sử dụng phương pháp "vét cạn" (lặp qua tất cả các khối TTin) để đảm bảo
 * tìm thấy chính xác "Mã số bí mật" (Hilo-SearchKey).
 */
function parseGsmXanhSM_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === CẢI TIẾN: Sử dụng phương pháp "vét cạn" (lặp) ===
    let lookupCode = "";
    // 1. Lấy tất cả các khối <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi); 
    if (ttinBlocks) {
        // 2. Lặp qua từng khối
        for (const block of ttinBlocks) {
            // 3. Kiểm tra xem khối này có chứa đúng <TTruong> ta cần không
            if (block.includes("<TTruong>Hilo-SearchKey</TTruong>")) {
                // 4. Nếu đúng, trích xuất <DLieu> từ chính khối này
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // 5. Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // =======================================================
    
    const website = "https://hoadon.xanhsm.com";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho hóa đơn dạng text của CTY TNHH MTV TRƯỜNG GIANG MOBILE (Vinvoice).
 */
function parseViettelTruongGiangMobile_Text(text, headers) {
    const result = [];
    // Chuẩn hóa văn bản về một dòng để dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Tách các khối thông tin để tránh nhầm lẫn giữa bên bán và bên mua ---
    const buyerBlockMatch = cleanedText.match(/Họ tên người mua hàng:.*?Hình thức thanh toán:/i);
    const buyerBlock = buyerBlockMatch ? buyerBlockMatch[0] : cleanedText;
    
    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu':
                value = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
                break;
            case 'ký ngày':
                const dateMatch = cleanedText.match(/Ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})\s+năm\s+(\d{4})/i);
                value = dateMatch ? `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}` : "";
                break;
            case 'số hóa đơn':
                value = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);
                break;
            case 'đơn vị bán':
                value = tryExtract(cleanedText, [/Đơn vị bán hàng:\s*(.*?)\s*Mã số thuế/i]);
                break;
            case 'mã số thuế bên bán':
                // Lấy mã số thuế đầu tiên tìm thấy, chính là của bên bán
                value = tryExtract(cleanedText, [/Mã số thuế:\s*(\d+)/i]);
                if (value) value = `'${value}`;
                break;
            case 'cộng tiền hàng':
                value = tryExtract(cleanedText, [/Cộng tiền hàng hóa, dịch vụ:\s*([\d.,]+)/i]).replace(/[.,]/g, "");
                break;
            case 'thuế suất gtgt số tiền':
                 value = tryExtract(cleanedText, [/Tổng tiền thuế GTGT 10%:\s*([\d.,]+)/i]).replace(/[.,]/g, "");
                break;
            case 'tổng tiền thanh toán':
                // Lấy số tiền cuối cùng trong dòng "Cộng tiền hàng hóa, dịch vụ"
                const totalMatch = cleanedText.match(/Cộng tiền hàng hóa, dịch vụ:\s*[\d.,]+\s*[\d.,]+\s*([\d.,]+)/i);
                value = totalMatch ? totalMatch[1].replace(/[.,]/g, "") : "";
                break;
            case 'mã số bí mật':
                value = tryExtract(cleanedText, [/Mã số bí mật:\s*([A-Z0-9]+)/i]);
                break;
            case 'website':
                value = tryExtract(cleanedText, [/(https?:\/\/[^\s]+)/i]);
                break;
            case 'đơn vị mua':
                value = tryExtract(buyerBlock, [/Tên đơn vị:\s*(.*?)\s*Mã số thuế/i]);
                break;
            case 'mã số thuế bên mua':
                value = tryExtract(buyerBlock, [/Mã số thuế:\s*(\d+)/i]);
                if (value) value = `'${value}`;
                break;
            case 'địa chỉ bên mua':
                value = tryExtract(buyerBlock, [/Địa chỉ:\s*(.*?)\s*Số tài khoản/i]);
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser mặc định, sử dụng Gemini API để bóc tách dữ liệu một cách thông minh.
 * @param {string} text - Nội dung OCR từ hóa đơn.
 * @param {string[]} headers - Danh sách các tiêu đề cột từ sheet KetQua.
 * @returns {Array} - Mảng dữ liệu đã được bóc tách.
 */
function parseWithGemini(text, headers) {
    // !!! QUAN TRỌNG: Dán khóa API của bạn vào đây
    const GEMINI_API_KEY = "AIzaSyAVD5X3PyHNi946j1NZMZCORs_Bp_m88dM";
    
    if (GEMINI_API_KEY === "DÁN_KHÓA_API_CỦA_BẠN_VÀO_ĐÂY") {
        throw new Error("Vui lòng cung cấp khóa API của Gemini trong hàm parseWithGemini_AI.");
    }

    // --- 1. Chuẩn bị yêu cầu cho Gemini ---

    // Chuyển đổi tiêu đề cột thành các key JSON hợp lệ (ví dụ: "Mã số thuế bên bán" -> "ma_so_thue_ben_ban")
    const jsonKeys = headers.map(header => {
        return header.toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Bỏ dấu
            .replace(/đ/g, "d")
            .replace(/[^a-z0-9\s]/g, '') // Bỏ ký tự đặc biệt
            .trim().replace(/\s+/g, '_'); // Thay khoảng trắng bằng gạch dưới
    });

    // Tạo Schema (khuôn mẫu) để Gemini trả về kết quả JSON có cấu trúc
    const responseSchema = {
        type: "OBJECT",
        properties: {}
    };
    jsonKeys.forEach(key => {
        if (key) {
            responseSchema.properties[key] = { "type": "STRING" };
        }
    });

    // Tạo câu lệnh (prompt) hướng dẫn Gemini cách làm việc
    const systemPrompt = `
      Bạn là một chuyên gia trích xuất dữ liệu từ văn bản hóa đơn của Việt Nam.
      Nhiệm vụ của bạn là đọc văn bản OCR và trả về một đối tượng JSON DUY NHẤT chứa các thông tin được yêu cầu.
      - Chỉ trả về JSON, không thêm bất kỳ văn bản giải thích nào.
      - Đối với các trường số tiền, chỉ trả về chữ số, loại bỏ dấu phẩy, dấu chấm và đơn vị tiền tệ.
      - Đối với mã số thuế, luôn trả về dưới dạng chuỗi văn bản.
      - Nếu không tìm thấy thông tin, hãy để giá trị là một chuỗi rỗng "".
    `;

    const userPrompt = `
      Dựa vào văn bản hóa đơn sau đây, hãy trích xuất các thông tin tương ứng với các tiêu đề cột này:
      
      TIÊU ĐỀ CỘT:
      ${headers.join(', ')}

      VĂN BẢN HÓA ĐƠN OCR:
      ---
      ${text}
      ---
    `;

    // --- 2. Gửi yêu cầu đến Gemini API ---
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;
    
    const payload = {
        contents: [{ "parts": [{ "text": userPrompt }] }],
        systemInstruction: { "parts": [{ "text": systemPrompt }] },
        generationConfig: {
            "responseMimeType": "application/json",
            "responseSchema": responseSchema
        }
    };

    const options = {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
    };

    let response, responseData, extractedData;
    try {
        response = UrlFetchApp.fetch(apiUrl, options);
        responseData = JSON.parse(response.getContentText());

        if (response.getResponseCode() !== 200 || !responseData.candidates || !responseData.candidates[0].content) {
            Logger.log("Lỗi API Gemini: " + response.getContentText());
            throw new Error("Không nhận được phản hồi hợp lệ từ Gemini API.");
        }
        
        const jsonString = responseData.candidates[0].content.parts[0].text;
        extractedData = JSON.parse(jsonString);

    } catch (e) {
        Logger.log("Lỗi khi gọi hoặc xử lý phản hồi từ Gemini: " + e.message);
        throw new Error("Gặp lỗi khi giao tiếp với Gemini. Vui lòng kiểm tra lại khóa API và nội dung hóa đơn.");
    }
    
    // --- 3. Ánh xạ kết quả JSON trả về vào mảng theo đúng thứ tự của headers ---
    const result = headers.map((header, i) => {
        const key = jsonKeys[i];
        let value = extractedData[key] || "";

        // Tự động thêm dấu nháy đơn cho mã số thuế
        if (header.toLowerCase().includes('mã số thuế') && value) {
            value = `'${value}`;
        }
        return value;
    });

    return result;
}


/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY CỔ PHẦN TOYOTA ĐÔNG SÀI GÒN (FAST).
 */
function parseFastToyotaDongSaiGon_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ KeySearch
    const lookupCode = tryExtract(text, [/<TTin>(?=.*?<TTruong>KeySearch<\/TTruong>)<DLieu>(.*?)<\/DLieu>.*?<\/TTin>/i]);
    const website = "https://einvoice.fast.com.vn";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CTY CP TM XUẤT NHẬP KHẨU THỦ ĐỨC.
 */
function parseThuDucXNK_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Sử dụng logic quét theo khối để lấy "Mã số bí mật"
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            if (block.includes("<TTruong>Mã số bí mật</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break;
                }
            }
        }
    }
    
    const website = tryExtract(text, [/<NBan>.*?<Website>(.*?)<\/Website>/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY TNHH APEAX VIỆT NAM (EasyInvoice).
 */
function parseEasyInvoice_Apeax_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ Fkey
    const lookupCode = tryExtract(text, [/<TTin>(?=.*?<TTruong>Fkey<\/TTruong>)<DLieu>(.*?)<\/DLieu>.*?<\/TTin>/i]);
    // Lấy Website từ thẻ PortalLink
    const website = tryExtract(text, [/<TTin>(?=.*?<TTruong>PortalLink<\/TTruong>)<DLieu>(.*?)<\/DLieu>.*?<\/TTin>/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo từ CÔNG TY CỔ PHẦN TOYOTA ĐÔNG SÀI GÒN (FAST).
 */
function parseFastToyotaDongSaiGon_Email(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/\*/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY CỔ PHẦN TOYOTA ĐÔNG SÀI GÒN";
    // MST không có trong email, sẽ được lấy từ thư viện cấu hình
    const sellerMst = getMstByNameFromParsers(sellerName); 
    
    const buyerName = tryExtract(cleanedText, [/Kính gửi.*?:\s*(.*?)\s*CÔNG TY CỔ PHẦN/i]);

    const invoiceDate = tryExtract(cleanedText, [/Ngày Hóa đơn.*?:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoicePattern = tryExtract(cleanedText, [/Mẫu số hóa đơn.*?:\s*(\S+)/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn.*?:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn.*?:\s*(\d+)/i]);

    // Email này không chứa thông tin về tiền, sẽ để trống
    
    // Lấy mã tra cứu dài đầu tiên
    const lookupCode = tryExtract(cleanedText, [/Mã số để tra cứu hóa đơn là.*?:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/einvoice\.fast\.com\.vn)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu':
                if (invoicePattern && invoiceSeries) { value = `${invoicePattern}${invoiceSeries}`; } 
                else { value = invoiceSeries; }
                break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;

            // Các trường không có trong email sẽ được để trống
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
                value = "";
                break;
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CTY TNHH TMDV XĂNG DẦU CHÂU THÀNH.
 */
function parseChauThanhPetro_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Sử dụng logic quét theo khối để lấy "Mã số bí mật"
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            if (block.includes("<TTruong>Mã số bí mật</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break;
                }
            }
        }
    }
    
    const website = ""; // Không có trong XML

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FIXED] Parser cho hóa đơn XML của CHI NHÁNH CTY TNHH TM DV HIỆP QUẾ - CỬA HÀNG XĂNG DẤU THANH PHÚC.
 * - Cập nhật: Sử dụng phương pháp "vét cạn" (lặp qua tất cả các khối TTin)
 * để đảm bảo tìm thấy chính xác "Mã số bí mật" (TransactionID).
 */
function parseHiepQueThanhPhuc_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === CẢI TIẾN: Sử dụng phương pháp "vét cạn" (lặp) ===
    let lookupCode = "";
    // 1. Lấy tất cả các khối <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Lặp qua từng khối
        for (const block of ttinBlocks) {
            // 3. Kiểm tra xem khối này có chứa đúng <TTruong> ta cần không
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                // 4. Nếu đúng, trích xuất <DLieu> từ chính khối này
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // 5. Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // =======================================================

    const website = tryExtract(text, [/<NBan>.*?<Website>(.*?)<\/Website>/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}


/**
 * [NEW] Parser cho hóa đơn PDF của CỬA HÀNG BÁN LẺ XĂNG DẦU THÁI BẢO (Viettel).
 */
function parseViettelThaiBao_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH MỘT THÀNH VIÊN XĂNG DẦU PHAN GIA HUY - CHI NHÁNH CỬA HÀNG BÁN LẺ XĂNG DẦU THÁI BẢO";
    const sellerMst = tryExtract(cleanedText, [/MST\s*:\s*([\d\s-]+?)\s*Họ tên người mua hàng/i]).replace(/\s/g, '');
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị:.*?Mã số thuế:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Mã số thuế:.*?Địa chỉ:\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã số bí mật:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu hóa đơn điện tử tại Website:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CÔNG TY TNHH XĂNG DẦU HỒNG ĐỨC (MISA).
 */
function parseMisaHongDuc_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH XĂNG DẦU HỒNG ĐỨC";
    const sellerMst = tryExtract(cleanedText, [/Đơn vị bán hàng:.*?Mã số thuế:\s*(\d+)/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị:.*?Mã số thuế:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Mã số thuế:.*?Địa chỉ:\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FIXED] Parser cho hóa đơn PDF của CTY TNHH TM & DV Ô TÔ PHÚC ANH (MISA).
 * Sửa lỗi lấy sai địa chỉ bên mua bằng Regex thông minh hơn.
 */
function parseMisaPhucAnh_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ PHÚC ANH";
    const sellerMst = tryExtract(cleanedText, [/PHÚC ANH Mã số thuế:\s*(\d+)/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    // === CẢI TIẾN LỚN NHẤT: Lấy cả khối thông tin bên mua ===
    // Regex này sẽ tìm một khối có cấu trúc: Tên đơn vị -> Mã số thuế -> Địa chỉ
    const buyerBlockMatch = cleanedText.match(/Tên đơn vị:\s*(.*?)\s*Mã số thuế:\s*(\d+)\s*Địa chỉ:\s*(.*?)\s*Hình thức thanh toán/i);
    const buyerName = buyerBlockMatch ? buyerBlockMatch[1].trim() : "";
    const buyerMst = buyerBlockMatch ? buyerBlockMatch[2].trim() : "";
    const buyerAddress = buyerBlockMatch ? buyerBlockMatch[3].trim() : "";
    // =======================================================
    
    const subtotalStr = tryExtract(cleanedText, [/Tổng tiền hàng trước thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tổng tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*(\S+)/i, /Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY CỔ PHẦN THƯƠNG MẠI HÓC MÔN.
 */
function parseHocMonTrading_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = ""; // Không có trong XML

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY XĂNG DẦU LONG AN.
 */
function parsePetrolimexLongAn_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = "https://hoadon.petrolimex.com.vn"; // Website tra cứu mặc định của Petrolimex

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY XĂNG DẦU TÂY NINH.
 */
function parsePetrolimexTayNinh_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = "https://hoadon.petrolimex.com.vn"; // Website tra cứu mặc định của Petrolimex

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPDATED] Parser cho hóa đơn XML của CÔNG TY CỔ PHẦN PHỤ TÙNG TITAN.
 * Sử dụng logic quét theo khối để lấy "Mã số bí mật" một cách chính xác.
 */
function parseTitan_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT MỚI ===
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            // Kiểm tra xem khối có chứa tên trường "TransactionID" không
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ===================================
    
    const website = tryExtract(text, [/<NBan>.*?<Website>(.*?)<\/Website>/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY TNHH MTV XĂNG DẦU AN GIANG.
 */
function parsePetrolimexAnGiang_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = "https://hoadon.petrolimex.com.vn"; // Website tra cứu mặc định của Petrolimex

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY XĂNG DẦU VĨNH LONG.
 */
function parsePetrolimexVinhLong_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = "https://hoadon.petrolimex.com.vn"; // Website tra cứu mặc định của Petrolimex

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CÔNG TY TNHH MTV XĂNG DẦU BÀ RỊA -VŨNG TÀU.
 */
function parsePetrolimexBaRiaVungTau_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Lấy Mã số bí mật từ thẻ <Fkey> ở cuối file
    const lookupCode = tryExtract(text, [/<Fkey>(.*?)<\/Fkey>/i]);
    const website = "https://hoadon.petrolimex.com.vn"; // Website tra cứu mặc định của Petrolimex

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser riêng cho hóa đơn PDF của CÔNG TY XĂNG DẦU KHU VỰC II (VNPT).
 */
function parsePetrolimex0300555450_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY XĂNG DẦU KHU VỰC II TNHH MỘT THÀNH VIÊN";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế:\s*(\d{10})/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/[Ss]ó:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Đơn vị mua hàng:\s*(.*?)\s*Địa chỉ/i]);
    const buyerMst = tryExtract(cleanedText, [/MST\/Mã QHNS:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Đơn vị mua hàng:.*?Địa chỉ:\s*(.*?)(?:STT|Tên hàng hóa|Biển số xe)/i]);
    
    // Logic lấy các khoản tiền một cách linh hoạt, bất kể vị trí
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:.*?([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT.*?\)\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng số tiền thanh toán:.*?([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Website tra cứu:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FIXED] Parser cho hóa đơn PDF của CTY TNHH DỊCH VỤ PHÁT TRIỂN VIỄN THÔNG BẢO CHÂU.
 * Sửa lỗi lấy sai địa chỉ bên mua bằng Regex thông minh hơn.
 */
function parseEasyInvoiceBaoChau_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH DỊCH VỤ PHÁT TRIỂN VIỄN THÔNG BẢO CHÂU";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế \(Tax code\):\s*(\d{10})/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày:\s*(\d{2}-\s*\d{2}-\s*\d{4})/i]).replace(/\s*-\s*/g, '/');
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày \(Date\)\s*(\d{2})\s*tháng \(month\)\s*(\d{2})\s*năm \(year\)\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu\s*\(Serial\):\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số \(No\.\):(\d+)/i]);

    // === CẢI TIẾN LỚN NHẤT: Lấy cả khối thông tin bên mua ===
    // Regex này sẽ tìm một khối có cấu trúc: Tên đơn vị -> Mã số thuế -> Địa chỉ
    const buyerBlockMatch = cleanedText.match(/Tên đơn vị \(Company's name\):\s*(.*?)\s*Mã số thuế \(Tax code\):\s*(\d+)\s*Địa chỉ \(Address\):\s*(.*?)(?:Số tài khoản|Hình thức thanh toán)/i);
    const buyerName = buyerBlockMatch ? buyerBlockMatch[1].trim() : "";
    const buyerMst = buyerBlockMatch ? buyerBlockMatch[2].trim() : "";
    const buyerAddress = buyerBlockMatch ? buyerBlockMatch[3].trim() : "";
    // =======================================================
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng \(Total amount\):\s*([\d.]+)/i]).replace(/\./g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT \(VAT amount\):\s*([\d.]+)/i]).replace(/\./g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán \(Total payment\):\s*([\d.]+)/i]).replace(/\./g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Trang tra cứu:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CHI NHÁNH 2 CTY TNHH TM XĂNG DẦU TÂN VẠN (Bkav).
 */
function parseBkavTanVan_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CHI NHÁNH 2 CÔNG TY TNHH THƯƠNG MẠI XĂNG DẦU TÂN VẠN";
    const sellerMst = tryExtract(cleanedText, [/MST\s*:\s*([\d\s-]+?)\s*Điện thoại/i]).replace(/\s/g, '');
    
    let invoiceDate = "";
    const dateMatch = cleanedText.match(/Ngày \(day\)\s*(\d{2})\s*tháng \(month\)\s*(\d{2})\s*năm \(year\)\s*(\d{4})/i);
    if (dateMatch) {
        invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Mẫu số - Ký hiệu \(Serial No\.\):\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số \(Invoice No\.\):\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Đơn vị mua hàng\s*:\s*(.*?)\s*Địa chỉ/i]);
    const buyerMst = tryExtract(cleanedText, [/Hình thức thanh toán.*?Mã số thuế\s*:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Đơn vị mua hàng:.*?Địa chỉ\s*:\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu HĐĐT này:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Hóa đơn Điện tử \(HĐĐT\) được tra cứu trực tuyến tại\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CTY TNHH MTV Xăng dầu TM và DV Minh Phát (MISA).
 */
function parseMinhPhat_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN XĂNG DẦU THƯƠNG MẠI VÀ DỊCH VỤ MINH PHÁT";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế:\s*(\d{10})/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên công ty:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên công ty:.*?Mã số thuế:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Mã số thuế:.*?Địa chỉ:\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CÔNG TY CỔ PHẦN PHỤ TÙNG TITAN (MISA).
 */
function parseTitan_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY CỔ PHẦN PHỤ TÙNG TITAN";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế \(Tax code\):\s*(\d{10})/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày \(Signing Date\):\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu \(Serial\):\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số \(No\.\):\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên người mua \(Buyer's name\):\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên người mua.*?Mã số thuế \(Tax code\):\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Mã số thuế.*?Địa chỉ \(Address\):\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng \(Total amount excl\. VAT\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT \(VAT amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán \(Total amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu \(Invoice code\):\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website.*?(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo từ CÔNG TY CỔ PHẦN PHỤ TÙNG TITAN (MISA).
 */
function parseTitan_Email(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/\*/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY CỔ PHẦN PHỤ TÙNG TITAN";
    // MST không có trong email, sẽ được lấy từ thư viện cấu hình
    const sellerMst = getMstByNameFromParsers(sellerName); 
    
    const buyerName = tryExtract(cleanedText, [/Kính gửi: Quý khách\s*(.*?)\s*CÔNG TY CỔ PHẦN/i]);

    const invoiceDate = tryExtract(cleanedText, [/Ngày:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    // Email này không chứa thông tin về tiền, sẽ để trống

    const lookupCode = tryExtract(cleanedText, [/nhập mã số:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/www\.meinvoice\.vn\/tra-cuu)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;

            // Các trường không có trong email sẽ được để trống
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
                value = "";
                break;
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CTY TNHH TMDV Ô TÔ THỦ ĐỨC (FPT).
 */
function parseOtoThuDuc_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH TMDV Ô TÔ THỦ ĐỨC";
    const sellerMst = tryExtract(cleanedText, [/Đơn vị bán hàng:.*?Mã số thuế:\s*(\d+)/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ngày ký:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày \(date\)\s*(\d{2})\s*tháng \(month\)\s*(\d{2})\s*năm \(year\)\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị:\s*(.*?)\s*Địa chỉ/i]);
    const buyerMst = tryExtract(cleanedText, [/Hình thức thanh toán.*?Mã số thuế\s*:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Tên đơn vị:.*?Địa chỉ:\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Tổng cộng\s*([\d.,]+)\s* \d{1,3}(?:[.,]\d{3})*\s* \d{1,3}(?:[.,]\d{3})*/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tổng cộng.*? \d{1,3}(?:[.,]\d{3})*\s*([\d.,]+)\s* \d{1,3}(?:[.,]\d{3})*/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng.*? \d{1,3}(?:[.,]\d{3})*\s* \d{1,3}(?:[.,]\d{3})*\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Trang tra cứu:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CTY TNHH THƯƠNG MẠI DỊCH VỤ HDTV (Viettel).
 */
function parseHDTV_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ HDTV";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế \(Tax code\):\s*(\d{10})/i]);
    
    // Logic lấy ngày linh hoạt
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày \(date\)\s*(\d{2})\s*tháng \(month\)\s*(\d{2})\s*năm \(year\)\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu \(Serial\):\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số \(No\.\):\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị \(Company name\):\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị.*?Mã số thuế \(Tax code\):\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Mã số thuế.*?Địa chỉ \(Address\):\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng \(Total amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT \(VAT amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán \(Total payment\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã số bí mật:\s*(\S+)\./i]);
    const website = tryExtract(cleanedText, [/Tra cứu hóa đơn điện tử tại Website:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CTY TNHH THƯƠNG MẠI DỊCH VỤ HDTV.
 */
function parseHDTV_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan>
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // Sử dụng logic quét theo khối để lấy "Mã số bí mật"
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            if (block.includes("<TTruong>Mã số bí mật</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break;
                }
            }
        }
    }
    
    const website = ""; // Không có trong XML

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPDATED] Parser cho email thông báo hóa đơn của CTY TNHH ĐTPT DV PHÚC THỊNH (EasyInvoice).
 * Bóc tách đầy đủ thông tin từ email thông báo.
 */
function parseEasyInvoice_PhucThinh(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/\*/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH ĐẦU TƯ PHÁT TRIỂN DỊCH VỤ PHÚC THỊNH";
    const sellerMst = tryExtract(cleanedText, [/PHÚC THỊNH, Mã số thuế\s*(\d+)/i]);
    
    const buyerName = tryExtract(cleanedText, [/đến Quý khách\s*(.*?),\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/đến Quý khách.*?, Mã số thuế\s*(\d+)/i]);

    const invoiceDate = tryExtract(cleanedText, [/Ngày hóa đơn:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu mẫu số hóa đơn:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);

    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế:\s*([\d,]+)/i]).replace(/,/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d,]+)/i]).replace(/,/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.easyinvoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'cộng tiền hàng':
                if (totalAmountStr && vatAmountStr) {
                    value = String((parseInt(totalAmountStr, 10) || 0) - (parseInt(vatAmountStr, 10) || 0));
                }
                break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FIXED] Parser cho hóa đơn XML của CTY TNHH TMDV Ô TÔ THỦ ĐỨC.
 * Sửa lỗi lấy sai "Mã số bí mật" bằng logic quét theo khối.
 */
function parseOtoThuDuc_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT ĐÃ SỬA LỖI ===
    let lookupCode = "";
    // 1. Tìm tất cả các khối thông tin <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Duyệt qua từng khối
        for (const block of ttinBlocks) {
            // 3. Nếu khối nào chứa một trong các tên trường phổ biến
            if (block.includes("<TTruong>Mã số bí mật</TTruong>") || block.includes("<TTruong>TransactionID</TTruong>") || block.includes("<TTruong>Fkey</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ===========================================
    
    const website = "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [SỬA LỖI TÊN CỘT] Parser cho hóa đơn XML của CTY TNHH MTV PHỤNG TÂN TIẾN.
 * Chấp nhận cả header 'ngày ký' và 'ký ngày'.
 * @param {string} xmlText Nội dung của file XML dưới dạng văn bản.
 * @param {string[]} headers Mảng chứa các tiêu đề cột từ trang tính.
 * @returns {any[]} Mảng dữ liệu đã được phân tích.
 */
function parseEasyInvoice_PhungTanTien_XML(xmlText, headers) {
    const result = [];
    try {
        const document = XmlService.parse(xmlText);
        const root = document.getRootElement();
        const ns = root.getNamespace(); // Luôn xử lý namespace để đảm bảo ổn định

        const dataElement = root.getChild('DLHDon', ns);
        if (!dataElement) {
            Logger.log("LỖI CẤU TRÚC: Không tìm thấy thẻ <DLHDon>.");
            return new Array(headers.length).fill(null);
        }

        const generalInfoElement = dataElement.getChild('TTChung', ns);
        const contentElement = dataElement.getChild('NDHDon', ns);

        if (!generalInfoElement || !contentElement) {
            Logger.log("LỖI CẤU TRÚC: Không tìm thấy thẻ <TTChung> hoặc <NDHDon>.");
            return new Array(headers.length).fill(null);
        }

        const getText = (element, childName) => {
            if (element && element.getChild(childName, ns)) {
                return element.getChild(childName, ns).getText();
            }
            return "";
        };

        const invoiceDateRaw = getText(generalInfoElement, 'NLap');
        const invoiceDate = invoiceDateRaw ? `${invoiceDateRaw.substr(8, 2)}/${invoiceDateRaw.substr(5, 2)}/${invoiceDateRaw.substr(0, 4)}` : "";
        const invoiceSeries = getText(generalInfoElement, 'KHHDon');
        const invoiceNumber = getText(generalInfoElement, 'SHDon');

        const sellerElement = contentElement.getChild('NBan', ns);
        const buyerElement = contentElement.getChild('NMua', ns);
        const paymentElement = contentElement.getChild('TToan', ns);

        const sellerName = getText(sellerElement, 'Ten').replace(/\.$/, '').trim();
        const sellerMst = getText(sellerElement, 'MST');
        const buyerName = getText(buyerElement, 'Ten');
        const buyerMst = getText(buyerElement, 'MST');
        const buyerAddress = getText(buyerElement, 'DChi');

        const subtotalStr = getText(paymentElement, 'TgTCThue').split('.')[0];
        const vatAmountStr = getText(paymentElement, 'TgTThue').split('.')[0];
        const totalAmountStr = getText(paymentElement, 'TgTTTBSo').split('.')[0];

        let lookupCode = '';
        let website = '';
        const otherInfoElement = generalInfoElement.getChild('TTKhac', ns);
        if (otherInfoElement) {
            const otherInfos = otherInfoElement.getChildren('TTin', ns);
            for (const info of otherInfos) {
                const fieldName = getText(info, 'TTruong');
                const fieldValue = getText(info, 'DLieu');
                if (fieldName === 'Fkey') {
                    lookupCode = fieldValue;
                }
                if (fieldName === 'PortalLink') {
                    website = fieldValue;
                }
            }
        }

        // --- Gán giá trị vào các cột ---
        for (const header of headers) {
            const h = header.toLowerCase().trim();
            let value = null;

            switch (h) {
                case 'ký hiệu': value = invoiceSeries; break;
                // [SỬA LỖI] Chấp nhận cả hai trường hợp 'ngày ký' và 'ký ngày'
                case 'ngày ký':
                case 'ký ngày':
                    value = invoiceDate;
                    break;
                case 'số hóa đơn': value = invoiceNumber; break;
                case 'đơn vị bán': value = sellerName; break;
                case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
                case 'cộng tiền hàng': value = subtotalStr; break;
                case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
                case 'tổng tiền thanh toán': value = totalAmountStr; break;
                case 'mã số bí mật': value = lookupCode; break;
                case 'website': value = website; break;
                case 'đơn vị mua': value = buyerName; break;
                case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
                case 'địa chỉ bên mua': value = buyerAddress; break;
            }

            result.push(value !== null ? String(value).trim() : null);
        }

    } catch (e) {
        Logger.log(`LỖI NGHIÊM TRỌNG KHI PHÂN TÍCH XML: ${e.message}`);
        return new Array(headers.length).fill(null);
    }

    return result;
}
/**
 * [NEW] Parser cho hóa đơn từ CHI NHÁNH 2 CTY TNHH TM XĂNG DẦU TÂN VẠN (Bkav eHoadon).
 */
function parseBkavTanVan(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/\*/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CHI NHÁNH 2 CÔNG TY TNHH THƯƠNG MẠI XĂNG DẦU TÂN VẠN";
    // MST không có trong email, sẽ được lấy từ sheet 'Parsers'
    const sellerMst = getMstByNameFromParsers(sellerName);
    
    const invoiceDate = tryExtract(cleanedText, [/Ngày Hóa đơn:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoicePattern = tryExtract(cleanedText, [/Mẫu số:\s*(\S+)/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số Hóa đơn:\s*(\d+)/i]);

    const totalAmountStr = tryExtract(cleanedText, [/Tổng thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu là:\s*(\S+)/i]);
    const website = "https://tracuu.ehoadon.vn";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu':
                if (invoicePattern && invoiceSeries) { value = `${invoicePattern}${invoiceSeries}`; } 
                else { value = invoiceSeries; }
                break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;

            // Các trường không có trong email sẽ được để trống
            case 'đơn vị mua':
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
                value = "";
                break;
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPDATED & ROBUST] Parser cho hóa đơn XML của CTY TNHH MTV AN LỘC VIỆT.
 * - Sử dụng logic quét theo khối để lấy chính xác "Mã số bí mật" từ TransactionID.
 * - Cập nhật Website tra cứu đúng của hệ thống MISA.
 */
function parseAnLocViet_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT MỚI ===
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            // Kiểm tra xem khối có chứa tên trường "TransactionID" không
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ===================================
    
    const website = "https://www.meinvoice.vn/tra-cuu/";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPDATED] Parser cho email thông báo từ DNTN TRẠM XĂNG DẦU TẤN HƯNG (EasyInvoice).
 * Cập nhật để xử lý chính xác định dạng hóa đơn đầy đủ hơn.
 */
function parseEasyInvoice_TanHung(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "DOANH NGHIỆP TƯ NHÂN TRẠM XĂNG DẦU TẤN HƯNG";
    const sellerMst = tryExtract(cleanedText, [/TẤN HƯNG, Mã số thuế\s*(\d+)/i]);
    
    const buyerName = tryExtract(cleanedText, [/đến Quý khách\s*(.*?),\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/đến Quý khách.*?, Mã số thuế\s*\*?\s*(\d+)/i]);

    const invoiceDate = tryExtract(cleanedText, [/Ngày hóa đơn:\s*\*?\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu mẫu số hóa đơn:\s*\*?\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*\*?\s*(\d+)/i]);

    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế:\s*\*?\s*([\d,]+)/i]).replace(/,/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*\*?\s*([\d,]+)/i]).replace(/,/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*\*?\s*([A-Z0-9]+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.easyinvoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'cộng tiền hàng':
                if (totalAmountStr && vatAmountStr) {
                    value = String((parseInt(totalAmountStr, 10) || 0) - (parseInt(vatAmountStr, 10) || 0));
                }
                break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPDATED] Parser cho hóa đơn XML của CÔNG TY TNHH GRAB.
 * Sử dụng logic quét theo khối để lấy "Mã số bí mật" một cách chính xác.
 */
function parseGrab_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT MỚI ===
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            // Ưu tiên tìm TransactionID trước, sau đó đến Fkey
            if (block.includes("<TTruong>TransactionID</TTruong>") || block.includes("<TTruong>Fkey</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ===================================
    
    const website = "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPDATED] Parser mặc định cho các file XML.
 * Cập nhật logic lấy "Mã số bí mật" linh hoạt theo cả Tiếng Việt và Tiếng Anh.
 */
function parseDefault_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw && invoiceDateRaw.includes('-')) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT MỚI ===
    let lookupCode = "";
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        for (const block of ttinBlocks) {
            // Kiểm tra xem khối có chứa tên trường Tiếng Việt HOẶC Tiếng Anh không
            if (block.includes("<TTruong>Mã số bí mật</TTruong>") || block.includes("<TTruong>TransactionID</TTruong>")) {
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ===================================
    
    const website = "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn XML của CTY TNHH MTV Xăng dầu TM và DV Minh Phát.
 */
function parseMinhPhat_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // Lấy các giá trị tiền từ khối <TToan> và bỏ phần thập phân
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT CHÍNH XÁC VÀ ỔN ĐỊNH ===
    let lookupCode = "";
    // 1. Tìm tất cả các khối thông tin <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Duyệt qua từng khối
        for (const block of ttinBlocks) {
            // 3. Nếu khối nào chứa "TransactionID"
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                // 4. Lấy dữ liệu <DLieu> từ chính khối đó
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    const website = "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FINAL-FIXED] Parser cho hóa đơn XML của CTY CP Vận tải TM và DV Hà Nội.
 * Sử dụng logic quét theo khối để lấy chính xác "Mã số bí mật" từ TransactionID.
 */
function parseHanoiTTS_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];

    // === LOGIC LẤY MÃ SỐ BÍ MẬT CHÍNH XÁC VÀ ỔN ĐỊNH ===
    let lookupCode = "";
    // 1. Tìm tất cả các khối thông tin <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Duyệt qua từng khối
        for (const block of ttinBlocks) {
            // 3. Nếu khối nào chứa "TransactionID"
            if (block.includes("<TTruong>TransactionID</TTruong>")) {
                // 4. Lấy dữ liệu <DLieu> từ chính khối đó
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // =================================================

    const website = "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [OPTIMIZED] Parser cho hóa đơn XML của CTY TNHH XĂNG DẦU 77.
 * Tối ưu hóa việc lấy "Mã số bí mật" dựa trên cấu trúc đã xác nhận.
 */
function parseXangDau77_XML(text, headers) {
    const result = [];

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(text, [/<NBan>.*?<Ten>(.*?)<\/Ten>/i]);
    const sellerMst = tryExtract(text, [/<NBan>.*?<MST>(.*?)<\/MST>/i]);
    
    const invoiceDateRaw = tryExtract(text, [/<NLap>(.*?)<\/NLap>/i]);
    let invoiceDate = "";
    if (invoiceDateRaw) {
        const dateParts = invoiceDateRaw.split('-');
        invoiceDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
    }
    
    const invoiceSeries = tryExtract(text, [/<KHHDon>(.*?)<\/KHHDon>/i]);
    const invoiceNumber = tryExtract(text, [/<SHDon>(.*?)<\/SHDon>/i]);

    const buyerName = tryExtract(text, [/<NMua>.*?<Ten>(.*?)<\/Ten>/i]);
    const buyerMst = tryExtract(text, [/<NMua>.*?<MST>(.*?)<\/MST>/i]);
    const buyerAddress = tryExtract(text, [/<NMua>.*?<DChi>(.*?)<\/DChi>/i]);
    
    // ...
    const subtotalStr = tryExtract(text, [/<TgTCThue>(.*?)<\/TgTCThue>/i]).split('.')[0];
    const vatAmountStr = tryExtract(text, [/<TgTThue>(.*?)<\/TgTThue>/i]).split('.')[0];
    const totalAmountStr = tryExtract(text, [/<TgTTTBSo>(.*?)<\/TgTTTBSo>/i]).split('.')[0];
    // ...
    // === LOGIC TỐI ƯU: Lấy "Mã số bí mật" trực tiếp bằng Regex ===
    let lookupCode = "";
    // 1. Tìm tất cả các khối <TTin>...</TTin>
    const ttinBlocks = text.match(/<TTin>.*?<\/TTin>/gi);
    if (ttinBlocks) {
        // 2. Duyệt qua từng khối
        for (const block of ttinBlocks) {
            // 3. Nếu khối nào chứa "Mã số bí mật"
            if (block.includes("<TTruong>Mã số bí mật</TTruong>")) {
                // 4. Lấy dữ liệu <DLieu> từ chính khối đó
                const match = block.match(/<DLieu>(.*?)<\/DLieu>/i);
                if (match && match[1]) {
                    lookupCode = match[1];
                    break; // Dừng lại ngay khi tìm thấy
                }
            }
        }
    }
    // ==========================================================
    
    const website = "";

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}

/**
 * [NEW] Parser riêng cho hóa đơn PDF của CÔNG TY XĂNG DẦU TIỀN GIANG.
 */
function parsePetrolimexTienGiang_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY XĂNG DẦU TIỀN GIANG";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế:\s*(\d+)\s*Đơn vị bán hàng/i]);
    
    let invoiceDate = "";
    let dateMatch = cleanedText.match(/Ký ngày:\s*(\d{2}\/\d{2})\s*(\d{4})/i); // Xử lý "20/07 2025"
    if (dateMatch) {
        invoiceDate = `${dateMatch[1]}/${dateMatch[2]}`;
    } else {
        dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/[Ss]ó:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Đơn vị mua hàng:\s*(.*?)\s*Địa chỉ/i]);
    const buyerMst = tryExtract(cleanedText, [/MST\/Mã QHNS:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Đơn vị mua hàng:.*?Địa chỉ:\s*(.*?)(?:STT|Tên hàng hóa)/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT.*?\)\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng số tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Website tra cứu:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FIXED] Parser cho hóa đơn PDF của CTY TNHH TM & DV Ô TÔ PHÚC ANH (MISA).
 * Sửa lỗi không lấy được "Ký ngày" bằng Regex linh hoạt hơn.
 */
function parseMisaPhucAnh_Pdf(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ PHÚC ANH";
    const sellerMst = tryExtract(cleanedText, [/PHÚC ANH Mã số thuế:\s*(\d+)/i]);
    
    // === CẢI TIẾN LOGIC LẤY NGÀY ===
    // Thử tìm "Ký ngày" trước, nếu không có thì tìm "Ngày .. tháng .. năm"
    let invoiceDate = "";
    let dateMatch = cleanedText.match(/Ký ngày:.*?(\d{2}\/\d{2}\/\d{4})/i);
    if (dateMatch && dateMatch[1]) {
        invoiceDate = dateMatch[1];
    } else {
        dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }
    // =============================
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị:.*?Mã số thuế:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Mã số thuế:\s*\d+\s*Địa chỉ:\s*(.*?)\s*Hình thức thanh toán/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Tổng tiền hàng trước thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tổng tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*(\S+)/i, /Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FINAL & ROBUST] Parser cho hóa đơn PDF của PETROLIMEX (VNPT).
 * Sửa lỗi không lấy được các trường số tiền bằng cách quét theo khối.
 */
function parsePetrolimex_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị bán hàng:\s*(CÔNG TY XĂNG DẦU.*?)(?:Địa chỉ|HÓA ĐƠN)/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế:\s*(\d{10})/i]);
    
    let invoiceDate = tryExtract(cleanedText, [/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    if (!invoiceDate) {
        const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
        if (dateMatch) {
            invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
        }
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/[Ss]ó:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Đơn vị mua hàng:\s*(.*?)\s*Địa chỉ/i]);
    const buyerMst = tryExtract(cleanedText, [/MST\/Mã QHNS:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Đơn vị mua hàng:.*?Địa chỉ:\s*(.*?)(?:STT|Tên hàng hóa|Biển số xe)/i]);
    
    // === CẢI TIẾN LỚN NHẤT: Lấy cả khối tổng tiền cùng lúc ===
    let subtotalStr = "", vatAmountStr = "", totalAmountStr = "";
    // Regex này sẽ tìm cả 3 nhãn, sau đó mới tìm 3 giá trị tiền tương ứng
    const amountsMatch = cleanedText.match(/Cộng tiền hàng:.*?Tiền thuế GTGT.*?\).*?Tổng số tiền thanh toán:.*?([\d.,]+)\s+([\d.,]+)\s+.*?([\d.,]+)/i);
    if (amountsMatch) {
        subtotalStr = (amountsMatch[1] || "").replace(/[.,]/g, '');
        vatAmountStr = (amountsMatch[2] || "").replace(/[.,]/g, '');
        totalAmountStr = (amountsMatch[3] || "").replace(/[.,]/g, '');
    }
    // =======================================================

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Website tra cứu:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [FINAL & FLEXIBLE] Parser cho hóa đơn PDF của CTY TNHH TRẠM XĂNG DẦU SÔNG THAO.
 * Sử dụng Regex linh hoạt nhất để đảm bảo lấy được tất cả các trường.
 */
function parseSongThao_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH TRẠM XĂNG DẦU SÔNG THAO";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế.*?:\s*([\d\s]+?)\s*Địa chỉ/i]).replace(/\s/g, '');
    
    // === CẢI TIẾN: Lấy ngày theo nhiều định dạng ===
    const dateMatch = cleanedText.match(/Ký ngày:\s*(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{4})/i) || cleanedText.match(/Ngày.*?(\d{2})\s*tháng.*?(\d{2})\s*năm.*?(\d{4})/i);
    let invoiceDate = "";
    if (dateMatch) {
      // Nếu khớp mẫu "Ký ngày: DD-MM-YYYY"
      if (dateMatch[0].includes('-')) {
        invoiceDate = `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}`;
      } 
      // Nếu khớp mẫu "Ngày DD tháng MM năm YYYY"
      else {
        invoiceDate = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`;
      }
    }
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu.*?:\s*(\S+)/i]);
    // === CẢI TIẾN: Regex linh hoạt hơn cho Số hóa đơn ===
    const invoiceNumber = tryExtract(cleanedText, [/Số.*?:\s*(\d+)/i]);

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị.*?:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị.*?Mã số thuế.*?:\s*(\d+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/Địa chỉ.*?:\s*(162\/71.*?)(?:Điện thoại|Căn cước)/i]);
    
    // === CẢI TIẾN: Regex linh hoạt hơn cho các khoản tiền ===
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng.*?:s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT.*?:s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán.*?:s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu\s*:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Trang tra cứu\s*:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho email thông báo từ CTY CP TM & DV Cần Giờ (VNPT).
 */
function parseVNPTCanGio_Email(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị\s*(.*?)\s*vừa phát hành/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế đơn vị phát hành:\s*(\d+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên khách hàng:\s*(.*?)(?=1\.|2\.|Để xem|$)/i, /của Quý khách hàng\s*(.*?)(?=\.|$)/i]);
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoicePattern = tryExtract(cleanedText, [/Mẫu số:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*([A-Z0-9-]+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.vnpt-invoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột theo tiêu đề ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu':
                if (invoicePattern && invoiceSeries) { value = `${invoicePattern}${invoiceSeries}`; } 
                else { value = invoiceSeries; }
                break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;

            // Các trường không có trong email sẽ được để trống
            case 'ký ngày':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'ghi chú':
                value = "";
                break;
                
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CTY CP TM & DV Cần Giờ (VNPT).
 */
function parseVNPTCanGio(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị bán hàng:\s*(.*?)\s*Địa chỉ/i]);
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế:\s*(\d{10}-\d{3})/i]); // Lấy MST của chi nhánh
    
    const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
    const invoiceDate = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : "";
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);
    
    // Xử lý khối thông tin người mua phức tạp
    const buyerBlock = tryExtract(cleanedText, [/(?:Tên đơn vị:|Họ tên người mua hàng:)\s*(.*?)(?:Hình thức thanh toán)/i]);
    let buyerName = "";
    let buyerAddress = "";
    if (buyerBlock) {
        // Tách tên và địa chỉ dựa trên việc địa chỉ thường bắt đầu bằng một con số
        const nameMatch = buyerBlock.match(/^.*?([^\d]+)/);
        if (nameMatch && nameMatch[1]) {
            buyerName = nameMatch[1].replace(/[\w-]+$/, '').trim(); // Bỏ mã số xe ở cuối nếu có
            buyerAddress = buyerBlock.replace(nameMatch[0], '').trim();
        } else {
            buyerName = buyerBlock;
        }
    }
    const buyerMst = tryExtract(cleanedText, [/Mã số thuế:\s*([\d\s]+?)\s*STT/i]).replace(/\s/g, '');
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng hóa, dịch vụ:\s*([\d\.]+)/i]).replaceAll(".", '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d\.]+)/i]).replaceAll(".", '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán:\s*([\d\.]+)/i]).replaceAll(".", '');
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.vnpt-invoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            case 'ghi chú': value = ""; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW & GENERIC] Parser chung cho các hóa đơn từ hệ thống VNPT Invoice.
 * Tự động tìm tên và MST của Đơn vị bán.
 */
function parseVNPTGeneric(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    // Tự động tìm tên đơn vị bán
    const sellerName = tryExtract(cleanedText, [/Đơn vị\s*(.*?)\s*vừa phát hành/i]);
    // Tự động tìm MST đơn vị bán
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế đơn vị phát hành:\s*(\d+)/i]);

    // Tên khách hàng nằm sau nhãn "Tên khách hàng:" hoặc "Quý khách hàng"
    const buyerName = tryExtract(cleanedText, [/Tên khách hàng:\s*(.*?)(?=1\.|2\.|Để xem|$)/i, /của Quý khách hàng\s*(.*?)(?=\.|$)/i]);
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoicePattern = tryExtract(cleanedText, [/Mẫu số:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*([A-Z0-9-]+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.vnpt-invoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột theo tiêu đề ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu':
                if (invoicePattern && invoiceSeries) { value = `${invoicePattern}${invoiceSeries}`; } 
                else { value = invoiceSeries; }
                break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;

            // Các trường không có trong email sẽ được để trống
            case 'ký ngày':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
            case 'mã số thuế bên mua':
            case 'địa chỉ bên mua':
            case 'ghi chú':
                value = "";
                break;
                
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn của TCT Cơ khí GTVT Sài Gòn (SAMCO) - VNPT.
 */
function parseVNPTSamco(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất toàn bộ thông tin ---
    const sellerName = tryExtract(cleanedText, [/(TỔNG CÔNG TY CƠ KHÍ GIAO THÔNG VẬN TẢI SÀI GÒN - TNHH MỘT THÀNH VIÊN)/i]);
    const sellerMst = getMstByNameFromParsers(sellerName);
    
    // Tìm khối chứa thông tin người mua để lấy tên và MST chính xác
    const buyerBlockMatch = cleanedText.match(/thông tin như sau:\s*(.*?)\s*Mã số thuế:\s*(\d+)/i);
    const buyerName = buyerBlockMatch ? buyerBlockMatch[1].trim() : "";
    const buyerMst = buyerBlockMatch ? buyerBlockMatch[2].trim() : "";

    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn\/ Invoice No:\s*(\d+)/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn\/ Invoice Serial:\s*(\S+)/i]);
    const invoicePattern = tryExtract(cleanedText, [/Mẫu hóa đơn\/ Invoice Pattern:\s*(\S+)/i]);
    
    const lookupCode = tryExtract(cleanedText, [/mã tra cứu sau:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/samco-tt78\.vnpt-invoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột theo tiêu đề ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu':
                // Ghép Mẫu số và Ký hiệu thành một chuỗi duy nhất
                if (invoicePattern && invoiceSeries) {
                    value = `${invoicePattern}${invoiceSeries}`;
                } else {
                    value = invoiceSeries;
                }
                break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;

            // Các trường không có trong email sẽ được để trống.
            // Script sẽ tự điền "Ngày nhận" từ ngày của email.
            case 'ký ngày':
            case 'cộng tiền hàng':
            case 'thuế suất gtgt số tiền':
            case 'tổng tiền thanh toán':
            case 'địa chỉ bên mua':
            case 'ghi chú':
                value = "";
                break;
                
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [NEW] Parser cho hóa đơn từ CÔNG TY CỔ PHẦN VẬT TƯ - XĂNG DẦU (COMECO).
 * @param {string} text - Nội dung OCR từ hóa đơn.
 * @param {string[]} headers - Danh sách các tiêu đề cột từ sheet.
 * @param {object} meta - Metadata từ email (để lấy ngày nhận dự phòng).
 * @returns {Array} - Mảng dữ liệu đã bóc tách.
 */
function parseComeco(text, headers, meta = {}) {
    const result = [];
    // Dọn dẹp văn bản, thay thế nhiều dòng thành khoảng trắng để Regex dễ xử lý
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Bắt đầu trích xuất thông tin ---
    const sellerName = "CÔNG TY CỔ PHẦN VẬT TƯ - XĂNG DẦU";
    // Lấy MST của công ty mẹ, không phải của chi nhánh, và loại bỏ khoảng trắng
    const sellerMst = tryExtract(cleanedText, [/CÔNG TY CỔ PHẦN VẬT TƯ - XĂNG DẦU.*?Mã số thuế:\s*([0-9\s]+)/i]).replace(/\s+/g, '');

    const buyerName = tryExtract(cleanedText, [/Tên đơn vị:\s*(.*?)\s*Địa chỉ/i]);
    // Lấy MST trong khối thông tin của người mua
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị:.*?Mã số thuế:\s*(\d+)/i]);

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu\s*:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/GIÁ TRỊ GIA TĂNG Số\s*:\s*(\d+)/i]);

    // Trích xuất ngày tháng theo định dạng "Ngày dd tháng mm năm yyyy"
    let invoiceDateInText = "";
    const dateMatch = cleanedText.match(/(?:Ký ngày|Ngày)\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i);
    if (dateMatch) {
        // Ghép lại thành định dạng dd/MM/yyyy
        invoiceDateInText = `${dateMatch[1].padStart(2, '0')}/${dateMatch[2].padStart(2, '0')}/${dateMatch[3]}`;
    }

    // Trích xuất các giá trị tiền và loại bỏ dấu chấm/phẩy
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng\s*:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT\s*:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán\s*:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã nhận hóa đơn:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/tracuuhd\.smartsign\.com\.vn)/i]);

    // --- Gán giá trị đã trích xuất vào các cột tương ứng ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                // Ưu tiên ngày trên hóa đơn, nếu không có mới lấy ngày nhận email
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: 
                value = null;
                break; 
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}
/**
 * [NEW] Parser cho hóa đơn thông báo từ CÔNG TY TNHH TOYOTA AN SƯƠNG (VNPT).
 * Dữ liệu từ email rất cơ bản, thiếu ngày tháng và các giá trị tiền.
 * @param {string} text - Nội dung OCR từ email.
 * @param {string[]} headers - Danh sách các tiêu đề cột từ sheet.
 * @param {object} meta - Metadata từ email (để lấy ngày nhận).
 * @returns {Array} - Mảng dữ liệu đã bóc tách.
 */
function parseToyotaAnSuong(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Bắt đầu trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH TOYOTA AN SƯƠNG";
    const buyerName = tryExtract(cleanedText, [/Kính gửi:\s*(.*?)\s*CÔNG TY TNHH/i]);
    
    // Email này không chứa MST, sẽ được điền từ sheet 'Parsers'
    const sellerMst = getMstByNameFromParsers(sellerName); 

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/toyotaansuong-tt78\.vnpt-invoice\.com\.vn)/i]);

    // --- Gán giá trị đã trích xuất vào các cột tương ứng ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                // Email này không có ngày hóa đơn, do đó sẽ LUÔN lấy ngày nhận email
                if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            
            // Các trường không có trong email (tiền bạc, mst người mua) sẽ để trống
            default: 
                value = null;
                break; 
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}
/**
 * [NEW] Parser cho hóa đơn từ CÔNG TY CỔ PHẦN DỊCH VỤ THƯƠNG MẠI LỐP XE VIỆT MỸ (EasyInvoice).
 * Bóc tách dữ liệu trực tiếp từ nội dung email thông báo.
 * @param {string} text - Nội dung OCR từ email.
 * @param {string[]} headers - Danh sách các tiêu đề cột từ sheet.
 * @param {object} meta - Metadata từ email (chứa ngày nhận).
 * @returns {Array} - Mảng dữ liệu đã bóc tách.
 */
function parseLopXeVietMy(text, headers, meta = {}) {
    const result = [];
    // Dọn dẹp văn bản để dễ dàng xử lý bằng Regex hơn
    const cleanedText = text.replace(/\*/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Bắt đầu trích xuất thông tin ---
    const sellerName = "CÔNG TY CỔ PHẦN DỊCH VỤ THƯƠNG MẠI LỐP XE VIỆT MỸ";
    const sellerMst = tryExtract(cleanedText, [/CÔNG TY CỔ PHẦN DỊCH VỤ THƯƠNG MẠI LỐP XE VIỆT MỸ, Mã số thuế\s*([0-9]+)/i]);
    
    const buyerName = tryExtract(cleanedText, [/phát hành hóa đơn điện tử đến Quý khách\s*(.*?),\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Mã số thuế\s*([0-9]+)\s*với thông tin chi tiết như sau/i]);

    const invoiceDateInText = tryExtract(cleanedText, [/Ngày hóa đơn:\s*(\d{2}\/\d{2}\/\d{4})/i]);
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu mẫu số hóa đơn:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế:\s*([\d,.]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d,.]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.easyinvoice\.com\.vn)/i]);

    // --- Gán giá trị đã trích xuất vào các cột tương ứng ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                // Ưu tiên ngày trên hóa đơn, nếu không có thì lấy ngày nhận email
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng':
                // Tự động tính tiền hàng = Tổng tiền - Tiền thuế
                if (totalAmountStr && vatAmountStr) {
                    const total = parseInt(totalAmountStr, 10) || 0;
                    const vat = parseInt(vatAmountStr, 10) || 0;
                    value = total - vat;
                }
                break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            // Các trường không có trong email sẽ để trống
            default: 
                value = null; // Dùng null để hàm chính không ghi đè lên dữ liệu cũ (nếu có)
                break; 
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}
/**
 * [REVISED] Parser cho hóa đơn từ nhà cung cấp SmartSign / Vi Na.
 * - Sửa lỗi lấy sai tên người bán.
 * - Xử lý các email thông báo không có tên người bán.
 */
function parseSmartSignVina(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin từ văn bản ---
    const sellerName = ""; // Để trống vì email thông báo không có tên người bán
    const sellerMst = tryExtract(cleanedText, [/MST người bán:\s*\*?([0-9-]+)/i]);
    
    const buyerName = tryExtract(cleanedText, [/Kính gửi:\s*(.*?)\s*-\s*\d+/i]);
    const buyerMst = tryExtract(cleanedText, [/Kính gửi:.*?- \s*(\d+)/i]);
    
    const invoiceDateInText = tryExtract(cleanedText, [/Ngày lập hóa đơn:\s*\*?\s*(\d{2}\/\d{2}\/\d{4})/i]);
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu hóa đơn:\s*\*?(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*\*?(\d+)/i]);

    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*\*?([\d,]+)/i]).replace(/[.,]/g, '');
    
    let lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*\*?(\S+)/i]);
    if (lookupCode && lookupCode.endsWith(',')) {
        lookupCode = lookupCode.slice(0, -1);
    }

    const website = tryExtract(cleanedText, [/Hóa đơn điện tử của.*?tại website:\s*(https?:\/\/[^\s]+)/i, /(https:\/\/tracuuhd\.smartsign\.com\.vn)/i]);
    
    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";
        
        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}
/**
 * [REWRITTEN & UPDATED] Parser cho hóa đơn VNPT (C.P Lương thực TP.HCM - Foodcosa).
 * Cập nhật để tự xử lý ngày thay thế và cải thiện regex.
 */
function parseVNPTFoodcosa(text, headers, meta = {}) { // Thêm meta để lấy ngày email
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH";
    const sellerMst = getMstByNameFromParsers(sellerName);
    
    const buyerName = tryExtract(cleanedText, [/Tên khách hàng:\s*(.*?)(?=1\.\s*Hóa đơn|$)/i]);
    
    // Cải thiện regex để bắt ký hiệu chính xác hơn
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*([A-Z0-9\/]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn:\s*(\d+)/i]);
    
    // Cố gắng tìm ngày trong văn bản (dù có thể không có)
    const invoiceDateInText = tryExtract(cleanedText, [/Ngày\s+\d{2}\s+tháng\s+\d{2}\s+năm\s+(\d{4})/i, /(\d{2}\/\d{2}\/\d{4})/i]);
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*([A-Z0-9-]+)/i]);
    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.vnpt-invoice\.com\.vn)/i]);

    // --- Gán giá trị vào các cột theo tiêu đề ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            // Logic mới để xử lý ngày tháng
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            default: 
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [UPGRADED V3] Parser cho hóa đơn PETROLIMEX (Xử lý được cả hóa đơn đầy đủ và email thông báo).
 * - Tự động nhận diện tên đơn vị bán (không còn hardcode).
 * - Tự động lấy ngày email nếu không có ngày ký trong văn bản.
 * - Giữ nguyên logic xử lý mã tra cứu và các giá trị tiền (nếu có).
 */
function parsePetrolimex(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---

    // ▼▼▼ THAY ĐỔI QUAN TRỌNG NHẤT ▼▼▼
    // Tự động tìm tên đơn vị bán thay vì gán cứng
    const sellerName = tryExtract(cleanedText, [
        /đơn vị (CÔNG TY XĂNG DẦU.*?)\s*(?:\(TNHH|đã phát hành|Mã số thuế)/i, // Dành cho email thông báo
        /(CÔNG TY XĂNG DẦU KHU VỰC II TNHH MỘT THÀNH VIÊN)/i // Giữ lại để tương thích ngược
    ]);
    // ▲▲▲ KẾT THÚC THAY ĐỔI ▲▲▲

    const sellerMst = getMstByNameFromParsers(sellerName);

    // Các regex sau vẫn giữ nguyên, chúng sẽ trả về rỗng nếu không tìm thấy trong email thông báo
    const buyerName = tryExtract(cleanedText, [/Kính gửi Quý khách hàng\s*:\s*([^,]+)/i]);
    const allMstMatches = Array.from(cleanedText.matchAll(/Mã số thuế\s*\*?\s*(\d+)/gi));
    const buyerMst = allMstMatches.length > 1 ? allMstMatches[1][1] : "";

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu(?: hóa đơn)?\s*:\s*\*?\s*([A-Z0-9\/]+)\s*\*?/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số hóa đơn\s*:\s*\*?\s*(\d+)\s*\*?/i]);
    
    const dateMatch = cleanedText.match(/Ngày\s+(\d{2})\s+tháng\s+(\d{2})\s+năm\s+(\d{4})/i);
    const invoiceDateInText = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : null;
    
    // Logic trích xuất mã tra cứu đã rất tốt, giữ nguyên
    let lookupCodeRaw = tryExtract(cleanedText, [/Mã tra cứu\s*:\s*(.*?)(?=Quý khách vui lòng)/i]);
    if (lookupCodeRaw) {
        lookupCodeRaw = lookupCodeRaw.replace(/\*/g, '').replace(/\s/g, '');
    }
    
    let website = tryExtract(cleanedText, [/(https?:\/\/[^\s<>]+)/i]);
    if (!website) website = "https://hoadon.petrolimex.com.vn";

    const totalAmountStr = tryExtract(cleanedText, [/Tổng số tiền thanh toán\s*:\s*([\d,.]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT\s*:\s*([\d,.]+)/i]).replace(/[.,]/g, '');
    let subtotalStr = tryExtract(cleanedText, [/Tổng số tiền chưa có thuế GTGT\s*:\s*([\d,.]+)/i]).replace(/[.,]/g, '');

    if (!subtotalStr && totalAmountStr && vatAmountStr) {
        subtotalStr = (parseInt(totalAmountStr, 10) || 0) - (parseInt(vatAmountStr, 10) || 0);
    }

    // --- Gán giá trị vào các cột theo tiêu đề ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    // Cực kỳ quan trọng cho email thông báo không có ngày
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật':
                if (lookupCodeRaw) {
                    value = lookupCodeRaw + "*"; // Petrolimex luôn cần dấu * ở cuối mã
                }
                break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * [REWRITTEN & FINAL] Parser cho CÔNG TY TNHH TRẠM XĂNG DẦU SÔNG THAO.
 * - Cải thiện lấy mã tra cứu, ký hiệu, số hóa đơn khi có dấu *.
 * - Tự xử lý việc lấy ngày email thay thế.
 */
function parseSongThaoEmail(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = "CÔNG TY TNHH TRẠM XĂNG DẦU SÔNG THAO";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế\s*\*?\s*(\d+)/i]);
    const buyerName = tryExtract(cleanedText, [/khách\s*(.*?),\s*Mã số thuế/i]);
    
    const allMstMatches = Array.from(cleanedText.matchAll(/Mã số thuế\s*\*?\s*(\d+)/gi));
    const buyerMst = allMstMatches.length > 1 ? allMstMatches[1][1] : "";

    // Cải thiện regex để xử lý dấu *
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu mẫu số hóa đơn:\s*\*?([A-Z0-9]+)\*?/i]);
    const invoiceNumber = tryExtract(cleanedText, [/(?<!Ký hiệu mẫu\s)Số(?: hóa đơn)?\s*:\s*\*?(\d+)\*?/i]);
    const invoiceDateInText = tryExtract(cleanedText, [/Ngày hóa đơn:\s*\*?\s*(\d{2}\/\d{2}\/\d{4})/i]);
    
    // ▼▼▼ THAY ĐỔI DUY NHẤT TẠI ĐÂY ▼▼▼
    // Regex mới chỉ bắt giữ các ký tự chữ và số, bỏ qua dấu *
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*\*?([a-zA-Z0-9]+)\*?/i]);
    // ▲▲▲ KẾT THÚC THAY ĐỔI ▲▲▲

    const website = tryExtract(cleanedText, [/(https?:\/\/[\w.-]+\.easyinvoice\.com\.vn\S+)/i]);
    
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*\*?\s*([\d,]+)/i]).replace(/,/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế:\s*\*?\s*([\d,]+)/i]).replace(/,/g, '');

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            // Thêm logic lấy ngày email thay thế
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'cộng tiền hàng':
                if (totalAmountStr && vatAmountStr) {
                    const total = parseInt(totalAmountStr, 10) || 0;
                    const vat = parseInt(vatAmountStr, 10) || 0;
                    value = total - vat;
                }
                break;
            default:
                value = null;
                break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
/**
 * Parser cho hóa đơn của DNTN TM DV PHÚC AN (MISA meInvoice)
 */
function parsePhucAn(text, headers) {
  const result = [];
  const cleanedText = text.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();

  // --- Tách khối thông tin người mua ---
  // Khối này nằm sau thông tin chung của hóa đơn và trước bảng hàng hóa.
  let buyerBlock = "";
  const buyerBlockMatch = cleanedText.match(/Số:\s*\d+\s*(.*?)\s*STT Tên hàng hóa/i);
  if (buyerBlockMatch && buyerBlockMatch[1]) {
    buyerBlock = buyerBlockMatch[1];
    Logger.log(`✅ Khối người mua (PhucAn) đã được tách: "${buyerBlock}"`);
  } else {
    buyerBlock = cleanedText; // Fallback
  }
  // --- Kết thúc tách khối ---

  for (let header of headers) {
    const h = header.toLowerCase().trim();
    let value = "";

    if (h.includes("ký hiệu")) {
      const match = cleanedText.match(/Ký hiệu:\s*([A-Z0-9]+)/i);
      value = match ? match[1] : "";
    }
    else if (h === "số") {
      const match = cleanedText.match(/Số:\s*(\d+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("ký ngày")) {
      const match = cleanedText.match(/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("đơn vị bán")) {
      value = "DOANH NGHIỆP TƯ NHÂN THƯƠNG MẠI DỊCH VỤ PHÚC AN";
    }
    else if (h.includes("mã số thuế") && !h.includes("mua")) {
      // Tìm MST ngay sau tên đơn vị bán hàng ở đầu file
      const match = cleanedText.match(/Đơn vị bán hàng:.*?Mã số thuế:\s*(\d+)/i);
      value = match ? "'" + match[1] : "";
    }
    else if (h.includes("đơn vị mua")) {
      // Tìm trong khối người mua
      const match = buyerBlock.match(/Tên đơn vị:\s*(.+?)\s*Mã số thuế/i);
      value = match ? match[1].trim() : "";
    }
    else if (h.includes("mã số thuế") && h.includes("mua")) {
      // Tìm trong khối người mua
      const match = buyerBlock.match(/Mã số thuế:\s*(\d+)/i);
      value = match ? "'" + match[1] : "";
    }
    else if (h.includes("địa chỉ") && h.includes("mua")) {
      // Tìm trong khối người mua
      const match = buyerBlock.match(/Địa chỉ:\s*(.+?)\s*Hình thức thanh toán/i);
      value = match ? match[1].trim() : "";
    }
    else if (h.includes("cộng tiền")) {
      const match = cleanedText.match(/Cộng tiền hàng:\s*([\d.,]+)/i);
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("thuế suất") && h.includes("số tiền")) {
      const match = cleanedText.match(/Tiền thuế GTGT:\s*([\d.,]+)/i);
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("thuế suất") && !h.includes("số tiền")) {
      const match = cleanedText.match(/Thuế suất GTGT:\s*([\d%]+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("tổng cộng") || h.includes("tổng tiền thanh toán")) {
      const match = cleanedText.match(/Tổng tiền thanh toán:\s*([\d.,]+)/i);
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("mã số bí mật")) {
      const match = cleanedText.match(/Mã tra cứu:\s*([A-Z0-9_]+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("website")) {
      const match = cleanedText.match(/(https?:\/\/www\.meinvoice\.vn\/tra-cuu)/i);
      value = match ? match[0] : "";
    }
    else {
      value = null;
    }
    
    result.push(value !== null ? value.trim() : null);
  }
  return result;
}

/**
 * Parser cho hóa đơn của CÔNG TY TNHH THƯƠNG MẠI TÂN HIỆP (MISA meInvoice)
 */
function parseTanHiep(text, headers) {
  const result = [];
  const cleanedText = text.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ").trim();

  // --- Tách khối thông tin người mua để tìm kiếm chính xác ---
  let buyerBlock = "";
  const buyerBlockStartMarker = "Tên người mua (Buyer):";
  // Khối thông tin người mua kết thúc trước bảng kê hàng hóa
  const buyerBlockEndMarker = "STT (No)"; 
  const startIndex = cleanedText.indexOf(buyerBlockStartMarker);

  if (startIndex !== -1) {
    const fromBuyerOnwards = cleanedText.substring(startIndex);
    const endIndex = fromBuyerOnwards.indexOf(buyerBlockEndMarker);
    buyerBlock = (endIndex !== -1) ? fromBuyerOnwards.substring(0, endIndex) : fromBuyerOnwards;
    Logger.log(`✅ Khối người mua (TanHiep) đã được tách: "${buyerBlock}"`);
  } else {
    buyerBlock = cleanedText; // Fallback
  }
  // --- Kết thúc tách khối ---

  for (let header of headers) {
    const h = header.toLowerCase().trim();
    let value = "";

    if (h.includes("ký hiệu")) {
      const match = cleanedText.match(/Ký hiệu \(Serial\):\s*([A-Z0-9]+)/i);
      value = match ? match[1] : "";
    }
    else if (h === "số") {
      const match = cleanedText.match(/Số \(No\.\):\s*(\d+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("ký ngày")) {
      // Lấy ngày ký ở cuối hóa đơn cho chính xác
      const match = cleanedText.match(/Ký ngày \(Signing Date\):\s*(\d{2}\/\d{2}\/\d{4})/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("đơn vị bán")) {
      // Lấy tên công ty chính ở trên cùng
      const match = cleanedText.match(/^(CÔNG TY TNHH THƯƠNG MẠI TÂN HIỆP)/i);
      value = match ? match[1] : "CÔNG TY TNHH THƯƠNG MẠI TÂN HIỆP";
    }
    else if (h.includes("mã số thuế") && !h.includes("mua")) {
      // Tìm MST đầu tiên trong văn bản (của bên bán)
      const match = cleanedText.match(/Mã số thuế \(Tax code\):\s*(\d+)/i);
      value = match ? "'" + match[1] : "";
    }
    else if (h.includes("đơn vị mua")) {
      // Tìm trong khối người mua
      const match = buyerBlock.match(/Tên đơn vị mua hàng \(Company's name\):\s*([^]+?)\s*Địa chỉ/i);
      value = match ? match[1].trim() : "";
    }
    else if (h.includes("mã số thuế") && h.includes("mua")) {
      // Tìm trong khối người mua
      const match = buyerBlock.match(/Mã số thuế \(Tax code\):\s*(\d+)/i);
      value = match ? "'" + match[1] : "";
    }
    else if (h.includes("địa chỉ") && h.includes("mua")) {
      // Tìm trong khối người mua
      const match = buyerBlock.match(/Địa chỉ \(Address\):\s*([^]+?)\s*(Căn cước công dân|Mã số thuế)/i);
      value = match ? match[1].trim() : "";
    }
    else if (h.includes("cộng tiền")) {
      const match = cleanedText.match(/Cộng tiền hàng \(Total amount excl\. VAT\):\s*([\d.,]+)/i);
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("thuế suất") && h.includes("số tiền")) {
      const match = cleanedText.match(/Tiền thuế GTGT \(VAT amount\):\s*([\d.,]+)/i);
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("thuế suất") && !h.includes("số tiền")) {
      const match = cleanedText.match(/Thuế suất GTGT \(VAT rate\):\s*([\d%]+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("tổng cộng") || h.includes("tổng tiền thanh toán")) {
      const match = cleanedText.match(/Tổng tiền thanh toán \(Total amount\):\s*([\d.,]+)/i);
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("mã số bí mật")) {
      const match = cleanedText.match(/Mã tra cứu \(Invoice code\):\s*(\w+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("website")) {
      const match = cleanedText.match(/(https?:\/\/www\.meinvoice\.vn\/tra-cuu)/i);
      value = match ? match[0] : "";
    }
    else {
      value = null;
    }
    
    result.push(value !== null ? value.trim() : null);
  }
  return result;
}
/**
 * [REWRITTEN] Parser cho hóa đơn Viettel của C.TY TNHH Xăng Dầu 77.
 * - Cấu trúc lại để tối ưu hiệu suất và dễ đọc.
 * - Tự xử lý việc lấy ngày email thay thế.
 * - Cải thiện tất cả các Regex để tăng độ chính xác.
 */
function parseXangDau77(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin bằng Regex ---
    const sellerName = "CÔNG TY TNHH XĂNG DẦU 77";
    // Lấy MST người bán và loại bỏ khoảng trắng
    const sellerMst = tryExtract(cleanedText, [/CÔNG TY TNHH XĂNG DẦU 77.*?Mã số thuế:\s*([0-9\s]+)/i]).replace(/\s+/g, '');
    
    const buyerName = tryExtract(cleanedText, [/Tên đơn vị:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị:.*?Mã số thuế:\s*(\d+)/i]);

    // Logic lấy ngày
    let invoiceDateInText = null;
    const dateMatch1 = cleanedText.match(/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateMatch2 = cleanedText.match(/Ngày\s+(\d{2})\s+tháng\s+(\d{2})\s+năm\s+(\d{4})/i);
    if (dateMatch1) {
        invoiceDateInText = dateMatch1[1];
    } else if (dateMatch2) {
        invoiceDateInText = `${dateMatch2[1]}/${dateMatch2[2]}/${dateMatch2[3]}`;
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]); // <-- Lấy số hóa đơn chính xác

    // Lấy các giá trị tiền
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Thuế suất GTGT:\s*[\d%]+\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    
    // Lấy mã tra cứu và loại bỏ dấu chấm ở cuối nếu có
    let lookupCode = tryExtract(cleanedText, [/Mã số bí mật:\s*(\S+)/i]);
    if (lookupCode && lookupCode.endsWith('.')) {
        lookupCode = lookupCode.slice(0, -1);
    }
    
    const website = tryExtract(cleanedText, [/Tra cứu hóa đơn điện tử tại Website:\s*(https?:\/\/[^\s(]+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: value = null; break;
        }

        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}

/**
 * [REWRITTEN] Parser cho hóa đơn MISA của C.TY CP Vận tải TM và DV Hà Nội.
 * - Sử dụng Regex trực tiếp để tăng độ chính xác.
 * - Tự xử lý việc lấy ngày email thay thế.
 */
function parseVTDichVuHaNoi(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin bằng Regex ---
    const sellerName = tryExtract(cleanedText, [/Ký bởi \(Signed By\):\s*(.*?)\s*Ký ngày/i]);
    const sellerMst = tryExtract(cleanedText, [/CÔNG TY CỔ PHẦN VẬN TẢI.*?Mã số thuế \(Tax code\):\s*(\d+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên đơn vị \(Company's name\):\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên đơn vị.*?Mã số thuế \(Tax code\):\s*(\d+)/i]);

    const invoiceDateInText = tryExtract(cleanedText, [/Ký ngày \(Signing Date\):\s*(\d{2}\/\d{2}\/\d{4})/i]);
    
    // Regex được cải thiện cho các trường quan trọng
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu \(Serial\):\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số \(No\.\):\s*(\d+)/i]); // <-- Lấy số hóa đơn chính xác
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng \(Total amount excl\. VAT\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT \(VAT amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán \(Total amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu \(Invoice code\):\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website.*?(https?:\/\/[^\s]+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: value = null; break;
        }

        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}
/**
 * [REWRITTEN] Parser cho hóa đơn MISA của C.TY TNHH MTV Xăng Dầu TM và DV Minh Phát.
 * - Cấu trúc lại để tối ưu hiệu suất và dễ đọc.
 * - Tự xử lý việc lấy ngày email thay thế.
 */
function parseMinhPhat(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin bằng Regex ---
    let sellerName = tryExtract(cleanedText, [/Ký bởi:\s*(.*?)\s*Ký ngày/i]);
    // Nối lại tên công ty nếu bị ngắt dòng
    if (sellerName) {
        sellerName = sellerName.replace(/\s+/g, " ");
    }
    const sellerMst = tryExtract(cleanedText, [/CÔNG TY TRÁCH NHIỆM HỮU HẠN.*?Mã số thuế:\s*(\d+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên công ty:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên công ty:.*?Mã số thuế:\s*(\d+)/i]);

    // Logic lấy ngày: ưu tiên "Ký ngày" trước
    let invoiceDateInText = null;
    const dateMatch1 = cleanedText.match(/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateMatch2 = cleanedText.match(/Ngày\s+(\d{2})\s+tháng\s+(\d{2})\s+năm\s+(\d{4})/i);
    if (dateMatch1) {
        invoiceDateInText = dateMatch1[1];
    } else if (dateMatch2) {
        invoiceDateInText = `${dateMatch2[1]}/${dateMatch2[2]}/${dateMatch2[3]}`;
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');

    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu hóa đơn:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website:\s*(https?:\/\/[^\s]+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}

/**
 * [REWRITTEN V2] Parser cho HÓA ĐƠN CÔNG TY CỔ PHẦN NHIÊN LIỆU SÀI GÒN - VIETTEL.
 * - Sửa lỗi lấy sai link website.
 * - Cấu trúc lại để tối ưu và có logic lấy ngày thay thế.
 */
function parseViettelFuelInvoice(text, headers, meta = {}) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin bằng Regex ---
    const sellerName = "CÔNG TY CỔ PHẦN NHIÊN LIỆU SÀI GÒN";
    const sellerMst = tryExtract(cleanedText, [/Mã số thuế\s*\(Tax code\):\s*([\d\s]+)/i]).replace(/\s+/g, '');

    const buyerBlockMatch = cleanedText.match(/Họ tên người mua hàng[\s\S]*?(?=STT)/i);
    const buyerBlock = buyerBlockMatch ? buyerBlockMatch[0] : cleanedText;
    
    const buyerName = tryExtract(buyerBlock, [/Tên đơn vị\s*\(Company name\):\s*(.+)/i]);
    const buyerMst = tryExtract(buyerBlock, [/Mã số thuế\s*\(Tax code\):\s*([\d\s]+)/i]).replace(/\s+/g, '');
    
    let invoiceDateInText = null;
    const dateMatch1 = cleanedText.match(/Ký ngày\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateMatch2 = cleanedText.match(/Ngày\s*\(date\)\s*(\d{2})\s+tháng\s*(\d{2})\s+năm\s*(\d{4})/i);
    if (dateMatch1) {
        invoiceDateInText = dateMatch1[1];
    } else if (dateMatch2) {
        invoiceDateInText = `${dateMatch2[1]}/${dateMatch2[2]}/${dateMatch2[3]}`;
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu\s*\(Serial\):\s*([A-Z0-9]+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số\s*\(No\.?\)\s*:\s*(\d+)/i]);
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng \(Total\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT \(VAT amount\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán \(Total payment\):\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    
    const lookupCode = tryExtract(cleanedText, [/Mã số bí mật:\s*([A-Z0-9]+)/i]);
    
    // ▼▼▼ THAY ĐỔI LOGIC LẤY WEBSITE TẠI ĐÂY ▼▼▼
    let website = tryExtract(cleanedText, [/Tra cứu hóa đơn điện tử tại Website:\s*(https?:\/\/[^\s]+)/i]);
    // Loại bỏ dấu chấm ở cuối nếu có
    if (website && website.endsWith('.')) {
        website = website.slice(0, -1);
    }
    // ▲▲▲ KẾT THÚC THAY ĐỔI ▲▲▲
    
    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: value = null; break;
        }

        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}

/**
 * parseMeInvoice - OCR chuyên cho mẫu MISA MeInvoice
 */
function parseMeInvoice(text, headers) {
  const result = [];
  const cleanedText = text.replace(/\r\n|\n/g, "\n").replace(/[ ]+/g, " ").trim();

  for (let header of headers) {
    const h = header.toLowerCase().trim();
    let value = "";
    
    if (h.includes("ký hiệu")) { const match = cleanedText.match(/Serial\)\s*:\s*([A-Z0-9]+)/i); value = match ? match[1] : ""; }
    else if (h === "số") { const match = cleanedText.match(/Số\s*\(No\.\)\s*:\s*(\d+)/i); value = match ? match[1] : ""; }
    else if (h.includes("ký ngày")) {
      const match = cleanedText.match(/Ngày\s*\(Date\)\s*(\d{2})\s*tháng.*?(\d{2})\s*năm.*?(\d{4})/i);
      value = match ? `${match[1]}/${match[2]}/${match[3]}` : "";
    }
    else if (h.includes("cộng tiền")) { const match = cleanedText.match(/Total amount excl\. VAT\)\s*:\s*([\d.,]+)/i); value = match ? match[1].replace(/[.,]/g, "") : ""; }
    else if (h.includes("thuế suất") && !h.includes("số tiền")) {
      const match = cleanedText.match(/VAT rate\)\s*:\s*([0-9]+ ?%)/i);
      value = match ? match[1].replace(/\s+/g, "") : "";
    }
    else if (h.includes("thuế suất") && h.includes("số tiền")) { const match = cleanedText.match(/VAT amount\)\s*:\s*([\d.,]+)/i); value = match ? match[1].replace(/[.,]/g, "") : ""; }
    else if (h.includes("tổng cộng") || h.includes("tổng tiền thanh toán")) {
      let match = cleanedText.match(/Tổng tiền thanh toán\s*\(Total amount\)\s*:\s*([\d.,]+)/i);
      if (!match) { match = cleanedText.match(/Tổng tiền thanh toán[^0-9]{0,20}([\d.,]+)/i); }
      value = match ? match[1].replace(/[.,]/g, "") : "";
    }
    else if (h.includes("mã số bí mật")) { const match = cleanedText.match(/Mã tra cứu.*?:\s*([A-Z0-9]+)/i); value = match ? match[1] : ""; }
    else if (h.includes("website")) { const match = cleanedText.match(/https?:\/\/[^\s]+/i); value = match ? match[0] : ""; }
    else if (h.includes("đơn vị bán")) { value = "CÔNG TY CỔ PHẦN MISA"; }
    else if (h.includes("mã số thuế") && !h.includes("mua")) {
      const match = cleanedText.match(/MST\s*(\d{10,})/i);
      value = match ? "'" + match[1] : "";
    }
    else if (h.includes("đơn vị mua")) { const match = cleanedText.match(/Tên đơn vị\s*\(Company'?s name\)\s*:\s*(.+)/i); value = match ? match[1].trim() : ""; }
    else if (h.includes("mã số thuế") && h.includes("mua")) {
      const block = cleanedText.match(/Tên đơn vị[\s\S]*?(Mã số thuế\s*\(Tax code\)\s*:\s*[\d\s]+)/i);
      if (block) {
        const mst = block[1].match(/Mã số thuế\s*\(Tax code\)\s*:\s*([\d\s]+)/i);
        value = mst ? "'" + mst[1].replace(/\s+/g, "") : "";
      } else { value = ""; }
    }
    else if (h.includes("địa chỉ") && h.includes("mua")) {
      const block = cleanedText.match(/Tên đơn vị[\s\S]*?(Địa chỉ\s*\(Address\)\s*:\s*.+)/i);
      if (block) {
        const addr = block[1].match(/Địa chỉ\s*\(Address\)\s*:\s*(.+)/i);
        value = addr ? addr[1].trim() : "";
      } else { value = ""; }
    }
    else { value = null; }
    result.push(value !== null ? value.trim() : null);
  }
  return result;
}

/**
 * Hàm parseDefault: Dò thông tin chung với Mappings.
 */
function parseDefault(text, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mappings = getMappings(ss.getSheetByName("Mappings"));
  const result = [];
  const cleanedText = text.replace(/\r\n|\n/g, "\n").replace(/[ ]+/g, " ").trim();

  for (let header of headers) {
    const h = header.toLowerCase().trim();
    let value = "";
    const labels = mappings[header] || [header];

    if (h.includes("ký ngày")) {
      const match = cleanedText.match(/Ngày\s*\(?(Date)?\)?\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
      value = match ? `${match[2]}/${match[3]}/${match[4]}` : "";
    }
    else if (h.includes("mã số bí mật")) {
      const match = cleanedText.match(/Mã tra cứu.*?:\s*([A-Z0-9_]+)/i) || cleanedText.match(/Mã số bí mật.*?:\s*([A-Z0-9_]+)/i);
      value = match ? match[1] : "";
    }
    else if (h.includes("website")) {
      const match = cleanedText.match(/https?:\/\/[^\s]+/i);
      value = match ? match[0] : "";
    }
    else { value = findValueByLabels(cleanedText, labels); }
    result.push(value !== null ? value.trim() : null);
  }
  return result;
}

/**
 * Parser cho hóa đơn MISA của C.TY TNHH TM DV HIỆP QUẾ.
 * @param {string} text - Nội dung OCR từ hóa đơn.
 * @param {string[]} headers - Danh sách các tiêu đề cột từ sheet.
 * @param {object} meta - Metadata từ email (chứa ngày email).
 * @returns {Array} - Mảng dữ liệu đã bóc tách.
 */
function parseHiepQueMisa(text, headers, meta = {}) {
  
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin từ văn bản ---
    const sellerName = tryExtract(cleanedText, [/Ký bởi:\s*(.*?)\s*Ký ngày/i]);
    const sellerMst = tryExtract(cleanedText, [/CHI NHÁNH CÔNG TY.*?Mã số thuế:\s*([0-9-]+)/i]);
    const buyerName = tryExtract(cleanedText, [/Tên người mua:\s*(.*?)\s*Mã số thuế/i]);
    const buyerMst = tryExtract(cleanedText, [/Tên người mua:.*?Mã số thuế:\s*(\d+)/i]);
    
    // Logic lấy ngày: ưu tiên "Ký ngày" trước
    let invoiceDateInText = null;
    const dateMatch1 = cleanedText.match(/Ký ngày:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateMatch2 = cleanedText.match(/Ngày\s+(\d{2})\s+tháng\s+(\d{2})\s+năm\s+(\d{4})/i);
    if (dateMatch1) {
        invoiceDateInText = dateMatch1[1];
    } else if (dateMatch2) {
        invoiceDateInText = `${dateMatch2[1]}/${dateMatch2[2]}/${dateMatch2[3]}`;
    }

    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);

    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng tiền thanh toán:\s*([\d.,]+)/i]).replace(/[.,]/g, '');
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu tại Website:\s*(https?:\/\/[^\s]+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";
        
        switch(h) {
            case 'ký ngày':
                if (invoiceDateInText) {
                    value = invoiceDateInText;
                } else if (meta && meta.date) {
                    value = Utilities.formatDate(new Date(meta.date), "Asia/Ho_Chi_Minh", "dd/MM/yyyy");
                } else {
                    value = "";
                }
                break;
            case 'ký hiệu': value = invoiceSeries; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    
    return result;
}
/**
 * [NEW] Parser cho hóa đơn PDF của CTY CP TM & DV Cần Giờ (VNPT).
 * Xử lý định dạng OCR phức tạp.
 */
function parseVNPTCanGio_PDF(text, headers) {
    const result = [];
    const cleanedText = text.replace(/\u00A0/g, ' ').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

    // --- Trích xuất thông tin ---
    const sellerName = tryExtract(cleanedText, [/Đơn vị bán hàng:\s*(.*?)\s*Địa chỉ/i]);
    const sellerMst = tryExtract(cleanedText, [/Điện thoại:.*?Mã số thuế:\s*(\d{10}-\d{3})/i]);
    
    const dateMatch = cleanedText.match(/Ngày\s*(\d{2})\s*tháng\s*(\d{2})\s*năm\s*(\d{4})/i);
    const invoiceDate = dateMatch ? `${dateMatch[1]}/${dateMatch[2]}/${dateMatch[3]}` : "";
    
    const invoiceSeries = tryExtract(cleanedText, [/Ký hiệu:\s*(\S+)/i]);
    const invoiceNumber = tryExtract(cleanedText, [/Số:\s*(\d+)/i]);
    
    // Xử lý khối thông tin người mua phức tạp
    const buyerName = tryExtract(cleanedText, [/(?:Tên đơn vị:|Họ tên người mua hàng:)\s*(?:[\w-]+)?\s*([^\d]+)/i]);
    const buyerAddress = tryExtract(cleanedText, [/HỢP TÁC XÃ THƯƠNG MẠI DU LỊCH VẬN TẢI THÀNH CÔNG(.*?)(?:Hình thức thanh toán)/i]);
    const buyerMst = tryExtract(cleanedText, [/Mã số thuế:\s*([\d\s]+?)\s*STT/i]).replace(/\s/g, '');
    
    const subtotalStr = tryExtract(cleanedText, [/Cộng tiền hàng hóa, dịch vụ:\s*([\d\.]+)/i]).replaceAll(".", '');
    const vatAmountStr = tryExtract(cleanedText, [/Tiền thuế GTGT:\s*([\d\.]+)/i]).replaceAll(".", '');
    const totalAmountStr = tryExtract(cleanedText, [/Tổng cộng tiền thanh toán:\s*([\d\.]+)/i]).replaceAll(".", '');
    
    const lookupCode = tryExtract(cleanedText, [/Mã tra cứu:\s*(\S+)/i]);
    const website = tryExtract(cleanedText, [/Tra cứu thông tin và in hóa đơn điện tử tại:\s*(https?:\/\/\S+)/i]);

    // --- Gán giá trị vào các cột ---
    for (const header of headers) {
        const h = header.toLowerCase().trim();
        let value = "";

        switch(h) {
            case 'ký hiệu': value = invoiceSeries; break;
            case 'ký ngày': value = invoiceDate; break;
            case 'số hóa đơn': value = invoiceNumber; break;
            case 'đơn vị bán': value = sellerName; break;
            case 'mã số thuế bên bán': value = sellerMst ? `'${sellerMst}` : ''; break;
            case 'cộng tiền hàng': value = subtotalStr; break;
            case 'thuế suất gtgt số tiền': value = vatAmountStr; break;
            case 'tổng tiền thanh toán': value = totalAmountStr; break;
            case 'mã số bí mật': value = lookupCode; break;
            case 'website': value = website; break;
            case 'đơn vị mua': value = buyerName; break;
            case 'mã số thuế bên mua': value = buyerMst ? `'${buyerMst}` : ''; break;
            case 'địa chỉ bên mua': value = buyerAddress; break;
            case 'ghi chú': value = ""; break;
            default: value = null; break;
        }
        
        result.push(value !== null ? String(value).trim() : null);
    }
    return result;
}
//====================================================================
/**
 * [HELPER] Thử nhiều mẫu Regex và trả về kết quả của mẫu đầu tiên khớp.
 * @param {string} text - Đoạn văn bản để tìm kiếm.
 * @param {RegExp[]} patterns - Mảng các mẫu Regex để thử.
 * @returns {string} - Giá trị tìm được hoặc chuỗi rỗng.
 */
function tryExtract(text, patterns) {
  if (!text) return "";
  for (const pattern of patterns) {
    const match = text.match(pattern);
    // Trả về group 1 của match đầu tiên tìm thấy
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return "";
}

/**
 * [V2 - NÂNG CẤP] Parser mặc định thông minh hơn.
 * Tổng hợp các trường hợp phổ biến từ nhiều loại hóa đơn khác nhau.
 */
function parseDefault_V2(text, headers) {
  const result = [];
  const cleanedText = text.replace(/\*/g, '').replace(/(\r\n|\n|\r)/gm, " ").replace(/\s+/g, " ").trim();

  // --- Cố gắng tách khối thông tin người mua ---
  let buyerBlock = "";
  const buyerBlockStartMarkers = ["Tên đơn vị:", "Họ tên người mua hàng:", "Tên người mua (Buyer):", "đến Quý khách"];
  const buyerBlockEndMarkers = ["STT", "Tên hàng hóa", "Hình thức thanh toán", "Cộng tiền hàng"];
  
  let startIndex = -1;
  for(const marker of buyerBlockStartMarkers) {
    // Dùng regex để tìm chính xác hơn
    const markerRegex = new RegExp(marker, "i");
    const match = cleanedText.match(markerRegex);
    if (match) {
      startIndex = match.index;
      break;
    }
  }

  if (startIndex !== -1) {
    const fromBuyerOnwards = cleanedText.substring(startIndex);
    let endIndex = -1;
    for(const marker of buyerBlockEndMarkers) {
        const markerRegex = new RegExp(marker, "i");
        const match = fromBuyerOnwards.match(markerRegex);
        if (match) {
            endIndex = match.index;
            break;
        }
    }
    buyerBlock = (endIndex !== -1) ? fromBuyerOnwards.substring(0, endIndex) : fromBuyerOnwards;
    Logger.log(`✅ Default Parser - Khối người mua đã được tách: "${buyerBlock}"`);
  } else {
    buyerBlock = cleanedText; // Fallback
  }
  // --- Kết thúc tách khối ---

  for (let header of headers) {
    const h = header.toLowerCase().trim();
    let value = "";

    if (h.includes("ký hiệu")) {
      const patterns = [ /Ký hiệu\s*\(Serial\)\s*[:：]?\s*([A-Z0-9\/]+)/i, /Ký hiệu mẫu số hóa đơn\s*[:：]?\s*(\w+)/i, /Ký hiệu\s*[:：]?\s*([A-Z0-9\/]+)/i ];
      value = tryExtract(cleanedText, patterns);
    }
    else if (h === "số") {
      const patterns = [ /Số\s*\(No\.\)\s*[:：]?\s*(\d+)/i, /Số hóa đơn\s*[:：]?\s*(\d+)/i, /Số\s*[:：]?\s*(\d+)/i ];
      value = tryExtract(cleanedText, patterns);
    }
    else if (h.includes("ký ngày")) {
      const patterns = [ /Ký ngày\s*\(Signing Date\)\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i, /Ký ngày\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i, /Ngày hóa đơn\s*[:：]?\s*(\d{2}\/\d{2}\/\d{4})/i ];
      value = tryExtract(cleanedText, patterns);
      if (!value) {
          const dayMonthYearMatch = cleanedText.match(/Ngày\s+(\d{2})\s+tháng\s+(\d{2})\s+năm\s+(\d{4})/i);
          value = dayMonthYearMatch ? `${dayMonthYearMatch[1]}/${dayMonthYearMatch[2]}/${dayMonthYearMatch[3]}`: "";
      }
    }
    else if (h.includes("đơn vị bán")) {
      const patterns = [ /Đơn vị bán hàng\s*[:：]?\s*([^\r\n]+?)\s*Mã số thuế/i, /Ký bởi\s*[:：]?\s*([^\r\n]+)/i, /CÔNG TY[^\r\n]+/i ];
      value = tryExtract(cleanedText, patterns);
    }
    else if (h.includes("mã số thuế") && !h.includes("mua")) {
      const patterns = [ /Mã số thuế\s*\(Tax code\)\s*[:：]?\s*([\d\s]+)/i, /Mã số thuế\s*[:：]?\s*([\d\s]+)/i ];
      value = tryExtract(cleanedText, patterns).replace(/\s+/g, "");
      if (value) value = "'" + value;
    }
    else if (h.includes("đơn vị mua")) {
      const patterns = [ /Tên đơn vị(?: mua hàng)?(?:\s*\(Company(?:'s)? name\))?\s*[:：]?\s*(.+?)\s*(?:Mã số thuế|Địa chỉ)/i, /đến Quý khách\s(.*?),\s*Mã số thuế/i ];
      value = tryExtract(buyerBlock, patterns);
    }
    else if (h.includes("mã số thuế") && h.includes("mua")) {
      const patterns = [ /Mã số thuế\s*\(Tax code\)\s*[:：]?\s*([\d\s]+)/i, /, Mã số thuế\s*(\d+)\s*với thông tin chi tiết/i, /Mã số thuế\s*[:：]?\s*([\d\s]+)/i ];
      value = tryExtract(buyerBlock, patterns).replace(/\s+/g, "");
      if (value) value = "'" + value;
    }
    else if (h.includes("địa chỉ") && h.includes("mua")) {
      const patterns = [ /Địa chỉ\s*\(Address\)\s*[:：]?\s*([^]+?)\s*(?:Căn cước|Hình thức thanh toán|Số tài khoản)/i, /Địa chỉ\s*[:：]?\s*([^]+?)\s*(?:Căn cước|Hình thức thanh toán|Số tài khoản)/i ];
      value = tryExtract(buyerBlock, patterns);
    }
    else if (h.includes("cộng tiền")) {
      const patterns = [ /Cộng tiền hàng\s*\(Total amount excl\. VAT\)\s*[:：]?\s*([\d.,]+)/i, /Cộng tiền hàng\s*[:：]?\s*([\d.,]+)/i ];
      value = tryExtract(cleanedText, patterns).replace(/[.,]/g, "");
    }
    else if (h.includes("thuế suất") && h.includes("số tiền")) {
      const patterns = [ /Tiền thuế GTGT\s*\(VAT amount\)\s*[:：]?\s*([\d.,]+)/i, /Thuế suất GTGT\s*[:：]?\s*[\d%]+\s*([\d.,]+)/i, /Tiền thuế GTGT\s*[:：]?\s*([\d.,]+)/i, /Tiền thuế\s*[:：]?\s*([\d,]+)/i ];
      value = tryExtract(cleanedText, patterns).replace(/[.,]/g, "");
    }
    else if (h.includes("thuế suất") && !h.includes("số tiền")) {
      const patterns = [ /Thuế suất GTGT\s*\(VAT rate\)\s*[:：]?\s*([\d\s%]+)/i, /Thuế suất GTGT\s*[:：]?\s*([\d\s%]+)/i ];
      value = tryExtract(cleanedText, patterns).replace(/\s/g, '');
    }
    else if (h.includes("tổng cộng") || h.includes("tổng tiền thanh toán")) {
      const patterns = [ /Tổng tiền thanh toán\s*\(Total amount\)\s*[:：]?\s*([\d.,]+)/i, /Tổng cộng tiền thanh toán\s*[:：]?\s*([\d.,]+)/i ];
      value = tryExtract(cleanedText, patterns).replace(/[.,]/g, "");
    }
    else if (h.includes("mã số bí mật")) {
            const patterns = [
                /Mã tra cứu\s*\(Invoice code\)\s*[:：]?\s*([A-Z0-9]{5,})/i,
                /Mã tra cứu\s*[:：]?\s*([A-Z0-9]{5,})/i,
                /Mã số bí mật\s*[:：]?\s*([A-Z0-9]{5,})/i
            ];
            value = tryExtract(cleanedText, patterns);
    }
    else if (h.includes("website") || h.includes("link tra cứu")) {
      const patterns = [ /(https?:\/\/[^\s()]+)/i ];
      value = tryExtract(cleanedText, patterns);
    }
    else {
      value = null;
    }
    
    result.push(value !== null ? value : null);
  }
  return result;
}

/**
 * [HELPER] Lấy MST từ sheet "Parsers" dựa vào tên đơn vị bán.
 * @param {string} sellerName - Tên đơn vị bán hàng để tìm kiếm.
 * @returns {string} - Mã số thuế tìm được hoặc chuỗi rỗng.
 */
function getMstByNameFromParsers(sellerName) {
    // Hàm này sẽ gọi đến một hàm khác trong cùng thư viện
    const configurations = getParsers(); 
    if (!configurations || !sellerName) return "";

    const lowerSellerName = sellerName.toLowerCase().trim();
    // Tìm cấu hình có tên khớp
    const config = configurations.find(row => (row.name || '').toLowerCase().trim() === lowerSellerName);
    
    if (config) {
      return config.mst || "";
    }
    
    Logger.log(`⚠️ Không tìm thấy MST cho tên bán: '${sellerName}' trong thư viện.`);
    return "";
}

/**
 * @OnlyCurrentDoc
 * Thư viện xử lý hóa đơn InvoiceLib.
 * Chứa hàm trung tâm để lựa chọn parser phù hợp.
 */

/**
 * [HÀM CHÍNH - BỘ NÃO] Tìm và trả về parser phù hợp dựa trên nội dung OCR.
 * Hàm này sẽ được gọi từ các kịch bản chính (Main.gs, RepairScript.gs).
 * * @param {string} ocrText Nội dung văn bản của hóa đơn.
 * @returns {object|null} Một object chứa tên parser và hàm thực thi, hoặc null nếu không tìm thấy.
 * Ví dụ: { name: "Xanh SM", func: parseGsmXanhSM_XML }
 * Ví dụ: { name: "Default AI", func: parseWithGemini_AI }
 */
function getParserForContent(ocrText) {
  Logger.log("InvoiceLib: Bắt đầu tìm parser cho nội dung...");
  
  if (!ocrText || typeof ocrText !== 'string' || ocrText.trim() === "") {
    Logger.log("InvoiceLib: Nội dung OCR rỗng hoặc không hợp lệ.");
    return null;
  }

  // Luôn làm sạch text trước khi kiểm tra
  const cleanedText = ocrText.replace(/\s+/g, " ").trim();
  
  // 1. Lấy danh sách cấu hình parser từ Configuration.gs
  let parserConfigs = [];
  try {
     // Gọi hàm getParsers() được định nghĩa trong Configuration.gs
     if (typeof getParsers === 'function') {
         parserConfigs = getParsers();
         Logger.log(`InvoiceLib: Đã lấy được ${parserConfigs.length} cấu hình parser.`);
     } else {
         Logger.log("InvoiceLib LỖI: Không tìm thấy hàm getParsers() trong Configuration.gs!");
         return getDefaultParser(); // Trả về parser mặc định nếu không có cấu hình
     }
  } catch (e) {
      Logger.log(`InvoiceLib LỖI khi gọi getParsers(): ${e.message}`);
      return getDefaultParser(); // Trả về parser mặc định nếu có lỗi
  }

  // 2. Duyệt qua các cấu hình để tìm parser phù hợp
  for (const config of parserConfigs) {
    // Ưu tiên kiểm tra MST trước nếu có
    if (config.mst && cleanedText.includes(config.mst)) {
      Logger.log(`InvoiceLib: Tìm thấy khớp MST "${config.mst}" cho "${config.name || 'Chưa đặt tên'}".`);
      const parserFunc = findParserFunctionByName(config.xml || config.pdf || config.email); // Ưu tiên XML > PDF > Email
      if (parserFunc) {
        return { name: config.name, func: parserFunc };
      } else {
         Logger.log(`InvoiceLib CẢNH BÁO: Không tìm thấy hàm parser "${config.xml || config.pdf || config.email}" được định nghĩa cho MST ${config.mst}.`);
      }
    }
    // Kiểm tra tên nếu không có MST hoặc không khớp MST
    else if (config.name && cleanedText.toLowerCase().includes(config.name.toLowerCase())) {
       Logger.log(`InvoiceLib: Tìm thấy khớp Tên "${config.name}".`);
       const parserFunc = findParserFunctionByName(config.xml || config.pdf || config.email);
       if (parserFunc) {
         return { name: config.name, func: parserFunc };
       } else {
          Logger.log(`InvoiceLib CẢNH BÁO: Không tìm thấy hàm parser "${config.xml || config.pdf || config.email}" được định nghĩa cho tên ${config.name}.`);
       }
    }
  }

  // 3. Nếu không tìm thấy parser cụ thể, trả về parser mặc định (AI)
  Logger.log("InvoiceLib: Không tìm thấy parser chuyên dụng nào khớp. Sử dụng parser mặc định (AI).");
  return getDefaultParser();
}

/**
 * [HÀM PHỤ] Tìm hàm parser mặc định (thường là AI).
 */
function getDefaultParser() {
    let parserConfigs = [];
    try {
        if (typeof getParsers === 'function') {
            parserConfigs = getParsers();
        } else {
             Logger.log("InvoiceLib LỖI: Không tìm thấy hàm getParsers() khi lấy parser mặc định.");
            return null;
        }
    } catch (e) {
         Logger.log(`InvoiceLib LỖI khi gọi getParsers() để lấy parser mặc định: ${e.message}`);
        return null;
    }

    const defaultConfig = parserConfigs.find(c => !c.mst && !c.name); // Tìm cấu hình không có MST và Tên
    if (defaultConfig) {
        const parserFuncName = defaultConfig.xml || defaultConfig.pdf || defaultConfig.email;
        const parserFunc = findParserFunctionByName(parserFuncName);
        if (parserFunc) {
            return { name: "Mặc định (AI)", func: parserFunc };
        } else {
            Logger.log(`InvoiceLib LỖI: Không tìm thấy hàm parser mặc định "${parserFuncName}" đã định nghĩa.`);
        }
    } else {
        Logger.log("InvoiceLib LỖI: Không tìm thấy cấu hình parser mặc định (name và mst trống) trong Configuration.gs.");
    }
    return null; // Trả về null nếu không tìm thấy cả parser mặc định
}


/**
 * [HÀM PHỤ - QUAN TRỌNG] Tìm hàm parser dựa vào tên hàm (string).
 * Sử dụng globalThis để truy cập hàm một cách an toàn trong môi trường thư viện.
 * @param {string} parserName Tên hàm parser (ví dụ: "parseGsmXanhSM_XML").
 * @returns {function|null} Hàm parser thực tế hoặc null nếu không tìm thấy.
 */
function findParserFunctionByName(parserName) {
  if (!parserName || typeof parserName !== 'string') {
    return null;
  }
  try {
    // Sử dụng globalThis để đảm bảo tìm thấy hàm trong phạm vi toàn cục của thư viện
    if (typeof globalThis[parserName] === 'function') {
      return globalThis[parserName];
    } else {
      Logger.log(`InvoiceLib CẢNH BÁO: Hàm parser "${parserName}" không được định nghĩa hoặc không phải là hàm.`);
      return null;
    }
  } catch (e) {
    Logger.log(`InvoiceLib LỖI khi tìm hàm parser "${parserName}": ${e.message}`);
    return null;
  }
}