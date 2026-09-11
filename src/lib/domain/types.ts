export const employmentTypes = [
  "internship",
  "contract",
  "permanent",
  "part_time",
  "freelance",
  "temporary",
  "other",
] as const;

export const applicationStages = [
  "saved",
  "applied",
  "screening",
  "assessment",
  "interview",
  "offer",
  "accepted",
  "rejected",
  "withdrawn",
  "archived",
] as const;

export const transactionKinds = ["income", "expense", "transfer"] as const;
export const transactionStates = ["draft", "posted", "void"] as const;
export const jobOpportunityStatuses = ["saved", "reviewing", "ready", "applied", "dismissed", "expired"] as const;
export const jobProgramTypes = ["graduate_program", "entry_level", "internship", "apprenticeship", "other"] as const;
export const deadlineKinds = ["exact", "estimated", "rolling", "unknown"] as const;

export type EmploymentType = (typeof employmentTypes)[number];
export type ApplicationStage = (typeof applicationStages)[number];
export type TransactionKind = (typeof transactionKinds)[number];
export type TransactionState = (typeof transactionStates)[number];
export type JobOpportunityStatus = (typeof jobOpportunityStatuses)[number];
export type JobProgramType = (typeof jobProgramTypes)[number];
export type DeadlineKind = (typeof deadlineKinds)[number];

export type ApplicationSummary = {
  id: string;
  company: string;
  position: string;
  stage: ApplicationStage;
  employmentType: EmploymentType;
  appliedAt: string | null;
  nextAction: string | null;
  nextActionAt: string | null;
  location: string | null;
  workMode: "onsite" | "hybrid" | "remote" | null;
  source: string | null;
  compensationAmount: string | null;
  payPeriod: "hourly" | "daily" | "monthly" | "yearly" | null;
  contractMonths: number | null;
  contractStart: string | null;
  contractEnd: string | null;
  notes: string | null;
};

export type AccountSummary = {
  id: string;
  name: string;
  kind: "cash" | "bank" | "ewallet" | "other";
  balanceMinor: bigint;
  openingBalance: string;
};

export type TransactionSummary = {
  id: string;
  occurredAt: string;
  kind: TransactionKind;
  state: TransactionState;
  description: string;
  category: string | null;
  amountMinor: bigint;
  amount: string;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  categoryId: string | null;
};

export type JobOpportunity = {
  id: string;
  companyName: string;
  title: string;
  officialApplyUrl: string;
  sourceUrl: string | null;
  sourceName: string | null;
  programType: JobProgramType;
  employmentType: EmploymentType | null;
  location: string | null;
  workMode: "onsite" | "hybrid" | "remote" | null;
  publishedAt: string | null;
  deadlineAt: string | null;
  deadlineKind: DeadlineKind;
  status: JobOpportunityStatus;
  isFreshGraduate: boolean;
  experienceMaxYears: number | null;
  education: string | null;
  requirements: string | null;
  notes: string | null;
  lastVerifiedAt: string | null;
  applicationId: string | null;
  createdAt: string;
};

export type JobOpportunityMilestone = {
  id: string;
  opportunityId: string;
  title: string;
  dueAt: string | null;
  completedAt: string | null;
  notes: string | null;
  sortOrder: number;
};

export const stageLabels: Record<ApplicationStage, string> = {
  saved: "Tersimpan",
  applied: "Dilamar",
  screening: "Screening",
  assessment: "Assessment",
  interview: "Interview",
  offer: "Tawaran",
  accepted: "Diterima",
  rejected: "Ditolak",
  withdrawn: "Ditarik",
  archived: "Diarsipkan",
};

export const employmentLabels: Record<EmploymentType, string> = {
  internship: "Internship",
  contract: "Kontrak",
  permanent: "Tetap",
  part_time: "Paruh waktu",
  freelance: "Freelance",
  temporary: "Temporer",
  other: "Lainnya",
};

export const jobOpportunityStatusLabels: Record<JobOpportunityStatus, string> = {
  saved: "Tersimpan",
  reviewing: "Sedang ditinjau",
  ready: "Siap dilamar",
  applied: "Sudah dilamar",
  dismissed: "Dilewati",
  expired: "Kedaluwarsa",
};

export const jobProgramLabels: Record<JobProgramType, string> = {
  graduate_program: "Graduate program",
  entry_level: "Entry level",
  internship: "Internship",
  apprenticeship: "Apprenticeship",
  other: "Lainnya",
};

export const deadlineKindLabels: Record<DeadlineKind, string> = {
  exact: "Tanggal pasti",
  estimated: "Perkiraan",
  rolling: "Rolling",
  unknown: "Belum diketahui",
};
