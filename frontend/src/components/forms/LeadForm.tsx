"use client";

import Link from "next/link";
import { button, cx, sectionHeading } from "@/components/ui/styles";
import { useActionState, useEffect, useRef, useSyncExternalStore } from "react";
import { submitLead } from "@/app/(site)/actions";
import { readAttribution } from "@/components/site/attribution";
import {
  ATTRIBUTION_FIELDS,
  SERVICE_AREAS,
  type LeadFormState,
} from "@zgate/website-contracts/constants";

type CourseOption = { id: number; title: string };
type ServiceArea = (typeof SERVICE_AREAS)[number];

function isServiceArea(value: string): value is ServiceArea {
  return SERVICE_AREAS.some((service) => service === value);
}

type ContextualService = Exclude<ServiceArea, "not-sure">;

const noopSubscribe = () => () => {};

/** A stable number per action result, so fields can remount when a new one arrives. */
const resultIds = new WeakMap<object, number>();
let lastResultId = 0;
function resultId(state: object): number {
  let value = resultIds.get(state);
  if (value === undefined) {
    value = ++lastResultId;
    resultIds.set(state, value);
  }
  return value;
}

/**
 * The service named in the address (`/contact?service=advisory`, from a
 * division page's button), read in the browser. Reading it on the server
 * would make every page dynamic and skip the page cache; here the page
 * stays cached and only the form adapts. Null during server render.
 */
function serviceFromUrl(): ContextualService | null {
  const value = new URLSearchParams(window.location.search).get("service");
  return value && isServiceArea(value) && value !== "not-sure" ? value : null;
}

/**
 * `?intent=demo` (the floating "Demo" button): the message starts as a demo
 * request - a person walks the visitor through how Z-GATE would work for
 * their business. Read in the browser, like `?service=`.
 */
const DEMO_MESSAGE = "I'd like a demo: a walkthrough of how Z-GATE could work for my business.";
/**
 * The demo request message, naming the demo when the Demo Library sent the
 * visitor (`&topic=`); "" when the address asks for no demo.
 */
function demoMessage(): string {
  const params = new URLSearchParams(window.location.search);
  if (params.get("intent") !== "demo") return "";
  // Plain text in a textarea's default value (React escapes it), capped in length.
  const topic = (params.get("topic") ?? "").trim().slice(0, 120);
  return topic ? `I'd like a live walkthrough of: ${topic}.` : DEMO_MESSAGE;
}

type Props = {
  variant: "contact" | "waitlist";
  heading?: string | null;
  intro?: string | null;
  courses: CourseOption[];
  responseTimeCommitment?: string | null;
  /** Preselects a service; otherwise `?service=` in the address does. */
  contextualService?: ContextualService;
  /** On a course page the course is already known - shown, not asked. */
  fixedCourse?: CourseOption;
};

const SERVICE_LABELS: Record<ServiceArea, string> = {
  advisory: "Advisory — tax and business support",
  academy: "Academy — professional training",
  tech: "Tech — technology solutions",
  data: "Data — analytics and reporting",
  "not-sure": "Not sure yet",
};

const initialState: LeadFormState = { status: "idle" };

// Form styling. Inputs: 44px touch targets, paper-dim border, red when invalid.
const result = "rounded-md border-l-4 p-4";
const fieldBox =
  "grid gap-2 [&_label]:font-semibold [&_:is(input[type=text],select,textarea)]:min-h-11 [&_:is(input[type=text],select,textarea)]:w-full [&_:is(input[type=text],select,textarea)]:rounded-md [&_:is(input[type=text],select,textarea)]:border [&_:is(input[type=text],select,textarea)]:border-paper-dim [&_:is(input[type=text],select,textarea)]:bg-ink-2 [&_:is(input[type=text],select,textarea)]:p-3 [&_:is(input[type=text],select,textarea)]:text-paper [&_[aria-invalid=true]]:border-error";
