import { PrivacyPolicyContent } from "../../components/PrivacyPolicyContent";
import styles from "./styles.module.css";

export const meta = () => {
  return [
    { title: "Privacy Policy - Rabbi Country Blocker" },
    {
      name: "description",
      content:
        "Privacy Policy for Rabbi Country Blocker — how we collect, use, and protect store and customer data.",
    },
  ];
};

export default function PublicPrivacyPolicy() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Privacy Policy</h1>
        <p className={styles.subtitle}>Rabbi Country Blocker Shopify App</p>
      </header>
      <div className={styles.content}>
        <PrivacyPolicyContent />
      </div>
    </main>
  );
}
