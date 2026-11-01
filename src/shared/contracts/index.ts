// Contract cross-module dùng chung (research R-04; plan.md "Downstream References").
// M01 và M02 PHẢI import schema và kiểu từ đây, không định nghĩa lại. Package 003 sở hữu bốn contract này;
// đổi hình dạng chỉ khi spec-M03 §5.1 đổi trước (constitution II).
export * from './publishedRoute';
export * from './journeySnapshot';
export * from './liveQrLookup';
export * from './sessionSyncRecord';
