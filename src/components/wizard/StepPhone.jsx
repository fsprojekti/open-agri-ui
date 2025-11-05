// file: src/components/wizard/StepPhone.jsx
import React from "react";
import { Alert, Button, Form } from "react-bootstrap";

/**
 * PhoneStep
 * - Works like StepEmail, but for phone numbers.
 * - `required` controls whether the field must be filled (default: false).
 * - By default it accepts common international formats (very forgiving).
 * - Override `pattern` or `validate` for stricter rules (e.g., full E.164).
 *
 * Props:
 *  label, value, setValue, onBack, onNext,
 *  placeholder, autoComplete, backLabel, nextLabel,
 *  validate, normalize, helpText, autoFocus, id, title,
 *  required, pattern, inputMode
 */
export function PhoneStep({
                              label = "Phone",
                              value,
                              setValue,
                              onBack,
                              onNext,
                              placeholder = "+386 31 123 456",
                              autoComplete = "tel",
                              backLabel = "Back",
                              nextLabel = "Next",
                              // Optional/required toggle:
                              required = false,
                              // Very forgiving default pattern: +, digits, spaces, dashes, dots, parentheses
                              pattern = "^\\+?[0-9()\\-\\.\\s]{6,20}$",
                              inputMode = "tel",
                              validate,                         // (v) => "" | "error"
                              normalize = (v) => v?.trim?.() ?? v,
                              helpText,
                              autoFocus = true,
                              id = "phoneField",
                              title = "Register",
                          }) {
    const [err, setErr] = React.useState("");

    const submit = () => {
        const v = normalize(value ?? "");

        if (required && !v) {
            setErr("Required");
            return;
        }

        if (v) {
            // Only validate format if user typed something (when optional)
            if (pattern) {
                try {
                    const re = new RegExp(pattern);
                    if (!re.test(v)) {
                        setErr("Invalid phone number");
                        return;
                    }
                } catch {
                    // ignore bad pattern; fall back to custom validate if provided
                }
            }
            if (validate) {
                const msg = validate(v);
                if (msg) {
                    setErr(msg);
                    return;
                }
            }
        }

        setErr("");
        onNext(v); // pass normalized value (may be empty if not required)
    };

    return (
        <div className="p-3" style={{ maxWidth: 520, margin: "40px auto" }}>
            <h2 className="mb-3">{title}</h2>

            {err && <Alert variant="danger">{err}</Alert>}

            <Form.Group className="mb-3" controlId={id}>
                <Form.Label>
                    {label} {required ? "" : `(${helpText ? "" : "optional"})`}
                </Form.Label>
                <Form.Control
                    type="tel"
                    value={value}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
                    inputMode={inputMode}
                    onChange={(e) => {
                        setValue(e.target.value);
                        if (err) setErr("");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            submit();
                        }
                    }}
                />
                {helpText && <Form.Text className="text-muted">{helpText}</Form.Text>}
            </Form.Group>

            <div className="d-flex gap-2">
                <Button variant="secondary" className="w-50" onClick={onBack}>
                    {backLabel}
                </Button>
                <Button className="w-50 fw-bold" onClick={submit}>
                    {nextLabel}
                </Button>
            </div>
        </div>
    );
}

export default PhoneStep;
