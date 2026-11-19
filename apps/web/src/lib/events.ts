// Titik sambung antar modul.
// Dipanggil oleh modul pay-in setelah pembayaran batch terverifikasi (status FUNDED).
// Modul payout (Farhan) dan blockchain (Irfan) akan mengisi fungsi ini.
export async function onBatchFunded(batchId: string): Promise<void> {
  console.log(`[events] batch ${batchId} FUNDED, menunggu modul payout dan blockchain`);
}
