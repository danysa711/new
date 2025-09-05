// Di komponen React yang menangani QRIS
import { qrisInstance, createQrisPayment, uploadQrisPaymentProof, getQrisSettings } from "../services/qrisAxios";

// Contoh penggunaan dalam komponen
const handleCreatePayment = async () => {
  try {
    const result = await createQrisPayment(selectedPlan.id);
    setPaymentData(result.payment);
  } catch (error) {
    console.error("Error creating payment:", error);
    setError("Gagal membuat pembayaran QRIS");
  }
};

const handleUploadProof = async (file) => {
  try {
    const result = await uploadQrisPaymentProof(paymentData.reference, file);
    setUploadSuccess(true);
  } catch (error) {
    console.error("Error uploading proof:", error);
    setError("Gagal mengunggah bukti pembayaran");
  }
};