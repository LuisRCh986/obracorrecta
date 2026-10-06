import { ReviewDashboard } from "@/components/review-dashboard";
import { demoFindings, demoProject } from "@/data/demo-project";

export default function HomePage() {
  return <ReviewDashboard project={demoProject} findings={demoFindings} />;
}
