"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Course, SiteData, Subject, SubjectSlug } from "@/lib/types";
import { scrollToTarget } from "@/lib/motion";

export interface CourseFilter {
  cls: "all" | "9-10" | "11-12";
  subject: "all" | SubjectSlug;
  mode: "all" | "online" | "offline";
}

interface SiteCtx {
  data: SiteData;
  subjectById: Map<string, Subject>;
  subjectBySlug: Map<SubjectSlug, Subject>;
  courseById: Map<string, Course>;
  filter: CourseFilter;
  setFilter: (f: Partial<CourseFilter>) => void;
  enrollCourseId: string | null;
  enrollCourse: (courseId: string | null) => void;
  showSubjectCourses: (slug: SubjectSlug) => void;
}

const Ctx = createContext<SiteCtx | null>(null);

export function SiteProvider({ data, children }: { data: SiteData; children: React.ReactNode }) {
  const [filter, setFilterState] = useState<CourseFilter>({ cls: "all", subject: "all", mode: "all" });
  const [enrollCourseId, setEnrollCourseId] = useState<string | null>(null);

  const subjectById = useMemo(() => new Map(data.subjects.map((s) => [s.id, s])), [data.subjects]);
  const subjectBySlug = useMemo(() => new Map(data.subjects.map((s) => [s.slug, s])), [data.subjects]);
  const courseById = useMemo(() => new Map(data.courses.map((c) => [c.id, c])), [data.courses]);

  const setFilter = useCallback((f: Partial<CourseFilter>) => setFilterState((prev) => ({ ...prev, ...f })), []);

  const enrollCourse = useCallback((courseId: string | null) => {
    setEnrollCourseId(courseId);
    requestAnimationFrame(() => scrollToTarget("#contact"));
  }, []);

  const showSubjectCourses = useCallback((slug: SubjectSlug) => {
    setFilterState((prev) => ({ ...prev, subject: slug }));
    requestAnimationFrame(() => scrollToTarget("#courses"));
  }, []);

  const value = useMemo(
    () => ({
      data,
      subjectById,
      subjectBySlug,
      courseById,
      filter,
      setFilter,
      enrollCourseId,
      enrollCourse,
      showSubjectCourses,
    }),
    [data, subjectById, subjectBySlug, courseById, filter, setFilter, enrollCourseId, enrollCourse, showSubjectCourses],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSite() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}
