// file: src/pages/register/registrationWizard.jsx
import React from "react";
import {Navigate, Route, Routes, useLocation, useNavigate} from "react-router-dom";
import {Alert, Button, Card, Spinner} from "react-bootstrap";
import {useTranslation} from "react-i18next";

// use your existing APIs/config
import {loginAdmin, loginUser, registerUser} from "../../api/auth.js";
import {addFarm} from "../../api/farms.js";
import {SERVICES} from "../../config.js";

// use the standalone step components you just created
import StringStep from "../../components/wizard/StepString.jsx";
import NumberStep from "../../components/wizard/StepNumber.jsx";
import EmailStep from "../../components/wizard/StepEmail.jsx";
import PasswordStep from "../../components/wizard/StepPassword.jsx";
import PhoneStep from "../../components/wizard/StepPhone.jsx";

/* ----------------------------- Wizard store/nav ----------------------------- */

const WizardCtx = React.createContext(null);
const STORE_KEY = "registrationWizard.v1";

function loadStore() {
    try {
        const raw = sessionStorage.getItem(STORE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveStore(data) {
    try {
        sessionStorage.setItem(STORE_KEY, JSON.stringify(data || {}));
    } catch {
        // ignore

    }
}

function WizardProvider({children}) {
    const [data, setData] = React.useState(() => loadStore());
    React.useEffect(() => saveStore(data), [data]);
    const value = React.useMemo(() => ({data, setData}), [data]);
    return <WizardCtx.Provider value={value}>{children}</WizardCtx.Provider>;
}

function useRegWizardNav() {
    const {data, setData} = React.useContext(WizardCtx);
    const nav = useNavigate();
    const {pathname} = useLocation();

    function goNext(path, patch = {}) {
        setData((d) => ({...d, ...patch}));
        nav(path);
    }

    function goBack(path) {
        if (path) nav(path);
        else window.history.back();
    }

    function ensure(requiredKeys = [], redirectPath) {
        const ok = requiredKeys.every((k) => !!data?.[k]);
        if (!ok && redirectPath && pathname !== redirectPath) nav(redirectPath, {replace: true});
    }

    return {data, goNext, goBack, ensure, setData};
}

/* --------------------------------- Steps --------------------------------- */

function StepFirstName() {
    const {t} = useTranslation();
    const {data, goNext} = useRegWizardNav();
    const [v, setV] = React.useState(data.firstName ?? "");
    return (
        <StringStep
            title={t("register.title") || "Register"}
            label={t("farm.firstname") || "First name"}
            value={v}
            setValue={setV}
            placeholder={t("farm.firstname.placeholder") || "e.g., Ana"}
            autoComplete="given-name"
            onBack={() => window.history.back()}
            onNext={(val) => goNext("/register/last-name", {firstName: val})}
        />
    );
}

function StepLastName() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["firstName"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.lastName ?? "");
    return (
        <StringStep
            title={t("register.title") || "Register"}
            label={t("farm.lastname") || "Last name"}
            value={v}
            setValue={setV}
            placeholder={t("farm.lastname.placeholder") || "e.g., Novak"}
            autoComplete="family-name"
            onBack={() => goBack("/register/first-name")}
            onNext={(val) => goNext("/register/email", {lastName: val})}
        />
    );
}

function StepEmail() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["firstName", "lastName"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.email ?? "");
    return (
        <EmailStep
            title={t("register.title") || "Register"}
            label={t("register.email") || "Email"}
            value={v}
            setValue={setV}
            placeholder="name@example.com"
            autoComplete="email"
            onBack={() => goBack("/register/last-name")}
            onNext={(val) => goNext("/register/phone", {email: val})}
        />
    );
}

function StepPhone() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["email"], "/register/first-name");
    }, []); // eslint-disable-line
    const [phone, setPhone] = React.useState(data.phone ?? "");

    return (
        <PhoneStep
            title={t("register.title") || "Register"}
            label={t("register.phone") || "Phone"}
            value={phone}
            setValue={setPhone}
            placeholder={t("register.phone.placeholder") || "+386 31 123 456"}
            helpText={t("register.phone.help") || "You can skip this and add a phone later in your profile."}
            required={false}                 // make true if you want it mandatory
            onBack={() => goBack("/register/email")}
            onNext={(v) => goNext("/register/password", {phone: v})}
        />
    );
}

