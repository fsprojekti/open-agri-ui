// file: src/contexts/useDb.js
import { useContext } from "react";
import { DbContext } from "./DbContext.jsx";

export function useDb() {
    const ctx = useContext(DbContext);
    if (!ctx) {
        throw new Error("useDb must be used within <DbProvider>");
    }
    return ctx;
}

export default useDb;
