import styles from "./murid.module.css";

export default function MuridHome() {
  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <h1>Selamat Pagi, Murid!</h1>
        <button className={styles.infoBtn}>Informasi</button>
      </div>
    </div>
  );
}
