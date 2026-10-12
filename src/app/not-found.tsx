import Link from "next/link";

export default function NotFound() {
  return (
    <section className="block">
      <div className="wrap prose">
        <h1>Page not found</h1>
        <p>
          That page does not exist. Go to the <Link href="/">AIDCF home page</Link>.
        </p>
      </div>
    </section>
  );
}
