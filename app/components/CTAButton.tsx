import Link from "next/link";

export default function CTAButton() {
  return (
    <Link href="/login" className="btn btn-accent">
      Start Training Free
    </Link>
  );
}
