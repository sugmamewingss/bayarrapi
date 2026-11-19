import BatchForm from "./BatchForm";

export default function NewBatchPage() {
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Buat batch kirim</h1>
          <p className="muted" style={{ marginBottom: 0 }}>
            Masukkan penerima, lalu bayar sekali untuk semuanya. Gunakan data dummy saja.
          </p>
        </div>
      </div>
      <BatchForm />
    </>
  );
}
