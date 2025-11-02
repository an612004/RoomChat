"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const router = (0, express_1.Router)();
// Simple health check for Cloudinary admin API (reads a small resource list)
router.get('/cloudinary', async (req, res) => {
    try {
        const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || null;
        if (!cloud_name)
            return res.status(500).json({ ok: false, message: 'CLOUDINARY_CLOUD_NAME not configured' });
        // safe read: fetch up to 1 resource
        const account = await cloudinary_1.default.api.resources({ max_results: 1 }).catch((e) => { throw e; });
        return res.json({ ok: true, cloud_name, sampleCount: account.resources ? account.resources.length : 0 });
    }
    catch (err) {
        return res.status(502).json({ ok: false, message: err && err.message ? err.message : 'Cloudinary check failed', error: err });
    }
});
exports.default = router;
