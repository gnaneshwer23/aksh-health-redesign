export { AudiencePageLayout } from "./audience-page-layout";
export type { AudiencePageLayoutProps } from "./audience-page-layout";
export { AudienceAgentMapSection } from "./AudienceAgentMapSection";
export { AudienceWorkflowSection } from "./AudienceWorkflowSection";
export { audiencePages } from "./audience-content";
export type {
  AudienceCta,
  AudiencePageContent,
  AudienceWorkflow,
  AudienceWorkflowStep,
} from "./audience-content";

export type AudiencePageKey = keyof typeof import("./audience-content").audiencePages;
