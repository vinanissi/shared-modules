/**
 * @OnlyCurrentDoc
 * Thư viện tập trung chứa toàn bộ cấu hình cho kịch bản hóa đơn.
 */
// Cấu hình từ khóa tìm kiếm email
function getKeys() {
  return [
    "hóa đơn",
    "petrolimex",
    "petrolimex.com.vn",
    "meinvoice.vn",
    "thông báo phát hành",
    "xăng dầu",
    "công ty cổ phần thương mại tổng hợp thuận an",
    "công ty tnhh thương mại dịch vụ hdtv"
  ];
}
// Cấu hình các parser
function getParsers() {
  return [
  { 
    name: "", // Để trống tên
    mst: "",   // Để trống MST
    email: "parseWithGemini",
    pdf: "parseWithGemini",
    xml: "parseWithGemini",
    website: "" 
  },    
  // Thêm parser sau dòng này
  
{ 
  name: "CÔNG TY TNHH TM & DV SAGRI BAZAN", 
  mst: "6400446946", 
  email: "parseVnptSagriBazan_Text", 
  pdf: "parseVnptSagriBazan_Text",
  xml: "parseWithGemini", // Dùng AI cho XML (nếu có)
  website: "https://xemhoadon.vnpt.vn/" 
},
  { 
  name: "DOANH NGHIỆP TƯ NHÂN THƯƠNG MẠI DỊCH VỤ TRƯỜNG VẠN LÝ", 
  mst: "0311509061", 
  email: "parseWithGemini", // Dùng AI cho email
  pdf: "parseWithGemini", // Dùng AI cho PDF
  xml: "parseMisaTruongVanLy_XML", // Dùng parser riêng cho XML
  website: "https://meinvoice.vn/tra-cuu" 
},
  { 
  name: "CÔNG TY CỔ PHẦN MOVEO BÌNH DƯƠNG", 
  mst: "3702613605", 
  email: "parseFptMoveoBinhDuong_Text", // Dùng chung cho cả email và text
  pdf: "parseFptMoveoBinhDuong_Text",
  xml: "parseWithGemini", // Dùng AI cho XML (nếu có)
  website: "https://tracuuhoadon.fpt.com.vn" 
},
{ 
  name: "DNTN THƯƠNG MẠI KIM LONG", 
  mst: "0301427324", 
  email: "parseVnptKimLong_Email",
  pdf: "parseWithGemini", // Dùng AI cho PDF
  xml: "parseWithGemini", // Dùng AI cho XML
  website: "https://kimlong-tt78.vnpt-invoice.com.vn" 
},  
{ 
  name: "CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH", 
  mst: "0300559014", 
  email: "parseVnptFoodcosa_Email",
  pdf: "parseWithGemini", // Dùng AI cho PDF
  xml: "parseWithGemini", // Dùng AI cho XML
  website: "https://foodcosa-tt78.vnpt-invoice.com.vn" 
},
  { 
    name: "TỔNG CÔNG TY DẦU VIỆT NAM - CÔNG TY CỔ PHẦN", 
    mst: "0301293029", // MST PVOIL
    email: "parsePvoil_Email",
    pdf: "parseWithGemini", // Dùng AI cho PDF
    xml: "parseWithGemini", // Dùng AI cho XML
    website: "https://hoadon.pvoil.vn" 
},
    { 
    name: "CÔNG TY CỔ PHẦN CƠ KHÍ XĂNG DẦU", 
    mst: "0302259646", 
    email: "parseFastCoKhiXangDau_Email",
    pdf: "parseWithGemini", // Tạm thời dùng AI cho PDF
    xml: "parseWithGemini", // Tạm thời dùng AI cho XML
    website: "https://einvoice.fast.com.vn" 
  },
  { 
    name: "CÔNG TY TNHH MTV XĂNG DẦU VĨNH THÀNH", 
    mst: "3600486468", 
    email: "parseWithGemini", // Tạm dùng parser XML cho email
    pdf: "parseWithGemini",   // Dùng parser XML cho PDF
    xml: "parseEasyInvoiceVinhThanh_XML",
    website: "http://3600486468hd.easyinvoice.com.vn" 
  },
  { 
    name: "CÔNG TY TNHH THƯƠNG MẠI XĂNG DẦU PHÚC KHANG", 
    mst: "3703127904", 
    email: "parseWithGemini", // Tạm dùng parser XML cho email
    pdf: "parseWithGemini",   // Dùng parser XML cho PDF
    xml: "parseVnptPhucKhang_XML",
    website: "https://3703127904-tt78.vnpt-invoice.com.vn" // Xác nhận lại nếu cần
  },
  { 
    name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ BIÊN KHOA", 
    mst: "0305405868", 
    email: "parseWithGemini", // Tạm dùng parser XML cho email
    pdf: "parseWithGemini",   // Dùng parser XML cho PDF
    xml: "parseMisaBienKhoa_XML",
    website: "https://meinvoice.vn/tra-cuu" 
  },
   { 
    name: "TỔNG CÔNG TY CƠ KHÍ GIAO THÔNG VẬN TẢI SÀI GÒN - TNHH MỘT THÀNH VIÊN", 
    mst: "0300481551", // MST Chính (không phải chi nhánh)
    email: "parseVnptSamco_Email",
    pdf: "parseWithGemini", // <-- Cập nhật cột này
    xml: "parseVnptSamco_XML", // <-- Và cột này
    website: "https://samco-tt78.vnpt-invoice.com.vn" 
  },
  { 
  name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI - DỊCH VỤ - XUẤT NHẬP KHẨU TRƯỜNG PHÁT", 
  mst: "0304375226", 
  email: "parseWithGemini",
  pdf: "parseWithGemini", // Dùng chung vì cấu trúc XML là chính
  xml: "parseMisaTruongPhat_XML",
  website: "https://meinvoice.vn/tra-cuu" 
},
  { 
    name: "CHI NHÁNH CÔNG TY TNHH CƠ KHÍ XÂY DỰNG VÀ THƯƠNG MẠI TIÊN TIẾN - TRUNG TÂM DỊCH VỤ - ĐẬU XE TIÊN TIẾN", 
    mst: "0302325064-001", // MST Chi nhánh
    email: "parseFastTienTien_Email", // Hàm parser email ta vừa tạo
    pdf: "parseWithGemini",   // Dùng AI cho PDF
    xml: "parseWithGemini",   // Dùng AI cho XML
    website: "https://einvoice.fast.com.vn" 
  },
  { 
    name: "CÔNG TY TNHH SẢN XUẤT ĐẦU TƯ XÂY DỰNG THƯƠNG MẠI DỊCH VỤ MIỀN ĐÔNG", 
    mst: "3603409327", 
    email: "parseVnptMienDong_Email",
    pdf: "parseWithGemini", // Dùng AI cho PDF vì chưa có parser riêng
    xml: "parseWithGemini", // Dùng AI cho XML vì chưa có parser riêng
    website: "https://3603409327-tt78.vnpt-invoice.com.vn" 
  },
  { 
    name: "CHI NHÁNH CÔNG TY TNHH THƯƠNG MẠI BÌNH PHONG PHÚ", 
    mst: "0313936881-002", 
    email: "parseBkavBinhPhongPhu_Email",
    pdf: "parseWithGemini", // Dùng AI cho PDF vì chưa có parser riêng
    xml: "parseWithGemini", // Dùng AI cho XML vì chưa có parser riêng
    website: "tracuu.ehoadon.vn" 
  },
    {
      name: "CÔNG TY CỔ PHẦN NHIÊN LIỆU SÀI GÒN",
      mst: "0300631013",
      email: "parsePetrolimex",
      pdf: "parseViettelFuelInvoice",
      parse: "parseViettelFuelInvoice",
      xml: "parseDefault_XML",
      website: "https://vinvoice.viettel.vn/utilities/invoice-search"
    },
    {
      name: "CÔNG TY CỔ PHẦN VẬN TẢI THƯƠNG MẠI VÀ DỊCH VỤ HÀ NỘI",
      mst: "0104109604",
      email: "parsePetrolimex",
      pdf: "parseVTDichVuHaNoi",
      parse: "parseVTDichVuHaNoi",
      xml: "parseHanoiTTS_XML",
      website: "https://www.meinvoice.vn/tra-cuu"
    },
    {
      name: "CÔNG TY TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN XĂNG DẦU THƯƠNG MẠI VÀ DỊCH VỤ MINH PHÁT",
      mst: "0314297538",
      email: "parsePetrolimex",
      pdf: "parseMinhPhat_PDF",
      parse: "parseMeInvoice",
      xml: "parseMinhPhat_XML",
      website: "https://www.meinvoice.vn/tra-cuu"
    },
    {
      name: "CÔNG TY TNHH XĂNG DẦU 77",
      mst: "0303164208",
      email: "parseXangDau77",
      pdf: "parseXangDau77",
      parse: "parseXangDau77",
      xml: "parseXangDau77_XML",
      website: "https://vinvoice.viettel.vn/utilities/invoice-search"
    },
    {
      name: "CÔNG TY TNHH THƯƠNG MẠI TÂN HIỆP",
      mst: "0301722256",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parseTanHiep",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "DOANH NGHIỆP TƯ NHÂN THƯƠNG MẠI DỊCH VỤ PHÚC AN",
      mst: "0302159396",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePhucAn",
      xml: "parseDefault_XML",
      website: "https://www.meinvoice.vn/tra-cuu"
    },
    {
      name: "CÔNG TY TNHH TRẠM XĂNG DẦU SÔNG THAO",
      mst: "3600202758",
      email: "parseSongThaoEmail",
      pdf: "parseSongThao_PDF",
      parse: "parseSongThaoEmail",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      mst: "0301147253",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY CỔ PHẦN LƯƠNG THỰC THÀNH PHỐ HỒ CHÍ MINH",
      mst: "0300559014",
      email: "parseVNPTGeneric",
      pdf: "parsePetrolimex_PDF",
      parse: "parseVNPTFoodcosa",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ HIỆP QUẾ",
      mst: "0303172752-011",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parseHiepQueMisa",
      xml: "parseHiepQueThanhPhuc_XML",
      website: "https://www.meinvoice.vn/tra-cuu"
    },
    {
      name: "CÔNG TY TNHH TOYOTA AN SƯƠNG",
      mst: "0302066891",
      email: "parseToyotaAnSuong",
      pdf: "parseToyotaAnSuong",
      parse: "parseToyotaAnSuong",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY CỔ PHẦN VẬT TƯ - XĂNG DẦU",
      mst: "0300450673-062",
      email: "parsePetrolimex",
      pdf: "parseComeco",
      parse: "parseComeco",
      xml: "parseDefault_XML",
      website: "https://tracuuhd.smartsign.com.vn/"
    },
    {
      name: "CÔNG TY XĂNG DẦU ĐỒNG THÁP",
      mst: "1400113110",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY XĂNG DẦU SÔNG BÉ - TNHH MTV",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "PETROLIMEX",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY TNHH MTV XĂNG DẦU BÌNH THUẬN",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CHI NHÁNH XĂNG DẦU HẬU GIANG",
      mst: "1800158559-034",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CHI NHÁNH CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ CẦN GIỜ - CỬA HÀNG XĂNG DẦU SỐ 17",
      mst: "0302596283-023",
      email: "parseVNPTCanGio_Email",
      pdf: "parseVNPTCanGio_PDF",
      parse: "parseVNPTGeneric",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CHI NHÁNH CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ CẦN GIỜ",
      mst: "0302596283",
      email: "parseVNPTCanGio_Email",
      pdf: "parseVNPTCanGio_PDF",
      parse: "parseVNPTCanGio_Email",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY XĂNG DẦU KHU VỰC II TNHH MỘT THÀNH VIÊN",
      mst: "0300555450",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex0300555450_PDF",
      parse: "parsePetrolimex",
      xml: "parseDefault_XML",
      website: "https://hoadon.petrolimex.com.vn"
    },
    {
      name: "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ PHÚC ANH",
      mst: "1602037961",
      email: "parsePetrolimex",
      pdf: "parseMisaPhucAnh_Pdf",
      parse: "parseMisaPhucAnh_Pdf",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY XĂNG DẦU TIỀN GIANG",
      mst: "1200100370",
      email: "",
      pdf: "parsePetrolimexTienGiang_PDF",
      parse: "parsePetrolimexTienGiang_PDF",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY TNHH XĂNG DẦU LÂM ĐỒNG",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "",
      xml: "parseDefault_XML",
      website: ""
    },
    {
      name: "CÔNG TY CỔ PHẦN SẢN XUẤT - DỊCH VỤ TÂN BÌNH TANIMEX",
      mst: "0304563607",
      email: "parseVNPTGeneric",
      pdf: "",
      parse: "",
      xml: "",
      website: ""
    },
    {
      name: "CÔNG TY CỔ PHẦN PHỤ TÙNG TITAN",
      mst: "0317706186",
      email: "parseTitan_Email",
      pdf: "parseTitan_PDF",
      parse: "",
      xml: "parseTitan_XML",
      website: "https://www.meinvoice.vn/tra-cuu"
    },
    {
      name: "CÔNG TY TNHH GRAB",
      mst: "0312650437",
      email: "",
      pdf: "",
      parse: "",
      xml: "parseWithGemini",
      website: "https://vn.einvoice.grab.com"
    },
    {
      name: "DOANH NGHIỆP TƯ NHÂN TRẠM XĂNG DẦU TẤN HƯNG",
      mst: "3700569291",
      email: "parseEasyInvoice_TanHung",
      pdf: "",
      parse: "",
      xml: "",
      website: "https://3600202758hd.easyinvoice.com.vn/Search/Index"
    },
    {
      name: "CÔNG TY TRÁCH NHIỆM HỮU HẠN MỘT THÀNH VIÊN AN LỘC VIỆT",
      mst: "0312228962",
      email: "",
      pdf: "",
      parse: "",
      xml: "parseAnLocViet_XML",
      website: "https://www.meinvoice.vn/tra-cuu"
    },
    {
      name: "CHI NHÁNH 2 CÔNG TY TNHH THƯƠNG MẠI XĂNG DẦU TÂN VẠN",
      mst: "0314562539-001",
      email: "parseBkavTanVan",
      pdf: "parseBkavTanVan_PDF",
      parse: "",
      xml: "",
      website: "http://tracuu.ehoadon.vn"
    },
    {
      name: "CÔNG TY TNHH MỘT THÀNH VIÊN PHỤNG TÂN TIẾN",
      mst: "3700956727",
      email: "",
      pdf: "",
      parse: "",
      xml: "parseEasyInvoice_PhungTanTien_XML",
      website: "https://3600202758hd.easyinvoice.com.vn/Search/Index"
    },
    {
      name: "CÔNG TY TNHH TMDV Ô TÔ THỦ ĐỨC",
      mst: "0316897347",
      email: "",
      pdf: "parseOtoThuDuc_PDF",
      parse: "",
      xml: "parseOtoThuDuc_XML",
      website: "https://tracuuhoadon.fpt.com.vn/"
    },
    {
      name: "CÔNG TY TNHH ĐẦU TƯ PHÁT TRIỂN DỊCH VỤ PHÚC THỊNH",
      mst: "3700811376",
      email: "parseEasyInvoice_PhucThinh",
      pdf: "",
      parse: "",
      xml: "parseEasyInvoice_PhucThinh",
      website: "https://3600202758hd.easyinvoice.com.vn/Search/Index"
    },
    {
      name: "CÔNG TY TNHH THƯƠNG MẠI DỊCH VỤ HDTV",
      mst: "0313336978",
      email: "",
      pdf: "parseHDTV_PDF",
      parse: "",
      xml: "parseHDTV_XML",
      website: ""
    },
    {
      name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI TỔNG HỢP THUẬN AN",
      mst: "3700359664",
      email: "parseVNPTGeneric",
      pdf: "",
      parse: "",
      xml: "",
      website: ""
    },
    {
      name: "CÔNG TY TNHH XĂNG DẦU LÂM ĐỒNG",
      email: "parsePetrolimex",
      pdf: "parsePetrolimex_PDF",
      parse: "",
      xml: "",
      website: "https://tracuuhd.smartsign.com.vn"
    },
    {
      name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI VÀ DỊCH VỤ CẦN GIỜ",
      email: "parseVNPTCanGio_Email",
      pdf: "parseVNPTCanGio_PDF",
      parse: "",
      xml: "",
      website: ""
    },
    {
      name: "CÔNG TY TNHH DỊCH VỤ PHÁT TRIỂN VIỄN THÔNG BẢO CHÂU",
      email: "",
      pdf: "parseEasyInvoiceBaoChau_PDF",
      parse: "",
      xml: "",
      website: ""
    },
    {
      mst: "0317139145",
      email: "",
      pdf: "",
      parse: "",
      xml: "",
      website: "https://0317139145hd.easyinvoice.com.vn/Search/Search"
    },
    { 
      name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI HÓC MÔN", 
      mst: "0302481483", 
      email: "parseHocMonTrading_XML",
      pdf: "parseHocMonTrading_XML", // Dùng chung vì cấu trúc XML là chính
      xml: "parseHocMonTrading_XML",
      website: "" 
    },
  { 
    name: "CÔNG TY TNHH MTV XĂNG DẦU BÀ RỊA -VŨNG TÀU", 
    mst: "3500102573", 
    email: "parsePetrolimexBaRiaVungTau_XML",
    pdf: "parsePetrolimexBaRiaVungTau_XML",
    xml: "parsePetrolimexBaRiaVungTau_XML",
    website: "https://hoadon.petrolimex.com.vn" 
  },
  { 
    name: "CÔNG TY XĂNG DẦU VĨNH LONG", 
    mst: "1500207131", 
    email: "parsePetrolimexVinhLong_XML",
    pdf: "parsePetrolimexVinhLong_XML", // Dùng chung vì cấu trúc XML là chính
    xml: "parsePetrolimexVinhLong_XML",
    website: "https://hoadon.petrolimex.com.vn" 
  },  
  { 
    name: "CÔNG TY TNHH MẮT VIỆT GROUP", 
    mst: "", 
    email: "parseVNPTGeneric",
    pdf: "", 
    xml: "",
    website: "https://matviet-tt78.vnpt-invoice.com.vn" 
  },  
  { 
    name: "CÔNG TY TNHH MTV XĂNG DẦU AN GIANG", 
    mst: "1600184590", 
    email: "parsePetrolimexAnGiang_XML",
    pdf: "parsePetrolimexAnGiang_XML", // Dùng chung vì cấu trúc XML là chính
    xml: "parsePetrolimexAnGiang_XML",
    website: "https://hoadon.petrolimex.com.vn" 
  },
  { 
    name: "CÔNG TY XĂNG DẦU LONG AN", 
    mst: "1100108351", 
    email: "",
    pdf: "", // Dùng chung vì cấu trúc XML là chính
    xml: "parsePetrolimexLongAn_XML",
    website: "https://hoadon.petrolimex.com.vn" 
  },
  { 
    name: "CÔNG TY XĂNG DẦU LONG AN", 
    mst: "1100108351", 
    email: "",
    pdf: "", 
    xml: "parsePetrolimexLongAn_XML",
    website: "https://hoadon.petrolimex.com.vn" 
  },
  { 
    name: "CÔNG TY XĂNG DẦU TÂY NINH", 
    mst: "3900242688", 
    email: "parsePetrolimexTayNinh_XML",
    pdf: "parsePetrolimexTayNinh_XML", // Dùng chung vì cấu trúc XML là chính
    xml: "parsePetrolimexTayNinh_XML",
    website: "https://hoadon.petrolimex.com.vn" 
  },
  { 
    name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI HÓC MÔN", 
    mst: "0302481483", 
    email: "",
    pdf: "", 
    xml: "parseHocMonTrading_XML",
    website: "" 
  },
  { 
    name: "CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ Ô TÔ PHÚC ANH", 
    mst: "1602037961", 
    email: "", // Có thể để trống nếu không có email thông báo
    pdf: "parseMisaPhucAnh_PDF",
    xml: "", // Dùng chung vì cấu trúc PDF là chính
    website: "https://www.meinvoice.vn/tra-cuu/" 
  },  
  { 
    name: "CÔNG TY TNHH XĂNG DẦU HỒNG ĐỨC", 
    mst: "1200541784", 
    email: "", // Có thể để trống nếu không có email thông báo
    pdf: "parseMisaHongDuc_PDF",
    xml: "",
    website: "https://www.meinvoice.vn/tra-cuu" 
  },  
  { 
    name: "CÔNG TY TNHH MỘT THÀNH VIÊN XĂNG DẦU PHAN GIA HUY - CHI NHÁNH CỬA HÀNG BÁN LẺ XĂNG DẦU THÁI BẢO", 
    mst: "1900665016-001", 
    email: "", // Có thể để trống nếu không có email thông báo
    pdf: "parseViettelThaiBao_PDF",
    xml: "",
    website: "https://vinvoice.viettel.vn/utilities/invoice-search" 
  },
  { 
    name: "CÔNG TY TRÁCH NHIỆM HỮU HẠN TMDV XĂNG DẦU CHÂU THÀNH", 
    mst: "1200253539", 
    email: "parseChauThanhPetro_XML",
    pdf: "parseChauThanhPetro_XML", // Dùng chung vì cấu trúc XML là chính
    xml: "parseChauThanhPetro_XML",
    website: "" 
  },
  { 
    name: "CÔNG TY TNHH APEAX VIỆT NAM", 
    mst: "0317707260", 
    email: "parseEasyInvoice_TanHung",
    pdf: "parseEasyInvoiceBaoChau_PDF", // Dùng chung vì cấu trúc XML là chính
    xml: "parseEasyInvoice_Apeax_XML",
    website: "http://0317707260hd.easyinvoice.com.vn" 
  },
  { 
    name: "CÔNG TY CỔ PHẦN THƯƠNG MẠI XUẤT NHẬP KHẨU THỦ ĐỨC", 
    mst: "0301444626", 
    email: "parseThuDucXNK_XML",
    pdf: "parseThuDucXNK_XML", // Dùng chung vì cấu trúc XML là chính
    xml: "parseThuDucXNK_XML",
    website: "Timexcothuduc.com.vn" 
  },  
  { 
    name: "CÔNG TY CỔ PHẦN TOYOTA ĐÔNG SÀI GÒN", 
    mst: "0303091197", 
    email: "parseFastToyotaDongSaiGon_Email",
    pdf: "parseFastToyotaDongSaiGon_XML", // <-- Cập nhật cột này
    xml: "parseFastToyotaDongSaiGon_XML", // <-- Và cột này
    website: "https://einvoice.fast.com.vn" 
  },
  { 
    name: "CÔNG TY TNHH MỘT THÀNH VIÊN TRƯỜNG GIANG MOBILE", 
    mst: "2100406977", 
    email: "parseViettelTruongGiangMobile_Text",
    pdf: "parseViettelTruongGiangMobile_Text",
    xml: "parseViettelTruongGiangMobile_Text",
    website: "https://vinvoice.viettel.vn/utilities/invoice-search" 
  },
  { 
  name: "CHI NHÁNH THÀNH PHỐ HỒ CHÍ MINH - CÔNG TY CỔ PHẦN DI CHUYỂN XANH VÀ THÔNG MINH GSM", 
  mst: "0110269067-001", 
  email: "parseGsmXanhSM_XML",
  pdf: "parseGsmXanhSM_XML",
  xml: "parseGsmXanhSM_XML",
  website: "https://hoadon.xanhsm.com" 
},
{ 
  name: "CHI NHÁNH BÀ RỊA - VŨNG TÀU – CÔNG TY CỔ PHẦN DI CHUYỂN XANH VÀ THÔNG MINH GSM", 
  mst: "0110269067-014", 
  email: "parseGsmXanhSM_XML", // Tái sử dụng parser Xanh SM đã có
  pdf: "parseGsmXanhSM_XML",   // Tái sử dụng parser Xanh SM đã có
  xml: "parseGsmXanhSM_XML",   // Tái sử dụng parser Xanh SM đã có
  website: "https://hoadon.xanhsm.com" 
},
{ 
  name: "CÔNG TY XĂNG DẦU QUÂN ĐỘI KHU VỤC 4", 
  mst: "0100108688-008", 
  email: "parseViettelXangDauQuanDoi4_XML",
  pdf: "parseViettelXangDauQuanDoi4_XML", // Dùng chung parser cho các loại file
  xml: "parseViettelXangDauQuanDoi4_XML",
  website: "https://vinvoice.viettel.vn/tra-cuu" 
}
//--------- Chen then truoc hang nay    
  ];
}
// Cấu hình ánh xạ cho parser mặc định
function getMappings() {
  return {
    "Trường": ["Từ khóa","Từ khóa 1","Từ khóa 2","Từ khóa 3","Từ khóa 4"],
    "Ký hiệu": ["Ký hiệu","Ký hiệu","Serial","Mã CQT","Ký hiệu mẫu số hóa đơn"],
    "Ký ngày": ["Ký ngày","Ngày","Date"],
    "Số hóa đơn": ["Số","Số","No.","Số HĐ","Số hóa đơn"],
    "Đơn vị bán": ["Đơn vị bán","(CÔNG\\s*TY\\s*[^\\n]{3,50})","Người bán","Seller","Đơn vị bán hàng","CÔNG TY XĂNG DẦU KHU VỰC II TNHH MỘT THÀNH VIÊN "],
    "Mã số thuế bên bán": ["Mã số thuế","Mã số thuế","Tax code","Mã số thuế người bán","Mã số thuế (Tax code)","Mã số thuế đơn vị phát hành","MST người bán"],
    "Cộng tiền hàng": ["Cộng tiền hàng","Cộng tiền hàng","Tổng tiền","Tiền hàng"],
    "Thuế suất GTGT số tiền": ["Thuế suất GTGT","Thuế suất GTGT","VAT rate","Tiền thuế GTGT","Tiền thuế GTGT (VAT amount)","Tiền thuế"],
    "Tổng tiền thanh toán": ["Tổng cộng tiền thanh toán","Tổng cộng tiền thanh toán","Tổng cộng","3 - Tổng cộng tiền thanh toán","Tổng tiền thanh toán"],
    "Mã số bí mật": ["Mã số bí mật","Mã tra cứu","Code tra cứu","Mã tra cứu hóa đơn","TransactionID"],
    "Website": ["Website","Tra cứu tại Website","Search in website"],
    "GHI CHÚ": [],
    "Đơn vị mua": ["Đơn vị mua","Tên đơn vị","Tên khách hàng"],
    "Mã số thuế bên mua": ["Mã số thuế bên mua","Mã số thuế"],
    "Địa chỉ bên mua": ["Địa chỉ bên mua","Địa chỉ"],
    "OCR": [],
    "Email đến": [],
    "Link PDF": [],
    "Link XML": [],
    "Link Email": [],
    "Parser": [],
  };
}

