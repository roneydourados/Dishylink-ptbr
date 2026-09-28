import { requestPanel } from "../../hooks/usePanelRouting";
import { inlineLinkButton } from "../ui/action-button";

/** Owns the wording so "sign in" is a real control rather than a phrase the
 *  reader has to act on somewhere else. */
export function AccountRequiredNotice() {
  return (
    <>
      É necessária uma conta autorizada —{" "}
      <button type='button' className={inlineLinkButton} onClick={() => requestPanel("account")}>
        entre
      </button>{" "}
      para usar este recurso.
    </>
  );
}
