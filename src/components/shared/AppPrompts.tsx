import { useState } from "react";
import { Button } from "../ui/button";
import { PromptDialog } from "./PromptDialog";
import { SUPPORT_LINKS } from "./supportLinks";
import { HandHeartIcon } from "../../assets/icons/HandHeartIcon";
import { StarIcon } from "../../assets/icons/StarIcon";
import { HeartIcon } from "../../assets/icons/HeartIcon";
import { promptDue, retirePrompt, snoozePrompt, type PromptId } from "@/lib/promptSchedule";
import { reviewStore, reviewStoreName, reviewUrl } from "@/lib/storeReview";

function open(url: string): void {
  // The desktop renderer has no shell access, so it crosses the preload bridge.
  if (window.dishlink?.openExternal) window.dishlink.openExternal(url);
  else window.open(url, "_blank", "noopener,noreferrer");
}

// Chosen once, so answering the first never promotes the second into the same sitting.
function choose(canRate: boolean): PromptId | null {
  if (canRate && promptDue("rating")) return "rating";
  if (promptDue("donation")) return "donation";
  return null;
}

export function AppPrompts() {
  const store = reviewStore();
  const [showing, setShowing] = useState(() => choose(store !== null));
  const [pixCopied, setPixCopied] = useState(false);

  if (showing === null) return null;

  const later = (): void => {
    snoozePrompt(showing);
    setShowing(null);
  };
  const never = (): void => {
    retirePrompt(showing);
    setShowing(null);
  };
  const acted = (url: string): void => {
    open(url);
    retirePrompt(showing);
    setShowing(null);
  };
  const copyPix = (): void => {
    void navigator.clipboard.writeText(SUPPORT_LINKS.pixKey).then(() => {
      setPixCopied(true);
      retirePrompt(showing);
      window.setTimeout(() => setShowing(null), 1200);
    });
  };

  if (showing === "rating" && store !== null) {
    return (
      <PromptDialog
        icon={<StarIcon />}
        title='Curtindo o Starlink Monitor Br?'
        body='Uma avaliação leva dez segundos, mas é o que mais ajuda outros donos de Starlink a encontrar o app.'
        onLater={later}
        onNever={never}
        actions={
          <Button
            size='lg'
            className='w-full cursor-pointer'
            onClick={() => acted(reviewUrl(store))}
          >
            Avaliar na {reviewStoreName(store)}
          </Button>
        }
      />
    );
  }

  return (
    <PromptDialog
      icon={<HandHeartIcon />}
      title='O Starlink Monitor Br é gratuito, e sempre será.'
      body='Eu construí no meu tempo livre, porque nada assim existia para o Brasil. Se puder, doe via PIX ou deixe uma estrela no GitHub — isso ajuda a manter o projeto atualizado.'
      onLater={later}
      onNever={never}
      actions={
        <>
          <Button
            size='lg'
            className='w-full cursor-pointer bg-[color-mix(in_srgb,var(--ink)_86%,transparent)] text-page hover:bg-ink'
            onClick={copyPix}
          >
            <HeartIcon />
            {pixCopied ? "Chave PIX copiada" : "Copiar chave PIX"}
          </Button>
          <p className='font-mono text-[12px] text-ink-muted'>{SUPPORT_LINKS.pixKey}</p>
          <Button
            variant='outline'
            size='lg'
            className='w-full cursor-pointer'
            onClick={() => acted(SUPPORT_LINKS.starRepo)}
          >
            <StarIcon />
            Dar estrela no GitHub
          </Button>
        </>
      }
    />
  );
}
