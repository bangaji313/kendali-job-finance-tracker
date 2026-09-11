import { cache } from "react";
import type {
  DeadlineKind,
  EmploymentType,
  JobOpportunity,
  JobOpportunityMilestone,
  JobOpportunityStatus,
  JobProgramType,
} from "@/lib/domain/types";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getAuthenticatedUser } from "@/lib/supabase/server";

type OpportunityRow = {
  id: string;
  company_name: string;
  title: string;
  official_apply_url: string;
  source_url: string | null;
  source_name: string | null;
  program_type: JobProgramType;
  employment_type: EmploymentType | null;
  location: string | null;
  work_mode: "onsite" | "hybrid" | "remote" | null;
  published_at: string | null;
  deadline_at: string | null;
  deadline_kind: DeadlineKind;
  status: JobOpportunityStatus;
  is_fresh_graduate: boolean;
  experience_max_years: number | null;
  education: string | null;
  requirements: string | null;
  notes: string | null;
  last_verified_at: string | null;
  created_at: string;
};

type MilestoneRow = {
  id: string;
  opportunity_id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
  sort_order: number;
};

export type OpportunityData = {
  configured: boolean;
  signedIn: boolean;
  opportunities: JobOpportunity[];
  milestones: JobOpportunityMilestone[];
};

const empty: OpportunityData = {
  configured: false,
  signedIn: false,
  opportunities: [],
  milestones: [],
};

export const getOpportunityData = cache(async function getOpportunityData(): Promise<OpportunityData> {
  if (!hasSupabaseEnv()) return empty;
  const auth = await getAuthenticatedUser();
  if (!auth) return { ...empty, configured: true };

  const [opportunitiesResult, milestonesResult, applicationsResult] = await Promise.all([
    auth.supabase
      .from("job_opportunities")
      .select("id,company_name,title,official_apply_url,source_url,source_name,program_type,employment_type,location,work_mode,published_at,deadline_at,deadline_kind,status,is_fresh_graduate,experience_max_years,education,requirements,notes,last_verified_at,created_at")
      .is("archived_at", null)
      .order("deadline_at", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: false }),
    auth.supabase
      .from("job_opportunity_milestones")
      .select("id,opportunity_id,title,due_at,completed_at,notes,sort_order")
      .order("sort_order")
      .order("due_at", { ascending: true, nullsFirst: false }),
    auth.supabase
      .from("applications")
      .select("id,source_opportunity_id")
      .not("source_opportunity_id", "is", null),
  ]);

  const applicationByOpportunity = new Map(
    (applicationsResult.data ?? []).map((item) => [item.source_opportunity_id as string, item.id as string]),
  );

  const opportunities = (opportunitiesResult.data ?? []) as OpportunityRow[];
  const milestones = (milestonesResult.data ?? []) as MilestoneRow[];

  return {
    configured: true,
    signedIn: true,
    opportunities: opportunities.map((item) => ({
      id: item.id,
      companyName: item.company_name,
      title: item.title,
      officialApplyUrl: item.official_apply_url,
      sourceUrl: item.source_url,
      sourceName: item.source_name,
      programType: item.program_type,
      employmentType: item.employment_type,
      location: item.location,
      workMode: item.work_mode,
      publishedAt: item.published_at,
      deadlineAt: item.deadline_at,
      deadlineKind: item.deadline_kind,
      status: item.status,
      isFreshGraduate: item.is_fresh_graduate,
      experienceMaxYears: item.experience_max_years,
      education: item.education,
      requirements: item.requirements,
      notes: item.notes,
      lastVerifiedAt: item.last_verified_at,
      applicationId: applicationByOpportunity.get(item.id) ?? null,
      createdAt: item.created_at,
    })),
    milestones: milestones.map((item) => ({
      id: item.id,
      opportunityId: item.opportunity_id,
      title: item.title,
      dueAt: item.due_at,
      completedAt: item.completed_at,
      notes: item.notes,
      sortOrder: item.sort_order,
    })),
  };
});
