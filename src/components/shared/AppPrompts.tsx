import { useState } from "react";
import { Button } from "../ui/button";
import { PromptDialog } from "./PromptDialog";
import { SUPPORT_LINKS } from "./supportLinks";
import { HeartIcon } from "../../assets/icons/HeartIcon";
import { HandHeartIcon } from "../../assets/icons/HandHeartIcon";
import { StarIcon } from "../../assets/icons/StarIcon";
import { CoffeeIcon } from "../../assets/icons/CoffeeIcon";
import { PatreonIcon } from "../../assets/icons/PatreonIcon";
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

const FUNDING = [
  { href: SUPPORT_LINKS.buyMeACoffee, icon: CoffeeIcon, label: "Buy Me a Coffee" },
  {
    href: SUPPORT_LINKS.githubSponsors,
    icon: HeartIcon,
    label: "Tornar-se GitHub Sponsor",
    iconClassName: "text-[#ea4aaa]",
  },
  { href: SUPPORT_LINKS.patreon, icon: PatreonIcon, label: "Apoiar no Patreon" },
];

export function AppPrompts() {
  const store = reviewStore();
  const [showing, setShowing] = useState(() => choose(store !== null));

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

  if (showing === "rating" && store !== null) {
    return (
      <PromptDialog
        icon={<StarIcon />}
        title='Curtindo o Dishylink?'
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
      title='O Dishylink é gratuito, e sempre será.'
      body='Eu construí no meu tempo livre, porque nada assim existia. Sua contribuição pontual ou recorrente faz muita diferença para manter o projeto atualizado. Se puder, apoie!'
      onLater={later}
      onNever={never}
      actions={FUNDING.map(({ href, icon: Icon, label, iconClassName }, i) => (
        <Button
          key={href}
          variant={i === 0 ? "default" : "outline"}
          size='lg'
          className={
            i === 0
              ? "w-full cursor-pointer bg-[color-mix(in_srgb,var(--ink)_86%,transparent)] text-page hover:bg-ink"
              : "w-full cursor-pointer"
          }
          onClick={() => acted(href)}
        >
          <Icon className={iconClassName} />
          {label}
        </Button>
      ))}
    />
  );
}
