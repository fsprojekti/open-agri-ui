// src/routes/steps/useWizardNav.js
import { useLocation, useNavigate } from "react-router-dom";

export function useWizardNav() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const data = state ?? {}; // accumulated wizard data

    const goNext = (path, partial) => {
        navigate(path, { state: { ...data, ...partial } });
    };

    const goBack = (fallback = "/farms/add/first-name") => {
        // prefer history, but ensure state is preserved
        navigate(-1) || navigate(fallback, { state: data });
    };

    const ensure = (requiredKeys = [], redirectPath = "/farms/add/first-name") => {
        const missing = requiredKeys.find((k) => data[k] == null || data[k] === "");
        if (missing) navigate(redirectPath, { state: data });
        return !missing;
    };

    return { data, goNext, goBack, ensure };

    return { data, goNext, goBack };
}