function StepPassword() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["email"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.password ?? "");
    return (
        <PasswordStep
            title={t("register.title") || "Register"}
            label={t("register.password") || "Password"}
            value={v}
            setValue={setV}
            autoComplete="new-password"
            onBack={() => goBack("/register/phone")}
            onNext={(val) => goNext("/register/access-code", {password: val})}
            minLength={6}
        />
    );
}

function StepAccessCode() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["email", "password"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.accessCode ?? "");
    return (
        <StringStep
            title={t("register.title") || "Register"}
            label={t("register.accessCode") || "Access code"}
            value={v}
            setValue={setV}
            placeholder={t("register.accessCode.placeholder") || "Enter your access code"}
            onBack={() => goBack("/register/password")}
            onNext={(val) => goNext("/register/country", {accessCode: val})}
        />
    );
}

function StepCountry() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["accessCode"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.country ?? "");
    return (
        <StringStep
            title={t("register.title") || "Register"}
            label={t("farm.country") || "Country"}
            value={v}
            setValue={setV}
            placeholder={t("farm.country.placeholder") || "e.g., Slovenia"}
            autoComplete="country-name"
            onBack={() => goBack("/register/access-code")}
            onNext={(val) => goNext("/register/city", {country: val})}
        />
    );
}

function StepCity() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["country"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.city ?? "");
    return (
        <StringStep
            title={t("register.title") || "Register"}
            label={t("farm.city") || "City"}
            value={v}
            setValue={setV}
            placeholder={t("farm.city.placeholder") || "e.g., Ljubljana"}
            autoComplete="address-level2"
            onBack={() => goBack("/register/country")}
            onNext={(val) => goNext("/register/street", {city: val})}
        />
    );
}

function StepStreet() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["city"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.street ?? "");
    return (
        <StringStep
            title={t("register.title") || "Register"}
            label={t("farm.street") || "Street"}
            value={v}
            setValue={setV}
            placeholder={t("farm.street.placeholder") || "e.g., Slovenska cesta"}
            autoComplete="address-line1"
            onBack={() => goBack("/register/city")}
            onNext={(val) => goNext("/register/house-number", {street: val})}
        />
    );
}

function StepHouseNumber() {
    const {t} = useTranslation();
    const {data, goNext, goBack, ensure} = useRegWizardNav();
    React.useEffect(() => {
        ensure(["street"], "/register/first-name");
    }, []); // eslint-disable-line
    const [v, setV] = React.useState(data.houseNumber ?? "");
    return (
        <NumberStep
            title={t("register.title") || "Register"}
            label={t("farm.houseNumber") || "House number"}
            value={v}
            setValue={setV}
            placeholder={t("farm.houseNumber.placeholder") || "e.g., 12A"}
            // allow formats like "12A", "12-1", "12/1"
            pattern="^[0-9A-Za-z/-]+$"
            inputMode="text"
            onBack={() => goBack("/register/street")}
            onNext={(val) => goNext("/register/confirm", {houseNumber: val})}
        />
    );
}


/* ------------------------------ Confirm Step ------------------------------ */

