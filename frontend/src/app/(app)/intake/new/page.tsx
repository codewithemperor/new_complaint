import { ComplaintForm } from "@/components/ComplaintForm";

export const metadata = {
  title: "New Complaint (Intake) — KwaraMOc",
};

export default function IntakeNewPage() {
  return (
    <div className="py-4">
      <ComplaintForm showChannel />
    </div>
  );
}
