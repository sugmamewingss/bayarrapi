# User Stories dan Kriteria Penerimaan

Penanggung jawab: Rakapaksi. Versi awal, disesuaikan dengan konsep revisi 9 Nov 2026.

| ID | User story | Kriteria penerimaan |
| --- | --- | --- |
| US-01 | Sebagai pengirim, saya ingin membuat batch kirim berisi banyak penerima agar bisa membayar semuanya sekaligus. | Batch tersimpan dengan `external_id` unik, daftar penerima, total, fee, dan status `DRAFT`. Nominal per penerima minimal Rp10.000. |
| US-02 | Sebagai pengirim, saya ingin membayar total batch dengan VA, QRIS, atau e-wallet. | Sistem membuat invoice Xendit test mode; nominal invoice = total penerima + fee. Status batch `PENDING_PAYMENT`. |
| US-03 | Sebagai sistem, saya hanya memproses pembayaran yang sah. | Webhook dengan `x-callback-token` salah ditolak (401). Webhook ganda tidak memproses ulang. Nominal atau `external_id` tidak cocok ditolak. |
| US-04 | Sebagai pengirim, saya ingin dana diteruskan otomatis ke tiap penerima setelah pembayaran lunas. | Setelah invoice `PAID`, batch `FUNDED`, lalu satu payout dibuat per penerima dengan `Idempotency-key` unik. |
| US-05 | Sebagai pengirim, saya ingin melihat status tiap penerima. | Dashboard menampilkan `PENDING`, `SUCCEEDED`, atau `FAILED` per penerima, diperbarui dari webhook payout. |
| US-06 | Sebagai penerima, saya ingin memastikan bagian saya benar-benar dialokasikan dan dikirim. | Halaman cek menerima kode bukti dan menampilkan nominal, status, dan tautan transaksi Sepolia. Tidak menampilkan data pribadi penerima lain. |
| US-07 | Sebagai pengirim, saya ingin laporan rekonsiliasi. | Laporan per periode: total masuk = total terkirim + fee + gagal/dikembalikan. Bisa diekspor CSV. |
| US-08 | Sebagai sistem, saya tetap konsisten meski blockchain gagal sementara. | Kegagalan tulis ke Sepolia tidak mengubah status pembayaran; job masuk antrean retry. |