function StepConfirm() {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const {data, goBack, ensure} = useRegWizardNav();

    React.useEffect(() => {
        ensure(
            ["firstName", "lastName", "email", "password", "accessCode", "country", "city", "street", "houseNumber"],
            "/register/first-name"
        );
    }, []); // eslint-disable-line

    const {
        firstName = "", lastName = "", email = "", phone = "",
        password = "", accessCode = "", country = "",
        city = "", street = "", houseNumber = "",
    } = data || {};

    const complete = [firstName, lastName, email, password, accessCode, country, city, street, houseNumber].every(Boolean);

    const [busy, setBusy] = React.useState(false);
    const [error, setError] = React.useState("");

    const onSubmit = async () => {
        setError("");

        if (accessCode !== SERVICES.gatekeeper.accessCode) {
            setError(t("register.invalidAccessCode") || "Invalid access code");
            return;
        }

        try {
            setBusy(true);

            // 1) admin login
            const adminToken = await loginAdmin();
            // console.log("Got admin token:", adminToken ? "YES" : "NO");
            // 2) register user (email as username)
            await registerUser(
                {username: email.trim(), email: email.trim(), password, ...(phone ? {phone} : {})},
                adminToken
            );

            //Login the user automatically after registration
            await loginUser({ username: email.trim(), password });

            // 3) try to create a farm (ignore failure if API needs a user token)
            try {
                await addFarm({
                    contact: {
                        firstName: firstName.trim(),
                        lastName: lastName.trim(),
                        email: email.trim(),
                        phone: phone.trim()
                    },
                    address: {
                        country: country.trim(),
                        city: city.trim(),
                        street: street.trim(),
                        houseNumber: houseNumber.trim(),
                    },

                });
            } catch (e) {
                // eslint-disable-next-line no-console
                console.warn("addFarm failed (continuing):", e?.response?.data || e?.message || e);
                console.log(e);
            }

            // navigate("/dashboard");
        } catch (e) {
            setError(e?.response?.data || e?.message || "Registration failed");
            setBusy(false);
            console.error(e);
        }
    };

    const rows = [
        [t("farm.firstname") || "First name", firstName || "—"],
        [t("farm.lastname") || "Last name", lastName || "—"],
        [t("register.email") || "Email", email || "—"],
        [t("register.phone") || "Phone", phone || "—"],
        [t("register.password") || "Password", "••••••"],
        [t("register.accessCode") || "Access code", "••••••"],
        [t("farm.country") || "Country", country || "—"],
        [t("farm.city") || "City", city || "—"],
        [t("farm.street") || "Street", street || "—"],
        [t("farm.houseNumber") || "House number", houseNumber || "—"],
    ];

    return (
        <div className="p-3" style={{maxWidth: 560, margin: "40px auto"}}>
            <h2 className="mb-3">{t("register.title") || "Register"}</h2>

            {error && (
                <Alert variant="danger" className="mb-3">
                    {typeof error === "string" ? error : JSON.stringify(error)}
                </Alert>
            )}

            {!complete && (
                <Alert variant="warning" className="mb-3">
                    {t("form.incomplete") ||
                        "Some required data is missing. Use Back to complete all steps."}
                </Alert>
            )}

            <Card className="mb-3">
                <Card.Body>
                    {rows.map(([k, v], i) => (
                        <div key={i} className="mb-2">
                            <strong>{k}:</strong> {v}
                        </div>
                    ))}
                </Card.Body>
            </Card>

            <div className="d-flex gap-2">
                <Button variant="secondary" className="w-50" onClick={() => goBack("/register/house-number")}
                        disabled={busy}>
                    {t("button.back") || "Back"}
                </Button>
                <Button className="w-50 fw-bold" onClick={onSubmit} disabled={!complete || busy}>
                    {busy ? (<><Spinner size="sm"
                                        className="me-2"/> {t("button.working") || "Working…"}</>) : (t("register.submit") || "Register")}
                </Button>
            </div>
        </div>
    );
}

/* --------------------------------- Router --------------------------------- */

export default function RegistrationWizard() {
    return (
        <WizardProvider>
            <Routes>
                <Route index element={<Navigate to="first-name" replace/>}/>
                <Route path="first-name" element={<StepFirstName/>}/>
                <Route path="last-name" element={<StepLastName/>}/>
                <Route path="email" element={<StepEmail/>}/>
                <Route path="phone" element={<StepPhone/>}/> {/* NEW */}
                <Route path="password" element={<StepPassword/>}/>
                <Route path="access-code" element={<StepAccessCode/>}/>
                <Route path="country" element={<StepCountry/>}/>
                <Route path="city" element={<StepCity/>}/>
                <Route path="street" element={<StepStreet/>}/>
                <Route path="house-number" element={<StepHouseNumber/>}/>
                <Route path="confirm" element={<StepConfirm/>}/>
                <Route path="*" element={<Navigate to="first-name" replace/>}/>
            </Routes>
        </WizardProvider>
    );
}
