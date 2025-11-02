"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
// Xóa ảnh/video trên Cloudinary
router.delete('/delete', async (req, res) => {
    const { public_id, resource_type } = req.body;
    if (!public_id)
        return res.status(400).json({ success: false, message: 'Thiếu public_id' });
    try {
        await cloudinary_1.default.uploader.destroy(public_id, { resource_type: resource_type || 'image' });
        return res.json({ success: true });
    }
    catch (err) {
        return res.status(500).json({ success: false, message: err?.message || 'Xóa thất bại', error: err });
    }
});
exports.default = router;
