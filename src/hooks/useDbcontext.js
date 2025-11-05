import { useContext } from "react";
import { DbContext } from "../contexts/DbContext.jsx";

export function useDbContext() {
    return useContext(DbContext);
}
