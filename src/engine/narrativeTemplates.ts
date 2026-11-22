import {
  EmployeeRecord,
  LIFECYCLE_STAGES,
  NarrativeContent,
  ScoreBreakdown,
} from "../types/journey";

export function buildTemplateNarrative(
  employee: EmployeeRecord,
  breakdown: ScoreBreakdown
): NarrativeContent {
  const activeMatched = breakdown.matchedSkills.filter((m) => m.active);
  const heldSummary =
    activeMatched.length > 0
      ? activeMatched.map((m) => `${m.skill} (${m.tag})`).join(", ")
      : employee.extractedSkills.map((s) => `${s.name} (${s.tag})`).join(", ") ||
        "foundational role experience";

  const gapSummary =
    breakdown.hasProfile && breakdown.missingSkills.length > 0
      ? breakdown.missingSkills.map((m) => m.skill).join(", ")
      : employee.inProgressOrNotStartedCourses.length > 0
      ? employee.inProgressOrNotStartedCourses
          .map((c) => `${c.courseName} (${c.status})`)
          .join(", ")
      : "role-specific leadership exposure";

  const whyRecommendation = breakdown.hasProfile
    ? `This ${employee.careerAspiration} path is suggested because ${employee.fullName} noted "${employee.internalMobilityInterest}" mobility interest and holds ${heldSummary}, giving a ${breakdown.matchPercent}% deterministic match with ${employee.potentialRating} potential and a ${employee.performanceRating5}/5 performance rating. Areas where manager and HR support can help close gaps include ${gapSummary}.`
    : `This ${employee.careerAspiration} path is suggested because ${employee.fullName} noted "${employee.internalMobilityInterest}" mobility interest with ${employee.potentialRating} potential and a ${employee.performanceRating5}/5 performance rating. No role profile is defined yet for ${employee.careerAspiration}, so managers and HR can use Learning, Performance, and Growth evidence to support the conversation.`;

  const q1 = `Your Growth profile notes an interest in exploring ${employee.careerAspiration} (next career discussion scheduled ${employee.nextCareerDiscussionDate || "soon"}) — does this feel like a path you want to pursue, and what excites you most about it?`;

  const q2 =
    breakdown.missingSkills.length > 0
      ? `Looking at the ${breakdown.missingSkills[0].skill} area${
          employee.courseProgram ? ` and your "${employee.courseProgram}" course (${employee.learningStatus})` : ""
        }, how can I support you with time or resources over the next 60 days?`
      : `Your feedback highlights "${employee.keyStrengths || "consistent delivery"}" and mentions "${employee.developmentAreas || "broader exposure"}" — what kind of stretch experience would feel most helpful?`;

  const q3 = employee.stayInterviewNotes
    ? `In your stay interview (${employee.stayInterviewDate}), you shared: "${employee.stayInterviewNotes}" — what support from me or HR would help most as you consider ${employee.careerAspiration}?`
    : `With ${employee.mentor && employee.mentor !== "To be assigned" ? `${employee.mentor} as your mentor` : "a mentor assignment still open"}, what kind of mentoring or shadowing support would you find most valuable?`;

  const suggestedActions: string[] = [];

  if (employee.engagementAction && employee.engagementAction.isOpenOrOverdue) {
    suggestedActions.push(
      `Follow up on open engagement support action (${employee.engagementAction.status}${
        employee.engagementAction.isOverdue ? ", Overdue" : ""
      }): "${employee.engagementAction.action}" — Owner: ${employee.engagementAction.owner}, Due: ${employee.engagementAction.dueDate}.`
    );
  }

  if (employee.inProgressOrNotStartedCourses.length > 0) {
    const c = employee.inProgressOrNotStartedCourses[0];
    suggestedActions.push(
      `Support completion of "${c.courseName}" (currently ${c.status}) to help build ${c.mappedSkill ?? "target role"} capability.`
    );
  } else if (breakdown.missingSkills.length > 0) {
    suggestedActions.push(
      `Offer targeted learning or shadowing support for ${breakdown.missingSkills
        .slice(0, 2)
        .map((m) => m.skill)
        .join(" and ")}.`
    );
  }

  if (employee.developmentPlan) {
    suggestedActions.push(
      `Development plan (Sample text): ${employee.developmentPlan}`
    );
  }

  if (employee.mentor === "To be assigned") {
    suggestedActions.push(
      `Help connect with an internal mentor ahead of the ${employee.nextCareerDiscussionDate} career discussion.`
    );
  }

  return {
    source: "template",
    whyRecommendation,
    conversationQuestions: [q1, q2, q3],
    suggestedActions: suggestedActions.slice(0, 4),
  };
}

export async function fetchNarrativeWithFallback(
  employee: EmployeeRecord,
  breakdown: ScoreBreakdown
): Promise<NarrativeContent> {
  const fallback = buildTemplateNarrative(employee, breakdown);

  const evidenceRows = LIFECYCLE_STAGES.flatMap((stage) =>
    employee.evidenceByStage[stage].map((row) => ({
      stage: row.stage,
      sentence: row.sentence,
      sourceTab: row.sourceTab,
      date: row.date,
    }))
  );

  try {
    const response = await fetch("/api/recommendations/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeName: employee.fullName,
        currentRole: employee.jobTitle,
        targetRole: employee.careerAspiration,
        matchPercent: breakdown.matchPercent,
        heldSkills: employee.extractedSkills.map((s) => ({
          name: s.name,
          tag: s.tag,
          source: s.sources.join("; "),
        })),
        gaps: breakdown.missingSkills.map((m) => ({
          name: m.skill,
          reason: m.reason,
        })),
        evidenceRows,
        engagementAction: employee.engagementAction?.isOpenOrOverdue
          ? {
              action: employee.engagementAction.action,
              owner: employee.engagementAction.owner,
              dueDate: employee.engagementAction.dueDate,
              status: employee.engagementAction.status,
              isOverdue: employee.engagementAction.isOverdue,
            }
          : null,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        ...fallback,
        errorNote:
          typeof errData?.error === "string"
            ? errData.error
            : "Gemini endpoint unavailable; using evidence template.",
      };
    }

    const data = await response.json();
    if (
      data &&
      data.whyRecommendation &&
      Array.isArray(data.conversationQuestions) &&
      data.conversationQuestions.length > 0
    ) {
      return {
        source: "gemini",
        whyRecommendation: data.whyRecommendation,
        conversationQuestions: data.conversationQuestions,
        suggestedActions:
          Array.isArray(data.suggestedActions) && data.suggestedActions.length > 0
            ? data.suggestedActions
            : fallback.suggestedActions,
      };
    }

    return fallback;
  } catch {
    return {
      ...fallback,
      errorNote: "Offline or network unreachable; using evidence template.",
    };
  }
}
