const TRIPAY_API_KEY = process.env.TRIPAY_API_KEY || "5CVDH22vZjFAWySB7lIpCDRd2hXIBnycUA1tvHBa";
const TRIPAY_PRIVATE_KEY = process.env.TRIPAY_PRIVATE_KEY || "4PAWA-uFTIU-H6Ced-yK6Bz-f0AGl";
const TRIPAY_MERCHANT_CODE = process.env.TRIPAY_MERCHANT_CODE || "T44798";
const TRIPAY_PROXY_URL = process.env.TRIPAY_PROXY_URL || "https://callback.kinterstore.com/api/tripay-proxy";
const CALLBACK_URL = process.env.CALLBACK_URL || "https://callback.kinterstore.com/api/tripay/callback/autobot";
const RETURN_URL = process.env.FRONTEND_URL || "https://kinterstore.my.id";

module.exports = {
  TRIPAY_API_KEY,
  TRIPAY_PRIVATE_KEY,
  TRIPAY_MERCHANT_CODE,
  TRIPAY_PROXY_URL,
  CALLBACK_URL,
  RETURN_URL
};