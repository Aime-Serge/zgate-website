"use client";

import Link from "next/link";
import { button, cx, sectionHeading } from "@/components/ui/styles";
import { useActionState, useEffect, useRef } from "react";
import { submitLead } from "@/app/(site)/actions";
import { readAttribution } from "@/components/site/attribution";
import {
  ATTRIBUTION_FIELDS,
  INTERESTS,
  type LeadFormState,
} from "@zgate/website-contracts/constants";

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

// Form styling. Inputs: 44px touch targets, paper-dim border, red when invalid.
const result = "rounded-md border-l-4 p-4";
const fieldBox =
  "grid gap-2 [&_label]:font-semibold [&_:is(input[type=text],select,textarea)]:min-h-11 [&_:is(input[type=text],select,textarea)]:w-full [&_:is(input[type=text],select,textarea)]:rounded-md [&_:is(input[type=text],select,textarea)]:border [&_:is(input[type=text],select,textarea)]:border-paper-dim [&_:is(input[type=text],select,textarea)]:bg-ink-2 [&_:is(input[type=text],select,textarea)]:p-3 [&_:is(input[type=text],select,textarea)]:text-paper [&_[aria-invalid=true]]:border-error";
const hint = "text-[0.95rem] text-paper-dim";
const checkboxBox =
  "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2 [&_input]:mt-0.5 [&_input]:size-6 [&_input]:accent-gate-1 [&_label]:font-normal [&_label_a]:underline [&_label_a]:underline-offset-2 [&>p]:col-start-2";

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
        className={cx(result, "border-success bg-success/8")}
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
      <p className="font-semibold text-error" id={id(`${field}-error`)}>
        {errors[field]}
      </p>
    ) : null;

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid max-w-[40rem] gap-6"
      data-lead-form
      noValidate
    >
      {heading ? <h2 className={sectionHeading}>{heading}</h2> : null}
      {intro ? <p className="text-paper-dim">{intro}</p> : null}

      {state.status === "error" ? (
        <div
          className={cx(result, "border-error bg-error/8")}
          role="alert"
          tabIndex={-1}
          ref={summaryRef}
        >
          <p>{state.message}</p>
        </div>
      ) : null}

      <input type="hidden" name="kind" value={variant} />
      {ATTRIBUTION_FIELDS.map((field) => (
        <input key={field} type="hidden" name={field} defaultValue="" />
      ))}

      {/* Honeypot - hidden from people and assistive technology. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor={id("website")}>Leave this field empty</label>
        <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className={fieldBox}>
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

      <div className={fieldBox}>
        <label htmlFor={id("contact")}>Phone, WhatsApp or email</label>
        <p className={hint} id={id("contact-hint")}>
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
          <div className={fieldBox}>
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
          <div className={fieldBox}>
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
          <p className={hint}>
            Course: <strong>{fixedCourse.title}</strong>
          </p>
          {fieldError("courseId")}
        </>
      ) : (
        <div className={fieldBox}>
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

      <div className={checkboxBox}>
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

      <div className={checkboxBox}>
        <input id={id("consentMarketing")} name="consentMarketing" type="checkbox" />
        <label htmlFor={id("consentMarketing")}>
          Also send me occasional news about Z-GATE courses and services (optional).
        </label>
      </div>

      <button
        type="submit"
        className={cx(button, "disabled:cursor-progress disabled:opacity-60")}
        disabled={pending}
        aria-disabled={pending}
      >
        {pending ? "Sending…" : variant === "waitlist" ? "Join the waitlist" : "Send message"}
      </button>
    </form>
  );
}
