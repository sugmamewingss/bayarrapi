import { processChainJobs, queueChainJob } from "./chain";
import { startPayouts } from "./payout";

// Titik sambung antar modul.
// Dipanggil modul pay-in setelah pembayaran batch terverifikasi (status FUNDED):
// 1. alokasi batch masuk antrean pencatatan on-chain,
// 2. payout dikirim ke tiap penerima,
// 3. antrean on-chain diproses di latar belakang.
export async function onBatchFunded(batchId: string): Promise<void> {
  await queueChainJob("RECORD_BATCH", batchId);
  await startPayouts(batchId);
  void processChainJobs();
}
