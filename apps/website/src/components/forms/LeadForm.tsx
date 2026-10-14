"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { submitLead } from "@/app/(site)/actions";
import { readAttribution } from "@/components/site/attribution";
import { ATTRIBUTION_FIELDS, INTERESTS, type LeadFormState } from "@/lib/leads/constants";

type CourseOption = { id: number; title: string };

type Props = {
  variant: "contact" | "waitlist";
  heading?: string | null;
  intro?: string | null;
  courses: CourseOption[];
  /** On a course page the course is already known - shown, not asked. */
  fixedCourse?: CourseOption;
};

const INTEREST_LABELS: Record<(typeof INTERESTS)[number], string> = {
  advisory: "Advisory — tax, compliance, bookkeeping",
  academy: "Academy — training courses",
  tech: "Tech — software and systems",
  data: "Data — reporting and analysis",
  "not-sure": "Not sure yet",
};

const initialState: LeadFormState = { status: "idle" };

/**
 * Works without JavaScript: the form posts to the server action and the
 * page re-renders with the result. With JavaScript it submits in place.
 */
export function LeadForm({ variant, heading, intro, courses, fixedCourse }: Props) {
  const [state, formAction, pending] = useActionState(submitLead, initialState);
  const summaryRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const id = (field: string) => `${variant}-${field}`;

  // Attribution (UTM, landing page) captured on arrival - see attribution.ts.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const attribution = readAttribution();
    for (const field of ATTRIBUTION_FIELDS) {
      const input = form.elements.namedItem(field);
      if (input instanceof HTMLInputElement) input.value = attribution[field] ?? "";
    }
  }, []);

  // Move focus to the result so screen-reader and keyboard users hear it.
  useEffect(() => {
    if (state.status !== "idle") summaryRef.current?.focus();
  }, [state]);

  if (state.status === "success") {
    return (
      <div
        className="form-result form-result--success"
        role="status"
        tabIndex={-1}
        ref={summaryRef}
      >
        <p>{state.message}</p>
      </div>
    );
  }

  const errors = state.status === "error" ? state.fieldErrors : {};
  const values = state.status === "error" ? state.values : {};
  const describedBy = (field: keyof typeof errors) =>
    errors[field] ? id(`${field}-error`) : undefined;
  const fieldError = (field: keyof typeof errors) =>
    errors[field] ? (
      <p className="field-error" id={id(`${field}-error`)}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form ref={formRef} action={formAction} className="lead-form" noValidate>
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p>{intro}</p> : null}

      {state.status === "error" ? (
        <div className="form-result form-result--error" role="alert" tabIndex={-1} ref={summaryRef}>
          <p>{state.message}</p>
        </div>
      ) : null}

      <input type="hidden" name="kind" value={variant} />
      {ATTRIBUTION_FIELDS.map((field) => (
        <input key={field} type="hidden" name={field} defaultValue="" />
      ))}

      {/* Honeypot - hidden from people and assistive technology. */}
      <div className="visually-hidden" aria-hidden="true">
        <label htmlFor={id("website")}>Leave this field empty</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="field">
        <label htmlFor={id("name")}>Your name</label>
        <input
          id={id("name")}
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={200}
          defaultValue={values.name}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={describedBy("name")}
        />
        {fieldError("name")}
      </div>

      <div className="field">
        <label htmlFor={id("contact")}>Phone, WhatsApp or email</label>
        <p className="field-hint" id={id("contact-hint")}>
          Whichever is easiest for you to be reached on.
        </p>
        <input
          id={id("contact")}
          name="contact"
          type="text"
          required
          maxLength={200}
          defaultValue={values.contact}
          aria-invalid={Boolean(errors.contact)}
          aria-describedby={[id("contact-hint"), describedBy("contact")].filter(Boolean).join(" ")}
        />
        {fieldError("contact")}
      </div>

      {variant === "contact" ? (
        <>
          <div className="field">
            <label htmlFor={id("interest")}>What can we help with? (optional)</label>
            <select id={id("interest")} name="interest" defaultValue={values.interest ?? ""}>
              <option value="">Choose one</option>
              {INTERESTS.map((interest) => (
                <option key={interest} value={interest}>
                  {INTEREST_LABELS[interest]}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={id("message")}>Tell us a little more (optional)</label>
            <textarea
              id={id("message")}
              name="message"
              rows={5}
              maxLength={2000}
              defaultValue={values.message}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={describedBy("message")}
            />
            {fieldError("message")}
          </div>
        </>
      ) : fixedCourse ? (
        <>
          <input type="hidden" name="courseId" value={fixedCourse.id} />
          <p className="field-hint">
            Course: <strong>{fixedCourse.title}</strong>
          </p>
          {fieldError("courseId")}
        </>
      ) : (
        <div className="field">
          <label htmlFor={id("courseId")}>Which course?</label>
          <select
            id={id("courseId")}
            name="courseId"
            required
            defaultValue={values.courseId ?? ""}
            aria-invalid={Boolean(errors.courseId)}
            aria-describedby={describedBy("courseId")}
          >
            <option value="">Choose a course</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>
          {fieldError("courseId")}
        </div>
      )}

      <div className="field field--checkbox">
        <input
          id={id("consentContact")}
          name="consentContact"
          type="checkbox"
          required
          aria-invalid={Boolean(errors.consentContact)}
          aria-describedby={describedBy("consentContact")}
        />
        <label htmlFor={id("consentContact")}>
          I agree that Z-GATE may contact me about this{" "}
          {variant === "waitlist" ? "course" : "enquiry"}, as described in the{" "}
          <Link href="/privacy">privacy notice</Link>.
        </label>
        {fieldError("consentContact")}
      </div>

      <div className="field field--checkbox">
        <input id={id("consentMarketing")} name="consentMarketing" type="checkbox" />
        <label htmlFor={id("consentMarketing")}>
          Also send me occasional news about Z-GATE courses and services (optional).
        </label>
      </div>

      <button type="submit" className="button" disabled={pending} aria-disabled={pending}>
        {pending ? "Sending…" : variant === "waitlist" ? "Join the waitlist" : "Send message"}
      </button>
    </form>
  );
}
