export default function HomePage() {
  return (
    <section>
      <h1>Bayar sekali, teruskan ke banyak rekening</h1>
      <p>
        Prototipe Kelompok 3. Semua transaksi memakai Xendit test mode dan jaringan Ethereum
        Sepolia. Tidak ada uang nyata.
      </p>
      <ul>
        <li>
          <a href="/batches/new">Buat batch kirim</a>
        </li>
        <li>
          <a href="/batches">Dashboard batch</a>
        </li>
        <li>
          <a href="/proof">Cek bukti penerima</a>
        </li>
      </ul>
    </section>
  );
}
