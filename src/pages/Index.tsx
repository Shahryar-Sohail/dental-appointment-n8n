import { useState, useCallback } from "react";

const QUESTIONS = [
  { key: "name", label: "What is your name?", type: "text", placeholder: "Your full name" },
  { key: "email", label: "What is your email address?", type: "email", placeholder: "you@example.com" },
  { key: "phone", label: "What is your phone number?", type: "tel", placeholder: "(555) 123-4567" },
  { key: "treatment", label: "What type of treatment are you looking for?", type: "select", placeholder: "Select a treatment", options: ["General Checkup", "Cleaning", "Whitening", "Filling", "Root Canal", "Extraction", "Other"] },
] as const;

type FormData = Record<string, string>;

type Phase = "questions" | "review" | "submitted";

const Index = () => {
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<Phase>("questions");
  const [data, setData] = useState<FormData>({});
  const [currentValue, setCurrentValue] = useState("");
  const [fade, setFade] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");


  const question = QUESTIONS[step];

  const transition = useCallback((cb: () => void) => {
    setFade(false);
    setTimeout(() => {
      cb();
      setFade(true);
    }, 300);
  }, []);

  const handleNext = () => {
    const val = currentValue.trim();
    if (!val) return;

    // Basic validation
    if (question.key === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (question.key === "phone" && val.length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setError("");
    const updated = { ...data, [question.key]: val };
    setData(updated);

    if (step < QUESTIONS.length - 1) {
      transition(() => {
        setStep(step + 1);
        setCurrentValue("");
      });
    } else {
      transition(() => {
        setPhase("review");
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNext();
    }
  };
  const handleSubmit = async () => {
    const url = import.meta.env.VITE_N8N_WEBHOOK_URL;
    setSubmitting(true);
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          phone: data.phone,
          treatment: data.treatment,
        }),
      });
      transition(() => setPhase("submitted"));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-[600px]">
        <div
          className={`transition-opacity duration-500 ease-in-out ${fade ? "opacity-100" : "opacity-0"}`}
        >
          {phase === "questions" && (
            <div className="space-y-8">
              <h1 className="font-heading text-2xl font-light tracking-tight text-foreground sm:text-3xl">
                {question.label}
              </h1>

              {question.type === "select" ? (
                <div className="space-y-3">
                  {question.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setCurrentValue(opt);
                        setError("");
                      }}
                      className={`block w-full border-b py-3 text-left font-body text-lg transition-colors duration-200 ${currentValue === opt
                        ? "border-accent text-foreground"
                        : "border-input text-muted-foreground hover:text-foreground"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type={question.type}
                  value={currentValue}
                  onChange={(e) => {
                    setCurrentValue(e.target.value);
                    setError("");
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={question.placeholder}
                  autoFocus
                  className="w-full border-b-2 border-input bg-transparent py-3 font-body text-lg text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors duration-300 focus:border-accent"
                />
              )}

              {error && (
                <p className="font-body text-sm text-destructive">{error}</p>
              )}

              <button
                onClick={handleNext}
                disabled={!currentValue.trim()}
                className="mt-4 bg-accent px-8 py-3 font-heading text-sm font-light tracking-wide text-accent-foreground transition-opacity duration-200 hover:opacity-80 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}

          {phase === "review" && (
            <div className="space-y-8">
              <h1 className="font-heading text-2xl font-light tracking-tight text-foreground sm:text-3xl">
                Please confirm your details.
              </h1>

              <div className="space-y-4">
                {QUESTIONS.map((q) => (
                  <div key={q.key} className="border-b border-input py-3">
                    <p className="font-heading text-xs font-light uppercase tracking-widest text-muted-foreground">
                      {q.key}
                    </p>
                    <p className="mt-1 font-body text-lg text-foreground">
                      {data[q.key]}
                    </p>
                  </div>
                ))}
              </div>

              {error && (
                <p className="font-body text-sm text-destructive">{error}</p>
              )}

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-accent px-8 py-3 font-heading text-sm font-light tracking-wide text-accent-foreground transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Confirm Enquiry"}
              </button>
            </div>
          )}

          {phase === "submitted" && (
            <p className="font-heading text-2xl font-light text-success sm:text-3xl">
              Thank you. We will be in touch shortly.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