const hint = "text-sm text-paper-dim";
const checkboxBox =
  "grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-2 [&_input]:mt-0.5 [&_input]:size-6 [&_input]:accent-gate-1 [&_label]:font-normal [&_label_a]:underline [&_label_a]:underline-offset-2 [&>p]:col-start-2";

/**
 * Works without JavaScript: the form posts to the server action and the
 * page re-renders with the result. With JavaScript it submits in place.
 */
export function LeadForm({
  variant,
  heading,
  intro,
  courses,
  responseTimeCommitment,
  contextualService: contextualServiceProp,
  fixedCourse,
}: Props) {
  const urlService = useSyncExternalStore(noopSubscribe, serviceFromUrl, () => null);
  const demoText = useSyncExternalStore(noopSubscribe, demoMessage, () => "");
  const demo = variant === "contact" ? demoText : "";
  const contextualService =
    variant === "contact" ? (contextualServiceProp ?? urlService ?? undefined) : undefined;
  const [state, formAction, pending] = useActionState(submitLead, initialState);
  // The service select is uncontrolled, like the other fields: React resets
  // a form after its action completes, which would leave a controlled
  // select showing its first option while its state said otherwise. It is
  // remounted (key) with the echoed choice after each result, and once the
  // address's ?service= is known after hydration.
  const defaultService =
    state.status === "error" && state.values.serviceInterests
      ? (state.values.serviceInterests.find(isServiceArea) ?? "")
      : (contextualService ?? "");
  const serviceKey = `${contextualService ?? "none"}-${resultId(state)}`;
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

      <div className="grid gap-2 rounded-md border border-line bg-ink-2 p-4 text-sm/6 text-paper-dim">
        {responseTimeCommitment ? (
          <p>
            Current reply target: <strong className="text-paper">{responseTimeCommitment}</strong>.
            A team member will respond personally using your preferred contact method.
          </p>
        ) : (
          <p>
            A team member reviews submissions and replies personally using your preferred contact
            method.
          </p>
        )}
        {variant === "contact" ? (
          <>
            <p>
              This form is not live chat. For urgent help, call or WhatsApp us. Existing clients
              should use the support channel and response commitments in their service agreement.
            </p>
            <p>
              You will see an on-screen confirmation after sending; we do not send an automated chat
              or SMS reply.
            </p>
          </>
        ) : (
          <p>
            This adds you to the course waitlist; it does not enroll you. We will contact you when
            registration opens.
          </p>
        )}
      </div>

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
            <label htmlFor={id("serviceInterests")}>What do you need help with?</label>
            {contextualService ? (
              <p className={hint} id={id("serviceInterests-hint")}>
                We selected {SERVICE_LABELS[contextualService]} based on the page you came from.
              </p>
            ) : null}
            <select
              id={id("serviceInterests")}
              name="serviceInterests"
              key={serviceKey}
              defaultValue={defaultService}
              required
              aria-invalid={Boolean(errors.serviceInterests)}
              aria-describedby={[
                contextualService ? id("serviceInterests-hint") : "",
                describedBy("serviceInterests"),
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <option value="">Choose a service</option>
              {SERVICE_AREAS.map((service) => (
                <option key={service} value={service}>
                  {SERVICE_LABELS[service]}
                </option>
              ))}
            </select>
            {fieldError("serviceInterests")}
          </div>

          <div className={fieldBox}>
            <label htmlFor={id("message")}>How can we help?</label>
            <p className={hint} id={id("message-hint")}>
              A few details will help us direct your enquiry. Please don’t include passwords, tax
              IDs or confidential client information.
            </p>
            <textarea
              id={id("message")}
              name="message"
              rows={4}
              maxLength={2000}
              // Remounted once ?intent=demo is known, and after each result (see the select).
              key={`${demo ? "demo" : "plain"}-${resultId(state)}`}
              defaultValue={values.message ?? (demo || undefined)}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={[id("message-hint"), describedBy("message")]
                .filter(Boolean)
                .join(" ")}
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
