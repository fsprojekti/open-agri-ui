// file: src/components/wizard/StepString.jsx
import React from "react";
import { Alert, Button, Form } from "react-bootstrap";

export function StringStep({
                               label = "Text",
                               value,
                               setValue,
                               onBack,
                               onNext,
                               placeholder,
                               autoComplete,
                               backLabel = "Back",
                               nextLabel = "Next",
                               validate,      // (v) => "" | "error"
                               normalize = (v) => v?.trim?.() ?? v,
                               helpText,
                               autoFocus = true,
                               id = "stringField",
                               title = "Register",
                           }) {
    const [err, setErr] = React.useState("");

    const submit = () => {
        const v = normalize(value ?? "");
        if (!v) return setErr("Required");
        if (validate) {
            const msg = validate(v);
            if (msg) return setErr(msg);
        }
        setErr("");
        onNext(v);
    };

    return (
        <div className="p-3" style={{ maxWidth: 520, margin: "40px auto" }}>
            <h2 className="mb-3">{title}</h2>

            {err && <Alert variant="danger">{err}</Alert>}

            <Form.Group className="mb-3" controlId={id}>
                <Form.Label>{label}</Form.Label>
                <Form.Control
                    type="text"
                    value={value}
                    autoFocus={autoFocus}
                    autoComplete={autoComplete}
                    placeholder={placeholder}
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

export default StringStep;
